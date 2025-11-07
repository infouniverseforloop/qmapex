// backend/dashboard.js
// Creates a WebSocket server at path '/dash-ws' and exposes broadcast()
const WebSocket = require('ws');
const url = require('url');
const { info, dbg } = require('./logger');

let wss = null;

function attachDashboard(server){
  if(wss) return; // already attached
  wss = new WebSocket.Server({ server, path: '/dash-ws' });
  wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress;
    info(`Dashboard client connected: ${ip}`);
    ws.send(JSON.stringify({ type:'hello', server_time: new Date().toISOString() }));
    ws.on('message', msg => {
      dbg('dash msg: ' + String(msg).slice(0,200));
    });
    ws.on('close', () => info(`Dashboard client disconnected: ${ip}`));
  });
  wss.on('listening', ()=> info('Dashboard WebSocket listening on /dash-ws'));
  wss.on('error', (e) => info('Dashboard WS error: ' + e.message));
}

// broadcast object to all dashboard clients
function broadcast(obj){
  if(!wss) return;
  const raw = JSON.stringify(obj);
  wss.clients.forEach(c => {
    if(c.readyState === WebSocket.OPEN){
      try { c.send(raw); } catch(e){}
    }
  });
}

module.exports = { attachDashboard, broadcast };
