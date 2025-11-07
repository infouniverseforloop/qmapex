// backend/strategyCore.js
const { detectOrderBlock, isRound } = require('./patternAnalyzer');

function sma(arr,n){ if(!arr||arr.length<n) return null; return arr.slice(-n).reduce((a,b)=>a+b,0)/n; }
function rsi(closes, p=14){
  if(!closes||closes.length<p+1) return 50;
  let g=0,l=0;
  for(let i=closes.length-p;i<closes.length;i++){ const d=closes[i]-closes[i-1]; if(d>0) g+=d; else l+=Math.abs(d); }
  const aG=g/p, aL=(l/p)||1e-8; const rs=aG/aL; return 100 - (100/(1+rs));
}
function aggregate(candles, size){
  const out=[];
  for(let i=0;i<candles.length;i+=size){
    const ch=candles.slice(i,i+size);
    if(!ch.length) continue;
    out.push({ time:ch[0].time, open:ch[0].open, high:Math.max(...ch.map(c=>c.high)), low:Math.min(...ch.map(c=>c.low)), close:ch[ch.length-1].close, volume: ch.reduce((s,c)=>s+(c.volume||0),0) });
  }
  return out;
}

function compute(pair, candles, opts={}){
  if(!candles || candles.length < 120) return { status:'hold', reason:'insufficient' };
  const closes = candles.map(c=>c.close);
  const sma5 = sma(closes,5), sma20 = sma(closes,20);
  const last = candles[candles.length-1], prev = candles[candles.length-2];
  const r = rsi(closes,14);
  const vols = candles.slice(-60).map(c=>c.volume||0); const avgV = vols.reduce((a,b)=>a+b,0)/vols.length;
  const volSpike = (last.volume||0) > (avgV * (parseFloat(process.env.VOL_SPIKE_MULT||'2.5')));
  const h5 = aggregate(candles.slice(-300),5);
  const h5c = h5.map(c=>c.close);
  const h5s5 = h5c.length>=5 ? sma(h5c,5) : null;
  const h5s20 = h5c.length>=20 ? sma(h5c,20) : null;
  const htfBull = h5s5 && h5s20 && h5s5 > h5s20;
  const htfBear = h5s5 && h5s20 && h5s5 < h5s20;
  const ob = detectOrderBlock(candles);
  const round = isRound(last.close);
  let score = 50;
  const bullish = sma5 > sma20 && last.close > prev.close;
  const bearish = sma5 < sma20 && last.close < prev.close;
  if(bullish) score += 12;
  if(bearish) score -= 12;
  if(r < 35) score += 8;
  if(r > 65) score -= 8;
  if(volSpike) score += 6;
  if(ob) score += 6;
  if(htfBull) score += 8;
  if(htfBear) score -= 8;
  if(round) score += 2;
  const layers = (bullish||bearish?1:0) + (volSpike?1:0) + (ob?1:0) + (htfBull||htfBear?1:0);
  if(layers < 2) return { status:'hold', reason:'no-confirm' };
  score = Math.max(10, Math.min(99, Math.round(score)));
  const CALL = parseInt(process.env.CONF_THRESHOLD_CALL||'70',10);
  const PUT  = parseInt(process.env.CONF_THRESHOLD_PUT||'30',10);
  let direction = score >= CALL ? 'CALL' : (score <= PUT ? 'PUT' : (bullish ? 'CALL' : 'PUT'));
  if(opts.mode === 'god') score = Math.min(99, score + (parseInt(process.env.GOD_MODE_BOOST||'4',10)));
  return {
    status:'ok',
    pair,
    direction,
    confidence: score,
    entry: last.close,
    entry_ts: Math.floor(Date.now()/1000),
    expiry_ts: Math.floor(Date.now()/1000) + parseInt(process.env.BINARY_EXPIRY_SECONDS||'60',10),
    notes: `rsi:${Math.round(r)}|volSpike:${volSpike}|ob:${!!ob}|htf:${htfBull?'BULL':htfBear?'BEAR':'NONE'}`
  };
}

module.exports = { compute };
