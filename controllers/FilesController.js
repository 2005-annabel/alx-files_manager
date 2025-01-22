import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;
    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!type || !['folder', 'file', 'image'].includes(type)) return res.status(400).json({ error: 'Missing type' });
    if (type !== 'folder' && !data) return res.status(400).json({ error: 'Missing data' });

    const parentFile = parentId !== 0 ? await dbClient.db.collection('files').findOne({ _id: new ObjectId(parentId) }) : null;
    if (parentId !== 0 && !parentFile) return res.status(400).json({ error: 'Parent not found' });
    if (parentId !== 0 && parentFile.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });

    const fileData = {
      userId: new ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId !== 0 ? new ObjectId(parentId) : 0,
    };

    if (type !== 'folder') {
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

      const localPath = path.join(folderPath, uuidv4());
      fs.writeFileSync(localPath, Buffer.from(data, 'base64'));
      fileData.localPath = localPath;
    }

    const result = await dbClient.db.collection('files').insertOne(fileData);
    res.status(201).json({
      id: result.insertedId,
      userId,
      name,
      type,
      isPublic,
      parentId,
    });
  }

  static async getShow(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(req.params.id), userId: new ObjectId(userId) });
    if (!file) return res.status(404).json({ error: 'Not found' });

    res.status(200).json(file);
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { parentId = 0, page = 0 } = req.query;
    const files = await dbClient.db.collection('files')
      .aggregate([
        { $match: { parentId: parentId !== 0 ? new ObjectId(parentId) : 0, userId: new ObjectId(userId) } },
        { $skip: page * 20 },
        { $limit: 20 },
      ])
      .toArray();

    res.status(200).json(files);
  }

  static async putPublish(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(req.params.id), userId: new ObjectId(userId) });
    if (!file) return res.status(404).json({ error: 'Not found' });

    await dbClient.db.collection('files').updateOne({ _id: new ObjectId(req.params.id) }, { $set: { isPublic: true } });
    res.status(200).json({ ...file, isPublic: true });
  }

  static async putUnpublish(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(req.params.id), userId: new ObjectId(userId) });
    if (!file) return res.status(404).json({ error: 'Not found' });

    await dbClient.db.collection('files').updateOne({ _id: new ObjectId(req.params.id) }, { $set: { isPublic: false } });
    res.status(200).json({ ...file, isPublic: false });
  }

  static async getFile(req, res) {
    const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(req.params.id) });
    if (!file) return res.status(404).json({ error: 'Not found' });

    if (!file.isPublic) {
      const token = req.headers['x-token'];
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId || userId !== file.userId.toString()) return res.status(404).json({ error: 'Not found' });
    }

    if (file.type === 'folder') return res.status(400).json({ error: "A folder doesn't have content" });

    const { size } = req.query;
    let filePath = file.localPath;
    if (size) {
      filePath = `${file.localPath}_${size}`;
    }

    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });

    const mimeType = mime.lookup(file.name);
    res.setHeader('Content-Type', mimeType);
    res.sendFile(filePath);
  }
}

export default FilesController;
