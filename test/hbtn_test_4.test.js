// filepath: test/hbtn_test_4.test.js
const request = require('supertest');
const server = require('../server'); // Adjust the path as needed

describe('GET /stats', () => {
  it('should return the number of users and files (with various number)', (done) => {
    request(server)
      .get('/stats')
      .expect(200)
      .expect((res) => {
        if (typeof res.body.users !== 'number') throw new Error("Users count is not a number");
        if (typeof res.body.files !== 'number') throw new Error("Files count is not a number");
      })
      .end(done);
  });
});
