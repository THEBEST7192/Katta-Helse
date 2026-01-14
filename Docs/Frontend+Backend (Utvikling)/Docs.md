## Info+Teknologi Valg

### Frontend
Jeg valgte å bygge nettsiden min med React og Typescript grunnet at jeg har god erfaring med det og Foretrekker det over vanilla JavaScript. Den tekniske årsaken er at React gir en komponentbasert struktur som gjør koden mer oversiktlig, gjenbrukbar og lettere å vedlikeholde. TypeScript tilfører statisk typing, som fanger feil tidlig, forbedrer autocomplete og gjør koden mer robust og skalerbar.

### Backend
Jeg valgte å bruke Node.js på serversiden fordi Node er lettvekts, plattformuavhengig og svært bedre egnet for miljøer med begrensede ressurser, sånn som en eldre Android-enhet som kjører Termux. Node.js kjører på samme språk som klienten (JavaScript/TypeScript), noe som forenkler utviklingen og reduserer behovet for å veksle mellom ulike teknologier.

### Versjonskontroll 
Jeg brukte Git for versjon kontroll og lastet opp koden på GitHub, dette ville også la meg klone Repoet seinere da jeg skulle publisere det.

## Sikkert 
### Backend Pålogging
Pålogging er håndtert i backenden. Da en bruker logger på så sender frontenden en API forespørsel til backenden med et bruker definert passord som brukeren har definert i frontenden, deretter samlinger backenden passordet det fikk fra frontenden med en miljøvariabel som ble satt i backenden. Hvis de er like så får brukeren tilgang til info om timene med person info, hvis passordene ikke er like så sender backenden en beskjed om at passordet var feil.

Det samme gjelder også API endepunkter som krever å være en helse sykepleier.

### CORS
Jeg brukte CORS (Cross-Origin Resource Sharing) for å begrense domene som hadde tilgang til nettsiden min, lokalt s ble dette `localhost:8001` og på serveren min så ble det `helse.the-diddy.party`

## Valg/Forbedringer 
### Seksjoner
Orginal siden (https://www.hamar-katedral.vgs.no/hovedmeny/for-elever/elevtjenesten-og-ppt/skolehelsetjenesten/) var ikke delt inn i seksjoner, noe som jeg synes at er viktig for å kunne navigere raskt mellom sidene, jeg lo derfor til seksjonene basert på innhol.

### Bedre Bilder
Orginal nettsiden hadde et bilde av en QR kode for å legge til helsetjenesten på Snapchat, men orginal bilde var dårlig så jeg byttet bilde ut.

### Reservasjon
Orginal siden manglet muligheten for å kunne bestille timer på nettsiden, jeg valgte å bruke Supabase (Postgres SQL), grunnet at daten for å reservere timer er strukturert og ikke varierende.

### FAQ (Ofte stillte spørsmål)
Det var flere spørsmål som jeg hadde da jeg var på orginal siden men det var ingen svar for spørsmålene, på grunn av dette så lo jeg til en FAQ med sammenleggbare seksjoner med de spørsmål jeg hadde og svarene til de.