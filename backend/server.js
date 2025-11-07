// backend/server.js
require('dotenv').config();
const express = require('express');
const { start } = require('./signalEngine');
const { info } = require('./logger');
const { getNetworkTime } = require('./timeSync');

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const OWNER = process.env.OWNER_NAME || 'David Mamun William';

app.get('/', (_,res) => res.send(`Quantum Apex System — Owner: ${OWNER}`));
app.get('/health', async (_,res) => {
  const t = await getNetworkTime();
  res.json({ ok:true, server_time: t });
});

app.listen(PORT, ()=> {
  info(`Quantum Apex System listening on ${PORT}`);
  if((process.env.AUTO_START || 'true') === 'true'){
    start().catch(e=> info('start err: ' + e.message));
  }
});
