/**
 * Full seed script - populates database with real data from external APIs.
 * 
 * Prerequisites:
 * - MongoDB running (local or Atlas)
 * - Environment variables set in .env:
 *   - MONGODB_URI
 *   - TICKETMASTER_API_KEY
 *   - SPOTIFY_ACCESS_TOKEN (optional but recommended)
 *   - LASTFM_API_KEY (optional)
 * 
 * Usage:
 *   node scripts/seed-full.mjs
 * 
 * Options:
 *   --skip-artists    Skip artist ingestion
 *   --skip-events     Skip event fetching
 *   --skip-users      Skip demo user creation
 *   --city=Zagreb     Set city for event search (default: Zagreb)
 */

import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

// Configuration
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'concert_recommender';
const TICKETMASTER_KEY = process.env.TICKETMASTER_API_KEY;
const SPOTIFY_TOKEN = process.env.SPOTIFY_ACCESS_TOKEN;
const LASTFM_KEY = process.env.LASTFM_API_KEY;

// Parse CLI args
const args = process.argv.slice(2);
const skipArtists = args.includes('--skip-artists');
const skipEvents = args.includes('--skip-events');
const skipUsers = args.includes('--skip-users');
const cityArg = args.find(a => a.startsWith('--city='));
const CITY = cityArg ? cityArg.split('=')[1] : 'Zagreb';

// Popular artists to seed (mix of genres)
const ARTISTS_TO_SEED = [
  // Pop
  'Taylor Swift',
  'Ed Sheeran',
  'Dua Lipa',
  'The Weeknd',
  'Harry Styles',
  'Billie Eilish',
  'Bruno Mars',
  'Adele',
  // Rock
  'Coldplay',
  'Imagine Dragons',
  'Foo Fighters',
  'Arctic Monkeys',
  'Red Hot Chili Peppers',
  'Muse',
  'Green Day',
  // Metal
  'Metallica',
  'Iron Maiden',
  'Rammstein',
  'Slipknot',
  // Electronic
  'Calvin Harris',
  'David Guetta',
  'Martin Garrix',
  'Kygo',
  // Hip-hop
  'Drake',
  'Kendrick Lamar',
  'Post Malone',
  'Travis Scott',
  // Regional/European
  '2Cellos',
  'Måneskin',
  'Oliver Dragojević',
  'Gibonni',
  'Parni Valjak',
  'Hladno Pivo',
  'Let 3',
  'Dubioza Kolektiv',
];

// Demo users
const DEMO_USERS = [
  { email: 'demo1@example.com', name: 'Ana Horvat', city: 'Zagreb', artists: ['Coldplay', 'Ed Sheeran', 'Dua Lipa'] },
  { email: 'demo2@example.com', name: 'Marko Novak', city: 'Zagreb', artists: ['Metallica', 'Iron Maiden', 'Foo Fighters'] },
  { email: 'demo3@example.com', name: 'Ivana Kovač', city: 'Split', artists: ['Taylor Swift', 'Billie Eilish', 'Harry Styles'] },
  { email: 'demo4@example.com', name: 'Petar Babić', city: 'Rijeka', artists: ['Calvin Harris', 'Martin Garrix', 'David Guetta'] },
  { email: 'demo5@example.com', name: 'Luka Jurić', city: 'Zagreb', artists: ['Dubioza Kolektiv', 'Hladno Pivo', 'Let 3'] },
];

// Helper functions
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeName(name) {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Spotify API
async function fetchSpotifyArtist(name) {
  if (!SPOTIFY_TOKEN) return null;
  
  try {
    const params = new URLSearchParams({ type: 'artist', limit: '1', q: name });
    const res = await fetch(`https://api.spotify.com/v1/search?${params}`, {
      headers: { Authorization: `Bearer ${SPOTIFY_TOKEN}` }
    });
    
    if (!res.ok) {
      console.warn(`  Spotify error for ${name}: ${res.status}`);
      return null;
    }
    
    const data = await res.json();
    const artist = data?.artists?.items?.[0];
    if (!artist) return null;
    
    return {
      id: artist.id,
      popularity: artist.popularity ?? 0,
      followers: artist.followers?.total ?? 0,
      genres: Array.isArray(artist.genres) ? artist.genres : [],
    };
  } catch (e) {
    console.warn(`  Spotify fetch failed for ${name}:`, e.message);
    return null;
  }
}

// Last.fm API
async function fetchLastfmArtist(name) {
  if (!LASTFM_KEY) return null;
  
  try {
    const params = new URLSearchParams({
      method: 'artist.getinfo',
      artist: name,
      api_key: LASTFM_KEY,
      format: 'json'
    });
    
    const res = await fetch(`https://ws.audioscrobbler.com/2.0/?${params}`);
    if (!res.ok) return null;
    
    const data = await res.json();
    const artist = data?.artist;
    if (!artist) return null;
    
    const tags = (artist.tags?.tag || []).map(t => t.name).slice(0, 10);
    
    return {
      mbid: artist.mbid || undefined,
      listeners: parseInt(artist.stats?.listeners) || 0,
      playcount: parseInt(artist.stats?.playcount) || 0,
      tags,
    };
  } catch (e) {
    console.warn(`  Last.fm fetch failed for ${name}:`, e.message);
    return null;
  }
}

// Ticketmaster API
async function fetchTicketmasterEvents(keyword, city, size = 30) {
  if (!TICKETMASTER_KEY) {
    console.warn('  TICKETMASTER_API_KEY not set, skipping event fetch');
    return [];
  }
  
  try {
    const params = new URLSearchParams({
      apikey: TICKETMASTER_KEY,
      classificationName: 'music',
      keyword,
      size: String(size),
    });
    if (city) params.set('city', city);
    
    const res = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`);
    if (!res.ok) {
      console.warn(`  Ticketmaster error: ${res.status}`);
      return [];
    }
    
    const data = await res.json();
    const events = data?._embedded?.events || [];
    
    return events.map(e => {
      const venue = e?._embedded?.venues?.[0];
      const attractions = (e?._embedded?.attractions || []).map(a => a?.name).filter(Boolean);
      const loc = venue?.location?.latitude && venue?.location?.longitude
        ? { lat: Number(venue.location.latitude), lon: Number(venue.location.longitude) }
        : undefined;
      
      return {
        tmId: e.id,
        name: e.name,
        url: e.url,
        date: e?.dates?.start?.localDate,
        localDateTime: e?.dates?.start?.dateTime,
        city: venue?.city?.name,
        countryCode: venue?.country?.countryCode,
        venue: venue?.name,
        images: Array.isArray(e.images) ? e.images.map(im => ({ url: im.url, width: im.width, height: im.height })) : [],
        location: loc,
        artists: attractions.length ? attractions : [keyword],
      };
    }).filter(x => x.tmId && x.date);
  } catch (e) {
    console.warn(`  Ticketmaster fetch failed for ${keyword}:`, e.message);
    return [];
  }
}

// Main seed function
async function main() {
  console.log('🎵 Concert Recommender - Full Seed Script\n');
  
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set');
    process.exit(1);
  }
  
  console.log('Configuration:');
  console.log(`  MongoDB: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
  console.log(`  Database: ${DB_NAME}`);
  console.log(`  City: ${CITY}`);
  console.log(`  Spotify: ${SPOTIFY_TOKEN ? '✓' : '✗ (artists will have limited data)'}`);
  console.log(`  Last.fm: ${LASTFM_KEY ? '✓' : '✗ (artists will have limited data)'}`);
  console.log(`  Ticketmaster: ${TICKETMASTER_KEY ? '✓' : '✗ (no events will be fetched)'}`);
  console.log('');
  
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log('✓ Connected to MongoDB\n');
  
  const db = client.db(DB_NAME);
  const artistsCol = db.collection('artists');
  const eventsCol = db.collection('events');
  const usersCol = db.collection('users');
  const profilesCol = db.collection('user_profiles');
  const interactionsCol = db.collection('interactions');
  
  // ========== SEED ARTISTS ==========
  if (!skipArtists) {
    console.log(`📀 Seeding ${ARTISTS_TO_SEED.length} artists...\n`);
    
    let artistCount = 0;
    for (const artistName of ARTISTS_TO_SEED) {
      process.stdout.write(`  ${artistName}... `);
      
      // Fetch from external APIs
      const spotify = await fetchSpotifyArtist(artistName);
      await sleep(100); // Rate limiting
      
      const lastfm = await fetchLastfmArtist(artistName);
      await sleep(100);
      
      const genres = Array.from(new Set([
        ...(spotify?.genres || []),
        ...(lastfm?.tags || [])
      ])).slice(0, 15);
      
      const signals = {
        spotify: spotify ? { id: spotify.id, popularity: spotify.popularity, followers: spotify.followers, genres: spotify.genres } : undefined,
        lastfm: lastfm ? { mbid: lastfm.mbid, listeners: lastfm.listeners, playcount: lastfm.playcount, tags: lastfm.tags } : undefined,
      };
      
      // Upsert artist
      const now = new Date();
      await artistsCol.updateOne(
        { normalizedName: normalizeName(artistName) },
        {
          $setOnInsert: {
            _id: new ObjectId(),
            name: artistName,
            normalizedName: normalizeName(artistName),
            createdAt: now,
          },
          $set: {
            genres,
            signals,
            updatedAt: now,
          }
        },
        { upsert: true }
      );
      
      artistCount++;
      console.log(`✓ (Spotify: ${spotify?.popularity || '-'}, Last.fm: ${lastfm?.listeners || '-'})`);
    }
    
    console.log(`\n✓ Seeded ${artistCount} artists\n`);
  }
  
  // ========== SEED EVENTS ==========
  if (!skipEvents && TICKETMASTER_KEY) {
    console.log(`🎫 Fetching events from Ticketmaster...\n`);
    
    let eventCount = 0;
    const seenTmIds = new Set();
    
    // Fetch events for each artist
    for (const artistName of ARTISTS_TO_SEED.slice(0, 20)) { // Limit to avoid rate limits
      process.stdout.write(`  Events for ${artistName}... `);
      
      const events = await fetchTicketmasterEvents(artistName, CITY, 10);
      await sleep(200); // Rate limiting
      
      let added = 0;
      for (const e of events) {
        if (seenTmIds.has(e.tmId)) continue;
        seenTmIds.add(e.tmId);
        
        const now = new Date();
        await eventsCol.updateOne(
          { tmId: e.tmId },
          {
            $setOnInsert: {
              _id: new ObjectId(),
              tmId: e.tmId,
              createdAt: now,
            },
            $set: {
              name: e.name,
              url: e.url,
              date: e.date,
              localDateTime: e.localDateTime,
              city: e.city,
              countryCode: e.countryCode,
              venue: e.venue,
              images: e.images,
              location: e.location,
              artists: e.artists,
              updatedAt: now,
            }
          },
          { upsert: true }
        );
        added++;
        eventCount++;
      }
      
      console.log(`${added} events`);
    }
    
    // Also fetch general events for the city
    process.stdout.write(`  General events in ${CITY}... `);
    const cityEvents = await fetchTicketmasterEvents('concert', CITY, 50);
    let cityAdded = 0;
    
    for (const e of cityEvents) {
      if (seenTmIds.has(e.tmId)) continue;
      seenTmIds.add(e.tmId);
      
      const now = new Date();
      await eventsCol.updateOne(
        { tmId: e.tmId },
        {
          $setOnInsert: {
            _id: new ObjectId(),
            tmId: e.tmId,
            createdAt: now,
          },
          $set: {
            name: e.name,
            url: e.url,
            date: e.date,
            localDateTime: e.localDateTime,
            city: e.city,
            countryCode: e.countryCode,
            venue: e.venue,
            images: e.images,
            location: e.location,
            artists: e.artists,
            updatedAt: now,
          }
        },
        { upsert: true }
      );
      cityAdded++;
      eventCount++;
    }
    console.log(`${cityAdded} events`);
    
    console.log(`\n✓ Seeded ${eventCount} total events\n`);
  }
  
  // ========== SEED USERS & INTERACTIONS ==========
  if (!skipUsers) {
    console.log(`👥 Creating demo users and interactions...\n`);
    
    const userIds = [];
    
    for (const user of DEMO_USERS) {
      // Create/update user
      const existingUser = await usersCol.findOne({ email: user.email });
      let userId;
      
      if (existingUser) {
        userId = existingUser._id.toHexString();
      } else {
        const _id = new ObjectId();
        await usersCol.insertOne({
          _id,
          email: user.email,
          name: user.name,
          emailVerified: null,
          image: null,
        });
        userId = _id.toHexString();
      }
      
      userIds.push({ id: userId, ...user });
      
      // Create user profile
      await profilesCol.updateOne(
        { _id: userId },
        {
          $setOnInsert: {
            _id: userId,
            userId: userId,
            createdAt: new Date(),
          },
          $set: {
            city: user.city,
            favoriteArtists: user.artists,
            onboardingCompleted: true,
            updatedAt: new Date(),
          }
        },
        { upsert: true }
      );
      
      console.log(`  ✓ ${user.name} (${user.email})`);
    }
    
    // Create interactions (likes)
    console.log('\n  Creating interactions...');
    
    for (const user of userIds) {
      for (const artistName of user.artists) {
        const artist = await artistsCol.findOne({ normalizedName: normalizeName(artistName) });
        if (!artist) continue;
        
        // Check if interaction exists
        const existing = await interactionsCol.findOne({
          userId: user.id,
          type: 'like_artist',
          targetType: 'artist',
          targetId: artist._id.toHexString(),
        });
        
        if (!existing) {
          await interactionsCol.insertOne({
            _id: new ObjectId(),
            userId: user.id,
            type: 'like_artist',
            targetType: 'artist',
            targetId: artist._id.toHexString(),
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 3600 * 1000), // Random date in last 30 days
          });
        }
      }
    }
    
    // Create some random event interactions
    const events = await eventsCol.find({}).limit(20).toArray();
    for (const event of events) {
      const randomUser = userIds[Math.floor(Math.random() * userIds.length)];
      
      // Random save
      if (Math.random() > 0.5) {
        const existing = await interactionsCol.findOne({
          userId: randomUser.id,
          type: 'save_event',
          targetType: 'event',
          targetId: event._id.toHexString(),
        });
        
        if (!existing) {
          await interactionsCol.insertOne({
            _id: new ObjectId(),
            userId: randomUser.id,
            type: 'save_event',
            targetType: 'event',
            targetId: event._id.toHexString(),
            createdAt: new Date(Date.now() - Math.random() * 14 * 24 * 3600 * 1000),
          });
        }
      }
      
      // Random views
      for (let i = 0; i < Math.floor(Math.random() * 5); i++) {
        const viewUser = userIds[Math.floor(Math.random() * userIds.length)];
        await interactionsCol.insertOne({
          _id: new ObjectId(),
          userId: viewUser.id,
          type: 'view_event',
          targetType: 'event',
          targetId: event._id.toHexString(),
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 3600 * 1000),
        });
      }
    }
    
    console.log(`\n✓ Created ${userIds.length} demo users with interactions\n`);
  }
  
  // ========== SUMMARY ==========
  const artistCount = await artistsCol.countDocuments();
  const eventCount = await eventsCol.countDocuments();
  const userCount = await usersCol.countDocuments();
  const interactionCount = await interactionsCol.countDocuments();
  
  console.log('📊 Database Summary:');
  console.log(`  Artists: ${artistCount}`);
  console.log(`  Events: ${eventCount}`);
  console.log(`  Users: ${userCount}`);
  console.log(`  Interactions: ${interactionCount}`);
  
  await client.close();
  console.log('\n✅ Seed completed successfully!');
  console.log('\nNext steps:');
  console.log('  1. Start the app: npm run dev');
  console.log('  2. Login with Google');
  console.log('  3. Go to /admin to trigger popularity regeneration');
  console.log('  4. Explore /popular and /recommendations');
}

main().catch(e => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});

