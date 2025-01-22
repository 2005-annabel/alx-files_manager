const request = require('supertest');
const server = require('../server'); // Adjust the path as needed

describe('GET /status', () => {
  it('should return the status of Redis and MongoDB', (done) => {
    request(server)
      .get('/status')
      .expect(200)
      .expect((res) => {
        if (!('redis' in res.body)) throw new Error("Missing redis status");
        if (!('mongodb' in res.body)) throw new Error("Missing mongodb status");
      })
      .end(done);
  });
});
