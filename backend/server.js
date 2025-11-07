// backend/server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const { start } = require('./signalEngine');
const { init: initBrokers } = require('./brokerManager');
const { info } = require('./logger');
const { attachDashboard } = require('./dashboard');

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const OWNER = process.env.OWNER_NAME || 'David Mamun William';

// Serve minimal dashboard files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Basic endpoints
app.get('/', (_, res) => res.send(`Quantum Apex System — Owner: ${OWNER} — Dashboard available at /`));
app.get('/health', (_, res) => res.json({ ok:true, server_time: new Date().toISOString() }));

// Create HTTP server and attach WS dashboard to it
const server = http.createServer(app);

// attach dashboard (creates a WebSocket server and returns broadcast function)
attachDashboard(server);

// Start server
server.listen(PORT, async () => {
  info(`Quantum Apex System listening on port ${PORT}`);
  try { await initBrokers(); } catch(e){ info('broker init error: ' + e.message); }
  if((process.env.AUTO_START || 'true') === 'true'){
    start().catch(e=> info('engine start err: ' + e.message));
  }
});
