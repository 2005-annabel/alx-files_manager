const request = require('supertest');
const server = require('../server'); // Adjust the path as needed

describe('GET /stats', () => {
  it('should return status 200', (done) => {
    request(server)
      .get('/stats')
      .expect(200, done);
  });
});
