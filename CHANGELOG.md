# Changelog

Alle noemenswaardige wijzigingen in dit project worden hier bijgehouden.

Format gebaseerd op [Keep a Changelog](https://keepachangelog.com/nl/1.0.0/).
Versienummering volgt [Semantic Versioning](https://semver.org/lang/nl/).

---

## [1.0.0] — 2026-02-18

Eerste publieke release van Cyber Agent.

### Toegevoegd
- **Zes agent-modi:** `general`, `redteam`, `blueteam`, `osint`, `webpentest`, `smartcontract`
- **Zes workflows:** Quick Scan, Hardening, OSINT Gather, Web App Scan, PCAP Analyse, Contract Audit
- **CLI interface** met interactieve prompt, help-menu en flows-menu
- **Kali tool wrappers:** nmap, nikto, sslscan, whatweb, gobuster, wapiti, tshark, whois, dig, dnsrecon, sublist3r
- **Export** van scanresultaten naar JSON, Markdown en CSV
- **AI-analyse** via Claude Agent SDK na elke scan
- **MITRE ATT&CK mapping** in bevindingen waar van toepassing
- **Model switching** tussen Claude Sonnet, Haiku en Opus
- **Tool check** bij elke workflow: overzicht van beschikbare Kali tools
- `start` script voor directe CLI-toegang zonder npm commando's
- Dry-run test suite (13/13 geslaagd)

---

<!-- Voeg nieuwe versies bovenaan toe, boven de vorige versie -->
