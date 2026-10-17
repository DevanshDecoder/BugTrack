import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import connectDB from '../src/config/db.js';

describe('BugTrack API Core Suite', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('GET /api/health should return ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('BugTrack API');
  });

  it('POST /api/auth/register should reject missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/login should reject invalid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nonexistent@bugtrack.io',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/projects should require authentication', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/register should successfully create and persist a new user in the database', async () => {
    const testEmail = `vitest_user_${Date.now()}@example.com`;
    const registerRes = await request(app).post('/api/auth/register').send({
      name: 'Integration Test User',
      email: testEmail,
      password: 'password123',
      role: 'Developer',
    });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.success).toBe(true);
    expect(registerRes.body.data.email).toBe(testEmail);
    expect(registerRes.body.data.token).toBeDefined();

    // Verify user can immediately log in
    const loginRes = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: 'password123',
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.email).toBe(testEmail);

    // Clean up created user from DB
    const User = (await import('../src/models/User.js')).default;
    await User.deleteOne({ email: testEmail });
  });
});
