/**
 * Seed script — populates drives, students, and sample vaccination records.
 * Safe to re-run: uses upserts so existing records are not duplicated.
 *
 * Usage:
 *   cd backend
 *   node seeds/seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Student  = require('../models/Student');
const Drive    = require('../models/Drive');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shotsecure';

// ── Drive definitions ──────────────────────────────────────────────────────
const DRIVE_DEFS = [
  { vaccineName: 'Hepatitis B',      date: new Date('2026-01-15'), location: 'Main Hall'       },
  { vaccineName: 'Polio (OPV)',      date: new Date('2026-02-20'), location: 'School Gymnasium' },
  { vaccineName: 'MMR',              date: new Date('2026-04-10'), location: 'Medical Room'     },
  { vaccineName: 'COVID-19 Booster', date: new Date('2026-05-05'), location: 'Sports Complex'   },
];

// ── Student definitions ────────────────────────────────────────────────────
const STUDENT_DEFS = [
  { name: 'Aarav Sharma',    class: '8A',  studentId: 'S001' },
  { name: 'Priya Verma',     class: '8A',  studentId: 'S002' },
  { name: 'Rohan Patel',     class: '8B',  studentId: 'S003' },
  { name: 'Ananya Singh',    class: '8B',  studentId: 'S004' },
  { name: 'Vikram Nair',     class: '9A',  studentId: 'S005' },
  { name: 'Sneha Iyer',      class: '9A',  studentId: 'S006' },
  { name: 'Arjun Mehta',     class: '9B',  studentId: 'S007' },
  { name: 'Kavya Reddy',     class: '9B',  studentId: 'S008' },
  { name: 'Karan Joshi',     class: '10A', studentId: 'S009' },
  { name: 'Divya Kumar',     class: '10A', studentId: 'S010' },
  { name: 'Aditya Rao',      class: '10B', studentId: 'S011' },
  { name: 'Meera Pillai',    class: '10B', studentId: 'S012' },
  { name: 'Siddharth Gupta', class: '8A',  studentId: 'S013' },
  { name: 'Pooja Desai',     class: '9A',  studentId: 'S014' },
  { name: 'Rahul Bose',      class: '10A', studentId: 'S015' },
  { name: 'Ishaan Malhotra', class: '8B',  studentId: 'S016' },
  { name: 'Tanya Saxena',    class: '9B',  studentId: 'S017' },
  { name: 'Nikhil Chawla',   class: '10B', studentId: 'S018' },
  { name: 'Ria Kapoor',      class: '8A',  studentId: 'S019' },
  { name: 'Arnav Bajaj',     class: '10A', studentId: 'S020' },
];

// ── Which students get vaccinated and for which drive ──────────────────────
// Format: { studentId, driveIndex }  (driveIndex = index into DRIVE_DEFS)
const VACCINATION_PLAN = [
  // 8A  → Hepatitis B
  { studentId: 'S001', driveIndex: 0 },
  { studentId: 'S002', driveIndex: 0 },
  { studentId: 'S013', driveIndex: 0 },
  { studentId: 'S019', driveIndex: 0 },
  // 8B  → Hepatitis B (partial)
  { studentId: 'S003', driveIndex: 0 },
  { studentId: 'S016', driveIndex: 0 },
  // 9A  → Polio
  { studentId: 'S005', driveIndex: 1 },
  { studentId: 'S006', driveIndex: 1 },
  { studentId: 'S014', driveIndex: 1 },
  // 9B  → Polio (partial)
  { studentId: 'S007', driveIndex: 1 },
  { studentId: 'S017', driveIndex: 1 },
  // 10A → both Hepatitis B and Polio
  { studentId: 'S009', driveIndex: 0 },
  { studentId: 'S009', driveIndex: 1 },
  { studentId: 'S010', driveIndex: 0 },
  { studentId: 'S010', driveIndex: 1 },
  { studentId: 'S015', driveIndex: 0 },
  { studentId: 'S020', driveIndex: 1 },
  // 10B → Hepatitis B (one student only)
  { studentId: 'S011', driveIndex: 0 },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // 1. Upsert drives
  const savedDrives = [];
  for (const def of DRIVE_DEFS) {
    const drive = await Drive.findOneAndUpdate(
      { vaccineName: def.vaccineName, date: def.date },
      def,
      { upsert: true, new: true }
    );
    savedDrives.push(drive);
    console.log(`  Drive: ${drive.vaccineName} on ${drive.date.toDateString()}`);
  }

  // 2. Upsert students (no vaccinations yet — added below)
  for (const def of STUDENT_DEFS) {
    await Student.updateOne(
      { studentId: def.studentId },
      { $setOnInsert: { ...def, vaccinations: [] } },
      { upsert: true }
    );
    console.log(`  Student: ${def.studentId} — ${def.name}`);
  }

  // 3. Apply vaccination plan
  console.log('\nApplying vaccinations...');
  for (const { studentId, driveIndex } of VACCINATION_PLAN) {
    const drive   = savedDrives[driveIndex];
    const student = await Student.findOne({ studentId });
    if (!student) continue;

    const alreadyDone = student.vaccinations.some(
      (v) => v.drive.toString() === drive._id.toString()
    );
    if (alreadyDone) {
      console.log(`  SKIP  ${studentId} already vaccinated for ${drive.vaccineName}`);
      continue;
    }

    student.vaccinations.push({
      drive:       drive._id,
      date:        drive.date,
      vaccineName: drive.vaccineName,
    });
    await student.save();
    console.log(`  VACC  ${studentId} → ${drive.vaccineName}`);
  }

  console.log('\nSeed complete.');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
