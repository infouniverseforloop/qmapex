// backend/cloudBackup.js
const fs = require('fs');
const axios = require('axios');
const { info, warn } = require('./logger');

const FIREBASE_DB_URL = (process.env.FIREBASE_DB_URL || '').replace(/\/$/,'');
const LOCAL_BACKUP = './data/backup_signals.json';
function ensureDataFolder(){ if(!fs.existsSync('./data')) fs.mkdirSync('./data'); }

async function pushToFirebase(payload){
  if(!FIREBASE_DB_URL) throw new Error('FIREBASE_DB_URL not set');
  const url = `${FIREBASE_DB_URL}/signals.json`;
  await axios.post(url, payload);
}

function saveLocal(payload){
  try{
    ensureDataFolder();
    const arr = fs.existsSync(LOCAL_BACKUP) ? JSON.parse(fs.readFileSync(LOCAL_BACKUP)) : [];
    arr.push(payload);
    fs.writeFileSync(LOCAL_BACKUP, JSON.stringify(arr, null, 2));
    info('Saved backup locally');
  }catch(e){ warn('Local backup failed: ' + e.message); }
}

async function backupSignal(payload){
  try{
    if(FIREBASE_DB_URL){
      await pushToFirebase(payload);
      info('Backed up to Firebase');
    } else {
      saveLocal(payload);
    }
  }catch(e){
    warn('Cloud backup failed: ' + e.message);
    saveLocal(payload);
  }
}

module.exports = { backupSignal, saveLocal };
