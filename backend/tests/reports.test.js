const request = require('supertest');
const app     = require('../app');
const db      = require('./helpers/db');

beforeAll(db.connect);
afterEach(db.clearDB);
afterAll(db.disconnect);

const AUTH = 'Bearer admin-token';

// ── Test data helpers ──────────────────────────────────────────────────────

const createStudent = (overrides = {}) =>
  request(app)
    .post('/api/students')
    .set('Authorization', AUTH)
    .send({ name: 'Test Student', class: '10A', studentId: 'S001', ...overrides })
    .then((r) => r.body);

const createDrive = (overrides = {}) =>
  request(app)
    .post('/api/drives')
    .set('Authorization', AUTH)
    .send({ vaccineName: 'Hepatitis B', date: '2026-01-15', location: 'Main Hall', ...overrides })
    .then((r) => r.body);

const vaccinate = (studentId, driveId) =>
  request(app)
    .post(`/api/students/${studentId}/vaccinate`)
    .set('Authorization', AUTH)
    .send({ driveId });

// ── Tests ──────────────────────────────────────────────────────────────────

describe('GET /api/reports — basic', () => {
  it('returns an empty array when no students exist', async () => {
    const res = await request(app).get('/api/reports').set('Authorization', AUTH);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns a row per student with vaccinated=No when unvaccinated', async () => {
    await createStudent({ name: 'Priya', studentId: 'S001' });

    const res = await request(app).get('/api/reports').set('Authorization', AUTH);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].vaccinated).toBe('No');
    expect(res.body[0].name).toBe('Priya');
    expect(res.body[0].vaccineName).toBe('');
  });

  it('returns vaccinated=Yes and vaccination details after vaccination', async () => {
    const student = await createStudent();
    const drive   = await createDrive();
    await vaccinate(student._id, drive._id);

    const res = await request(app).get('/api/reports').set('Authorization', AUTH);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].vaccinated).toBe('Yes');
    expect(res.body[0].vaccineName).toBe('Hepatitis B');
    expect(res.body[0].location).toBe('Main Hall');
  });

  it('returns one row per vaccination when a student has multiple', async () => {
    const student = await createStudent();
    const drive1  = await createDrive({ vaccineName: 'Hepatitis B', date: '2026-01-15', location: 'Main Hall' });
    const drive2  = await createDrive({ vaccineName: 'Polio (OPV)', date: '2026-02-20', location: 'Gymnasium' });
    await vaccinate(student._id, drive1._id);
    await vaccinate(student._id, drive2._id);

    const res = await request(app).get('/api/reports').set('Authorization', AUTH);
    expect(res.body).toHaveLength(2);
  });
});

describe('GET /api/reports — filters', () => {
  let studentA, studentB, drive;

  beforeEach(async () => {
    studentA = await createStudent({ name: 'Aarav', class: '10A', studentId: 'S001' });
    studentB = await createStudent({ name: 'Priya', class: '9A',  studentId: 'S002' });
    drive    = await createDrive();
    // Only studentA is vaccinated
    await vaccinate(studentA._id, drive._id);
  });

  it('vaccinated=true returns only vaccinated students', async () => {
    const res = await request(app)
      .get('/api/reports?vaccinated=true')
      .set('Authorization', AUTH);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].studentId).toBe('S001');
    expect(res.body[0].vaccinated).toBe('Yes');
  });

  it('vaccinated=false returns only unvaccinated students', async () => {
    const res = await request(app)
      .get('/api/reports?vaccinated=false')
      .set('Authorization', AUTH);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].studentId).toBe('S002');
    expect(res.body[0].vaccinated).toBe('No');
  });

  it('class filter returns only students in that class', async () => {
    const res = await request(app)
      .get('/api/reports?class=9A')
      .set('Authorization', AUTH);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Priya');
  });

  it('vaccineName filter returns only rows matching that vaccine', async () => {
    const drive2 = await createDrive({ vaccineName: 'Polio (OPV)', date: '2026-02-20', location: 'Gymnasium' });
    await vaccinate(studentB._id, drive2._id);

    const res = await request(app)
      .get('/api/reports?vaccineName=Polio (OPV)')
      .set('Authorization', AUTH);

    // Only studentB has Polio; studentA should not appear
    expect(res.body.every((r) => r.vaccineName === 'Polio (OPV)' || r.vaccinated === 'No')).toBe(true);
    const vaccinatedRows = res.body.filter((r) => r.vaccinated === 'Yes');
    expect(vaccinatedRows).toHaveLength(1);
    expect(vaccinatedRows[0].studentId).toBe('S002');
  });

  it('combined class + vaccinated filter works', async () => {
    const res = await request(app)
      .get('/api/reports?class=10A&vaccinated=true')
      .set('Authorization', AUTH);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].class).toBe('10A');
    expect(res.body[0].vaccinated).toBe('Yes');
  });
});

describe('GET /api/reports?format=csv', () => {
  it('returns CSV content-type and correct header row', async () => {
    await createStudent();

    const res = await request(app)
      .get('/api/reports?format=csv')
      .set('Authorization', AUTH);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.headers['content-disposition']).toMatch(/vaccination-report\.csv/);

    const lines = res.text.trim().split('\n');
    expect(lines[0]).toBe('Student ID,Name,Class,Vaccinated,Vaccine Name,Date,Location');
    expect(lines.length).toBeGreaterThan(1); // header + at least one data row
  });

  it('each data row is properly quoted', async () => {
    await createStudent({ name: 'Test, Comma', studentId: 'S001' });

    const res = await request(app)
      .get('/api/reports?format=csv')
      .set('Authorization', AUTH);

    const dataLine = res.text.trim().split('\n')[1];
    expect(dataLine).toContain('"Test, Comma"'); // commas inside values are quoted
  });
});
