const request = require('supertest');
const app = require('../app');

describe('Auth', function() {
  it('health check', async function() {
    const res = await request(app).get('/health');
    if (res.status !== 200) throw new Error('health failed');
  });
});
