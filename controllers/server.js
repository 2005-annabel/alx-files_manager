import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.DB_URI || 'mongodb://127.0.0.1:27017', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let dbClient;

async function connectDB() {
  if (!dbClient) {
    try {
      await client.connect();
      dbClient = client.db(process.env.DB_DATABASE || 'files_manager');
      console.log('MongoDB connection successful');
    } catch (error) {
      console.error('MongoDB connection error:', error);
    }
  }
}

export default { connectDB, getCollection: (name) => dbClient.collection(name) };
