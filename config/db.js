import { MongoClient, GridFSBucket } from "mongodb";

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "cpsc431_vasusiddharth";

let db;
let bucket;

export async function connectDB() {
  const client = await MongoClient.connect(MONGO_URL);
  db = client.db(DB_NAME);
  console.log("Connected to MongoDB");
  bucket = new GridFSBucket(db, { bucketName: "uploads" });
}

export function getDB() {
  return db;
}

export function getBucket() {
  return bucket;
}

export function users() {
  return db.collection("users");
}