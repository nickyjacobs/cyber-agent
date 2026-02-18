# Cyber Agent

AI-powered cybersecurity agent gebouwd op Kali Linux, aangedreven door Claude via de Agent SDK.
De agent kan Kali tools zelfstandig aansturen, output interpreteren en bevindingen rapporteren in het Nederlands.

---

## Wat doet het?

Je stelt een vraag of geeft een opdracht. De agent kiest zelf de juiste Kali tools, voert ze uit en geeft een gestructureerde analyse terug — inclusief MITRE ATT&CK mapping en prioritaire aanbevelingen.

**Zes gespecialiseerde modi:**

| Modus | Beschrijving |
|---|---|
| `general` | Algemene security assistent |
| `redteam` | Denkt als aanvaller, identificeert aanvalsvectoren |
| `blueteam` | Defensief, hardening en detectie |
| `osint` | Open source intelligence gathering |
| `webpentest` | Web applicatie penetratietesten |
| `smartcontract` | Smart contract security audit |

**Beschikbare workflows:**

- **Quick Scan** — nmap + systeem checks + AI-analyse in één keer
- **Web App Scan** — nikto, whatweb, SSL check, wapiti
- **Network Analysis** — tshark verkeer analyse
- **OSINT Gather** — whois, dig, dnsrecon, sublist3r
- **Hardening Check** — systeem configuratie doorlichten
- **Contract Audit** — smart contract kwetsbaarheden

---

## Vereisten

- **Kali Linux** (of Debian-based met Kali tooling)
- **Node.js** v18+
- **Claude Pro abonnement** (de agent SDK gebruikt je ingelogde sessie, geen API key)
- **Claude Code CLI** — `npm install -g @anthropic-ai/claude-code`

Kali tools die gebruikt worden: `nmap`, `nikto`, `tshark`, `whois`, `dig`, `dnsrecon`, `sslscan`, `whatweb`, `wapiti`, `sublist3r`, `searchsploit`

---

## Installatie

```bash
git clone https://github.com/JOUWGEBRUIKERSNAAM/cyber-agent.git
cd cyber-agent
npm install
```

---

## Gebruik

```bash
# Standaard starten (general modus)
./start

# Specifieke modus
./start redteam
./start blueteam
./start osint
./start webpentest
./start smartcontract
```

In de interactieve CLI kun je daarna gewoon typen wat je wilt weten of doen.

---

## Projectstructuur

```
src/
├── cli/          # Interactieve terminal interface
├── core/         # Agent kern en types
├── modes/        # Agent persoonlijkheden per modus
├── providers/    # Claude Agent SDK integratie
├── tools/        # Wrappers om Kali CLI tools
├── utils/        # Shell helpers, logging, export
└── workflows/    # Stap-voor-stap begeleide security flows
```

---

## Security & ethiek

- Genereert **nooit** echte exploit-code
- Vraagt altijd bevestiging voordat externe systemen gescand worden
- Scan-resultaten worden **niet** opgeslagen in de repo (`.gitignore`)
- Alleen gebruiken op systemen waarvoor je expliciete toestemming hebt

---

## Stack

- **TypeScript** + tsx (geen build stap nodig)
- **@anthropic-ai/claude-agent-sdk** — Claude als redenerende kern
- **Kali Linux native tools** — geen npm wrappers voor security tools
- **inquirer** + **chalk** + **ora** — CLI interface
