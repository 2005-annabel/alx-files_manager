import dbClient from './db';

class FilesCollection {
  static async createFile(newFile) {
    const collection = dbClient.getCollection('files');
    const result = await collection.insertOne(newFile);
    return result.insertedId;
  }

  static async getFile(query) {
    const collection = dbClient.getCollection('files');
    const file = await collection.find(query).toArray();
    return file;
  }

  static async getPage(query, page, pageSize = 20) {
    const collection = dbClient.getCollection('files');
    const file = await collection
      .find(query)
      .skip(page * pageSize)
      .limit(pageSize)
      .toArray();
    return file;
  }

  static async updateFile(query, update) {
    const collection = dbClient.getCollection('files');
    await collection.updateOne(query, update);
  }

  static async findOne(query) {
    const collection = dbClient.getCollection('files');
    const file = await collection.findOne(query);
    return file;
  }
}

export default FilesCollection;
