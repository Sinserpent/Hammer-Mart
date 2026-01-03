// utils/httpsClient.js
import https from 'https';
import axios from 'axios';
import fs from 'fs';

export const createSecureClient = (keyPath, certPath) => {
  return axios.create({
    httpsAgent: new https.Agent({
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2'
    }),
    timeout: 10000 // 10s safety net
  });
};
