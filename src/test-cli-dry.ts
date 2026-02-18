// src/test-cli-dry.ts — CLI dry run zonder REPL en zonder Claude API calls
import chalk from 'chalk';
import { CyberAgent } from './core/agent';
import { showBanner } from './cli/banner';
import { handleCommand, CLIState } from './cli/commands';
import { exportResults } from './utils/export';
import { getAvailableModes } from './modes';
import { checkKaliTools } from './utils/shell';
import type { ScanResult } from './core/types';
import * as fs from 'fs';

let passed = 0;
let failed = 0;

function ok(label: string) {
  console.log(chalk.green(`  ✅ ${label}`));
  passed++;
}
function fail(label: string, err?: any) {
  console.log(chalk.red(`  ❌ ${label}`));
  if (err) console.log(chalk.dim(`     ${err}`));
  failed++;
}

// ─── Mock ScanResults voor export tests ───────────────────────────────────────
const mockResults: ScanResult[] = [
  { tool: 'nmap-scanner', severity: 'info',   title: 'Nmap quick scan van localhost', description: 'Scan compleet in 1234ms' },
  { tool: 'system-check', severity: 'high',   title: 'Firewall niet actief', description: 'UFW is inactief.', recommendation: 'sudo ufw enable', mitreAttackId: 'T1562.004' },
  { tool: 'system-check', severity: 'medium', title: 'SSH wachtwoord auth actief', description: 'Brute-force risico.', recommendation: 'Gebruik SSH keys' },
];

async function main() {
  console.log(chalk.bold('\n══════════════════════════════════════'));
  console.log(chalk.bold('  Cyber Agent CLI — Dry Run Test'));
  console.log(chalk.bold('══════════════════════════════════════\n'));

  // ─── 1. Banner ────────────────────────────────────────────────────────────
  console.log(chalk.bold('1. Banner'));
  try {
    const agent = new CyberAgent({ mode: 'general' });
    showBanner(agent.getConfig());
    ok('Banner rendered zonder errors');
  } catch (e) { fail('Banner rendering', e); }

  // ─── 2. Modes ────────────────────────────────────────────────────────────
  console.log(chalk.bold('\n2. Mode-systeem'));
  try {
    const modes = getAvailableModes();
    if (modes.length === 6) ok(`6 modes geladen: ${modes.map(m => m.mode).join(', ')}`);
    else fail(`Verwacht 6 modes, kreeg ${modes.length}`);
  } catch (e) { fail('Modes laden', e); }

  // ─── 3. Kali tools check ─────────────────────────────────────────────────
  console.log(chalk.bold('\n3. Kali tools detectie'));
  try {
    const tools = checkKaliTools();
    const available = Object.entries(tools).filter(([, v]) => v).map(([k]) => k);
    const missing   = Object.entries(tools).filter(([, v]) => !v).map(([k]) => k);
    ok(`Beschikbaar (${available.length}): ${available.join(', ')}`);
    if (missing.length) console.log(chalk.yellow(`  ⚠️  Ontbreekt (${missing.length}): ${missing.join(', ')}`));
  } catch (e) { fail('Kali tools check', e); }

  // ─── 4. Export — JSON ────────────────────────────────────────────────────
  console.log(chalk.bold('\n4. Export'));
  try {
    const jsonFile = exportResults(mockResults, 'json', 'test');
    const json = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
    if (json.length === 3) ok(`JSON export: ${jsonFile} (${json.length} items)`);
    else fail(`JSON: verwacht 3 items, kreeg ${json.length}`);
    fs.unlinkSync(jsonFile);
  } catch (e) { fail('JSON export', e); }

  try {
    const mdFile = exportResults(mockResults, 'md', 'test');
    const md = fs.readFileSync(mdFile, 'utf-8');
    if (md.includes('# Cyber Agent') && md.includes('Firewall niet actief')) ok(`Markdown export: ${mdFile}`);
    else fail('Markdown mist verwachte inhoud');
    fs.unlinkSync(mdFile);
  } catch (e) { fail('Markdown export', e); }

  try {
    const csvFile = exportResults(mockResults, 'csv', 'test');
    const csv = fs.readFileSync(csvFile, 'utf-8');
    const lines = csv.split('\n');
    if (lines.length === 4) ok(`CSV export: ${csvFile} (${lines.length - 1} rijen + header)`);
    else fail(`CSV: verwacht 4 regels, kreeg ${lines.length}`);
    fs.unlinkSync(csvFile);
  } catch (e) { fail('CSV export', e); }

  // ─── 5. Command parsing (geen API calls) ─────────────────────────────────
  console.log(chalk.bold('\n5. Commando parsing'));
  const agent = new CyberAgent({ mode: 'general' });
  let state: CLIState = { agent, lastResults: mockResults };

  // mode wisselen
  try {
    state = await handleCommand('mode redteam', state);
    if (state.agent.getConfig().mode === 'redteam') ok('mode redteam → gewisseld');
    else fail('mode redteam: config niet geüpdatet');
  } catch (e) { fail('mode commando', e); }

  // model wisselen
  try {
    state = await handleCommand('model haiku', state);
    if (state.agent.getConfig().model === 'haiku') ok('model haiku → gewisseld');
    else fail('model haiku: config niet geüpdatet');
  } catch (e) { fail('model commando', e); }

  // status
  try {
    state = await handleCommand('status', state);
    ok('status commando zonder errors');
  } catch (e) { fail('status commando', e); }

  // export met bestaande lastResults
  try {
    state = await handleCommand('export json', state);
    ok('export json commando (met lastResults)');
    // ruim test bestand op
    const files = fs.readdirSync('scan-results').filter(f => f.includes('redteam'));
    for (const f of files) fs.unlinkSync(`scan-results/${f}`);
  } catch (e) { fail('export commando', e); }

  // help (geen output check, alleen geen crash)
  try {
    state = await handleCommand('help', state);
    ok('help commando zonder errors');
  } catch (e) { fail('help commando', e); }

  // tools
  try {
    state = await handleCommand('tools', state);
    ok('tools commando zonder errors');
  } catch (e) { fail('tools commando', e); }

  // leeg commando
  try {
    state = await handleCommand('', state);
    ok('leeg commando zonder crash');
  } catch (e) { fail('leeg commando', e); }

  // onbekend commando zonder API → wordt doorgestuurd naar agent.chat()
  // Slaan we over (vereist Claude API)

  // ─── Resultaat ────────────────────────────────────────────────────────────
  console.log(chalk.bold('\n══════════════════════════════════════'));
  const total = passed + failed;
  if (failed === 0) {
    console.log(chalk.green(`✅ Alle ${total} checks geslaagd`));
  } else {
    console.log(chalk.red(`❌ ${failed}/${total} checks mislukt`));
  }
  console.log(chalk.bold('══════════════════════════════════════\n'));

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(chalk.red('\nFatale fout in dry run:'), err);
  process.exit(1);
});
