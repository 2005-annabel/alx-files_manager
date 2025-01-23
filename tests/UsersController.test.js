import { ObjectId } from 'mongodb';
import sha1 from 'sha1';
import dbClient from '../utils/db';
import RedisClient from '../utils/redis';

class UsersController {
  // Corrected postNew method
  static async postNew(req, res) {
    const { email, password } = req.body;

    // Handle missing email or password
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    // Check if the user already exists
    const user = await dbClient.db.collection('users').findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'Already exist' });
    }

    // Hash the password and insert a new user
    const hashedPassword = sha1(password);
    const result = await dbClient.db.collection('users').insertOne({
      email,
      password: hashedPassword,
    });

    // Return success response
    return res.status(201).json({ id: result.insertedId, email });
  }

  // Corrected getMe method
  static async getMe(req, res) {
    const token = req.headers['x-token'];

    // Validate token and get userId
    const userId = await RedisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find user by userId
    const user = await dbClient.db.collection('users').findOne({
      _id: new ObjectId(userId),
    });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Return user details
    return res.status(200).json({ id: user._id, email: user.email });
  }
}

export default UsersController;
