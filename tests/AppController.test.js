import chai from 'chai';
import chaiHttp from 'chai-http';
import { MongoClient } from 'mongodb';
import sha1 from 'sha1';
import app from '../server';

chai.use(chaiHttp);
const { expect, request } = chai;

/**
 * Helper function to generate a random string.
 */
const randomString = () => Math.random().toString(16).substring(2);

/**
 * AppController test cases.
 */
describe('app Controller Tests', () => {
  let client;
  let db;
  const DB_HOST = process.env.DB_HOST || 'localhost';
  const DB_PORT = process.env.DB_PORT || 27017;
  const DATABASE = process.env.DB_DATABASE || 'files_manager';
  const users = [];
  const files = [];

  before(async () => {
    // Connect to the database
    client = new MongoClient(`mongodb://${DB_HOST}:${DB_PORT}`, { useUnifiedTopology: true });
    await client.connect();

    // Clear and populate user and files collections
    db = client.db(DATABASE);
    await db.collection('users').deleteMany({});
    await db.collection('files').deleteMany({});

    for (let i = 0; i < 5; i++) {
      const newUser = {
        email: `${randomString()}@mail.com`,
        password: sha1(randomString()),
      };
      const newFile = {
        name: randomString(),
        type: 'folder',
        parentId: 0,
        isPublic: false,
      };
      users.push(newUser);
      files.push(newFile);
    }

    await db.collection('users').insertMany(users);
    await db.collection('files').insertMany(files);
  });

  after(async () => {
    // Cleanup and close the connection
    await db.collection('users').deleteMany({});
    await db.collection('files').deleteMany({});
    await db.dropDatabase();
    await client.close();
  });

  describe('gET /status', () => {
    it('should return the status of Redis and MongoDB clients', () => new Promise((done) => {
      request(app)
        .get('/status')
        .end((error, res) => {
          const status = res.body;
          expect(error).to.be.null;
          expect(res).to.have.status(200);
          expect(status).to.have.property('redis');
          expect(status.redis).to.be.a('boolean');
          expect(status).to.have.property('db');
          expect(status.db).to.be.a('boolean');
          done();
        });
    }));
  });

  describe('gET /stats', () => {
    it('should return the number of users (5) and files (5) in the database', () => new Promise((done) => {
      request(app)
        .get('/stats')
        .end((error, res) => {
          const stats = res.body;
          expect(error).to.be.null;
          expect(res).to.have.status(200);
          expect(stats.users).to.equal(5);
          expect(stats.files).to.equal(5);
          done();
        });
    }));
  });
});
