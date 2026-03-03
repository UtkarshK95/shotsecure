const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const csv      = require('csv-parser');
const fs       = require('fs');
const path     = require('path');
const Student  = require('../models/Student');
const Drive    = require('../models/Drive');

const upload = multer({ dest: path.join(__dirname, '../uploads/') });

// GET /students — list with optional filters: name (regex), class, vaccinated (true|false)
router.get('/', async (req, res) => {
  try {
    const { name, class: studentClass, vaccinated } = req.query;
    const query = {};
    if (name)         query.name  = { $regex: name, $options: 'i' };
    if (studentClass) query.class = studentClass;

    let students = await Student.find(query)
      .populate('vaccinations.drive')
      .sort({ name: 1 });

    if (vaccinated === 'true')  students = students.filter(s => s.vaccinations.length > 0);
    if (vaccinated === 'false') students = students.filter(s => s.vaccinations.length === 0);

    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /students/import — bulk CSV import (must be declared before /:id routes)
// Expected CSV columns: name, class, studentid
router.post('/import', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const rows = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (row) => {
      // Normalise header keys: trim whitespace and lowercase
      const normalised = {};
      Object.keys(row).forEach((k) => {
        normalised[k.trim().toLowerCase()] = String(row[k]).trim();
      });
      rows.push(normalised);
    })
    .on('end', async () => {
      fs.unlink(req.file.path, () => {});

      let inserted = 0;
      let skipped  = 0;
      const errors = [];

      for (const row of rows) {
        const { name, class: cls, studentid } = row;
        if (!name || !cls || !studentid) {
          errors.push({ row, error: 'Missing required fields (name, class, studentid)' });
          skipped++;
          continue;
        }
        try {
          // Upsert: insert only if studentId doesn't already exist.
          // upsertedCount === 1 means a new document was created;
          // 0 means the document already existed — treat as skipped.
          const result = await Student.updateOne(
            { studentId: studentid },
            { $setOnInsert: { name, class: cls, studentId: studentid, vaccinations: [] } },
            { upsert: true }
          );
          if (result.upsertedCount === 1) {
            inserted++;
          } else {
            skipped++;
          }
        } catch (err) {
          errors.push({ row, error: err.message });
          skipped++;
        }
      }

      res.json({ inserted, skipped, errors });
    })
    .on('error', (err) => {
      fs.unlink(req.file.path, () => {});
      res.status(500).json({ error: err.message });
    });
});

// POST /students — add a single student
router.post('/', async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).json(student);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Student ID already exists' });
    res.status(400).json({ error: err.message });
  }
});

// PUT /students/:id — update name / class / studentId
router.put('/:id', async (req, res) => {
  try {
    const { name, class: cls, studentId } = req.body;
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: { name, class: cls, studentId } },
      { new: true, runValidators: true }
    );
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Student ID already exists' });
    res.status(400).json({ error: err.message });
  }
});

// DELETE /students/:id
router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /students/:id/vaccinate — mark a student as vaccinated for a specific drive
// Enforces one vaccination per student per drive
router.post('/:id/vaccinate', async (req, res) => {
  try {
    const { driveId } = req.body;
    if (!driveId) return res.status(400).json({ error: 'driveId is required' });

    const drive = await Drive.findById(driveId);
    if (!drive) return res.status(404).json({ error: 'Drive not found' });

    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const alreadyVaccinated = student.vaccinations.some(
      (v) => v.drive.toString() === driveId
    );
    if (alreadyVaccinated) {
      return res.status(409).json({ error: 'Student already vaccinated for this drive' });
    }

    student.vaccinations.push({
      drive:       driveId,
      date:        drive.date,
      vaccineName: drive.vaccineName,
    });

    await student.save();
    await student.populate('vaccinations.drive');
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
