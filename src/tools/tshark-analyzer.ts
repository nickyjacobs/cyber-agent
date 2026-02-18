// src/tools/tshark-analyzer.ts
import { runCommand, isToolAvailable } from '../utils/shell';
import { SecurityTool, ScanResult } from '../core/types';

export class TsharkAnalyzer implements SecurityTool {
  name = 'tshark-analyzer';
  description = 'PCAP analyse (tshark/tcpdump) voor netwerkverkeer inspectie';

  async run(args: Record<string, unknown> = {}): Promise<ScanResult[]> {
    if (!isToolAvailable('tshark')) {
      return [{
        tool: this.name,
        severity: 'critical',
        title: 'tshark niet gevonden',
        description: 'Installeer met: sudo apt install tshark',
      }];
    }

    let pcapFile = args.pcapFile as string;

    // Geen pcap opgegeven → tcpdump gebruiken voor live capture
    if (!pcapFile) {
      if (!isToolAvailable('tcpdump')) {
        return [{
          tool: this.name,
          severity: 'medium',
          title: 'Geen PCAP bestand opgegeven en tcpdump niet gevonden',
          description: 'Geef een pcap bestand op via args.pcapFile, of installeer tcpdump voor live capture.',
        }];
      }

      const iface = (args.interface as string) || 'any';
      const duration = (args.duration as number) || 30;
      pcapFile = `/tmp/cyberagent-capture-${Date.now()}.pcap`;

      const capture = runCommand(
        `tcpdump -i ${iface} -w "${pcapFile}" -G ${duration} -W 1 2>/dev/null`,
        { timeout: (duration + 5) * 1000, silent: true, sudo: true }
      );

      if (capture.exitCode !== 0 && !capture.stdout) {
        return [{
          tool: this.name,
          severity: 'medium',
          title: 'Live capture mislukt',
          description: capture.stderr || 'tcpdump kon geen verkeer vastleggen.',
        }];
      }
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
