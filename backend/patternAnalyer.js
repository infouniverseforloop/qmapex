// backend/patternAnalyzer.js
function isRound(price){
  const s = price.toString();
  if(s.includes('.')) {
    const frac = s.split('.')[1];
    return frac.endsWith('000') || frac === '0000';
  }
  return true;
}
function detectOrderBlock(candles){
  if(!candles || candles.length < 5) return null;
  const prev = candles[candles.length-2];
  const body = Math.abs(prev.close - prev.open);
  const avg = candles.slice(-10).reduce((s,c)=>s+Math.abs(c.close-c.open),0)/10;
  if(body > avg * 1.6) return { zone:[Math.min(prev.open,prev.close), Math.max(prev.open,prev.close)], strength: body/avg };
  return null;
}
module.exports = { isRound, detectOrderBlock };
