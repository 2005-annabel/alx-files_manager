import chai from 'chai';
import chaiHttp from 'chai-http';
import sha1 from 'sha1';
import { MongoClient } from 'mongodb';
import { createClient } from 'redis';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import app from '../server';

chai.use(chaiHttp);
const { expect, request } = chai;

/**
 * Helper function to generate a random string.
 */
const randomString = () => Math.random().toString(16).substring(2);

/**
 * Setup and teardown for MongoDB and Redis clients.
 */
describe('AuthController Tests', () => {
  let dbClient;
  let db;
  let rdClient;
  let asyncSet, asyncKeys, asyncDel;
  const DB_HOST = process.env.DB_HOST || 'localhost';
  const DB_PORT = process.env.DB_PORT || 27017;
  const DATABASE = process.env.DB_DATABASE || 'files_manager';
  const initialPassword = randomString();
  const hashedPassword = sha1(initialPassword);
  const user = { email: `${randomString()}@mail.com`, password: hashedPassword };
  const token = uuidv4();

  before(async () => {
    // Connect to MongoDB and clear collections
    dbClient = new MongoClient(`mongodb://${DB_HOST}:${DB_PORT}`, { useUnifiedTopology: true });
    await dbClient.connect();
    db = dbClient.db(DATABASE);
    await db.collection('users').deleteMany({});

    // Insert a new user
    const { insertedId } = await db.collection('users').insertOne(user);

    // Setup Redis client
    rdClient = createClient();
    asyncSet = promisify(rdClient.set).bind(rdClient);
    asyncKeys = promisify(rdClient.keys).bind(rdClient);
    asyncDel = promisify(rdClient.del).bind(rdClient);
    await new Promise((resolve, reject) => {
      rdClient.on('connect', async () => {
        await asyncSet(`auth_${token}`, insertedId.toString());
        resolve();
      });
      rdClient.on('error', reject);
    });
  });

  after(async () => {
    // Cleanup MongoDB collections
    await db.collection('users').deleteMany({});
    await db.dropDatabase();
    await dbClient.close();

    // Cleanup Redis keys and close connection
    const tokens = await asyncKeys('auth_*');
    const deleteKeysOperations = tokens.map(key => asyncDel(key));
    await Promise.all(deleteKeysOperations);
    rdClient.quit();
  });

  describe('GET /connect', () => {
    it('should login user and return token', (done) => {
      request(app)
        .get('/connect')
        .auth(user.email, initialPassword)
        .end((error, res) => {
          expect(error).to.be.null;
          expect(res).to.have.status(200);
          expect(res.body.token).to.be.a('string');
          done();
        });
    });

    it('should return unauthorized if email is missing', (done) => {
      request(app)
        .get('/connect')
        .auth('', user.password)
        .end((error, res) => {
          expect(error).to.be.null;
          expect(res).to.have.status(401);
          expect(res.body.error).to.equal('Unauthorized');
          done();
        });
    });

    it('should return unauthorized if password is missing', (done) => {
      request(app)
        .get('/connect')
        .auth(user.email)
        .end((error, res) => {
          expect(error).to.be.null;
          expect(res).to.have.status(401);
          expect(res.body.error).to.equal('Unauthorized');
          done();
        });
    });

    it('should return unauthorized when credentials are missing', (done) => {
      request(app)
        .get('/connect')
        .end((error, res) => {
          expect(error).to.be.null;
          expect(res).to.have.status(401);
          expect(res.body.error).to.equal('Unauthorized');
          done();
        });
    });

    it('should return unauthorized when credentials are incorrect', (done) => {
      const email = `${randomString()}@test.com`;
      const password = randomString();
      request(app)
        .get('/connect')
        .auth(email, password)
        .end((error, res) => {
          expect(error).to.be.null;
          expect(res).to.have.status(401);
          expect(res.body.error).to.equal('Unauthorized');
          done();
        });
    });
  });

  describe('GET /users/me', () => {
    it('should return user details with a valid token', (done) => {
      request(app)
        .get('/users/me')
        .set('X-Token', token)
        .end((error, res) => {
          expect(error).to.be.null;
          expect(res).to.have.status(200);
          expect(res.body.id).to.be.a('string');
          expect(res.body.email).to.equal(user.email);
          expect(res.body.password).to.be.undefined;
          done();
        });
    });

    it('should return unauthorized with an incorrect token', (done) => {
      request(app)
        .get('/users/me')
        .set('X-Token', uuidv4())
        .end((error, res) => {
          expect(error).to.be.null;
          expect(res).to.have.status(401);
          expect(res.body.error).to.equal('Unauthorized');
          done();
        });
    });
  });

describe('GET /disconnect', () => {
  it('should logout user from the system', (done) => {
    request(app)
      .get('/disconnect')
      .set('X-Token', token)
      .end((error, res) => {
        expect(error).to.be.null;
        expect(res).to.have.status(204);
        done();
      });
  });
  });
});
