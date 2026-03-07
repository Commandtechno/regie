import { MongoClient, type Collection, type Db } from "mongodb";
import type { CourseDocument } from "./types.js";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  client = new MongoClient(uri);
  await client.connect();

  const dbName = process.env.MONGODB_DB || "classes";
  db = client.db(dbName);

  return db;
}

export async function getCoursesCollection(): Promise<Collection<CourseDocument>> {
  const database = await getDb();
  const collectionName = process.env.MONGODB_COLLECTION || "courses";
  return database.collection<CourseDocument>(collectionName);
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
