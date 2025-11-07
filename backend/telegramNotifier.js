// backend/telegramNotifier.js
const axios = require('axios');
const { info, warn } = require('./logger');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

async function send(text){
  if(!TOKEN || !CHAT_ID) { warn('Telegram not configured'); return false; }
  try{
    const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
    await axios.post(url, { chat_id: CHAT_ID, text, parse_mode: 'HTML' });
    info('Telegram sent');
    return true;
  }catch(e){
    warn('Telegram failed: ' + (e.response && e.response.data ? JSON.stringify(e.response.data) : e.message));
    return false;
  }
}

function format(sig){
  const when = new Date((sig.entry_ts||Math.floor(Date.now()/1000))*1000).toLocaleString();
  const expiry = new Date((sig.expiry_ts||0)*1000).toLocaleString();
  const lines = [
    `<b>Quantum Apex — Signal</b>`,
    `Pair: <b>${sig.pair}</b>`,
    `Mode: <b>${sig.mode || 'AUTO'}</b>`,
    `Type: <b>${sig.direction}</b>`,
    `Confidence: <b>${sig.confidence}%</b>`,
    `Entry: <code>${sig.entry}</code> at ${when}`,
    `Expiry: ${expiry}`,
    `Notes: ${sig.notes || '-'}`,
    `ID: ${sig.id || '-'}`,
    sig.result ? `Result: <b>${sig.result}</b>` : ''
  ];
  return lines.join('\n');
}

module.exports = { send, format };
