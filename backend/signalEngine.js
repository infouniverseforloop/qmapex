// backend/signalEngine.js
const { info, warn, dbg } = require('./logger');
const broker = require('./brokerManager');
const { compute } = require('./strategyCore');
const { send, format } = require('./telegramNotifier');
const { backupSignal } = require('./cloudBackup');
const { getWeight, record } = require('./aiLearner');
const { broadcast } = require('./dashboard'); // <-- new

const WATCH = (process.env.WATCH_SYMBOLS || 'EUR/USD,GBP/USD,USD/JPY,AUD/USD,USD/CAD,USD/CHF,NZD/USD').split(',').map(s=>s.trim());
const SCAN_INTERVAL = parseInt(process.env.SCAN_INTERVAL_MS || '4000', 10);
const MIN_CONF = parseInt(process.env.MIN_CONFIDENCE || '80', 10);

function sleep(ms){ return new Promise(res=>setTimeout(res,ms)); }

async function localFetch(pair, count=400){
  const now = Math.floor(Date.now()/1000);
  const arr = [];
  let base = 1.0;
  if(pair.startsWith('EUR')) base = 1.09;
  if(pair.startsWith('GBP')) base = 1.28;
  if(pair.includes('JPY')) base = 154.5;
  for(let i=count;i>=1;i--){
    const t = now - i;
    const noise = (Math.random()-0.5) * (pair.includes('BTC') ? 200 : 0.0012);
    const close = +(base + noise).toFixed(pair.includes('JPY')?2:5);
    const open = +(close + ((Math.random()-0.5)*0.0008)).toFixed(5);
    const high = Math.max(open, close) + Math.random()*0.0007;
    const low = Math.min(open, close) - Math.random()*0.0007;
    const vol = Math.floor(100 + Math.random()*900);
    arr.push({ time:t, open, high, low, close, volume:vol });
  }
  return arr;
}

async function evaluatePair(pair, mode){
  try{
    const candles = (typeof global.fetchCandles === 'function') ? await global.fetchCandles(pair, 400) : await localFetch(pair, 400);
    const base = compute(pair, candles, { mode });
    if(!base || base.status !== 'ok') return null;
    const weight = getWeight();
    base.confidence = Math.min(99, Math.round(base.confidence * weight));
    base.mode = mode;
    base.id = Date.now() + Math.floor(Math.random()*999);
    return base;
  }catch(e){ warn('evaluatePair err: ' + e.message); return null; }
}

async function handle(sig){
  try{
    // broadcast to dashboard immediately
    try { broadcast({ type:'signal', data: sig }); } catch(e){ dbg('dashboard broadcast err: '+e.message); }

    // announce (telegram)
    const text = format(sig);
    await send(text).catch(()=>{});
    await backupSignal(sig).catch(()=>{});
    info(`Signal: ${sig.pair} ${sig.direction} conf:${sig.confidence}`);
  }catch(e){ warn('handle err: ' + e.message); }

  const ttl = Math.max(5, (sig.expiry_ts - Math.floor(Date.now()/1000)));
  setTimeout(async ()=>{
    try{
      const candles = (typeof global.fetchCandles === 'function') ? await global.fetchCandles(sig.pair, 10) : await localFetch(sig.pair, 10);
      const final = candles.length ? candles[candles.length-1].close : sig.entry;
      const win = (sig.direction === 'CALL') ? (final > sig.entry) : (final < sig.entry);
      sig.result = win ? 'WIN' : 'LOSS';
      await backupSignal({ ...sig, finalPrice: final }).catch(()=>{});
      await send(format(sig)).catch(()=>{});
      record(sig, sig.result);
      info(`Result: ${sig.pair} => ${sig.result} (entry:${sig.entry} final:${final})`);
      // broadcast result to dashboard
      try { broadcast({ type:'result', data: { ...sig, finalPrice: final } }); } catch(e){ dbg('dashboard result broadcast err: '+e.message); }
    }catch(e){ warn('expiry handler err: ' + e.message); }
  }, ttl*1000 + 1500);
}

async function start(){
  info('Initializing brokers...');
  await broker.init();
  info('Quantum Apex auto-scan started');
  while(true){
    try{
      for(const p of WATCH){
        const mode = (process.env.BROKER_MODE || 'hybrid').toLowerCase() === 'binary' ? 'binary' : 'forex';
        const cand = await evaluatePair(p, mode);
        if(cand && cand.confidence >= MIN_CONF){
          await handle(cand);
          const waitSec = Math.max(5, (cand.expiry_ts - Math.floor(Date.now()/1000)) + 2);
          await sleep(waitSec*1000);
        }
      }
    }catch(e){ warn('scan loop err: ' + e.message); }
    await sleep(SCAN_INTERVAL);
  }
}

module.exports = { start, evaluatePair };
