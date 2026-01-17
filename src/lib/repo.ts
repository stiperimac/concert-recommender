import { ObjectId } from 'mongodb';
import { getMongoClientPromise } from './mongodb';
import { COLLECTIONS } from './collections';
import type { ArtistDoc, EventDoc, InteractionDoc, PopularitySnapshotDoc, RecommendationDoc, UserProfileDoc } from './types';


export async function getDb() {
  const client = await getMongoClientPromise();
  return client.db(process.env.MONGODB_DB || "concert_recommender");
}

export function normalizeName(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

export async function upsertArtist(input: Omit<ArtistDoc, '_id' | 'createdAt' | 'updatedAt'> & { _id?: ObjectId }) {
  const db = await getDb();
  const now = new Date();
  const normalizedName = normalizeName(input.name);

  const col = db.collection<ArtistDoc>(COLLECTIONS.artists);
  const existing = await col.findOne({ normalizedName });

  if (existing) {
    await col.updateOne(
      { _id: existing._id },
      {
        $set: {
          name: input.name,
          normalizedName,
          genres: input.genres,
          signals: input.signals,
          updatedAt: now,
        },
      }
    );
    return existing._id.toHexString();
  }

  const doc: ArtistDoc = {
    _id: new ObjectId(),
    name: input.name,
    normalizedName,
    genres: input.genres,
    signals: input.signals,
    createdAt: now,
    updatedAt: now,
  };
  await col.insertOne(doc);
  return doc._id.toHexString();
}

export async function findArtistsByQuery(q: string, limit = 10) {
  const db = await getDb();
  const col = db.collection<ArtistDoc>(COLLECTIONS.artists);
  const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const docs = await col.find({ name: rx }).limit(limit).toArray();
  return docs.map((d) => ({
    id: d._id.toHexString(),
    name: d.name,
    genres: d.genres,
    signals: {
      spotifyPopularity: d.signals.spotify?.popularity,
      spotifyFollowers: d.signals.spotify?.followers,
      lastfmListeners: d.signals.lastfm?.listeners,
      lastfmPlaycount: d.signals.lastfm?.playcount,
    }
  }));
}

export async function getArtistById(id: string) {
  const db = await getDb();
  const col = db.collection<ArtistDoc>(COLLECTIONS.artists);
  const doc = await col.findOne({ _id: new ObjectId(id) });
  return doc;
}

export async function getArtistByName(name: string) {
  const db = await getDb();
  const col = db.collection<ArtistDoc>(COLLECTIONS.artists);
  const doc = await col.findOne({ normalizedName: normalizeName(name) });
  return doc;
}

export async function upsertEventByTicketmaster(tmId: string, patch: Partial<Omit<EventDoc, '_id' | 'createdAt' | 'updatedAt' | 'tmId'>> & Pick<EventDoc, 'name' | 'date' | 'artists'>) {
  const db = await getDb();
  const col = db.collection<EventDoc>(COLLECTIONS.events);
  const now = new Date();

  const existing = await col.findOne({ tmId });
  if (existing) {
    await col.updateOne(
      { _id: existing._id },
      { $set: { ...patch, updatedAt: now } }
    );
    return existing._id.toHexString();
  }

  const doc: EventDoc = {
    _id: new ObjectId(),
    tmId,
    name: patch.name,
    date: patch.date,
    artists: patch.artists,
    url: patch.url,
    localDateTime: patch.localDateTime,
    city: patch.city,
    countryCode: patch.countryCode,
    venue: patch.venue,
    images: patch.images,
    location: patch.location,
    createdAt: now,
    updatedAt: now,
  };
  await col.insertOne(doc);
  return doc._id.toHexString();
}

export async function findEventsByQuery({ artist, city, limit = 20 }: { artist?: string; city?: string; limit?: number }) {
  const db = await getDb();
  const col = db.collection<EventDoc>(COLLECTIONS.events);

  const query: any = {};
  if (artist) {
    query.artists = { $elemMatch: { $regex: new RegExp(artist, 'i') } };
  }
  if (city) {
    query.city = { $regex: new RegExp(city, 'i') };
  }

  const docs = await col.find(query).sort({ date: 1 }).limit(limit).toArray();
  return docs.map((d) => ({
    id: d._id.toHexString(),
    name: d.name,
    date: d.date,
    city: d.city,
    url: d.url,
    tmId: d.tmId,
  }));
}

export async function ensureUserProfile(userId: string) {
  const db = await getDb();
  const col = db.collection<UserProfileDoc>(COLLECTIONS.userProfiles);
  const now = new Date();
  const existing = await col.findOne({ _id: userId });
  if (existing) return existing;

  const doc: UserProfileDoc = {
    _id: userId,
    userId,
    city: 'Zagreb',
    favoriteArtists: [],
    onboardingCompleted: false,
    createdAt: now,
    updatedAt: now,
  };
  await col.insertOne(doc);
  return doc;
}

export async function updateUserProfile(userId: string, patch: Partial<Pick<UserProfileDoc, 'city' | 'favoriteArtists' | 'onboardingCompleted'>>) {
  const db = await getDb();
  const col = db.collection<UserProfileDoc>(COLLECTIONS.userProfiles);
  const now = new Date();

  await col.updateOne(
    { _id: userId },
    { $set: { ...patch, updatedAt: now }, $setOnInsert: { createdAt: now, userId, favoriteArtists: [], onboardingCompleted: false } },
    { upsert: true }
  );

  return col.findOne({ _id: userId });
}

export async function addInteraction(input: Omit<InteractionDoc, '_id' | 'createdAt'>) {
  const db = await getDb();
  const col = db.collection<InteractionDoc>(COLLECTIONS.interactions);
  const now = new Date();
  const doc: InteractionDoc = { _id: new ObjectId(), createdAt: now, ...input };
  await col.insertOne(doc);
  return doc._id.toHexString();
}

export async function countInteractionsByTarget(targetType: InteractionDoc['targetType'], targetId: string, type?: InteractionDoc['type']) {
  const db = await getDb();
  const col = db.collection<InteractionDoc>(COLLECTIONS.interactions);
  const q: any = { targetType, targetId };
  if (type) q.type = type;
  return col.countDocuments(q);
}

export async function getUserLikedArtistIds(userId: string, limit = 200) {
  const db = await getDb();
  const col = db.collection<InteractionDoc>(COLLECTIONS.interactions);
  const docs = await col.find({ userId, type: 'like_artist', targetType: 'artist' }).sort({ createdAt: -1 }).limit(limit).toArray();
  return docs.map((d) => d.targetId);
}

export async function getAllUsersWithLikes(limitUsers = 200) {
  const db = await getDb();
  const col = db.collection<InteractionDoc>(COLLECTIONS.interactions);
  const pipeline = [
    { $match: { type: 'like_artist', targetType: 'artist' } },
    { $group: { _id: '$userId', likes: { $addToSet: '$targetId' } } },
    { $limit: limitUsers }
  ];
  const rows = await col.aggregate<{ _id: string; likes: string[] }>(pipeline).toArray();
  return rows;
}

export async function upsertPopularitySnapshot(scope: PopularitySnapshotDoc['scope'], period: PopularitySnapshotDoc['period'], key: string, items: PopularitySnapshotDoc['items']) {
  const db = await getDb();
  const col = db.collection<PopularitySnapshotDoc>(COLLECTIONS.popularitySnapshots);
  const now = new Date();

  const existing = await col.findOne({ scope, period, key });
  if (existing) {
    await col.updateOne({ _id: existing._id }, { $set: { items, generatedAt: now } });
    return existing._id.toHexString();
  }

  const doc: PopularitySnapshotDoc = {
    _id: new ObjectId(),
    scope,
    period,
    key,
    generatedAt: now,
    items,
  };
  await col.insertOne(doc);
  return doc._id.toHexString();
}

export async function getPopularitySnapshot(scope: PopularitySnapshotDoc['scope'], period: PopularitySnapshotDoc['period'], key: string) {
  const db = await getDb();
  const col = db.collection<PopularitySnapshotDoc>(COLLECTIONS.popularitySnapshots);
  return col.findOne({ scope, period, key });
}

export async function upsertRecommendations(userId: string, horizonDays: number, city: string | undefined, items: RecommendationDoc['items']) {
  const db = await getDb();
  const col = db.collection<RecommendationDoc>(COLLECTIONS.recommendations);
  const now = new Date();

  const existing = await col.findOne({ userId });
  if (existing) {
    await col.updateOne({ _id: existing._id }, { $set: { items, generatedAt: now, horizonDays, city } });
    return existing._id.toHexString();
  }

  const doc: RecommendationDoc = {
    _id: new ObjectId(),
    userId,
    generatedAt: now,
    horizonDays,
    city,
    items,
  };
  await col.insertOne(doc);
  return doc._id.toHexString();
}

export async function getRecommendationsForUser(userId: string) {
  const db = await getDb();
  const col = db.collection<RecommendationDoc>(COLLECTIONS.recommendations);
  return col.findOne({ userId });
}

export async function listArtists(limit = 200) {
  const db = await getDb();
  const col = db.collection<ArtistDoc>(COLLECTIONS.artists);
  const docs = await col.find({}).limit(limit).toArray();
  return docs;
}

export async function listEvents(limit = 2000) {
  const db = await getDb();
  const col = db.collection<EventDoc>(COLLECTIONS.events);
  const docs = await col.find({}).sort({ date: 1 }).limit(limit).toArray();
  return docs;
}

export async function getEventById(id: string) {
  const db = await getDb();
  const col = db.collection<EventDoc>(COLLECTIONS.events);
  return col.findOne({ _id: new ObjectId(id) });
}
