const request = require('supertest');
const server = require('../server'); // Adjust the path as needed

describe('GET /stats', () => {
  it('should return the number of users and files (both at 0)', (done) => {
    request(server)
      .get('/stats')
      .expect(200)
      .expect((res) => {
        if (res.body.users !== 0) throw new Error("Users count is not 0");
        if (res.body.files !== 0) throw new Error("Files count is not 0");
      })
      .end(done);
  });
});
