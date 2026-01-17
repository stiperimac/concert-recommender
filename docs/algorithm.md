# Algoritam preporuka

## Pregled

Sustav za preporuke koristi višefaktorski pristup koji kombinira:
- Eksplicitne preferencije korisnika
- Društvene signale iz aplikacije (interakcije)
- Vanjske signale (Spotify, Last.fm, Ticketmaster, Open-Meteo)
- Kolaborativno filtriranje (slični korisnici)

## Ulazni signali

### 1. Eksplicitne preferencije (Onboarding)
- `favoriteArtists[]` - lista omiljenih izvođača
- `city` - preferirani grad za koncerte

### 2. Društveni signali iz aplikacije
- `like_artist` - označavanje izvođača kao omiljenog
- `save_event` - spremanje koncerta
- `view_event` - pregled koncerta

### 3. Vanjski signali
- **Ticketmaster**: nadolazeći događaji, lokacija, datum
- **Spotify**: popularnost izvođača, broj pratitelja, žanrovi
- **Last.fm**: broj slušatelja, broj reprodukcija, tagovi
- **Open-Meteo**: vremenska prognoza za lokaciju i datum

## Skoriranje događaja

Za svaki kandidat događaj računaju se sljedeći faktori:

### Faktor: Omiljeni izvođač (favorite_artist)
- **Težina**: +120 bodova po poklapanju
- **Opis**: Najviši prioritet imaju koncerti izvođača koje je korisnik eksplicitno označio kao omiljene

### Faktor: Poklapanje žanrova (genre_match)  
- **Težina**: +15 bodova po podudarnom žanru (max 60)
- **Opis**: Usporedba žanrova izvođača na koncertu sa žanrovima omiljenih izvođača korisnika

### Faktor: Popularnost izvođača (artist_popularity)
- **Težina**: Spotify popularnost × 0.3 (max 30)
- **Opis**: Popularni izvođači dobivaju dodatni boost

### Faktor: Slični korisnici (similar_users)
- **Težina**: Jaccard sličnost × 50
- **Opis**: Ako korisnici sa sličnim ukusom vole izvođača na koncertu

### Faktor: Kolaborativno filtriranje (collaborative)
- **Težina**: Zbroj Jaccard sličnosti × 10
- **Opis**: Mali boost za postojanje sličnih korisnika

### Faktor: Blizina datuma (recency)
- **Težina**: max(0, 50 - dani_do_koncerta)
- **Opis**: Bliži koncerti imaju veći prioritet

### Faktor: Trending (cold-start)
- **Težina**: +20-35 za popularne izvođače
- **Opis**: Za nove korisnike bez preferencija, boost za trending sadržaj

### Faktor: Vrijeme (weather)
- **Težina**: -20 do +10
- **Opis**: Penalizacija za jake oborine, bonus za lijepo vrijeme

## Cold-Start Problem

Za nove korisnike bez preferencija ili interakcija:
1. Sustav prepoznaje cold-start stanje
2. Prikazuju se popularni i trending koncerti
3. Korisnik se usmjerava na Onboarding stranicu

## Kandidati događaja

Kandidati se biraju na sljedeći način:
1. Događaji u vremenskom prozoru `horizonDays` (default 60 dana)
2. Filter po gradu (ako je postavljen)
3. Filter po omiljenim izvođačima (ako postoje)
4. Fallback: svi događaji u gradu/periodu ako nema direktnih poklapanja

## Kolaborativno filtriranje

### Jaccard sličnost
Sličnost korisnika se računa kao:
```
J(A, B) = |A ∩ B| / |A ∪ B|
```
gdje su A i B skupovi liked artist ID-eva.

### Proces
1. Dohvati liked artists za trenutnog korisnika
2. Dohvati liked artists za sve druge korisnike
3. Izračunaj Jaccard sličnost
4. Uzmi top 5 najsličnijih korisnika
5. Izvođači koje vole slični korisnici dobivaju boost

## Vremenska komponenta

Preporuke uzimaju u obzir:
- Blizinu datuma koncerta (bliži = bolji)
- Vremensku prognozu za dan koncerta
- Prilagodbu preporuka za outdoor vs indoor evente

## Objašnjivost (Explainability)

Svaka preporuka uključuje:
- Lista razloga zašto je preporučena
- Raščlamba bodova po faktorima
- Postotak doprinosa svakog faktora
- Weather info ako je dostupan

## API Filteri

Korisnik može dodatno filtrirati preporuke:
- `cityFilter` - specifični grad
- `dateFrom` / `dateTo` - vremenski raspon
- `horizonDays` - koliko dana unaprijed
- `limit` - broj rezultata

## Popularnost (zasebni sustav)

### Izvođači
```
score = spotify_popularity × 10 
      + log10(spotify_followers) × 40 
      + log10(lastfm_listeners) × 30 
      + internal_likes × 5
```

### Koncerti
```
score = num_artists × 50 
      + saves × 10 
      + views × 1
```

Snapshotovi se generiraju po periodu (day/month/year) i cache-iraju.
