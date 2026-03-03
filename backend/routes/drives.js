const express = require('express');
const router  = express.Router();
const Drive   = require('../models/Drive');

// GET /drives — all drives, newest first
router.get('/', async (_req, res) => {
  try {
    const drives = await Drive.find().sort({ date: -1 });
    res.json(drives);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /drives — create a new drive
router.post('/', async (req, res) => {
  try {
    const drive = new Drive(req.body);
    await drive.save();
    res.status(201).json(drive);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /drives/:id — update an existing drive
router.put('/:id', async (req, res) => {
  try {
    const drive = await Drive.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!drive) return res.status(404).json({ error: 'Drive not found' });
    res.json(drive);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /drives/:id
router.delete('/:id', async (req, res) => {
  try {
    const drive = await Drive.findByIdAndDelete(req.params.id);
    if (!drive) return res.status(404).json({ error: 'Drive not found' });
    res.json({ message: 'Drive deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
