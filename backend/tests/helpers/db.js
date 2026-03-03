/**
 * Shared MongoDB memory server helpers.
 * Each test file calls connect/disconnect to get its own isolated instance.
 */
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

const connect = async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
};

const clearDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

const disconnect = async () => {
  await mongoose.disconnect();
  await mongod.stop();
};

module.exports = { connect, clearDB, disconnect };
