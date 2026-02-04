## Info+Teknologi Valg
### Termux (Linuxmiljø for Android)
Jeg valgte å bruke Termux (En Android terminalemulator og Linuxmiljø app.) for å installere å hoste webserveren min. 

Hoved grunnen til at jeg valgte Termux var at jeg ville ha tilgang til serveren på en egen enhet som ikke var skole eid, jeg hadde ikke tilgang til ekstra stasjonere PCer/Laptoper hjemme og valgte derfor en gammel mobil enhet.

### Scrcpy (Tilgang til mobil fra PC)
Jeg brukte Scrcpy for å kunne ha tilgang til mobilen min fra PCen,  dette lar meg se mobil skjermen i tillegg så lar den meg bruke tastaturet til PCen min på mobil.

### Apache
Jeg brukte Apache ovenfor Nginx grunnet at 
jeg har hatt bedre efaringer med Apache da det gjelder webservere, jeg hadde valgt Nginx visst jeg skulle ha ordnet en TCP/UDP proxy server.

### Cloudflared
Jeg har ikke en offentlig IP, og grunnet dette valgte jeg å bruke Cloudflare Tunnels (Cloudflared) på grunn av at den omgår mangelen på offentlig IP ved å opprette en utgående kobling til Cloudflare sinne Edge servere, slik at trafikk blir videreført direkte fra Cloudflares nettverk til min lokale server uten behov for portåpning.

I tillegg så vil Cloudflare håndtere SSL sertifikater.

## Nettsider
Test nettside: test.the-diddy.party
Helse: helse.the-diddy.party
Helse API: helse-api.the-diddy.party

## Start
Jeg oppdatere alle pakkene mine med:
`pkg update && pkg upgrade`

Deretter så installerte jeg pakkene jeg trengte (cloudflared er installert fra før av)
`pkg install apache2 nodejs`

## Sider

### Side med info om planner
For å sjekke IPen min så kjørte jeg `ifconfig`,
resultatet var:
```
lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        unspec 00-00-00-00-00-00-00-00-00-00-00-00-00-00-00-00  txqueuelen 1000  (UNSPEC)

wlan0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.1.225  netmask 255.255.255.0  broadcast 192.168.1.255
        unspec 00-00-00-00-00-00-00-00-00-00-00-00-00-00-00-00  txqueuelen 3000  (UNSPEC)
```
Dette betydde altså at IPen min var `192.168.1.225`

Jeg redigerte standard Apache siden min med micro for å legge til info om planner+privat IP.
```bash
micro /data/data/com.termux/files/usr/share/apache2/default-site/htdocs/index.html
```

[Bilde av nettside]

Jeg fikk denne advarselen etter å ha kjørt `httpd`:
```
`AH00558: httpd: Could not reliably determine the server's fully qualified domain name, using 127.0.0.1. Set the 'ServerName' directive globally to suppress this message.
```

Men valgte å ignorere det grunnet at jeg planla å bruke cloudflared som ikke har bruk for en offentlig+privat IP.

[Bilde av nettside]
Apache standard nettsiden fungerte på localhost, derfor så begynte jeg å legge til Katta-Helse Repoet mitt.

### React Side+Node backend
Jeg klonet GitHub Repoet mitt med Git Clone:
```
git clone https://github.com/THEBEST7192/Katta-Helse/
```

Deretter så installerte jeg alle avhengigetene
```
cd ~/Katta-Helse
npm install
cd server npm install
npm install
```

og endret på miljøvariabelene
```
#Backend
micro .env
```
**Backend innhold**
```
PORT=6767
DATABASE_URL=postgresql://postgres.DU-FÅR-IKKE:MITT-BRUKERNAVN&PASSORD@aws-1-eu-west-3.pooler.supabase.com:5432/postgres
ALLOWED_ORIGINS=http://localhost:8081,https://helse.the-diddy.party
DOCTOR_PASSWORD=qwerty
RESERVATION_RETENTION_DAYS=1
```

**Frontend**
```
#Frontend
cd ..
micro .env
```

**Frontend .env**
```
VITE_API_URL=https://helse-api.the-diddy.party
```

#### React Frontend
For serve React siden min, endret jeg Apache konfigurasjons filen min med `micro /data/data/com.termux/files/usr/etc/apache2/httpd.conf`
Til å inneholde denne konfigurasjonen på slutten 
```
Listen 8081

<VirtualHost *:8081>
    DocumentRoot "/data/data/com.termux/files/home/Katta-Helse/dist"

    <Directory "/data/data/com.termux/files/home/Katta-Helse/dist">
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

Deretter drepte jeg Apache og startet Apache opp igjen:
```
httpd -k stop
httpd
```

#### Node backend
For  starte node backend serveren så bruke jeg følgende kommando i en ny terminal:

```
node /data/data/com.termux/files/home/Katta-Helse/server/index.js
```



### Cloudflared
Normalt så måte jeg ha kjørt
`cloudflared login`
Men jeg hadde allerede logget inn fra før av da jeg skulle hoste https://tierlistsforspotify.party. så det var ikke nødvendig

Deretter så lage jeg en ny Tunnel (reverse proxy)
`cloudflared tunnel create katta-helse`

Resultatet var:
```
Tunnel credentials written to /data/data/com.termux/files/home/.cloudflared/4ba866ec-da5b-4d61-9fe3-33a030f1563d.json. cloudflared chose this file based on where your origin certificate was found. Keep this file secret. To revoke these credentials, delete the tunnel.

Created tunnel katta-helse with id 4ba866ec-da5b-4d61-9fe3-33a030f1563d
```

Så endret jeg Cloudflared konfigurasjons filen med:
`micro ~/.cloudflared/config.yml`
og lo til følgene i filen:
```
protocol: http2
tunnel: katta-helse
credentials-file: /data/data/com.termux/files/home/.cloudflared/4ba866ec-da5b-4d61-9fe3-33a030f1563d.json

ingress:
  - hostname: test.the-diddy.party
    service: http://localhost:8080

  - hostname: helse.the-diddy.party
    service: http://localhost:8081

  - hostname: helse-api.the-diddy.party
    service: http://localhost:6767

  - service: http_status:404
```


TIl slutt så endret jeg på DNS innstillingene.
```
cloudflared tunnel route dns katta-helse test.the-diddy.party
cloudflared tunnel route dns katta-helse helse.the-diddy.party
cloudflared tunnel route dns katta-helse helse-api.the-diddy.party
```
Resultat:
```
2026-01-12T19:07:45Z INF Added CNAME test.the-diddy.party.tierlistsforspotify.party which will route to this tunnel tunnelID=4ba866ec-da5b-4d61-9fe3-33a030f1563d
2026-01-12T19:07:47Z INF Added CNAME helse.the-diddy.party.tierlistsforspotify.party which will route to this tunnel tunnelID=4ba866ec-da5b-4d61-9fe3-33a030f1563d
2026-01-12T19:07:48Z INF Added CNAME helse-api.the-diddy.party.tierlistsforspotify.party which will route to this tunnel tunnelID=4ba866ec-da5b-4d61-9fe3-33a030f1563d
```

Men jeg innså at brukte feil dommene, på grunn av jeg hadde hostet noe annet med serveren før, grunnet dette slettet jeg `~/.cloudflared/cert.pem`
med `rm ~/.cloudflared/cert.pem` og logget inn på nytt med `cloudflared tunnel login`

Deretter så endret jeg DNSen på nytt:
```
cloudflared tunnel route dns katta-helse test.the-diddy.party
cloudflared tunnel route dns katta-helse helse.the-diddy.party
cloudflared tunnel route dns katta-helse helse-api.the-diddy.party
```
Dommene ble riktige nå (*.the-diddy.party istedenfor *.tierlistsforspotify.party).

Kode for å starte Apache, node og Cloudflared sammen i samme Terminal
```bash
nohup node /data/data/com.termux/files/home/Katta-Helse/server/index.js > node.log 2>&1 & nohup httpd > httpd.log 2>&1 & cloudflared tunnel run katta-helse
```
