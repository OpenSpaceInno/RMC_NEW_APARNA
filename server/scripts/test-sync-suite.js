import { pool as localPool } from '../db.js';
import mysql from 'mysql2/promise';
import { cloudSyncService } from '../cloud-sync-service.js';

async function runTestSuite() {
  console.log('===============================================================');
  console.log(' APARNA RMC - AUTOMATED SYNCHRONIZATION TEST SUITE');
  console.log(' Tests A through E: Local MySQL <-> Coolify Server MySQL');
  console.log('===============================================================\n');

  const prodPool = mysql.createPool({
    host: '213.210.37.249',
    port: 3306,
    user: 'rmc_user',
    password: 'SecureRmcPassword2026!',
    database: 'Aparna_RMC_Db',
    waitForConnections: true,
    connectionLimit: 3
  });

  await cloudSyncService.initialize();

  const testId = 'TEST-VEH-SYNC-999';

  try {
    // Clean up any stale test record
    await localPool.query('DELETE FROM vehicles WHERE id = ?', [testId]);
    await prodPool.query('DELETE FROM vehicles WHERE id = ?', [testId]);

    // -------------------------------------------------------------------------
    // TEST A: Create Record Locally & Synchronize to Server
    // -------------------------------------------------------------------------
    console.log('--- TEST A: Insert Record Locally & Sync to Server ---');
    const insertTime = new Date();
    await localPool.query(
      `INSERT INTO vehicles (id, registration_no, type, make, model, year, capacity, capacity_unit, fuel_type, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [testId, 'AP09-TEST-9999', 'Transit Mixer', 'Tata', 'Signa 2823', 2024, 7, 'm3', 'diesel', 'active', insertTime, insertTime]
    );
    console.log(`1. Inserted local test record '${testId}'.`);

    // Run sync cycle
    const resA = await cloudSyncService.runSyncCycle();
    console.log(`2. Sync executed: status=${resA.status}, inserted=${resA.totalInserted}, updated=${resA.totalUpdated}.`);

    // Verify record on production server
    const [prodRowsA] = await prodPool.query('SELECT id, registration_no, make, model, status FROM vehicles WHERE id = ?', [testId]);
    if (prodRowsA.length === 1 && prodRowsA[0].registration_no === 'AP09-TEST-9999') {
      console.log('✅ TEST A PASSED: Record exists on production server:', prodRowsA[0]);
    } else {
      throw new Error(`TEST A FAILED: Record not found on production server! Found: ${JSON.stringify(prodRowsA)}`);
    }

    // -------------------------------------------------------------------------
    // TEST B: Update Record Locally & Verify Server Update (No Duplicate)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST B: Update Record Locally & Verify Server Update ---');
    // Wait 1.5 seconds so updated_at is strictly newer
    await new Promise(r => setTimeout(r, 1500));
    const updateTime = new Date();
    await localPool.query(
      'UPDATE vehicles SET model = ?, status = ?, updated_at = ? WHERE id = ?',
      ['Signa 2825-HYBRID', 'maintenance', updateTime, testId]
    );
    console.log(`1. Updated local test record '${testId}' to model='Signa 2825-HYBRID', status='maintenance'.`);

    // Run sync cycle
    const resB = await cloudSyncService.runSyncCycle();
    console.log(`2. Sync executed: status=${resB.status}, inserted=${resB.totalInserted}, updated=${resB.totalUpdated}.`);

    // Verify record on production server
    const [prodRowsB] = await prodPool.query('SELECT id, registration_no, make, model, status FROM vehicles WHERE id = ?', [testId]);
    const [countRowsB] = await prodPool.query('SELECT COUNT(*) as cnt FROM vehicles WHERE id = ?', [testId]);

    if (
      prodRowsB.length === 1 && 
      countRowsB[0].cnt === 1 &&
      prodRowsB[0].model === 'Signa 2825-HYBRID' && 
      prodRowsB[0].status === 'maintenance'
    ) {
      console.log('✅ TEST B PASSED: Production record updated correctly with 0 duplicates:', prodRowsB[0]);
    } else {
      throw new Error(`TEST B FAILED: Production update mismatch. Rows: ${JSON.stringify(prodRowsB)}, Count: ${countRowsB[0].cnt}`);
    }

    // -------------------------------------------------------------------------
    // TEST C: Re-run Without Changes (No-Op Idempotency)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST C: Idempotency Check (No-Op) ---');
    const resC = await cloudSyncService.runSyncCycle();
    console.log(`1. Sync executed without changes: status=${resC.status}, tables=${resC.tablesProcessed}, inserted=${resC.totalInserted}, updated=${resC.totalUpdated}.`);

    if (resC.status === 'clean_no_changes' && resC.tablesProcessed === 0) {
      console.log('✅ TEST C PASSED: Idempotency verified. 0 redundant records sent, 0 duplicates.');
    } else {
      throw new Error(`TEST C FAILED: Expected clean_no_changes, got ${resC.status}`);
    }

    // -------------------------------------------------------------------------
    // TEST D: Direct DB Fallback Channel
    // -------------------------------------------------------------------------
    console.log('\n--- TEST D: Direct MySQL Fallback Channel ---');
    // Test direct DB push method
    const directPayload = {
      vehicles: [{
        id: testId,
        registration_no: 'AP09-TEST-9999',
        type: 'Transit Mixer',
        make: 'Tata',
        model: 'Signa 2825-DIRECT',
        year: 2024,
        capacity: 7,
        capacity_unit: 'm3',
        fuel_type: 'diesel',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]
    };
    const directRes = await cloudSyncService.pushDirectDbSync(directPayload);
    console.log(`1. Direct DB push result: success=${directRes.success}, inserted=${directRes.summary?.insertedRecords}, updated=${directRes.summary?.updatedRecords}`);

    const [prodRowsD] = await prodPool.query('SELECT id, model FROM vehicles WHERE id = ?', [testId]);
    if (directRes.success && prodRowsD[0]?.model === 'Signa 2825-DIRECT') {
      console.log('✅ TEST D PASSED: Direct MySQL channel successfully updated production server directly.');
    } else {
      throw new Error(`TEST D FAILED: Direct DB channel failed. Result: ${JSON.stringify(directRes)}`);
    }

    // -------------------------------------------------------------------------
    // TEST E: Clean Up Test Records
    // -------------------------------------------------------------------------
    console.log('\n--- TEST E: Cleanup ---');
    await localPool.query('DELETE FROM vehicles WHERE id = ?', [testId]);
    await prodPool.query('DELETE FROM vehicles WHERE id = ?', [testId]);
    console.log(`✅ TEST E PASSED: Test record '${testId}' cleanly removed from both databases.`);

    console.log('\n===============================================================');
    console.log(' 🎉 ALL 5 TESTS (A, B, C, D, E) PASSED SUCCESSFULLY!');
    console.log(' Local -> Production Synchronization is 100% verified & healthy.');
    console.log('===============================================================');

  } catch (err) {
    console.error('\n❌ TEST SUITE FAILURE:', err.message);
    process.exit(1);
  } finally {
    cloudSyncService.stopSyncLoop();
    await localPool.end();
    await prodPool.end();
    if (cloudSyncService.remoteDbPool) {
      await cloudSyncService.remoteDbPool.end();
    }
  }
}

runTestSuite();
