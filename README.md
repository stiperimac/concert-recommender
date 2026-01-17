# Concert Recommender (Next.js + MongoDB)

Ovaj projekt implementira tri obavezna sustava iz projektnog zadatka:

1. **Kreiranje profila sadržaja** (izvođači i koncerti u bazi, uz društvene signale)
2. **Lista popularnosti sadržaja** (globalno rangiranje, s vremenskom komponentom)
3. **Personalizirane preporuke** (Google login + eksplicitne preferencije + kontekst vremena)

## Glavni izvori podataka (API)

- Google OAuth (prijava)
- Ticketmaster (nadolazeći koncerti)
- Spotify (popularnost izvođača, followers, žanrovi) – opcionalno
- Last.fm (listeners/playcount/tags) – opcionalno
- Open-Meteo (vremenska prognoza) – koristi se u preporukama

## Preduvjeti

- Node.js 20+
- Moze se s Dockerom buildati, ali ne mora

## Konfiguracija

Minimalno potrebno:

- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `TICKETMASTER_API_KEY`
- `MONGODB_URI`, `MONGODB_DB`

## Pokretanje (Docker Compose)

```bash
docker compose up --build
```

Aplikacija: `http://localhost:3000`

## Pokretanje (lokalno)

```bash
npm install
npm run dev
```

## Ključne funkcionalnosti

### Onboarding (eksplicitne preferencije)
- `/onboarding`
- korisnik postavi grad i listu omiljenih izvođača

### Uvoz sadržaja (profil sadržaja)
- početna stranica omogućuje:
  - pretraživanje izvođača u lokalnoj bazi
  - uvoz/obnovu izvođača (Spotify/Last.fm)
  - dohvat koncerata (Ticketmaster)

### Popularnost (globalno)
- `/popular`
- rang liste za izvođače i koncerte
- period: dan/mjesec/godina

### Preporuke (personalizirano)
- `/recommendations`
- izračun preporuka na temelju:
  - omiljenih izvođača
  - sličnih korisnika (Jaccard na “liked artists”)
  - “recency” (bliži termini dobivaju boost)
  - vremenske prognoze (Open-Meteo)

## Seed i dump

> Za projekt je potrebno imati minimalno 4 korisnika u bazi.

- Seed: `npm run seed`
- Dump: `npm run dump`

## Admin ingest (opcionalno)

Ako `ADMIN_EMAILS` sadrži tvoj email, možeš koristiti:

`POST /api/admin/ingest` s JSON:

```json
{ "artist": "Coldplay", "city": "Zagreb", "withEvents": true }
```
