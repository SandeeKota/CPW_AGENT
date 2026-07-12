import { MongoClient, Db, type MongoClientOptions } from "mongodb";
import config from "./config";

const uri = config.MONGO_URI;
const mongoOptions: MongoClientOptions = {
  socketTimeoutMS: 5000,
  connectTimeoutMS: 30000,
  serverSelectionTimeoutMS: 5000,
  retryWrites: true,
  w: "majority",
};

let client: MongoClient | null = null;

export const getConnection = async (): Promise<MongoClient> => {
  if (!client) {
    client = await MongoClient.connect(uri, mongoOptions);
  }
  return client;
};

export const getDb = async (): Promise<Db> => {
  const conn = await getConnection();
  return conn.db(config.DB_NAME);
};
