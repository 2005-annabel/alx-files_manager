const request = require('supertest');
const server = require('../server'); // Adjust the path as needed

describe('GET /status', () => {
  it('should return status 200', (done) => {
    request(server)
      .get('/status')
      .expect(200, done);
  });
});
