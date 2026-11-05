import { spawn } from 'child_process';
import WebSocket from 'ws';
import http from 'http';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9222;

const edge = spawn(edgePath, [
  '--headless',
  '--disable-gpu',
  `--remote-debugging-port=${port}`,
  '--no-first-run',
  '--no-default-browser-check',
  'http://localhost:8080'
], { stdio: 'ignore' });

setTimeout(async () => {
  try {
    const listRes = await fetch(`http://127.0.0.1:${port}/json`);
    const tabs = await listRes.json();
    const tab = tabs.find(t => t.url.includes('localhost:8080')) || tabs[0];
    if (!tab) {
      console.log('No tab found');
      edge.kill();
      process.exit(1);
    }

    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    ws.on('open', () => {
      ws.send(JSON.stringify({ id: 1, method: 'Console.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 3, method: 'Page.enable' }));
    });

    const logs = [];

    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
        logs.push(`[CONSOLE ${msg.params.type.toUpperCase()}] ${text}`);
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        const text = msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text;
        logs.push(`[EXCEPTION] ${text}`);
      }
    });

    setTimeout(() => {
      console.log('=== CAPTURED BROWSER LOGS ===');
      logs.forEach(l => console.log(l));
      console.log('=== END LOGS ===');
      ws.close();
      edge.kill();
      process.exit(0);
    }, 4000);

  } catch (err) {
    console.error('Diagnostic error:', err);
    edge.kill();
    process.exit(1);
  }
}, 2000);
