// SAP S/4HANA Enterprise Sync Queue Worker Daemon
// Aparna RMC Gate-to-Exit Enterprise Operations System
// Automatically polls `sap_sync_queue` table and retries pending MIGO & VL02N RFC transactions with exponential backoff

import dotenv from 'dotenv';
import { pool } from '../db.js';
import { SapConnectorService } from '../sap-connector.js';

dotenv.config();

const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS, 10) || 30000; // 30 seconds default
const BATCH_SIZE = parseInt(process.env.QUEUE_BATCH_SIZE, 10) || 10;
const sapService = new SapConnectorService();

let isRunning = true;
let isProcessingBatch = false;

console.log('---------------------------------------------------------');
console.log('🔄 Aparna RMC SAP Sync Queue Worker Daemon Starting...');
console.log(`⏱️ Poll Interval: ${POLL_INTERVAL_MS} ms | Batch Size: ${BATCH_SIZE}`);
console.log('---------------------------------------------------------');

/**
 * Process a single queue entry
 * @param {object} item 
 */
async function processQueueItem(item) {
  const { id, sync_category, reference_id, retry_count, max_retries } = item;
  let payload = item.payload_json;
  
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {
      payload = {};
    }
  }

  console.log(`\n⏳ [Item ${id}] Processing ${sync_category} for Ref #${reference_id} (Attempt ${retry_count + 1}/${max_retries})...`);

  // 1. Mark as processing
  await pool.query(
    'UPDATE sap_sync_queue SET status = "processing", last_attempt_at = NOW() WHERE id = ?',
    [id]
  );

  try {
    let result = null;
    const userData = payload?.userData || {
      userId: 'SAP_DAEMON_SVC',
      username: 'daemon.worker',
      operatorName: 'Aparna SAP Queue Worker Daemon'
    };

    switch (sync_category) {
      case 'GOODS_RECEIPT_MIGO':
        result = await sapService.postGoodsReceiptMigo(payload, userData);
        break;

      case 'GOODS_ISSUE_VL02N':
        result = await sapService.consumeOutboundDeliveryPgi(payload, userData);
        break;

      case 'PURCHASE_ORDER_QUERY':
        result = await sapService.checkPurchaseOrder(payload.poNumber || reference_id, userData);
        break;

      case 'OUTBOUND_DELIVERY_QUERY':
        result = await sapService.checkOutboundDelivery(payload.deliveryNumber || reference_id, userData);
        break;

      default:
        throw new Error(`Unsupported sync_category: ${sync_category}`);
    }

    if (!result || (!result.success && !result.sapDocNumber && !result.sapMaterialDocument)) {
      throw new Error(result?.error || 'SAP Connector returned unsuccessful response');
    }

    // Success: mark as completed
    await pool.query(
      `UPDATE sap_sync_queue SET 
         status = "completed", 
         retry_count = retry_count + 1, 
         response_json = ?, 
         error_message = NULL, 
         updated_at = NOW() 
       WHERE id = ?`,
      [JSON.stringify(result), id]
    );

    console.log(`✅ [Item ${id}] ${sync_category} successfully synchronized to SAP! Doc #${result.sapDocNumber || result.sapMaterialDocument || 'CONFIRMED'}`);
  } catch (err) {
    const nextRetryCount = retry_count + 1;
    const isExhausted = nextRetryCount >= max_retries;
    const nextStatus = isExhausted ? 'failed' : 'retry';
    
    // Exponential backoff: 30s, 60s, 120s, 240s, max 1 hour (3600s)
    const backoffSeconds = Math.min(3600, 30 * Math.pow(2, retry_count));

    console.warn(`❌ [Item ${id}] Failed sync: ${err.message}. ${isExhausted ? 'Max retries exceeded - marked FAILED.' : `Scheduling retry #${nextRetryCount} in ${backoffSeconds}s.`}`);

    await pool.query(
      `UPDATE sap_sync_queue SET 
         status = ?, 
         retry_count = ?, 
         next_retry_at = DATE_ADD(NOW(), INTERVAL ? SECOND), 
         error_message = ?, 
         updated_at = NOW() 
       WHERE id = ?`,
      [nextStatus, nextRetryCount, backoffSeconds, err.message, id]
    );
  }
}

/**
 * Poll database and execute pending queue entries
 */
async function pollQueue() {
  if (isProcessingBatch || !isRunning) return;
  isProcessingBatch = true;

  try {
    const [rows] = await pool.query(
      `SELECT * FROM sap_sync_queue 
       WHERE status IN ('queued', 'retry') 
         AND (next_retry_at IS NULL OR next_retry_at <= NOW()) 
       ORDER BY created_at ASC 
       LIMIT ?`,
      [BATCH_SIZE]
    );

    if (rows.length > 0) {
      console.log(`\n📦 Dispatched batch of ${rows.length} pending SAP queue transaction(s)...`);
      for (const item of rows) {
        if (!isRunning) break;
        await processQueueItem(item);
      }
    }
  } catch (error) {
    console.error('⚠️ SAP Queue Worker polling error:', error.message);
  } finally {
    isProcessingBatch = false;
  }
}

// Start timer loop
const intervalHandle = setInterval(pollQueue, POLL_INTERVAL_MS);

// Run initial poll immediately
pollQueue();

// Graceful process termination
const handleShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down SAP Queue Worker cleanly...`);
  isRunning = false;
  clearInterval(intervalHandle);

  // Wait if current batch is mid-flight
  if (isProcessingBatch) {
    console.log('⏳ Waiting for active queue transaction to complete...');
    let checks = 0;
    while (isProcessingBatch && checks < 10) {
      await new Promise(r => setTimeout(r, 500));
      checks++;
    }
  }

  console.log('👋 SAP Queue Worker Daemon stopped gracefully.');
  process.exit(0);
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

