// src/tools/ssl-scanner.ts
import { runCommand, isToolAvailable } from '../utils/shell';
import { SecurityTool, ScanResult } from '../core/types';

export class SslScanner implements SecurityTool {
  name = 'ssl-scanner';
  description = 'SSL/TLS scanner (sslscan) voor cipher en certificaat analyse';

  async run(args: Record<string, unknown> = {}): Promise<ScanResult[]> {
    if (!isToolAvailable('sslscan')) {
      return [{
        tool: this.name,
        severity: 'critical',
        title: 'sslscan niet gevonden',
        description: 'Installeer met: sudo apt install sslscan',
      }];
    }

    const target = (args.target as string) || 'localhost';
    const results: ScanResult[] = [];

    const scan = runCommand(`sslscan --no-colour ${target}`, {
      timeout: 60_000,
      silent: true,
    });

    results.push({
      tool: this.name,
      severity: 'info',
      title: `SSL/TLS scan van ${target}`,
      description: `Scan compleet in ${scan.durationMs}ms`,
      raw: scan.stdout,
    });

    const lines = scan.stdout.split('\n');

    // Verouderde protocollen
    const weakProtocols = ['SSLv2', 'SSLv3', 'TLSv1.0', 'TLSv1.1'];
    for (const proto of weakProtocols) {
      if (lines.some(l => l.includes(proto) && l.toLowerCase().includes('enabled'))) {
        results.push({
          tool: this.name,
          severity: 'high',
          title: `Verouderd protocol actief: ${proto}`,
          description: `${proto} is een verouderd en onveilig protocol.`,
          recommendation: `Schakel ${proto} uit in de server configuratie.`,
        });
      }
    }

    // Zwakke cipher suites
    if (lines.some(l => /(RC4|DES|NULL|EXPORT|anon)/i.test(l) && l.toLowerCase().includes('accepted'))) {
      results.push({
        tool: this.name,
        severity: 'high',
        title: 'Zwakke cipher suites geaccepteerd',
        description: 'Server accepteert verouderde ciphers (RC4, DES, NULL, EXPORT of anoniem).',
        recommendation: 'Beperk ciphers tot moderne AES-GCM en ChaCha20 varianten.',
      });
    }

    // Zelfondertekend certificaat
    if (lines.some(l => l.includes('self-signed'))) {
      results.push({
        tool: this.name,
        severity: 'medium',
        title: 'Zelfondertekend certificaat',
        description: 'Het SSL-certificaat is zelfondertekend en wordt niet vertrouwd door browsers.',
        recommendation: "Gebruik een certificaat van een vertrouwde CA (bijv. Let's Encrypt).",
      });
    }

    return results;
  }
}
