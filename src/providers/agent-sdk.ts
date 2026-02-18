// src/providers/agent-sdk.ts
import { query } from '@anthropic-ai/claude-agent-sdk';
import type { AgentMode } from '../core/types';
import { getModePrompt } from '../modes';

interface QueryOptions {
  mode: AgentMode;
  model?: string;
  allowedTools?: string[];
}

/**
 * Stuur prompt naar Claude via Agent SDK.
 * Gebruikt je Pro-abonnement (geen API key).
 * Claude kan Kali tools aanroepen via Bash.
 */
export async function askAgent(
  prompt: string,
  options: QueryOptions
): Promise<string> {
  const systemPrompt = getModePrompt(options.mode);
  let resultText = '';

  for await (const message of query({
    prompt,
    options: {
      systemPrompt,
      model: options.model || 'sonnet',
      allowedTools: options.allowedTools || [
        'Bash',   // Kali tools uitvoeren
        'Read',   // Bestanden lezen
        'Grep',   // Zoeken in bestanden/output
        'Glob',   // Bestanden vinden
      ],
      settingSources: ['project'],  // Laad .claude/CLAUDE.md
      maxTurns: 15,
    },
  })) {
    if (message.type === 'result') {
      resultText = (message as any).result || '';
    }
  }

  return resultText;
}

/**
 * Streaming versie — voor real-time output in CLI
 */
export async function* streamAgent(
  prompt: string,
  options: QueryOptions
): AsyncGenerator<{ type: string; content: string }> {
  const systemPrompt = getModePrompt(options.mode);

  for await (const message of query({
    prompt,
    options: {
      systemPrompt,
      model: options.model || 'sonnet',
      allowedTools: ['Bash', 'Read', 'Grep', 'Glob'],
      settingSources: ['project'],
      maxTurns: 15,
    },
  })) {
    if (message.type === 'assistant') {
      for (const block of (message as any).message?.content || []) {
        if (block.type === 'text') {
          yield { type: 'text', content: block.text };
        }
      }
    } else if (message.type === 'result') {
      yield { type: 'result', content: (message as any).result || '' };
    }
  }
}
