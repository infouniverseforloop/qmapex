// backend/timeSync.js
const axios = require('axios');
const { info, warn } = require('./logger');

async function getNetworkTime(){
  try{
    const r = await axios.get('http://worldtimeapi.org/api/ip');
    return new Date(r.data.utc_datetime).toISOString();
  }catch(e){
    warn('timeSync failed: ' + e.message);
    return new Date().toISOString();
  }
}

module.exports = { getNetworkTime };
