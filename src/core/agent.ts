// src/core/agent.ts
import { AgentConfig, AgentMode, ScanResult } from './types';
import { askAgent } from '../providers/agent-sdk';

export class CyberAgent {
  private config: AgentConfig;

  constructor(config?: Partial<AgentConfig>) {
    this.config = {
      mode: config?.mode || 'general',
      model: config?.model || 'sonnet',
      outputFormat: config?.outputFormat || 'text',
      verbose: config?.verbose || false,
      autoConfirm: config?.autoConfirm || false,
    };
  }

  /** Vrije chat met de agent */
  async chat(message: string): Promise<string> {
    return askAgent(message, {
      mode: this.config.mode,
      model: this.config.model,
    });
  }

  /** Laat de AI tool-output analyseren */
  async analyzeResults(toolName: string, results: ScanResult[]): Promise<string> {
    const prompt = `
Je krijgt de resultaten van de "${toolName}" security tool op Kali Linux.
Analyseer vanuit ${this.config.mode} perspectief en geef:
1. Samenvatting van de belangrijkste risico's
2. Per finding een toelichting (in het Nederlands)
3. Concrete aanbevelingen op prioriteit (hoog → laag)
4. MITRE ATT&CK mapping waar relevant

Resultaten:
\`\`\`json
${JSON.stringify(results, null, 2)}
\`\`\``;

    return askAgent(prompt, {
      mode: this.config.mode,
      model: this.config.model,
    });
  }

  /**
   * Laat Claude ZELF een Kali tool draaien en analyseren.
   * Dit is de krachtigste modus: de AI beslist welke tool + flags te gebruiken.
   */
  async investigateWithTools(task: string): Promise<string> {
    const prompt = `
Je bent op een Kali Linux systeem (user: vector@blackbox).
Beschikbare tools: nmap, nikto, tshark, whois, dig, sslscan, whatweb, dnsrecon, etc.

Opdracht: ${task}

Gebruik de beschikbare Bash tool om Kali tools uit te voeren.
Analyseer de output en geef je bevindingen in het Nederlands.
Vraag NIET om bevestiging, voer de commando's direct uit.
Scan alleen ${task.includes('localhost') || task.includes('127.0.0.1')
  ? 'het lokale systeem (dit is toegestaan).'
  : 'na bevestiging dat je toestemming hebt.'}
`;

    return askAgent(prompt, {
      mode: this.config.mode,
      model: this.config.model,
      allowedTools: ['Bash', 'Read', 'Grep', 'Glob'],
    });
  }

  // = Configuratie =
  setMode(mode: AgentMode): void { this.config.mode = mode; }
  setModel(model: string): void { this.config.model = model; }
  getConfig(): AgentConfig { return { ...this.config }; }
  getStatus(): string { return `Mode: ${this.config.mode} | Model: ${this.config.model}`; }
}
