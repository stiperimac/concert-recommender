# Inkluzivni dizajn

Projekt implementira više komponenti inkluzivnog dizajna s ciljem omogućavanja pristupa što većem broju korisnika bez posebne prilagodbe.

## 1. High-contrast mode (Visoki kontrast)

### Opis
Prebacuje vizualnu temu na visoki kontrast s crnom pozadinom i bijelim tekstom.

### Implementacija
- CSS varijable definirane u `globals.css`
- Toggle na `/settings` stranici
- Persist u localStorage (`cr_contrast`)

### Ciljani korisnici
- Korisnici s oštećenjem vida
- Korisnici u uvjetima slabog osvjetljenja
- Korisnici koji preferiraju veći kontrast

### Tehničke detalje
```css
:root[data-contrast="high"] {
  --bg: 0 0 0;
  --fg: 255 255 255;
  --accent: 250 204 21; /* žuta za bolju vidljivost */
}
```

## 2. Povećanje fonta (Font scaling)

### Opis
Globalno povećava font preko CSS varijable bez zoomanja cijele stranice.

### Implementacija
- Slider na `/settings` stranici (100% - 150%)
- CSS varijabla `--font-scale`
- Persist u localStorage (`cr_fontScale`)

### Ciljani korisnici
- Korisnici sa slabijim vidom
- Stariji korisnici
- Korisnici koji preferiraju veći tekst

### Tehničke detalje
```css
html {
  font-size: calc(16px * var(--font-scale));
}
```

## 3. Skip link (Preskoči na sadržaj)

### Opis
Omogućuje korisnicima tipkovnice brzi skok na glavni sadržaj, preskačući navigaciju.

### Implementacija
- Link s `href="#main"` na vrhu stranice
- Vidljiv samo na `:focus`
- Main content ima `id="main"`

### Ciljani korisnici
- Korisnici koji koriste tipkovnicu za navigaciju
- Korisnici čitača zaslona
- Korisnici s motoričkim poteškoćama

## 4. Focus visible stil

### Opis
Osigurava jasno vidljiv fokus pri navigaciji tipkovnicom.

### Implementacija
```css
:focus-visible {
  outline: 3px solid rgb(var(--accent));
  outline-offset: 2px;
}
```

### Ciljani korisnici
- Korisnici tipkovnice
- Korisnici s poteškoćama vida
- Korisnici koji ne koriste miš

## 5. Semantički HTML i ARIA

### Implementacija
- Korištenje semantičkih elemenata (`<header>`, `<main>`, `<nav>`, `<section>`, `<footer>`)
- `aria-label` na navigaciji
- `sr-only` klasa za tekst vidljiv samo čitačima zaslona
- Pravilno označeni form elementi (`<label>`)

### Ciljani korisnici
- Korisnici čitača zaslona
- Asistivne tehnologije

## 6. Responzivan dizajn

### Opis
Aplikacija je potpuno responzivna i prilagođava se različitim veličinama zaslona.

### Implementacija
- Tailwind CSS responsive klase
- Grid layout koji se prilagođava
- Touch-friendly veličine gumba (min 44px)

### Ciljani korisnici
- Korisnici mobilnih uređaja
- Korisnici tableta
- Korisnici s različitim veličinama zaslona

## 7. Čitljiva tipografija

### Opis
- Inter font za čitljivost
- Dovoljna veličina teksta (base 16px)
- Dobar line-height (1.6)
- Kontrastne boje teksta

### Ciljani korisnici
- Svi korisnici, posebno oni s disleksijom ili poteškoćama čitanja

## 8. Prilagođeni scrollbar

### Opis
Stiliziran scrollbar za bolju vidljivost u high-contrast modu.

### Implementacija
```css
::-webkit-scrollbar-thumb {
  background: rgb(var(--border));
  border-radius: 4px;
}
```

## Testiranje pristupačnosti

Preporučeni alati za testiranje:
- WAVE (Web Accessibility Evaluation Tool)
- axe DevTools
- Lighthouse Accessibility audit
- Ručno testiranje s čitačem zaslona (NVDA, VoiceOver)
- Ručno testiranje samo tipkovnicom

## WCAG smjernice

Aplikacija cilja na razinu WCAG 2.1 AA:
- Kontrast teksta minimalno 4.5:1
- Fokus vidljiv na svim interaktivnim elementima
- Tekst skalabilan do 200%
- Navigacija tipkovnicom
