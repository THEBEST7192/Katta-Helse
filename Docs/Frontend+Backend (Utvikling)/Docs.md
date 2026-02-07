## Info+Teknologi Valg

### Frontend
Jeg valgte å bygge nettsiden min med React og Typescript grunnet at jeg har god erfaring med det og Foretrekker det over vanilla JavaScript. Den tekniske årsaken er at React gir en komponentbasert struktur som gjør koden mer oversiktlig, gjenbrukbar og lettere å vedlikeholde. TypeScript tilfører statisk typing, som fanger feil tidlig, forbedrer autocomplete og gjør koden mer robust og skalerbar.

### Backend
Jeg valgte å bruke Node.js på serversiden fordi Node er lettvekts, plattformuavhengig og svært bedre egnet for miljøer med begrensede ressurser, sånn som en eldre Android-enhet som kjører Termux. Node.js kjører på samme språk som klienten (JavaScript/TypeScript), noe som forenkler utviklingen og reduserer behovet for å veksle mellom ulike teknologier.

### Versjonskontroll 
Jeg brukte Git for versjon kontroll og lastet opp koden på GitHub, dette ville også la meg klone Repoet seinere da jeg skulle publisere det.

## Sikkert 
### Backend Pålogging
Pålogging er håndtert i backenden ved bruk av en dedikert `doctors`-tabell. Da en bruker logger på, sender frontenden en API-forespørsel til `/api/login` med brukernavn og passord. Backenden verifiserer dette mot databasen ved å sammenligne passordet med en lagret bcrypt-hash.

Hvis legitimasjonen er korrekt, får brukeren tilgang til pasientdata. Alle forespørsler til `/api/reservations` krever nå `x-username` og `x-password` i HTTP-headerne for autentisering. Dette sikrer at kun autoriserte leger kan se sensitiv pasientinformasjon.

Hvis ingen leger er registrert i databasen, vil frontenden vise et systemvarsel som informerer om at en lege må opprettes manuelt i databasen.

Det samme gjelder også API endepunkter som krever å være en helse sykepleier.

### CORS
Jeg brukte CORS (Cross-Origin Resource Sharing) for å begrense domene som hadde tilgang til nettsiden min, lokalt s ble dette `localhost:8081` og på serveren min så ble det `helse.the-diddy.party`

## Valg/Forbedringer 
### Seksjoner
Orginal siden (https://www.hamar-katedral.vgs.no/hovedmeny/for-elever/elevtjenesten-og-ppt/skolehelsetjenesten/) var ikke delt inn i seksjoner, noe som jeg synes at er viktig for å kunne navigere raskt mellom sidene, jeg lo derfor til seksjonene basert på innhol.

### Bedre Bilder
Orginal nettsiden hadde et bilde av en QR kode for å legge til helsetjenesten på Snapchat, men orginal bilde var dårlig så jeg byttet bilde ut.

### Reservasjon
Orginal siden manglet muligheten for å kunne bestille timer på nettsiden, jeg valgte å bruke Supabase (Postgres SQL), grunnet at daten for å reservere timer er strukturert og ikke varierende.

### FAQ (Ofte stillte spørsmål)
Det var flere spørsmål som jeg hadde da jeg var på orginal siden men det var ingen svar for spørsmålene, på grunn av dette så lo jeg til en FAQ med sammenleggbare seksjoner med de spørsmål jeg hadde og svarene til de.