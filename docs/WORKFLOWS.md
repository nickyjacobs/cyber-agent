# Workflows

Workflows zijn begeleide, stap-voor-stap scans die meerdere Kali tools combineren en de output samenvoegen tot een AI-analyse. Ze zijn de snelste manier om een compleet beeld te krijgen van een specifiek aanvalsoppervlak.

Start een workflow via het commando in de CLI, of gebruik `flows` voor een interactief menu.

---

## Overzicht

| Workflow | Commando | Doel |
|---|---|---|
| 🔍 Quick Scan | `scan` | Lokaal systeem doorlichten |
| 🛡️ Hardening | `harden` | Configuratiefouten vinden |
| 🕵️ OSINT Gather | `osint <domein>` | Externe informatie verzamelen |
| 🌐 Web App Scan | `webscan <url>` | Webapplicatie kwetsbaarheden |
| 📡 PCAP Analyse | `pcap <bestand>` | Opgenomen netwerkverkeer analyseren |
| 📜 Contract Audit | `audit <contract.sol>` | Solidity smart contract review |

---

## 🔍 Quick Scan

**Commando:** `scan`

Een snelle security doorlichting van het lokale systeem.

### Stappen
1. **Tool check** — controleert welke Kali tools beschikbaar zijn
2. **Nmap** — scant de meest voorkomende poorten op localhost
3. **Systeem checks:**
   - Open TCP verbindingen (`ss -tlnp`)
   - Firewall status (UFW)
   - SSH configuratie (`/etc/ssh/sshd_config`)
4. **AI-analyse** — interpeteert alle bevindingen en geeft prioritaire aanbevelingen

### Gebruikte tools
- `nmap` — poortscanner
- `ss` — socketstatistieken
- `ufw` — firewall status

### Wanneer gebruiken
- Eerste check op een nieuw of onbekend systeem
- Snelle dagelijkse health check
- Voordat je een systeem op het netwerk aansluit

---

## 🛡️ Hardening Check

**Commando:** `harden`

Doorlicht de systeemconfiguratie op bekende beveiligingsproblemen en geeft concrete hardening-aanbevelingen.

### Stappen
1. **Tool check** — controleert `ss`, `ufw`, `auditd`, `lynis`
2. **Systeemanalyse** — uitgebreide configuratiecheck
3. **AI-analyse** — prioriteert bevindingen en geeft stap-voor-stap hardening advies

### Gebruikte tools
- `ss` — open verbindingen
- `ufw` — firewall configuratie
- `auditd` — audit logging status
- `lynis` — systeemhardening audit (indien beschikbaar)

### Wanneer gebruiken
- Na installatie van een nieuw systeem
- Compliance check (CIS benchmarks, etc.)
- Voorbereiding op een penetratietest

---

## 🕵️ OSINT Gather

**Commando:** `osint <domein>`

Verzamelt publiek beschikbare informatie over een domeinnaam via passieve reconnaissance.

### Stappen
1. **Tool check** — controleert `whois`, `dig`, `dnsrecon`, `sublist3r`, `theHarvester`
2. **Informatie verzamelen:**
   - WHOIS registratie-informatie
   - DNS-records (A, MX, NS, TXT, CNAME)
   - Subdomein-enumeratie
   - Aanvullende OSINT bronnen
3. **AI-analyse** — interpreteert de gevonden data en identificeert interessante aanknopingspunten

### Gebruikte tools
- `whois` — domeinregistratie info
- `dig` — DNS-records opvragen
- `dnsrecon` — uitgebreide DNS-enumeratie
- `sublist3r` — subdomein-enumeratie
- `theHarvester` — email- en hostnameverzameling (indien beschikbaar)

### Voorbeelden
```
> osint example.com
> osint target-company.nl
```

### Wanneer gebruiken
- Reconnaissance fase van een penetratietest
- Controleren welke informatie over jouw eigen domein publiek zichtbaar is
- Voorbereiding op een social engineering assessment

> **Let op:** Alleen uitvoeren op domeinen waarvoor je expliciete toestemming hebt, of op je eigen infrastructuur.

---

## 🌐 Web App Scan

**Commando:** `webscan <url>`

Uitgebreide scan van een webapplicatie op bekende kwetsbaarheden (OWASP Top 10 en meer).

### Stappen
1. **Toestemmingsvraag** — voor externe URL's vraagt de agent altijd bevestiging
2. **Tool check** — controleert `nikto`, `whatweb`, `sslscan`, `gobuster`, `wapiti`
3. **Scans:**
   - **Nikto** — bekende web vulnerabilities, verouderde software, misconfiguraties
   - **WhatWeb** — technologie stack detectie (CMS, frameworks, versies)
   - **SSL/TLS scan** — certificaatgeldigheid, zwakke ciphers (alleen HTTPS)
   - **Gobuster** — verborgen directories en bestanden (woordenlijst bruteforce)
   - **Wapiti** — geautomatiseerde vulnerability scan (XSS, SQLi, CRLF, SSRF, etc.)
4. **AI-analyse** — combineert alle bevindingen tot een OWASP-gestructureerd rapport

### Gebruikte tools
- `nikto` — web vulnerability scanner
- `whatweb` — web technologie detectie
- `sslscan` — SSL/TLS analyse
- `gobuster` — directory/bestand bruteforce
- `wapiti` — web application vulnerability scanner

### Voorbeelden
```
> webscan http://localhost:8080
> webscan https://mijn-test-server.local
```

### Wanneer gebruiken
- Web penetratietest van een eigen applicatie
- Pre-deployment security check
- OWASP Top 10 baseline assessment

> **Let op:** Wapiti en Gobuster sturen actieve requests naar de server. Voer dit alleen uit op systemen waarvoor je expliciete toestemming hebt.

---

## 📡 PCAP Analyse

**Commando:** `pcap <bestand.pcap>`

Analyseert opgenomen netwerkverkeer uit een .pcap bestand op verdachte patronen.

### Stappen
1. **Tool check** — controleert `tshark`, `capinfos`, `tcpdump`
2. **PCAP analyse:**
   - Protocoloverzicht en statistieken
   - Detectie van verdachte verbindingen
   - Unencrypted credentials of gevoelige data
   - Bekende command-and-control patronen
3. **AI-analyse** — interpreteert het verkeerspatroon en identificeert anomalieën

### Gebruikte tools
- `tshark` — Wireshark command-line interface
- `capinfos` — PCAP bestandsinformatie
- `tcpdump` — aanvullende pakketanalyse

### Voorbeelden
```
> pcap /home/vector/captures/traffic.pcap
> pcap ./netwerkdump-2024-01-15.pcap
```

### PCAP opnemen met tshark
```bash
# Opnemen op interface eth0 (stop met Ctrl+C)
sudo tshark -i eth0 -w /tmp/capture.pcap

# Opnemen met tijdslimiet (60 seconden)
sudo tshark -i eth0 -a duration:60 -w /tmp/capture.pcap
```

### Wanneer gebruiken
- Incident response — analyseer opgenomen verkeer na een incident
- Detecteer data-exfiltratie of C2-communicatie
- Controleer of interne applicaties onverwacht verkeer genereren

---

## 📜 Smart Contract Audit

**Commando:** `audit <contract.sol>`

AI-gestuurde security audit van Solidity smart contracts.

### Stappen
1. **Contract laden** — leest het .sol bestand
2. **AI code review** — analyseert op bekende Solidity kwetsbaarheden:
   - Reentrancy
   - Integer overflow/underflow
   - Access control problemen
   - Front-running
   - Denial of Service
   - Onveilige randomness
   - Overige Solidity-specifieke issues
3. **Audit rapport** — per bevinding: locatie, severity, beschrijving en aanbeveling

### Gebruikte tools
- Geen Kali tools — volledig AI-gedreven code review
- Claude analyseert de Solidity broncode direct

### Voorbeelden
```
> audit ./contracts/Token.sol
> audit /pad/naar/MyContract.sol
```

### Wanneer gebruiken
- Voor deployment van een smart contract
- Code review van externe contracten
- Leren over Solidity security patterns

> **Let op:** Dit is een AI-gestuurde analyse, geen formele audit. Voor productie-contracten met grote bedragen is een professionele audit door een gespecialiseerd bedrijf aan te raden.

---

## Resultaten exporteren

Na elke workflow kun je de resultaten exporteren:

```
> export json    # Ruwe data voor verdere verwerking
> export md      # Leesbaar markdown rapport
> export csv     # Importeerbaar in spreadsheet
```

Bestanden worden opgeslagen in `scan-results/` met een timestamp in de bestandsnaam.
