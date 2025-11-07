// backend/brokerManager.js
// Auto-login placeholder supporting username/password for Quotex & Exness.
// If USE_REAL_X is 'true' and credentials present, integrate real login flows here.
const { info, warn, dbg } = require('./logger');

/*
ENV expected:
BROKER_MODE=hybrid
BROKER_BINARY=quotex
BROKER_FOREX=exness
QUOTEX_EMAIL=
QUOTEX_PASSWORD=
EXNESS_USERNAME=
EXNESS_PASSWORD=
USE_REAL_QUOTEX=false
USE_REAL_EXNESS=false
*/

const SIM = true;

async function loginQuotex(){
  if(process.env.USE_REAL_QUOTEX==='true' && process.env.QUOTEX_EMAIL && process.env.QUOTEX_PASSWORD){
    // Implement real do-login here (websocket auth/token) using provided creds.
    dbg('Quotex real login requested (implement adapter).');
    // return { ok:true, token:'...' }
    return { ok:false, reason:'not-implemented' };
  }
  info('Quotex simulated login (no real creds set)');
  return { ok:true, token:'SIM-QX-' + Math.random().toString(36).slice(2,9) };
}

async function loginExness(){
  if(process.env.USE_REAL_EXNESS==='true' && process.env.EXNESS_USERNAME && process.env.EXNESS_PASSWORD){
    dbg('Exness real login requested (implement adapter).');
    return { ok:false, reason:'not-implemented' };
  }
  info('Exness simulated login (no real creds set)');
  return { ok:true, token:'SIM-EX-' + Math.random().toString(36).slice(2,9) };
}

async function init(){
  const res = { quotex: null, exness: null };
  try{ res.quotex = await loginQuotex(); res.exness = await loginExness(); }
  catch(e){ warn('brokerManager init err: '+e.message); }
  return res;
}

// fetchCandles pair -> will be implemented by engine; here we just expose a hook to implement real requests
module.exports = { init };
