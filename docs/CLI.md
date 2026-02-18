# CLI Command Reference

Alle commando's die je kunt gebruiken in de interactieve Cyber Agent terminal.

---

## Starten

```bash
# Standaard starten (general modus)
./start

# Starten in een specifieke modus
./start redteam
./start blueteam
./start osint
./start webpentest
./start smartcontract
```

Zodra de agent gestart is, verschijnt een prompt (`>`). Typ hier een commando of stel een vraag in vrije tekst.

---

## Commando's

### `scan`
Voert een Quick Scan uit op het lokale systeem: nmap poortcheck, open services en een AI-analyse.

```
> scan
```

---

### `harden`
Controleert de systeemconfiguratie en geeft hardening-aanbevelingen (firewall, SSH, gebruikersbeheer, etc.).

```
> harden
```

---

### `webscan <url>`
Voert een web vulnerability scan uit op de opgegeven URL met nikto, sslscan en wapiti.
Voor externe URL's vraagt de agent eerst om bevestiging.

```
> webscan https://example.com
> webscan http://localhost:8080
```

---

### `osint <domein>`
Voert OSINT-gathering uit op een domeinnaam: whois, DNS-records, subdomeinen (sublist3r) en meer.

```
> osint example.com
> osint google.com
```

---

### `pcap <bestand>`
Analyseert een opgenomen netwerkdump (.pcap bestand) met tshark en tcpdump.

```
> pcap /home/vector/captures/traffic.pcap
> pcap ./network-dump.pcap
```

---

### `audit <contract.sol>`
Voert een security audit uit op een Solidity smart contract.

```
> audit ./contracts/Token.sol
> audit /pad/naar/contract.sol
```

---

### `investigate <opdracht>`
Vrije AI-gestuurde scan: de agent beslist zelf welke Kali tools nodig zijn op basis van je omschrijving.

```
> investigate controleer of poort 22 open staat en wat de SSH versie is
> investigate zoek naar kwetsbaarheden in de webserver op localhost
```

---

### `mode <naam>`
Wissel van agent-modus zonder de sessie opnieuw te starten.

```
> mode redteam
> mode blueteam
> mode osint
> mode webpentest
> mode smartcontract
> mode general
```

Zonder argument toont het commando een overzicht van alle beschikbare modi.

---

### `model <naam>`
Wissel van AI-model.

```
> model sonnet   # Claude Sonnet — standaard, goede balans
> model haiku    # Claude Haiku — sneller en zuiniger
> model opus     # Claude Opus — meest krachtig
```

---

### `flows`
Opent een interactief keuzemenu met alle beschikbare workflows.
Handig als je niet zeker weet welk commando je nodig hebt.

```
> flows
```

---

### `export <format>`
Exporteert de resultaten van de laatste scan naar een bestand in `scan-results/`.

```
> export json   # Gestructureerde data
> export md     # Markdown rapport
> export csv    # Spreadsheet-formaat
```

Voer eerst een scan uit voordat je exporteert.

---

### `tools`
Toont welke Kali tools beschikbaar zijn op het systeem.

```
> tools
```

Voorbeeld output:
```
✅ nmap
✅ nikto
❌ wapiti
✅ whois
...
```

---

### `status`
Toont de huidige configuratie: actieve modus, AI-model en het aantal resultaten van de laatste scan.

```
> status
```

---

### `clear`
Wist het scherm.

```
> clear
```

---

### `help`
Toont een korte samenvatting van alle commando's direct in de terminal.

```
> help
```

---

### `exit` / `quit`
Sluit de agent af.

```
> exit
> quit
```

---

## Vrije tekst

Je hoeft geen specifiek commando te gebruiken. Typ gewoon wat je wilt weten:

```
> wat zijn de meest voorkomende poorten die open zouden moeten staan op een webserver?
> leg uit wat een SYN flood aanval is
> wat betekent CVE-2021-44228?
```

De agent antwoordt op basis van de actieve modus (redteam denkt als aanvaller, blueteam defensief, etc.).

---

## Tips

- Gebruik `flows` als je niet zeker weet welk commando je nodig hebt — het menu begeleidt je.
- Wissel van `mode` midden in een sessie om een ander perspectief te krijgen op hetzelfde probleem.
- Gebruik `model haiku` voor snelle vragen, `model opus` voor complexe analyses.
- Exporteer resultaten altijd na een scan als je ze wilt bewaren — de agent onthoudt alleen de laatste scan.
- `investigate` is de meest flexibele optie: beschrijf in gewone taal wat je wilt onderzoeken.
