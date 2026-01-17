import { MongoClient } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'concert_recommender';

if (!uri) {
  console.error('Missing MONGODB_URI');
  process.exit(1);
}

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);

const outDir = path.resolve('dump', 'sample');
await fs.mkdir(outDir, { recursive: true });

async function dumpCollection(name) {
  const docs = await db.collection(name).find({}).limit(5000).toArray();
  await fs.writeFile(path.join(outDir, `${name}.json`), JSON.stringify(docs, null, 2), 'utf8');
  console.log('Dumped', name, docs.length);
}

await dumpCollection('artists');
await dumpCollection('events');
await dumpCollection('interactions');
await dumpCollection('user_profiles');
await dumpCollection('popularity_snapshots');
await dumpCollection('recommendations');

await client.close();
