# Izvori podataka

## Pregled

Aplikacija koristi 4 vanjska izvora podataka za kreiranje profila sadržaja i obogaćivanje preporuka:

| Izvor | Tip podataka | API |
|-------|--------------|-----|
| Ticketmaster | Koncerti/eventi | Discovery API |
| Spotify | Izvođači | Web API |
| Last.fm | Izvođači | API |
| Open-Meteo | Vrijeme | Forecast API |

## 1. Ticketmaster Discovery API

### Dohvaćeni podaci
- `tmId` - Ticketmaster event ID
- `name` - Naziv eventa
- `url` - Link na Ticketmaster
- `date` - Datum (YYYY-MM-DD)
- `localDateTime` - Lokalno vrijeme
- `city` - Grad
- `countryCode` - Država
- `venue` - Naziv dvorane/mjesta
- `images[]` - Slike eventa
- `location` - Koordinate (lat/lon)
- `artists[]` - Lista izvođača (attractions)

### Endpoint
```
GET https://app.ticketmaster.com/discovery/v2/events.json
?apikey={KEY}
&classificationName=music
&keyword={artist}
&city={city}
&size={limit}
```

### Korištenje
- Primarni izvor za nadolazeće koncerte
- Dohvat po izvođaču ili gradu
- Slike za event cards

## 2. Spotify Web API

### Dohvaćeni podaci
- `id` - Spotify artist ID
- `popularity` - Popularnost (0-100)
- `followers` - Broj pratitelja
- `genres[]` - Žanrovi

### Endpoint
```
GET https://api.spotify.com/v1/search
?type=artist
&q={name}
&limit=1
```

### Korištenje
- Društveni signal: popularnost i pratitelji
- Žanrovi za matching preporuka
- Scoring u popularnosti i preporukama

## 3. Last.fm API

### Dohvaćeni podaci
- `mbid` - MusicBrainz ID
- `listeners` - Broj slušatelja
- `playcount` - Ukupan broj reprodukcija
- `tags[]` - Tagovi/žanrovi

### Endpoint
```
GET https://ws.audioscrobbler.com/2.0/
?method=artist.getinfo
&artist={name}
&api_key={KEY}
&format=json
```

### Korištenje
- Dodatni društveni signal
- Kombinacija sa Spotify podacima
- Tagovi za obogaćivanje žanrova

## 4. Open-Meteo API

### Dohvaćeni podaci
- `temperature_2m` - Temperatura
- `precipitation` - Oborine (mm)
- `weathercode` - Kod vremena

### Endpoint
```
GET https://api.open-meteo.com/v1/forecast
?latitude={lat}
&longitude={lon}
&daily=temperature_2m,precipitation,weathercode
&start_date={date}
&end_date={date}
```

### Korištenje
- Vremenska prognoza za dan koncerta
- Utjecaj na scoring preporuka
- Prikaz na event detail stranici

## Interna baza podataka (MongoDB)

### Kolekcije

| Kolekcija | Opis |
|-----------|------|
| `artists` | Profili izvođača s vanjskim signalima |
| `events` | Koncerti/eventi iz Ticketmastera |
| `interactions` | Korisničke interakcije (like/save/view) |
| `user_profiles` | Preferencije korisnika |
| `popularity_snapshots` | Cache popularnosti |
| `recommendations` | Spremljene preporuke |
| `comments` | Komentari na izvođače/evente |
| `follows` | Praćenje između korisnika |

### Društveni podaci iz aplikacije

1. **Interakcije s izvođačima**
   - `like_artist` - Označavanje kao omiljenog

2. **Interakcije s eventima**
   - `save_event` - Spremanje koncerta
   - `view_event` - Pregled detalja

3. **Socijalne interakcije**
   - Komentari na izvođače i evente
   - Praćenje drugih korisnika
   - Activity feed

## Osvježavanje podataka

### Ručno (Admin panel)
- `/admin` stranica za batch uvoz
- Osvježavanje profila izvođača
- Dohvat novih koncerata

### API endpointi za cron
```bash
# Osvježi profile izvođača
POST /api/admin/refresh
{"action": "refresh_artists"}

# Dohvati nove koncerte
POST /api/admin/refresh
{"action": "refresh_events", "city": "Zagreb"}

# Regeneriraj popularnost
POST /api/admin/refresh
{"action": "regenerate_popularity"}
```

## Rate limiting i caching

- Ticketmaster: ~5 req/sec
- Spotify: Requires OAuth token
- Last.fm: ~5 req/sec
- Open-Meteo: Free, no key required

Popularnost snapshotovi se cache-iraju po periodu (day/month/year) da se izbjegnu nepotrebni pozivi.

## Environment varijable

```env
TICKETMASTER_API_KEY=your_key
SPOTIFY_ACCESS_TOKEN=your_token
LASTFM_API_KEY=your_key
ADMIN_EMAILS=admin@example.com
```

## Dijagram toka podataka

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Ticketmaster│     │   Spotify   │     │   Last.fm   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │    Events         │    Artist         │    Artist
       │                   │    Profile        │    Info
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Ingest    │
                    │   Service   │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   MongoDB   │
                    │  (artists,  │
                    │   events)   │
                    └──────┬──────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ▼              ▼              ▼
     ┌───────────┐  ┌───────────┐  ┌───────────┐
     │ Popularity│  │Recommender│  │  Detail   │
     │  Service  │  │  Service  │  │   Pages   │
     └───────────┘  └───────────┘  └───────────┘
```
