import { cloudSyncService } from '../cloud-sync-service.js';
import { pool } from '../db.js';

async function main() {
  console.log('===============================================================');
  console.log(' Aparna RMC - On-Demand Database Synchronization');
  console.log(' Local MySQL (Plant) -> Coolify Server MySQL (Production)');
  console.log('===============================================================');

  try {
    // Test local database connection
    await pool.query('SELECT 1');
    console.log('✅ Local MySQL connection verified.');

    // Initialize tracking table & remote pool
    await cloudSyncService.initialize();

    console.log(`📡 Target endpoint: ${cloudSyncService.cloudServerUrl || 'Direct Remote MySQL'}`);
    console.log('🚀 Running synchronization cycle...');

    const result = await cloudSyncService.runSyncCycle();

    console.log('---------------------------------------------------------------');
    console.log('Synchronization Result:');
    console.log(`Status:           ${result.status}`);
    console.log(`Channel Used:     ${result.channel || 'None'}`);
    console.log(`Tables Processed: ${result.tablesProcessed || 0}`);
    console.log(`Records Inserted: ${result.totalInserted || 0}`);
    console.log(`Records Updated:  ${result.totalUpdated || 0}`);
    console.log(`Records Unchanged:${result.totalUnchanged || 0}`);

    if (result.tableDetails && Object.keys(result.tableDetails).length > 0) {
      console.log('\nPer-Table Breakdown:');
      for (const [tbl, stats] of Object.entries(result.tableDetails)) {
        console.log(`  - ${tbl.padEnd(28)}: +${stats.inserted || 0} inserted, ~${stats.updated || 0} updated, =${stats.unchanged || 0} unchanged`);
      }
    }

    if (result.errors && result.errors.length > 0) {
      console.error('\n⚠️ Errors encountered:');
      result.errors.forEach(err => console.error(`  - ${err}`));
    }

    console.log('---------------------------------------------------------------');
    console.log('Log file written to: logs/cloud-sync.log');
    console.log('===============================================================');

    cloudSyncService.stopSyncLoop();
    await pool.end();
    if (cloudSyncService.remoteDbPool) {
      await cloudSyncService.remoteDbPool.end();
    }

    if (result.status === 'success' || result.status === 'clean_no_changes') {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Fatal error running synchronization:', err);
    process.exit(1);
  }
}

main();
