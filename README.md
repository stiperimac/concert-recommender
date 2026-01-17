# Concert Recommender (Next.js + MongoDB)

Sustav za preporuku koncerata na temelju društvenih podataka.

## Implementirani sustavi

1. **Kreiranje profila sadržaja** - Izvođači i koncerti s društvenim signalima (Spotify, Last.fm, Ticketmaster)
2. **Lista popularnosti sadržaja** - Globalno rangiranje s vremenskom komponentom (dan/mjesec/godina)
3. **Personalizirane preporuke** - Na temelju preferencija, sličnih korisnika, žanrova i vremenske prognoze
4. **Inkluzivni dizajn** - High-contrast mode, font scaling, keyboard navigation, skip links

## Značajke

- 🔐 Google OAuth autentifikacija
- 📊 Višefaktorski algoritam preporuka s objašnjivošću
- 👥 Socijalne funkcije (komentari, praćenje, feed)
- 🎨 Inkluzivni dizajn (pristupačnost)
- 📱 Responzivan UI
- 🔄 Admin dashboard za upravljanje sadržajem

## Preduvjeti

- Node.js 20+
- MongoDB (lokalno ili Atlas)
- API ključevi (vidi dolje)

## Konfiguracija

Kreiraj `.env` datoteku u rootu projekta:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/concert_recommender
MONGODB_DB=concert_recommender

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-me

# Google OAuth (https://console.cloud.google.com/apis/credentials)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Ticketmaster API (https://developer.ticketmaster.com/)
TICKETMASTER_API_KEY=your-ticketmaster-api-key

# Spotify API (https://developer.spotify.com/dashboard)
# Koristi "Get Token" u Spotify Developer Console
SPOTIFY_ACCESS_TOKEN=your-spotify-access-token

# Last.fm API (https://www.last.fm/api/account/create)
LASTFM_API_KEY=your-lastfm-api-key

# Admin emails (comma-separated)
ADMIN_EMAILS=your-email@example.com
```

### Kako dobiti API ključeve

1. **Google OAuth**:
   - Idi na [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Kreiraj OAuth 2.0 Client ID
   - Dodaj `http://localhost:3000/api/auth/callback/google` kao Authorized redirect URI

2. **Ticketmaster**:
   - Registriraj se na [Ticketmaster Developer](https://developer.ticketmaster.com/)
   - Kreiraj novu app i kopiraj Consumer Key

3. **Spotify** (opcionalno, ali preporučeno):
   - Idi na [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Koristi Web API konzolu za dobivanje tokena
   - Napomena: Token ističe nakon sat vremena, ali dovoljan je za seeding

4. **Last.fm** (opcionalno):
   - Registriraj se na [Last.fm API](https://www.last.fm/api/account/create)

## Pokretanje

### Lokalno

```bash
# Instaliraj dependencies
npm install

# Pokreni MongoDB (ako koristiš lokalno)
mongod

# Popuni bazu s podacima
npm run seed:full

# Pokreni development server
npm run dev
```

Aplikacija: http://localhost:3000

### Docker Compose

```bash
docker compose up --build
```

## Punjenje baze podataka

### Brzi seed (minimalni podaci)

```bash
npm run seed
```

### Puni seed (preporučeno za demo)

```bash
npm run seed:full
```

Ovaj script:
- Dohvaća 35+ popularnih izvođača iz Spotify i Last.fm
- Dohvaća nadolazeće koncerte iz Ticketmastera
- Kreira 5 demo korisnika s različitim preferencijama
- Generira interakcije (likes, saves, views)

**Opcije:**

```bash
# Promijeni grad za traženje koncerata
npm run seed:full -- --city=Split

# Preskoči određene korake
npm run seed:full -- --skip-artists
npm run seed:full -- --skip-events
npm run seed:full -- --skip-users
```

### Ručni unos preko Admin panela

1. Prijavi se s Google računom
2. Dodaj svoj email u `ADMIN_EMAILS` env varijablu
3. Idi na `/admin`
4. Koristi "Batch uvoz izvođača" za dodavanje izvođača
5. Klikni "Dohvati nove koncerte" za dohvat evenata

## Struktura stranica

| Stranica | Opis |
|----------|------|
| `/` | Početna s pretragom i popularnim sadržajem |
| `/popular` | Globalne rang liste |
| `/recommendations` | Personalizirane preporuke |
| `/artists/[id]` | Detalji izvođača |
| `/events/[id]` | Detalji koncerta |
| `/feed` | Activity feed + slični korisnici |
| `/onboarding` | Postavljanje preferencija |
| `/settings` | Pristupačnost (contrast, font) |
| `/admin` | Admin dashboard |

## API Dokumentacija

### Preporuke

```http
POST /api/recommendations?city=Zagreb&dateFrom=2026-01-01&dateTo=2026-12-31
```

### Popularnost

```http
GET /api/popular?scope=artist&period=month&limit=30
```

### Admin (zahtijeva auth + admin email)

```http
POST /api/admin/refresh
Content-Type: application/json

{"action": "batch_ingest", "artists": "Coldplay\nMetallica", "withEvents": true}
```

## Inkluzivni dizajn

- **High-contrast mode** - `/settings`
- **Font scaling** - 100% - 150%
- **Skip link** - Brzi skok na glavni sadržaj
- **Focus visible** - Jasni fokus za keyboard navigaciju
- **Semantički HTML** - Čitači zaslona

## Algoritam preporuka

Vidi [docs/algorithm.md](docs/algorithm.md) za detaljan opis.

Faktori skoriranja:
- Omiljeni izvođač: +120 bodova
- Poklapanje žanrova: +15/žanr (max 60)
- Popularnost izvođača: Spotify × 0.3 (max 30)
- Slični korisnici: Jaccard × 50
- Blizina datuma: max(0, 50 - dani)
- Vremenska prognoza: -20 do +10

## Tehnologije

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Auth**: NextAuth.js (Google OAuth)
- **APIs**: Ticketmaster, Spotify, Last.fm, Open-Meteo
