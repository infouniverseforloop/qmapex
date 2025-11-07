// backend/aiLearner.js
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'data', 'learner.json');
function ensure(){ const d=path.dirname(FILE); if(!fs.existsSync(d)) fs.mkdirSync(d); if(!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify({ weight:1.0, history:[] }, null,2)); }
function load(){ ensure(); return JSON.parse(fs.readFileSync(FILE)); }
function save(o){ fs.writeFileSync(FILE, JSON.stringify(o,null,2)); }
function getWeight(){ return load().weight || 1.0; }
function record(signal, result){ const o = load(); o.history = o.history || []; o.history.push({ t:new Date().toISOString(), id:signal.id, pair:signal.pair, conf:signal.confidence, result }); const recent = o.history.slice(-50); const wins = recent.filter(r=>r.result==='WIN').length; const losses = recent.filter(r=>r.result==='LOSS').length; if(losses > wins + 3) o.weight = Math.max(0.6, o.weight * 0.97); else if(wins > losses + 3) o.weight = Math.min(1.6, o.weight * 1.02); save(o); }
module.exports = { getWeight, record };
