# Katta Skolehelsetjeneste

En modernisert versjon av skolehelsetjenestens nettside for Hamar katedralskole. Bygget med React, TypeScript og Tailwind CSS v4, med en Node.js-backend og PostgreSQL-integrasjon.

## Funksjoner

- **Moderne brukergrensesnitt**: Rent og responsivt design med skolens fargeprofil (#005850).
- **Timebestilling**: Et fullstack-system for reservasjon av samtaler.
- **Kalender-visninger**: Offentlig oversikt over opptatte tider, samt en passordbeskyttet lege-oversikt med pasientdetaljer.
- **Åpningstider**: Oversiktlig visning av når helsetjenesten er tilgjengelig.
- **Snapchat-integrasjon**: Enkel tilgang via Snapchat QR-kode.
- **Interaktivt kart**: Informasjon om hvor du finner kontoret på skolen.

## Teknologier

- **Frontend**: Vite, React, TypeScript, Tailwind CSS v4, Framer Motion, Lucide React.
- **Backend**: Node.js, Express, PostgreSQL, Cors, Dotenv.

## Kom i gang

### Forutsetninger

- Node.js installert
- En PostgreSQL-database (f.eks. via Supabase, Render, eller lokalt)

### Oppsett av Backend

1. Gå til server-mappen:
   ```bash
   cd server
   ```
2. Installer avhengigheter:
   ```bash
   npm install
   ```
3. Konfigurer miljøvariabler:
   - Endre navn på `.env.example` til `.env`
   - Oppdater `DATABASE_URL` med din PostgreSQL-tilkoblingsstreng.
   - Valgfritt: sett `RESERVATION_RETENTION_DAYS` for hvor lenge gamle reservasjoner lagres (standard: `1` dag).
     - `0` = slett umiddelbart dagen etter behandling.
     - `1` = behold i 1 dag.
     - `30` = behold i en måned.
   - Standard port er `6767`.
4. Opprett en lege i databasen:
   - Siden systemet ikke har en offentlig registreringsside, må den første legen legges til manuelt i `doctors`-tabellen.
   - Passordet må hashes med bcrypt.
5. Start serveren:
   ```bash
   npm run dev
   ```

### Oppsett av Frontend

1. Gå tilbake til rotmappen:
   ```bash
   cd ..
   ```
2. Installer avhengigheter:
   ```bash
   npm install
   ```
3. Start utviklingsserveren:
   ```bash
   npm run dev
   ```
4. Åpne nettleseren på adressen oppgitt av Vite (vanligvis `http://localhost:8001`).

Du kan endre porten ved å lage en `.env`-fil i rotmappen og sette `PORT=din_port`.

## Prosjektstruktur

- `/src`: Kildekode for React frontend.
- `/server`: Node.js backend med API-endepunkter og databaselogikk.
- `/public`: Statiske filer som logo og Snapchat QR-kode.
