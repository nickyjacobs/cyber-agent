// src/tools/system-checker.ts
import { runCommand, isToolAvailable } from '../utils/shell';
import { SecurityTool, ScanResult } from '../core/types';

export class SystemChecker implements SecurityTool {
  name = 'system-checker';
  description = 'Lokale systeemconfiguratie checks voor hardening analyse';

  async run(_args: Record<string, unknown> = {}): Promise<ScanResult[]> {
    const results: ScanResult[] = [];

    // Open poorten via ss
    const ss = runCommand('ss -tlnp', { silent: true });
    const listenCount = ss.stdout.split('\n').filter(l => l.includes('LISTEN')).length;
    results.push({
      tool: this.name,
      severity: listenCount > 15 ? 'medium' : 'info',
      title: `${listenCount} luisterende TCP poorten`,
      description: ss.stdout,
    });

    // UFW firewall
    const ufw = runCommand('ufw status', { silent: true, sudo: true });
    if (ufw.stdout.includes('inactive') || ufw.exitCode !== 0) {
      results.push({
        tool: this.name,
        severity: 'high',
        title: 'Firewall niet actief',
        description: 'UFW firewall is niet actief.',
        recommendation: 'Activeer met: sudo ufw enable',
        mitreAttackId: 'T1562.004',
      });
    }

    // SSH configuratie
    const ssh = runCommand('cat /etc/ssh/sshd_config 2>/dev/null', { silent: true });
    if (ssh.stdout.includes('PermitRootLogin yes')) {
      results.push({
        tool: this.name,
        severity: 'high',
        title: 'SSH root login toegestaan',
        description: 'Root kan direct via SSH inloggen.',
        recommendation: 'Zet PermitRootLogin op "no" in /etc/ssh/sshd_config',
        mitreAttackId: 'T1021.004',
      });
    }
    if (ssh.stdout.includes('PasswordAuthentication yes')) {
      results.push({
        tool: this.name,
        severity: 'medium',
        title: 'SSH wachtwoord authenticatie actief',
        description: 'SSH staat wachtwoord-gebaseerde login toe, kwetsbaar voor brute-force.',
        recommendation: 'Zet PasswordAuthentication op "no" en gebruik SSH keys.',
      });
    }

    // Bestandspermissies op kritieke bestanden
    const sensitivePaths: { path: string; expected: string }[] = [
      { path: '/etc/passwd', expected: '644' },
      { path: '/etc/shadow', expected: '640' },
      { path: '/etc/sudoers', expected: '440' },
    ];
    for (const { path, expected } of sensitivePaths) {
      const perm = runCommand(`stat -c "%a" ${path} 2>/dev/null`, { silent: true });
      if (perm.stdout.trim() && perm.stdout.trim() !== expected) {
        results.push({
          tool: this.name,
          severity: 'high',
          title: `Verkeerde permissies op ${path}`,
          description: `Huidige permissies: ${perm.stdout.trim()}, verwacht: ${expected}`,
          recommendation: `Herstel met: sudo chmod ${expected} ${path}`,
        });
      }
    }

    // World-writable bestanden in /etc
    const worldWritable = runCommand(
      'find /etc -maxdepth 2 -perm -o+w -not -type l 2>/dev/null | head -10',
      { silent: true }
    );
    if (worldWritable.stdout.trim()) {
      results.push({
        tool: this.name,
        severity: 'high',
        title: 'World-writable bestanden in /etc gevonden',
        description: worldWritable.stdout.trim(),
        recommendation: 'Verwijder world-write permissie van configuratiebestanden.',
      });
    }

    // auditd — audit daemon status en regels
    const auditdStatus = runCommand('systemctl is-active auditd 2>/dev/null', { silent: true });
    if (auditdStatus.stdout.trim() !== 'active') {
      results.push({
        tool: this.name,
        severity: 'medium',
        title: 'auditd niet actief',
        description: 'De Linux Audit Daemon draait niet. Systeemgebeurtenissen worden niet gelogd.',
        recommendation: 'Installeer en activeer met: sudo apt install auditd && sudo systemctl enable --now auditd',
      });
    } else {
      const auditRules = runCommand('auditctl -l 2>/dev/null', { silent: true, sudo: true });
      const ruleCount = auditRules.stdout.split('\n').filter(l => l.trim() && !l.includes('No rules')).length;
      results.push({
        tool: this.name,
        severity: ruleCount === 0 ? 'low' : 'info',
        title: `auditd actief (${ruleCount} regels geconfigureerd)`,
        description: auditRules.stdout || 'Geen audit regels gevonden',
      });
    }

    // Lynis (indien aanwezig)
    if (isToolAvailable('lynis')) {
      const lynis = runCommand(
        'lynis audit system --quick --no-colors 2>/dev/null | tail -20',
        { timeout: 120_000, silent: true, sudo: true }
      );
      results.push({
        tool: this.name,
        severity: 'info',
        title: 'Lynis hardening audit (samenvatting)',
        description: lynis.stdout || 'Lynis output niet beschikbaar',
      });
    }

    return results;
  }
}
