const request = require('supertest');
const app     = require('../app');
const db      = require('./helpers/db');

beforeAll(db.connect);
afterEach(db.clearDB);
afterAll(db.disconnect);

const AUTH = 'Bearer admin-token';

const STUDENT = { name: 'Aarav Sharma', class: '10A', studentId: 'S001' };
const DRIVE   = { vaccineName: 'Hepatitis B', date: '2026-01-15', location: 'Main Hall' };

// Helper: create a student and return the response body
const createStudent = (overrides = {}) =>
  request(app)
    .post('/api/students')
    .set('Authorization', AUTH)
    .send({ ...STUDENT, ...overrides })
    .then((r) => r.body);

// Helper: create a drive and return the response body
const createDrive = (overrides = {}) =>
  request(app)
    .post('/api/drives')
    .set('Authorization', AUTH)
    .send({ ...DRIVE, ...overrides })
    .then((r) => r.body);

// ── CRUD ──────────────────────────────────────────────────────────────────

describe('GET /api/students', () => {
  it('returns an empty array when no students exist', async () => {
    const res = await request(app).get('/api/students').set('Authorization', AUTH);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('POST /api/students', () => {
  it('creates a student and returns 201', async () => {
    const res = await request(app)
      .post('/api/students')
      .set('Authorization', AUTH)
      .send(STUDENT);

    expect(res.status).toBe(201);
    expect(res.body.studentId).toBe('S001');
    expect(res.body.name).toBe('Aarav Sharma');
    expect(res.body.vaccinations).toEqual([]);
  });

  it('returns 409 for a duplicate studentId', async () => {
    await createStudent();
    const res = await request(app)
      .post('/api/students')
      .set('Authorization', AUTH)
      .send(STUDENT);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/students')
      .set('Authorization', AUTH)
      .send({ name: 'No ID' });

    expect(res.status).toBe(400);
  });
});

describe('PUT /api/students/:id', () => {
  it('updates name and class', async () => {
    const student = await createStudent();

    const res = await request(app)
      .put(`/api/students/${student._id}`)
      .set('Authorization', AUTH)
      .send({ name: 'Updated Name', class: '9B', studentId: 'S001' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Name');
    expect(res.body.class).toBe('9B');
  });

  it('returns 404 for a non-existent id', async () => {
    const res = await request(app)
      .put('/api/students/000000000000000000000000')
      .set('Authorization', AUTH)
      .send(STUDENT);

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/students/:id', () => {
  it('deletes a student', async () => {
    const student = await createStudent();

    const del = await request(app)
      .delete(`/api/students/${student._id}`)
      .set('Authorization', AUTH);

    expect(del.status).toBe(200);

    const list = await request(app).get('/api/students').set('Authorization', AUTH);
    expect(list.body).toHaveLength(0);
  });

  it('returns 404 for a non-existent id', async () => {
    const res = await request(app)
      .delete('/api/students/000000000000000000000000')
      .set('Authorization', AUTH);

    expect(res.status).toBe(404);
  });
});

// ── Filtering ─────────────────────────────────────────────────────────────

describe('GET /api/students filtering', () => {
  beforeEach(async () => {
    await createStudent({ name: 'Aarav Sharma',  class: '10A', studentId: 'S001' });
    await createStudent({ name: 'Priya Verma',   class: '9A',  studentId: 'S002' });
    await createStudent({ name: 'Rohan Patel',   class: '10A', studentId: 'S003' });
  });

  it('filters by name (case-insensitive regex)', async () => {
    const res = await request(app)
      .get('/api/students?name=priya')
      .set('Authorization', AUTH);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Priya Verma');
  });

  it('filters by class', async () => {
    const res = await request(app)
      .get('/api/students?class=10A')
      .set('Authorization', AUTH);

    expect(res.body).toHaveLength(2);
    res.body.forEach((s) => expect(s.class).toBe('10A'));
  });

  it('filters vaccinated=false returns all when none are vaccinated', async () => {
    const res = await request(app)
      .get('/api/students?vaccinated=false')
      .set('Authorization', AUTH);

    expect(res.body).toHaveLength(3);
  });

  it('filters vaccinated=true returns empty when none are vaccinated', async () => {
    const res = await request(app)
      .get('/api/students?vaccinated=true')
      .set('Authorization', AUTH);

    expect(res.body).toHaveLength(0);
  });
});

// ── Vaccinate ─────────────────────────────────────────────────────────────

describe('POST /api/students/:id/vaccinate', () => {
  let student, drive;

  beforeEach(async () => {
    student = await createStudent();
    drive   = await createDrive();
  });

  it('marks a student as vaccinated for a drive', async () => {
    const res = await request(app)
      .post(`/api/students/${student._id}/vaccinate`)
      .set('Authorization', AUTH)
      .send({ driveId: drive._id });

    expect(res.status).toBe(200);
    expect(res.body.vaccinations).toHaveLength(1);
    expect(res.body.vaccinations[0].vaccineName).toBe('Hepatitis B');
  });

  it('returns 409 if the student is already vaccinated for that drive', async () => {
    // First vaccination
    await request(app)
      .post(`/api/students/${student._id}/vaccinate`)
      .set('Authorization', AUTH)
      .send({ driveId: drive._id });

    // Duplicate attempt
    const res = await request(app)
      .post(`/api/students/${student._id}/vaccinate`)
      .set('Authorization', AUTH)
      .send({ driveId: drive._id });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already vaccinated/i);
  });

  it('returns 400 when driveId is missing', async () => {
    const res = await request(app)
      .post(`/api/students/${student._id}/vaccinate`)
      .set('Authorization', AUTH)
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 404 for a non-existent drive', async () => {
    const res = await request(app)
      .post(`/api/students/${student._id}/vaccinate`)
      .set('Authorization', AUTH)
      .send({ driveId: '000000000000000000000000' });

    expect(res.status).toBe(404);
  });

  it('allows vaccination for a second drive (different drive)', async () => {
    const drive2 = await createDrive({ vaccineName: 'Polio (OPV)', date: '2026-02-20', location: 'Gymnasium' });

    await request(app)
      .post(`/api/students/${student._id}/vaccinate`)
      .set('Authorization', AUTH)
      .send({ driveId: drive._id });

    const res = await request(app)
      .post(`/api/students/${student._id}/vaccinate`)
      .set('Authorization', AUTH)
      .send({ driveId: drive2._id });

    expect(res.status).toBe(200);
    expect(res.body.vaccinations).toHaveLength(2);
  });

  it('filters vaccinated=true returns only vaccinated students', async () => {
    await request(app)
      .post(`/api/students/${student._id}/vaccinate`)
      .set('Authorization', AUTH)
      .send({ driveId: drive._id });

    await createStudent({ name: 'Unvaccinated', class: '8B', studentId: 'S999' });

    const res = await request(app)
      .get('/api/students?vaccinated=true')
      .set('Authorization', AUTH);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].studentId).toBe('S001');
  });
});

// ── CSV Import ────────────────────────────────────────────────────────────

describe('POST /api/students/import', () => {
  it('imports valid rows from a CSV buffer', async () => {
    const csv = 'name,class,studentid\nZara Ahmed,8A,S021\nDev Malhotra,8B,S022\n';

    const res = await request(app)
      .post('/api/students/import')
      .set('Authorization', AUTH)
      .attach('file', Buffer.from(csv), 'students.csv');

    expect(res.status).toBe(200);
    expect(res.body.inserted).toBe(2);
    expect(res.body.skipped).toBe(0);

    const list = await request(app).get('/api/students').set('Authorization', AUTH);
    expect(list.body).toHaveLength(2);
  });

  it('skips rows with missing required fields', async () => {
    const csv = 'name,class,studentid\nGood Student,10A,S030\n,9B,\n';

    const res = await request(app)
      .post('/api/students/import')
      .set('Authorization', AUTH)
      .attach('file', Buffer.from(csv), 'students.csv');

    expect(res.status).toBe(200);
    expect(res.body.inserted).toBe(1);
    expect(res.body.skipped).toBe(1);
  });

  it('skips rows with a duplicate studentId', async () => {
    await createStudent(); // S001 already exists

    const csv = 'name,class,studentid\nDuplicate,10A,S001\nNew Student,9A,S099\n';

    const res = await request(app)
      .post('/api/students/import')
      .set('Authorization', AUTH)
      .attach('file', Buffer.from(csv), 'students.csv');

    expect(res.status).toBe(200);
    expect(res.body.inserted).toBe(1); // S099 inserted
    expect(res.body.skipped).toBe(1);  // S001 skipped
  });

  it('returns 400 when no file is attached', async () => {
    const res = await request(app)
      .post('/api/students/import')
      .set('Authorization', AUTH);

    expect(res.status).toBe(400);
  });
});
