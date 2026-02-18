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

    // sublist3r — subdomain enumeration
    if (isToolAvailable('sublist3r')) {
      const sublist3r = runCommand(`sublist3r -d ${domain} -o /dev/stdout 2>/dev/null`, {
        timeout: 120_000,
        silent: true,
      });
      const subdomains = sublist3r.stdout.split('\n').filter(l => l.trim() && l.includes('.'));
      results.push({
        tool: this.name,
        severity: subdomains.length > 0 ? 'low' : 'info',
        title: `Sublist3r: ${subdomains.length} subdomeinen gevonden voor ${domain}`,
        description: subdomains.join('\n') || 'Geen subdomeinen gevonden',
        raw: sublist3r.stdout,
      });
    }

    // theHarvester — email, hosts en namen verzamelen
    if (isToolAvailable('theHarvester')) {
      const harvester = runCommand(
        `theHarvester -d ${domain} -b duckduckgo,bing -l 100 2>/dev/null`,
        { timeout: 120_000, silent: true }
      );
      results.push({
        tool: this.name,
        severity: 'info',
        title: `theHarvester: open source intelligence voor ${domain}`,
        description: 'Emails, hosts en namen verzameld via publieke bronnen',
        raw: harvester.stdout,
      });

      // Emails zijn een apart aandachtspunt
      const emails = harvester.stdout
        .split('\n')
        .filter(l => l.includes('@') && l.includes(domain));
      if (emails.length > 0) {
        results.push({
          tool: this.name,
          severity: 'low',
          title: `${emails.length} emailadressen gevonden voor ${domain}`,
          description: emails.join('\n'),
          recommendation: 'Controleer of deze adressen niet gebruikt kunnen worden voor phishing of credential stuffing.',
          mitreAttackId: 'T1589.002',
        });
      }
    }

    return results;
  }
}
