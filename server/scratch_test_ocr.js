import { createWorker } from 'tesseract.js';

async function run() {
  console.log('Testing worker with PSM 11...');
  const worker = await createWorker('eng');
  await worker.setParameters({
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -',
    tessedit_pageseg_mode: '11',
  });
  console.log('Worker configured successfully with PSM 11!');
  await worker.terminate();
}

run().catch(console.error);
