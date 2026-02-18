// src/test-agent.ts
import { CyberAgent } from './core/agent';

async function main() {
  const agent = new CyberAgent({ mode: 'blueteam' });
  console.log('🔒 Cyber Agent Test op Kali Linux\n');

  // Test 1: Agent chat
  console.log('--- Test 1: Chat ---');
  const answer = await agent.chat('Welke Kali tools gebruik je voor een quick security audit?');
  console.log(answer);

  // Test 2: Agent voert ZELF nmap uit en analyseert
  console.log('\n--- Test 2: Agent draait nmap ---');
  const scan = await agent.investigateWithTools(
    'Scan localhost met nmap (top 20 poorten) en analyseer de resultaten'
  );
  console.log(scan);
}

main().catch(console.error);
