import { spawn } from 'child_process';
import WebSocket from 'ws';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9228;

async function inspectWeighbridge() {
  const edge = spawn(edgePath, [
    '--headless',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:8080/weighbridge'
  ], { stdio: 'ignore' });

  await new Promise(r => setTimeout(r, 2000));

  try {
    const listRes = await fetch(`http://127.0.0.1:${port}/json`);
    const tabs = await listRes.json();
    const tab = tabs.find(t => t.url.includes('weighbridge')) || tabs[0];
    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise(resolve => ws.on('open', resolve));

    const logs = [];
    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.method === 'Runtime.consoleAPICalled') {
        logs.push(msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' '));
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        logs.push('[EXC] ' + (msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text));
      }
    });

    ws.send(JSON.stringify({ id: 1, method: 'Console.enable' }));
    ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));

    // Wait 3.5s so fallback timer triggers and animations run
    await new Promise(r => setTimeout(r, 3500));

    let msgId = 10;
    const send = (method, params) => new Promise(res => {
      const id = ++msgId;
      const handler = (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.id === id) {
          ws.off('message', handler);
          res(msg.result);
        }
      };
      ws.on('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });

    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const canvases = Array.from(document.querySelectorAll('canvas')).map((c, i) => ({
          idx: i,
          width: c.width,
          height: c.height,
          clientWidth: c.clientWidth,
          clientHeight: c.clientHeight,
          display: window.getComputedStyle(c).display,
          visible: c.offsetParent !== null
        }));

        const videos = Array.from(document.querySelectorAll('video')).map((v, i) => ({
          idx: i,
          display: window.getComputedStyle(v).display,
          visible: v.offsetParent !== null
        }));

        const badges = Array.from(document.querySelectorAll('.badge, [class*="badge"]')).map(b => b.innerText.trim()).filter(Boolean);

        return {
          title: document.title,
          activeScreensBadge: document.body.innerText.match(/\\d\\s*\\/\\s*3\\s*SCREENS ACTIVE/)?.[0] || 'not found',
          canvasCount: canvases.length,
          visibleCanvases: canvases.filter(c => c.visible).length,
          canvases,
          videoCount: videos.length,
          badges: badges.slice(0, 10)
        };
      })()`,
      returnByValue: true
    });

    console.log('DOM Evaluation:');
    console.log(JSON.stringify(evalRes?.result?.value, null, 2));
    if (logs.filter(l => l.includes('[EXC]')).length > 0) {
      console.log('Errors:', logs.filter(l => l.includes('[EXC]')));
    }

    ws.close();
    edge.kill();
    process.exit(0);
  } catch (err) {
    console.error(err);
    edge.kill();
    process.exit(1);
  }
}

inspectWeighbridge();
