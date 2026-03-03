const request = require('supertest');
const app     = require('../app');
const db      = require('./helpers/db');

beforeAll(db.connect);
afterEach(db.clearDB);
afterAll(db.disconnect);

const AUTH = 'Bearer admin-token';

const DRIVE_PAYLOAD = {
  vaccineName: 'Hepatitis B',
  date:        '2026-01-15',
  location:    'Main Hall',
};

describe('GET /api/drives', () => {
  it('returns an empty array when no drives exist', async () => {
    const res = await request(app).get('/api/drives').set('Authorization', AUTH);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('POST /api/drives', () => {
  it('creates a drive and returns 201', async () => {
    const res = await request(app)
      .post('/api/drives')
      .set('Authorization', AUTH)
      .send(DRIVE_PAYLOAD);

    expect(res.status).toBe(201);
    expect(res.body.vaccineName).toBe('Hepatitis B');
    expect(res.body.location).toBe('Main Hall');
    expect(res.body._id).toBeDefined();
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/drives')
      .set('Authorization', AUTH)
      .send({ vaccineName: 'Polio' }); // missing date + location

    expect(res.status).toBe(400);
  });
});

describe('PUT /api/drives/:id', () => {
  it('updates an existing drive', async () => {
    const create = await request(app)
      .post('/api/drives')
      .set('Authorization', AUTH)
      .send(DRIVE_PAYLOAD);

    const id = create.body._id;

    const update = await request(app)
      .put(`/api/drives/${id}`)
      .set('Authorization', AUTH)
      .send({ ...DRIVE_PAYLOAD, location: 'New Gymnasium' });

    expect(update.status).toBe(200);
    expect(update.body.location).toBe('New Gymnasium');
  });

  it('returns 404 for a non-existent id', async () => {
    const res = await request(app)
      .put('/api/drives/000000000000000000000000')
      .set('Authorization', AUTH)
      .send(DRIVE_PAYLOAD);

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/drives/:id', () => {
  it('deletes a drive', async () => {
    const create = await request(app)
      .post('/api/drives')
      .set('Authorization', AUTH)
      .send(DRIVE_PAYLOAD);

    const id = create.body._id;

    const del = await request(app)
      .delete(`/api/drives/${id}`)
      .set('Authorization', AUTH);

    expect(del.status).toBe(200);

    // Confirm it no longer exists
    const list = await request(app).get('/api/drives').set('Authorization', AUTH);
    expect(list.body).toHaveLength(0);
  });

  it('returns 404 for a non-existent id', async () => {
    const res = await request(app)
      .delete('/api/drives/000000000000000000000000')
      .set('Authorization', AUTH);

    expect(res.status).toBe(404);
  });
});
