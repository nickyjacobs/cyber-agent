// src/cli/banner.ts
import figlet from 'figlet';
import gradientString from 'gradient-string';
import { checkKaliTools } from '../utils/shell';
import type { AgentConfig } from '../core/types';

export function showBanner(config: AgentConfig): void {
  console.clear();

  const title = figlet.textSync('Cyber Agent', { font: 'Standard' });
  console.log(gradientString('red', 'cyan')(title));
  console.log(gradientString('red', 'cyan')('  AI Security Assistant — Kali Linux\n'));

  // Sleuteltools status
  const tools = checkKaliTools();
  const keyTools = ['nmap', 'nikto', 'tshark', 'whois', 'gobuster', 'wapiti'];
  process.stdout.write('📦 Kali tools: ');
  for (const tool of keyTools) {
    process.stdout.write(`${tool} ${tools[tool] ? '✅' : '❌'}  `);
  }
  console.log('\n');

  console.log(`🤖 Mode: ${config.mode} | Model: ${config.model}`);
  console.log('💡 Typ "help" voor alle commando\'s\n');
}
