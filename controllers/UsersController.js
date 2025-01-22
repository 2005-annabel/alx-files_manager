const crypto = require('crypto');
const { MongoClient } = require('mongodb');

// MongoDB setup
const dbClient = new MongoClient('mongodb://127.0.0.1:27017', { useUnifiedTopology: true });
const databaseName = 'files_manager';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    try {
      await dbClient.connect();
      const db = dbClient.db(databaseName);
      const usersCollection = db.collection('users');

      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Already exist' });
      }

      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
      const newUser = {
        email,
        password: hashedPassword,
      };

      const result = await usersCollection.insertOne(newUser);

      return res.status(201).json({
        id: result.insertedId,
        email: newUser.email,
      });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      await dbClient.close();
    }
  }
}

module.exports = UsersController;
