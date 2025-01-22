import dbClient from './db';

class UsersCollection {
  /**
   * Create a new user.
   * @param {Object} user - The user details.
   * @param {string} user.email - The email of the user.
   * @param {string} user.password - The password of the user.
   * @returns {Promise<string>} The ID of the created user.
   */
  static async createUser({ email, password }) {
    const collection = dbClient.getCollection('users');
    const newUser = { email, password };
    const result = await collection.insertOne(newUser);
    return result.insertedId;
  }

  /**
   * Get users based on a query.
   * @param {Object} query - The query object to match users.
   * @returns {Promise<Array>} A list of users matching the query.
   */
  static async getUser(query) {
    const collection = dbClient.getCollection('users');
    const users = await collection.find(query).toArray();
    return users;
  }

  /**
   * Find one user based on a query.
   * @param {Object} query - The query object to find a user.
   * @returns {Promise<Object|null>} The user matching the query, or null if not found.
   */
  static async findOne(query) {
    const collection = dbClient.getCollection('users');
    const user = await collection.findOne(query);
    return user;
  }
}

export default UsersCollection;
