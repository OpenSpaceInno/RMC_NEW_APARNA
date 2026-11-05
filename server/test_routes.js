import { spawn } from 'child_process';
import WebSocket from 'ws';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9224;

const routes = ['/', '/gate-monitor', '/weighbridge', '/exit-verification', '/reports'];

async function testRoutes() {
  const edge = spawn(edgePath, [
    '--headless',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:8080'
  ], { stdio: 'ignore' });

  await new Promise(r => setTimeout(r, 2000));

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
    await new Promise(resolve => ws.on('open', resolve));

    ws.send(JSON.stringify({ id: 1, method: 'Console.enable' }));
    ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
    ws.send(JSON.stringify({ id: 3, method: 'Page.enable' }));

    const logs = [];
    let messageId = 10;
    const callbacks = new Map();

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
      if (msg.id && callbacks.has(msg.id)) {
        callbacks.get(msg.id)(msg.result);
        callbacks.delete(msg.id);
      }
    });

    const sendCmd = (method, params) => new Promise((resolve) => {
      const id = ++messageId;
      callbacks.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });

    for (const route of routes) {
      console.log(`\n--- Testing Route: ${route} ---`);
      logs.length = 0;
      await sendCmd('Page.navigate', { url: `http://localhost:8080${route}` });
      await new Promise(r => setTimeout(r, 2500));

      const evalRes = await sendCmd('Runtime.evaluate', {
        expression: `JSON.stringify({
          pathname: window.location.pathname,
          rootLength: document.getElementById('root')?.innerHTML?.length || 0,
          innerTextPreview: document.body.innerText?.slice(0, 150) || '',
          bodyBg: window.getComputedStyle(document.body).backgroundColor
        })`
      });

      console.log('DOM State:', evalRes?.result?.value);
      if (logs.some(l => l.includes('[EXCEPTION]') || l.includes('ERROR'))) {
        console.log('Errors caught:', logs.filter(l => l.includes('[EXCEPTION]') || l.includes('ERROR')));
      } else {
        console.log('No exceptions on', route);
      }
    }

    ws.close();
    edge.kill();
    process.exit(0);

  } catch (err) {
    console.error('Route test error:', err);
    edge.kill();
    process.exit(1);
  }
}

testRoutes();
