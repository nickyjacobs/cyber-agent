// src/cli/commands.ts
import inquirer from 'inquirer';
import chalk from 'chalk';
import { CyberAgent } from '../core/agent';
import { runQuickScan } from '../workflows/quick-scan';
import { runHardening } from '../workflows/hardening';
import { runOsintGather } from '../workflows/osint-gather';
import { runWebappScan } from '../workflows/webapp-scan';
import { runNetworkAnalysis } from '../workflows/network-analysis';
import { runContractAudit } from '../workflows/contract-audit';
import { exportResults, ExportFormat } from '../utils/export';
import { checkKaliTools } from '../utils/shell';
import { getAvailableModes } from '../modes';
import type { ScanResult, AgentMode } from '../core/types';

export interface CLIState {
  agent: CyberAgent;
  lastResults: ScanResult[];
}

export async function handleCommand(input: string, state: CLIState): Promise<CLIState> {
  const parts = input.trim().split(/\s+/);
  const cmd = parts[0]?.toLowerCase() ?? '';
  const args = parts.slice(1);

  switch (cmd) {
    case '':
      break;

    case 'scan':
      state.lastResults = await runQuickScan(state.agent);
      break;

    case 'harden':
      state.lastResults = await runHardening(state.agent);
      break;

    case 'osint': {
      const domain = args[0];
      if (!domain) { console.log(chalk.yellow('Gebruik: osint <domein>')); break; }
      state.lastResults = await runOsintGather(state.agent, domain);
      break;
    }

    case 'webscan': {
      const url = args[0];
      if (!url) { console.log(chalk.yellow('Gebruik: webscan <url>')); break; }

      const isLocal = url.includes('localhost') || url.includes('127.0.0.1');
      if (!isLocal) {
        const { confirmed } = await inquirer.prompt([{
          type: 'confirm',
          name: 'confirmed',
          message: `⚠️  Heb je toestemming om ${url} te scannen?`,
          default: false,
        }]);
        if (!confirmed) { console.log(chalk.red('Scan geannuleerd.')); break; }
      }

      state.lastResults = await runWebappScan(state.agent, url);
      break;
    }

    case 'pcap': {
      const file = args[0];
      if (!file) { console.log(chalk.yellow('Gebruik: pcap <bestand.pcap>')); break; }
      state.lastResults = await runNetworkAnalysis(state.agent, file);
      break;
    }

    case 'audit': {
      const file = args[0];
      if (!file) { console.log(chalk.yellow('Gebruik: audit <contract.sol>')); break; }
      state.lastResults = await runContractAudit(state.agent, file);
      break;
    }

    case 'investigate': {
      const task = args.join(' ');
      if (!task) { console.log(chalk.yellow('Gebruik: investigate <opdracht>')); break; }
      const result = await state.agent.investigateWithTools(task);
      console.log('\n🤖 = AI ONDERZOEK =\n');
      console.log(result);
      break;
    }

    case 'mode': {
      const newMode = args[0] as AgentMode;
      const validModes = getAvailableModes().map(m => m.mode);
      if (!newMode || !validModes.includes(newMode)) {
        console.log(chalk.yellow('Beschikbare modes:'));
        for (const m of getAvailableModes()) console.log(`  ${m.label} → ${m.mode}`);
        break;
      }
      state.agent.setMode(newMode);
      const modeLabel = getAvailableModes().find(m => m.mode === newMode)?.label;
      console.log(chalk.green(`✅ Gewisseld naar: ${modeLabel}`));
      break;
    }

    case 'model': {
      const newModel = args[0];
      const validModels = ['sonnet', 'haiku', 'opus'];
      if (!newModel || !validModels.includes(newModel)) {
        console.log(chalk.yellow(`Gebruik: model <${validModels.join('|')}>`));
        break;
      }
      state.agent.setModel(newModel);
      const labels: Record<string, string> = {
        sonnet: 'Claude Sonnet (default)',
        haiku:  'Claude Haiku (snel/zuinig)',
        opus:   'Claude Opus (krachtig)',
      };
      console.log(chalk.green(`✅ Model: ${labels[newModel]}`));
      break;
    }

    case 'export': {
      const format = (args[0] ?? 'json') as ExportFormat;
      const validFormats: ExportFormat[] = ['json', 'md', 'csv'];
      if (!validFormats.includes(format)) {
        console.log(chalk.yellow('Gebruik: export <json|md|csv>'));
        break;
      }
      if (state.lastResults.length === 0) {
        console.log(chalk.yellow('Geen resultaten om te exporteren. Voer eerst een scan uit.'));
        break;
      }
      const filename = exportResults(state.lastResults, format, state.agent.getConfig().mode);
      console.log(chalk.green(`📁 Opgeslagen: ${filename}`));
      break;
    }

    case 'flows': {
      const { flow } = await inquirer.prompt([{
        type: 'list',
        name: 'flow',
        message: 'Kies een workflow:',
        choices: [
          { name: '🔍 Quick Scan — lokaal systeem', value: 'scan' },
          { name: '🛡️  Hardening — systeemhardening', value: 'harden' },
          { name: '🔍 OSINT — domein reconnaissance', value: 'osint' },
          { name: '🌐 Web App Scan — OWASP checks', value: 'webscan' },
          { name: '📡 PCAP Analyse — netwerkverkeer', value: 'pcap' },
          { name: '📜 Smart Contract Audit', value: 'audit' },
          { name: '← Terug', value: null },
        ],
      }]);
      if (!flow) break;

      if (['osint', 'webscan', 'pcap', 'audit'].includes(flow)) {
        const labels: Record<string, string> = {
          osint:   'Domeinnaam (bijv. example.com)',
          webscan: 'URL (bijv. https://example.com)',
          pcap:    'Pad naar .pcap bestand',
          audit:   'Pad naar .sol bestand',
        };
        const { inputValue } = await inquirer.prompt([{
          type: 'input',
          name: 'inputValue',
          message: labels[flow],
        }]);
        return handleCommand(`${flow} ${inputValue}`, state);
      }
      return handleCommand(flow, state);
    }

    case 'tools': {
      const tools = checkKaliTools();
      console.log('\n📦 Beschikbare Kali tools:\n');
      for (const [tool, available] of Object.entries(tools)) {
        console.log(`  ${available ? '✅' : '❌'} ${tool}`);
      }
      console.log();
      break;
    }

    case 'status':
      console.log(`\n📊 ${state.agent.getStatus()}`);
      console.log(`📋 Laatste scan: ${state.lastResults.length} resultaten\n`);
      break;

    case 'clear':
      console.clear();
      break;

    case 'help':
      printHelp();
      break;

    case 'exit':
    case 'quit':
      console.log(chalk.cyan('\n👋 Tot ziens, vector!\n'));
      process.exit(0);
      break;

    default: {
      // Vrije tekst → chat met de agent
      const response = await state.agent.chat(input);
      console.log('\n🤖', response, '\n');
    }
  }

  return state;
}

function printHelp(): void {
  console.log(`
${chalk.bold('Commando\'s:')}
  ${chalk.cyan('scan')}                   Quick system scan
  ${chalk.cyan('harden')}                 Hardening aanbevelingen
  ${chalk.cyan('webscan')} <url>          Web vulnerability scan (nikto + sslscan + wapiti)
  ${chalk.cyan('osint')} <domein>         OSINT gathering (whois + dig + dnsrecon + sublist3r)
  ${chalk.cyan('pcap')} <bestand>         PCAP analyse (tshark + tcpdump)
  ${chalk.cyan('audit')} <contract.sol>   Smart contract audit
  ${chalk.cyan('investigate')} <opdracht> Vrije AI-gestuurde scan (agent kiest tools)
  ${chalk.cyan('mode')} <naam>            Wissel modus (general|redteam|blueteam|osint|webpentest|smartcontract)
  ${chalk.cyan('model')} <naam>           Wissel AI model (sonnet|haiku|opus)
  ${chalk.cyan('flows')}                  Toon workflow menu
  ${chalk.cyan('export')} <format>        Export resultaten (json|md|csv)
  ${chalk.cyan('tools')}                  Toon beschikbare Kali tools
  ${chalk.cyan('status')}                 Toon huidige configuratie
  ${chalk.cyan('clear')}                  Wis scherm
  ${chalk.cyan('exit')}                   Afsluiten

${chalk.dim('Of typ vrije tekst voor een gesprek met de agent.')}
`);
}
