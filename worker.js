import { Queue } from 'bull';
import dbClient from './utils/db.js';
import redisClient from './utils/redis.js';
import imageThumbnail from 'image-thumbnail';
import fs from 'fs';
import path from 'path';

const fileQueue = new Queue('fileQueue');
const userQueue = new Queue('userQueue');

fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;
  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');

  const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(fileId), userId: new ObjectId(userId) });
  if (!file) throw new Error('File not found');

  const sizes = [500, 250, 100];
  for (const size of sizes) {
    const thumbnail = await imageThumbnail(file.localPath, { width: size });
    const thumbnailPath = `${file.localPath}_${size}`;
    fs.writeFileSync(thumbnailPath, thumbnail);
  }
});

userQueue.process(async (job) => {
  const { userId } = job.data;
  if (!userId) throw new Error('Missing userId');

  const user = await dbClient.db.collection('users').findOne({ _id: new ObjectId(userId) });
  if (!user) throw new Error('User not found');

  console.log(`Welcome ${user.email}!`);
});

export default { fileQueue, userQueue };
