import { MongoClient, ObjectId } from 'mongodb';
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

const usersCol = db.collection('users');
const profilesCol = db.collection('user_profiles');
const artistsCol = db.collection('artists');
const eventsCol = db.collection('events');

async function upsertUser({ email, name }) {
  const existing = await usersCol.findOne({ email });
  if (existing) return existing._id.toHexString();
  const _id = new ObjectId();
  await usersCol.insertOne({ _id, email, name, emailVerified: null, image: null });
  return _id.toHexString();
}

const userIds = [];
userIds.push(await upsertUser({ email: 'demo1@example.com', name: 'Demo 1' }));
userIds.push(await upsertUser({ email: 'demo2@example.com', name: 'Demo 2' }));
userIds.push(await upsertUser({ email: 'demo3@example.com', name: 'Demo 3' }));
userIds.push(await upsertUser({ email: 'demo4@example.com', name: 'Demo 4' }));

for (const id of userIds) {
  await profilesCol.updateOne(
    { _id: id },
    {
      $setOnInsert: {
        _id: id,
        userId: id,
        city: 'Zagreb',
        favoriteArtists: ['Coldplay', 'Metallica'],
        onboardingCompleted: true,
        createdAt: new Date(),
      },
      $set: { updatedAt: new Date() }
    },
    { upsert: true }
  );
}

// Minimal sample content
await artistsCol.updateOne(
  { normalizedName: 'coldplay' },
  {
    $setOnInsert: {
      _id: new ObjectId('000000000000000000000001'),
      name: 'Coldplay',
      normalizedName: 'coldplay',
      genres: ['pop', 'rock'],
      signals: { spotify: { popularity: 90, followers: 35000000, genres: ['pop', 'rock'] }, lastfm: { listeners: 12000000, playcount: 900000000 } },
      createdAt: new Date(),
    },
    $set: { updatedAt: new Date() }
  },
  { upsert: true }
);

const future = new Date(Date.now() + 30 * 24 * 3600 * 1000);
const y = future.getFullYear();
const m = String(future.getMonth() + 1).padStart(2, '0');
const d = String(future.getDate()).padStart(2, '0');

await eventsCol.updateOne(
  { tmId: 'seed-coldplay-zg' },
  {
    $setOnInsert: {
      _id: new ObjectId(),
      tmId: 'seed-coldplay-zg',
      name: 'Coldplay - Seed Event',
      date: `${y}-${m}-${d}`,
      city: 'Zagreb',
      venue: 'Arena Zagreb',
      countryCode: 'HR',
      url: 'https://example.com',
      artists: ['Coldplay'],
      location: { lat: 45.777, lon: 15.941 },
      createdAt: new Date(),
    },
    $set: { updatedAt: new Date() }
  },
  { upsert: true }
);

console.log('Seed completed. Users:', userIds);
await client.close();
