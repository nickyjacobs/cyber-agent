// src/tools/osint-tools.ts
import { runCommand, isToolAvailable } from '../utils/shell';
import { SecurityTool, ScanResult } from '../core/types';

export class OsintTools implements SecurityTool {
  name = 'osint-tools';
  description = 'OSINT tools (whois, dig, dnsrecon) voor domein reconnaissance';

  async run(args: Record<string, unknown> = {}): Promise<ScanResult[]> {
    const domain = (args.domain as string) || 'example.com';
    const results: ScanResult[] = [];

    // whois
    if (isToolAvailable('whois')) {
      const whois = runCommand(`whois ${domain}`, { timeout: 30_000, silent: true });
      results.push({
        tool: this.name,
        severity: 'info',
        title: `WHOIS: ${domain}`,
        description: 'WHOIS lookup compleet',
        raw: whois.stdout,
      });

      if (whois.stdout && !whois.stdout.includes('REDACTED') && !whois.stdout.includes('Privacy')) {
        results.push({
          tool: this.name,
          severity: 'low',
          title: 'Registrant gegevens publiek zichtbaar',
          description: 'WHOIS toont persoonlijke of organisatorische gegevens van de domeineigenaar.',
          recommendation: 'Overweeg WHOIS privacy protection in te schakelen bij je registrar.',
        });
      }
    }

    // dig — A, MX, TXT, NS records
    if (isToolAvailable('dig')) {
      for (const type of ['A', 'MX', 'TXT', 'NS'] as const) {
        const dig = runCommand(`dig ${domain} ${type} +short`, { timeout: 15_000, silent: true });
        if (dig.stdout.trim()) {
          results.push({
            tool: this.name,
            severity: 'info',
            title: `DNS ${type} records: ${domain}`,
            description: dig.stdout.trim(),
          });
        }
      }

      // Zone transfer check
      const nsLookup = runCommand(`dig NS ${domain} +short`, { timeout: 10_000, silent: true });
      const nameserver = nsLookup.stdout.split('\n')[0]?.trim();
      if (nameserver) {
        const axfr = runCommand(`dig @${nameserver} ${domain} AXFR`, { timeout: 15_000, silent: true });
        if (axfr.stdout.includes('XFR size')) {
          results.push({
            tool: this.name,
            severity: 'critical',
            title: 'Zone transfer mogelijk!',
            description: `DNS zone transfer is toegestaan voor ${domain}. Dit lekt alle DNS records.`,
            recommendation: 'Beperk AXFR transfers tot alleen geautoriseerde secondary DNS servers.',
            mitreAttackId: 'T1590.002',
          });
        }
      }
    }

    // dnsrecon — standaard reconnaissance
    if (isToolAvailable('dnsrecon')) {
      const dnsrecon = runCommand(`dnsrecon -d ${domain} -t std`, { timeout: 60_000, silent: true });
      results.push({
        tool: this.name,
        severity: 'info',
        title: `DNSrecon: ${domain}`,
        description: 'Standaard DNS reconnaissance compleet',
        raw: dnsrecon.stdout,
      });
    }

    return results;
  }
}
