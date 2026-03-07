import { readFile } from "fs/promises";
import { getCoursesCollection, closeDb } from "../db.js";
import type { CourseDocument } from "../types.js";

interface ClassesJson {
  results: CourseDocument[];
  total: number;
}

async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error("Usage: tsx --env-file=.env src/cli/import.ts <path-to-classes.json>");
    process.exit(1);
  }

  const startTime = Date.now();

  try {
    console.log(`Reading classes.json from ${filePath}...`);
    const fileContent = await readFile(filePath, "utf-8");

    let data: ClassesJson;
    try {
      data = JSON.parse(fileContent) as ClassesJson;
    } catch {
      throw new Error("Invalid JSON: unable to parse file");
    }

    if (!Array.isArray(data.results)) {
      throw new Error("Invalid JSON: results array not found");
    }

    const records = data.results;
    console.log(`Parsed ${records.length} course records.`);

    const dbName = process.env.MONGODB_DB || "classes";
    const collectionName = process.env.MONGODB_COLLECTION || "courses";
    console.log(`Connecting to MongoDB (db: ${dbName}, collection: ${collectionName})...`);

    const collection = await getCoursesCollection();

    const existingCount = await collection.countDocuments();
    if (existingCount > 0) {
      console.log(`Dropping existing ${existingCount} documents...`);
      await collection.deleteMany({});
    }

    console.log(`Inserting ${records.length} documents...`);
    await collection.insertMany(records);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✓ Import complete: ${records.length} documents inserted in ${elapsed}s`);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("ENOENT")) {
        console.error(`✗ Error: File not found: ${filePath}`);
      } else {
        console.error(`✗ Error: ${error.message}`);
      }
    } else {
      console.error("✗ Error: An unknown error occurred");
    }
    process.exit(1);
  } finally {
    await closeDb();
  }
}

main();
