import chai from 'chai';
import chaiHttp from 'chai-http';
import { MongoClient } from 'mongodb';
import { createClient } from 'redis';
import { promisify } from 'util';
import app from '../server';

chai.use(chaiHttp);
const { expect, request } = chai;

/**
 * Test cases for UsersController.js endpoint:
 * 1. POST /users
 */
describe('UsersController.js tests', () => {
  let dbClient;
  let db;
  let rdClient;
  let asyncKeys;
  let asyncDel;
  const DB_HOST = process.env.DB_HOST || 'localhost';
  const DB_PORT = process.env.DB_PORT || 27017;
  const DATABASE = process.env.DB_DATABASE || 'files_manager';
  const user = { email: 'tester@mail.com', password: 'supersecretFYI' };

  before(async () => {
    // Initialize database client and clear collections
    dbClient = new MongoClient(`mongodb://${DB_HOST}:${DB_PORT}`, { useUnifiedTopology: true });
    await dbClient.connect();
    db = dbClient.db(DATABASE);
    await db.collection('users').deleteMany({});

    // Initialize Redis client and prepare utility functions
    rdClient = createClient();
    asyncKeys = promisify(rdClient.keys).bind(rdClient);
    asyncDel = promisify(rdClient.del).bind(rdClient);
    await new Promise((resolve) => {
      rdClient.on('connect', resolve);
    });
  });

  after(async () => {
    // Clean up database and Redis after tests
    await db.collection('users').deleteOne({ email: user.email });
    await db.dropDatabase();
    await dbClient.close();

    const redisKeys = await asyncKeys('bull*');
    const deleteOperations = redisKeys.map((key) => asyncDel(key));
    await Promise.all(deleteOperations);
    rdClient.quit();
  });

  describe('POST /users', () => {
    it('should create a new user and add them to the database', (done) => {
      request(app)
        .post('/users')
        .send(user)
        .end((error, res) => {
          expect(error).to.be.null;
          expect(res).to.have.status(201);
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('email');
          expect(res.body.email).to.equal(user.email);
          done();
        });
    });

    it('should not allow duplicate users with the same email', (done) => {
      request(app)
        .post('/users')
        .send(user)
        .end((error, res) => {
          expect(error).to.be.null;
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('error');
          expect(res.body.error).to.equal('Already exist');
          done();
        });
    });

    it('should return a 400 status if email is missing', (done) => {
      const invalidUser = { password: 'supersecretFYI' };
      request(app)
        .post('/users')
        .send(invalidUser)
        .end((error, res) => {
          expect(error).to.be.null;
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('error');
          expect(res.body.error).to.equal('Missing email');
          done();
        });
    });

    it('should return a 400 status if password is missing', (done) => {
      const invalidUser = { email: 'tester@mail.com' };
      request(app)
        .post('/users')
        .send(invalidUser)
        .end((error, res) => {
          expect(error).to.be.null;
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('error');
          expect(res.body.error).to.equal('Missing password');
          done();
        });
    });
  });
});
