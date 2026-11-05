import { spawn } from 'child_process';
import WebSocket from 'ws';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9223;

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
    });

    const logs = [];

    ws.on('message', async (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
        logs.push(`[CONSOLE ${msg.params.type.toUpperCase()}] ${text}`);
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        const text = msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text;
        logs.push(`[EXCEPTION] ${text}`);
      }
      if (msg.id === 10) {
        console.log('DOM Evaluation Result:', msg.result?.result?.value);
      }
    });

    setTimeout(() => {
      // Evaluate document state
      ws.send(JSON.stringify({
        id: 10,
        method: 'Runtime.evaluate',
        params: {
          expression: `JSON.stringify({
            title: document.title,
            rootLength: document.getElementById('root')?.innerHTML?.length || 0,
            rootPreview: document.getElementById('root')?.innerHTML?.slice(0, 300) || '',
            pathname: window.location.pathname,
            hasCrash: document.body.innerText.includes('Error') || document.body.innerText.includes('Uncaught')
          })`
        }
      }));
    }, 2500);

    setTimeout(() => {
      console.log('=== LOGS ===');
      logs.forEach(l => console.log(l));
      ws.close();
      edge.kill();
      process.exit(0);
    }, 4500);

  } catch (err) {
    console.error('Inspection error:', err);
    edge.kill();
    process.exit(1);
  }
}, 2000);
