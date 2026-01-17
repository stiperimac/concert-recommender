# Izvori podataka

## Google OAuth (NextAuth)
- autentikacija korisnika
- u bazi se pohranjuju `users`, `accounts`, `sessions` (NextAuth MongoDB adapter)

## Ticketmaster
- discovery API (`/discovery/v2/events.json`)
- dohvat nadolazećih događaja prema `keyword` (izvođač) i `city`

## Spotify (opcionalno)
- Web API `search` (artist)
- koristi se za: `popularity`, `followers`, `genres`
- očekuje se `SPOTIFY_ACCESS_TOKEN` u `.env`

## Last.fm (opcionalno)
- `artist.getinfo`
- koristi se za: listeners, playcount i tags

## Open-Meteo
- forecast API
- za top preporuke dohvaća dnevnu prognozu (datum događaja, lokacija venue-a)
