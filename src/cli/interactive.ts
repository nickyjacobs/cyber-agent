// src/cli/interactive.ts
import * as readline from 'readline';
import chalk from 'chalk';
import { CyberAgent } from '../core/agent';
import { handleCommand, CLIState } from './commands';
import type { AgentMode } from '../core/types';

export async function startInteractive(initialMode: AgentMode = 'general'): Promise<void> {
  const agent = new CyberAgent({ mode: initialMode });
  let state: CLIState = { agent, lastResults: [] };

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = (): string => `[${state.agent.getConfig().mode}] > `;

  const ask = (): void => {
    rl.question(chalk.cyan(prompt()), async (input) => {
      try {
        state = await handleCommand(input.trim(), state);
      } catch (err: any) {
        console.error(chalk.red(`\n❌ Fout: ${err.message}\n`));
      }
      ask();
    });
  };

  ask();

  rl.on('close', () => {
    console.log(chalk.cyan('\n👋 Tot ziens, vector!\n'));
    process.exit(0);
  });
}
