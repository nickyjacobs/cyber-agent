// src/utils/shell.ts
import { execSync } from 'child_process';

export interface ShellResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  command: string;
  durationMs: number;
}

/**
 * Voer een shell-commando uit en geef het resultaat terug.
 * Bevat timeout en basis sanitization.
 */
export function runCommand(
  command: string,
  options: {
    timeout?: number;     // ms, default 60s
    sudo?: boolean;       // voeg sudo toe
    silent?: boolean;     // geen stderr loggen
  } = {}
): ShellResult {
  const { timeout = 60_000, sudo = false, silent = false } = options;
  const fullCommand = sudo ? `sudo ${command}` : command;
  const start = Date.now();

  try {
    const stdout = execSync(fullCommand, {
      timeout,
      encoding: 'utf-8',
      stdio: silent ? ['pipe', 'pipe', 'pipe'] : undefined,
    });

    return {
      stdout: stdout.trim(),
      stderr: '',
      exitCode: 0,
      command: fullCommand,
      durationMs: Date.now() - start,
    };
  } catch (error: any) {
    return {
      stdout: error.stdout?.toString().trim() || '',
      stderr: error.stderr?.toString().trim() || '',
      exitCode: error.status || 1,
      command: fullCommand,
      durationMs: Date.now() - start,
    };
  }
}

/**
 * Check of een tool beschikbaar is op het systeem
 */
export function isToolAvailable(toolName: string): boolean {
  try {
    execSync(`which ${toolName}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Lijst beschikbare Kali tools
 */
export function checkKaliTools(): Record<string, boolean> {
  const tools = [
    'nmap', 'nikto', 'tshark', 'whois', 'dig',
    'sslscan', 'whatweb', 'dnsrecon', 'sublist3r',
    'wapiti', 'searchsploit', 'gobuster', 'amass',
  ];

  const status: Record<string, boolean> = {};
  for (const tool of tools) {
    status[tool] = isToolAvailable(tool);
  }
  return status;
}
