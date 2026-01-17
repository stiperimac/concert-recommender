# Algoritam preporuka

## Ulazni signali

1. **Eksplicitne preferencije** (Onboarding)
   - `favoriteArtists[]`
   - `city`

2. **Društveni signali iz aplikacije**
   - `like_artist` (omiljeni izvođači)
   - `save_event` / `view_event`

3. **Vanjski signali**
   - Ticketmaster: nadolazeći događaji
   - Open-Meteo: prognoza (lokacija + datum događaja)

## Kandidati

- događaji (`events`) koji:
  - padaju u vremenski prozor `horizonDays` (default 60)
  - odgovaraju `city` (ako je postavljen)
  - sadrže bar jednog izvođača iz `favoriteArtists` (ako je lista postavljena)

## Skoriranje

Za svaki kandidat događaj se računa:

- **Preference match**: +120 po poklapanju izvođača
- **Slični korisnici**: Jaccard sličnost na skupovima liked artists dodaje mali boost
- **Recency**: bliži događaji dobivaju veći boost
- **Weather**: penalizacija ako su očekivane jače oborine

Rezultat je sortirana lista top-N događaja.
