// src/tools/nikto-scanner.ts
import { runCommand, isToolAvailable } from '../utils/shell';
import { SecurityTool, ScanResult } from '../core/types';

export class NiktoScanner implements SecurityTool {
  name = 'nikto-scanner';
  description = 'Web vulnerability scanner (nikto) voor OWASP-checks';

  async run(args: Record<string, unknown> = {}): Promise<ScanResult[]> {
    if (!isToolAvailable('nikto')) {
      return [{
        tool: this.name,
        severity: 'critical',
        title: 'nikto niet gevonden',
        description: 'Installeer met: sudo apt install nikto',
      }];
    }

    const target = (args.target as string) || 'http://localhost';
    const results: ScanResult[] = [];

    const scan = runCommand(`nikto -h ${target} -nointeractive`, {
      timeout: 300_000,
      silent: true,
    });

    results.push({
      tool: this.name,
      severity: 'info',
      title: `Nikto scan van ${target}`,
      description: `Scan compleet in ${scan.durationMs}ms`,
      raw: scan.stdout,
    });

    // Nikto findings beginnen met '+'
    const findings = scan.stdout
      .split('\n')
      .filter(line => line.startsWith('+') && !line.includes('Start Time') && !line.includes('End Time'));

    for (const finding of findings) {
      const text = finding.replace(/^\+\s*/, '').trim();
      if (!text) continue;

      let severity: ScanResult['severity'] = 'low';
      if (/(SQL|XSS|injection|OSVDB|CVE)/i.test(text)) severity = 'high';
      else if (/(misconfigur|default|password|login|admin)/i.test(text)) severity = 'medium';

      results.push({
        tool: this.name,
        severity,
        title: text.slice(0, 80),
        description: text,
      });
    }

    return results;
  }
}
