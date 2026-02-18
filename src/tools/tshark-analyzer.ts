// src/tools/tshark-analyzer.ts
import { runCommand, isToolAvailable } from '../utils/shell';
import { SecurityTool, ScanResult } from '../core/types';

export class TsharkAnalyzer implements SecurityTool {
  name = 'tshark-analyzer';
  description = 'PCAP analyse (tshark) voor netwerkverkeer inspectie';

  async run(args: Record<string, unknown> = {}): Promise<ScanResult[]> {
    if (!isToolAvailable('tshark')) {
      return [{
        tool: this.name,
        severity: 'critical',
        title: 'tshark niet gevonden',
        description: 'Installeer met: sudo apt install tshark',
      }];
    }

    const pcapFile = args.pcapFile as string;
    if (!pcapFile) {
      return [{
        tool: this.name,
        severity: 'medium',
        title: 'Geen PCAP bestand opgegeven',
        description: 'Geef een pcap bestand op via args.pcapFile',
      }];
    }

    const results: ScanResult[] = [];

    // Bestandsinfo
    const info = runCommand(`capinfos "${pcapFile}" 2>/dev/null`, { timeout: 30_000, silent: true });
    results.push({
      tool: this.name,
      severity: 'info',
      title: `PCAP info: ${pcapFile}`,
      description: info.stdout || 'Geen info beschikbaar',
    });

    // Top IP-gesprekken
    const conversations = runCommand(
      `tshark -r "${pcapFile}" -q -z conv,ip 2>/dev/null | head -30`,
      { timeout: 60_000, silent: true }
    );
    if (conversations.stdout.trim()) {
      results.push({
        tool: this.name,
        severity: 'info',
        title: 'Top IP-gesprekken',
        description: conversations.stdout.trim(),
      });
    }

    // Onversleuteld HTTP verkeer
    const http = runCommand(
      `tshark -r "${pcapFile}" -Y "http.request" -T fields -e http.host -e http.request.uri 2>/dev/null | sort -u | head -20`,
      { timeout: 60_000, silent: true }
    );
    if (http.stdout.trim()) {
      results.push({
        tool: this.name,
        severity: 'medium',
        title: 'Onversleuteld HTTP verkeer gevonden',
        description: `HTTP requests:\n${http.stdout}`,
        recommendation: 'Gebruik HTTPS in plaats van HTTP om verkeer te versleutelen.',
        mitreAttackId: 'T1040',
      });
    }

    // DNS queries
    const dns = runCommand(
      `tshark -r "${pcapFile}" -Y "dns.flags.response == 0" -T fields -e dns.qry.name 2>/dev/null | sort -u | head -30`,
      { timeout: 60_000, silent: true }
    );
    if (dns.stdout.trim()) {
      results.push({
        tool: this.name,
        severity: 'info',
        title: 'DNS queries in capture',
        description: dns.stdout.trim(),
      });
    }

    // Plaintext credentials (FTP, Telnet, HTTP Basic Auth)
    const credentials = runCommand(
      `tshark -r "${pcapFile}" -Y "ftp || telnet || http.authorization" -T fields -e text 2>/dev/null | head -10`,
      { timeout: 60_000, silent: true }
    );
    if (credentials.stdout.trim()) {
      results.push({
        tool: this.name,
        severity: 'critical',
        title: 'Mogelijke plaintext credentials gevonden',
        description: 'FTP, Telnet of HTTP Basic Auth verkeer gedetecteerd — credentials mogelijk zichtbaar.',
        raw: credentials.stdout,
        mitreAttackId: 'T1040',
      });
    }

    return results;
  }
}
