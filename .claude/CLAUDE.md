# Cyber Agent — Project Context

AI-powered cybersecurity agent gebouwd op Kali Linux met Claude Agent SDK.

## Omgeving
- OS: Kali Linux (Debian-based)
- Shell: Zsh
- User: vector@blackbox
- Beschikbare Kali tools: nmap, nikto, tshark, whois, dig, dnsrecon,
  sslscan, whatweb, wapiti, sublist3r, searchsploit, metasploit

## Architectuur
- src/core/ → Agent kern, types, Kali tool wrappers
- src/tools/ → Wrappers rond Kali CLI tools (nmap, nikto, etc.)
- src/modes/ → Agent persoonlijkheden (redteam, blueteam, osint, etc.)
- src/workflows/ → Stap-voor-stap begeleide security flows
- src/cli/ → Interactieve terminal interface

## Regels
- Alle code is TypeScript
- Security-first: nooit echte exploits genereren
- Altijd toestemming vragen voor scans op externe systemen
- Gebruik native Kali tools via Bash i.p.v. npm libraries
- Output in het Nederlands tenzij anders gevraagd
