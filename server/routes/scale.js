import express from 'express';
import { scaleService } from '../scale-service.js';

const router = express.Router();

// GET /api/scale/status
router.get('/status', (req, res) => {
  res.json(scaleService.getStatus());
});

// GET /api/scale/reading
router.get('/reading', (req, res) => {
  res.json(scaleService.getCurrentPayload());
});

// POST /api/scale/config
router.post('/config', (req, res) => {
  scaleService.updateConfig(req.body);
  res.json({ success: true, config: scaleService.config });
});

// POST /api/scale/zero
router.post('/zero', (req, res) => {
  scaleService.zeroScale();
  res.json({ success: true, message: 'Scale zeroed' });
});

// POST /api/scale/tare
router.post('/tare', (req, res) => {
  scaleService.tareScale();
  res.json({ success: true, message: 'Scale tared', tareWeight: scaleService.state.tareWeight });
});

// POST /api/scale/inject (simulate truck load or tolerance breach)
router.post('/inject', (req, res) => {
  const { weight, instant } = req.body;
  if (typeof weight !== 'number') {
    return res.status(400).json({ error: 'weight must be a number' });
  }
  scaleService.setSimulatedWeight(weight, instant || false);
  res.json({ success: true, targetWeight: weight });
});

export default router;
