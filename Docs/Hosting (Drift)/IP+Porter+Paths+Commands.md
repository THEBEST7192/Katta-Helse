### IP
Privat IP Hjemme: 192.168.1.225

**Porter**
Test:
`8080`

Katta Helse (Frontend):
`8081`

Katta Helse API (Backend):
`6767`

#### Default Apache Site Path
`/data/data/com.termux/files/usr/share/apache2/default-site/htdocs`

#### Termux Start Directory
`/data/data/com.termux/files/home`

#### Apache Config Path
`/data/data/com.termux/files/usr/etc/apache2/httpd.conf`

#### Start Node, Apache og Cloudflared samtidig i samme Terminal
~~node /data/data/com.termux/files/home/Katta-Helse/server/index.js & httpd & cloudflared run tunnel~~

```
nohup node /data/data/com.termux/files/home/Katta-Helse/server/index.js > node.log 2>&1 & nohup httpd > httpd.log 2>&1 & cloudflared tunnel run katta-helse
```