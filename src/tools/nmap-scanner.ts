// src/tools/nmap-scanner.ts
import { runCommand, isToolAvailable } from '../utils/shell';
import { SecurityTool, ScanResult } from '../core/types';

export class NmapScanner implements SecurityTool {
  name = 'nmap-scanner';
  description = 'Netwerkscanner (nmap) voor poort- en service-detectie';

  async run(args: Record<string, unknown> = {}): Promise<ScanResult[]> {
    if (!isToolAvailable('nmap')) {
      return [{
        tool: this.name,
        severity: 'critical',
        title: 'nmap niet gevonden',
        description: 'Installeer met: sudo apt install nmap',
      }];
    }

    const target = (args.target as string) || 'localhost';
    const scanType = (args.scanType as string) || 'quick';
    const results: ScanResult[] = [];

    // Bouw nmap commando op basis van scantype
    let nmapCmd: string;
    switch (scanType) {
      case 'full':
        nmapCmd = `nmap -sV -sC -O -A ${target}`;
        break;
      case 'stealth':
        nmapCmd = `nmap -sS -sV --top-ports 1000 ${target}`;
        break;
      case 'quick':
      default:
        nmapCmd = `nmap -sV --top-ports 100 ${target}`;
        break;
    }

    // Voer nmap uit
    const scan = runCommand(nmapCmd, {
      timeout: 120_000,  // nmap kan lang duren
      sudo: scanType === 'stealth',  // SYN scan vereist root
    });

    if (scan.exitCode !== 0) {
      results.push({
        tool: this.name,
        severity: 'medium',
        title: 'Nmap scan fout',
        description: `Fout bij uitvoeren: ${scan.stderr}`,
      });
      return results;
    }

    // Parse nmap output → ScanResults
    results.push({
      tool: this.name,
      severity: 'info',
      title: `Nmap ${scanType} scan van ${target}`,
      description: `Scan compleet in ${scan.durationMs}ms`,
      raw: scan.stdout,
    });

    // Detecteer open poorten uit de output
    const openPorts = scan.stdout
      .split('\n')
      .filter(line => line.includes('/tcp') && line.includes('open'));

    for (const portLine of openPorts) {
      const parts = portLine.trim().split(/\s+/);
      const port = parts[0];       // bijv. "22/tcp"
      const service = parts[2];    // bijv. "ssh"
      const version = parts.slice(3).join(' ');

      results.push({
        tool: this.name,
        severity: 'info',
        title: `Open poort: ${port} (${service})`,
        description: version || 'Geen versie gedetecteerd',
        raw: portLine,
      });
    }

    // Waarschuw voor risico-poorten
    const riskyPorts = ['21', '23', '445', '3389', '5900'];
    for (const portLine of openPorts) {
      const portNum = portLine.split('/')[0].trim();
      if (riskyPorts.includes(portNum)) {
        results.push({
          tool: this.name,
          severity: 'high',
          title: `Risico-poort open: ${portNum}`,
          description: `Poort ${portNum} staat bekend als risicovol en is open.`,
          recommendation: `Overweeg poort ${portNum} te sluiten als deze niet nodig is.`,
        });
      }
    }

    return results;
  }
}
