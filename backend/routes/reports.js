const express = require('express');
const router  = express.Router();
const Student = require('../models/Student');

// GET /reports
// Query params:
//   class       — filter by student class
//   vaccineName — filter by vaccine name within vaccinations
//   vaccinated  — "true" | "false" — filter by vaccination status (relative to vaccineName if set)
//   format      — "csv" to stream a CSV download instead of JSON
router.get('/', async (req, res) => {
  try {
    const { vaccineName, class: studentClass, vaccinated, format } = req.query;

    const query = {};
    if (studentClass) query.class = studentClass;

    const students = await Student.find(query)
      .populate('vaccinations.drive')
      .sort({ name: 1 });

    const rows = [];

    for (const student of students) {
      // If vaccineName filter is set, consider only vaccinations that match it
      const relevantVaccinations = vaccineName
        ? student.vaccinations.filter((v) => v.vaccineName === vaccineName)
        : student.vaccinations;

      const isVaccinatedForFilter = relevantVaccinations.length > 0;

      if (vaccinated === 'true'  && !isVaccinatedForFilter) continue;
      if (vaccinated === 'false' &&  isVaccinatedForFilter) continue;

      if (relevantVaccinations.length === 0) {
        rows.push({
          studentId:   student.studentId,
          name:        student.name,
          class:       student.class,
          vaccinated:  'No',
          vaccineName: '',
          date:        '',
          location:    '',
        });
      } else {
        for (const v of relevantVaccinations) {
          rows.push({
            studentId:   student.studentId,
            name:        student.name,
            class:       student.class,
            vaccinated:  'Yes',
            vaccineName: v.vaccineName,
            date:        v.date ? new Date(v.date).toISOString().split('T')[0] : '',
            location:    v.drive ? v.drive.location : '',
          });
        }
      }
    }

    if (format === 'csv') {
      const header = 'Student ID,Name,Class,Vaccinated,Vaccine Name,Date,Location\n';
      const csvBody = rows
        .map((r) =>
          [r.studentId, r.name, r.class, r.vaccinated, r.vaccineName, r.date, r.location]
            .map((val) => `"${String(val).replace(/"/g, '""')}"`)
            .join(',')
        )
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="vaccination-report.csv"');
      return res.send(header + csvBody);
    }

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
