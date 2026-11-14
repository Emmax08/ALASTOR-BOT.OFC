// lib/myfunc.js  (CommonJS)
// Utilidades de uso general para los plugins.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

// Tamaño legible de bytes
function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
}

// Tiempo de actividad del proceso como string
function runtime(seconds) {
  seconds = Math.floor(seconds);
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [d, h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

function clockString(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor(ms / 60000) % 60;
  const s = Math.floor(ms / 1000) % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

// Elemento aleatorio
function pickRandom(arr) {
  if (!Array.isArray(arr)) return arr;
  return arr[Math.floor(Math.random() * arr.length)];
}

// Pausa
const delay = ms => new Promise(r => setTimeout(r, ms));

// JSON bonito para errores
function jsonformat(obj) {
  try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
}

//¿Es URL?
function isUrl(text) {
  return /^https?:\/\//i.test(text);
}

// Genera un nombre temporal único
function tmpName(ext = 'tmp') {
  return `${Date.now()}_${Math.floor(Math.random() * 1e6)}.${ext}`;
}

// Descarga un buffer desde una URL con node-fetch
async function fetchBuffer(url, options = {}) {
  const fetch = require('node-fetch');
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.buffer();
}

// Información de RAM/CPU
function systemInfo() {
  const ramTotal = os.totalmem();
  const ramFree = os.freemem();
  const ramUsed = ramTotal - ramFree;
  const cpuModel = (os.cpus()[0] && os.cpus()[0].model) || 'Desconocido';
  const cpuCores = os.cpus().length;
  return {
    ramTotal, ramFree, ramUsed,
    ramTotalGB: (ramTotal / 1024 / 1024 / 1024).toFixed(2),
    ramUsedGB: (ramUsed / 1024 / 1024 / 1024).toFixed(2),
    cpuModel, cpuCores,
    platform: os.platform(),
    uptime: process.uptime()
  };
}

// Ejecuta un comando shell y devuelve stdout
function exec(cmd) {
  return new Promise((resolve, reject) => {
    spawn('sh', ['-c', cmd], { stdio: ['ignore', 'pipe', 'pipe'] })
      .on('error', reject)
      .on('close', code => {
        if (code !== 0) return reject(new Error('exit code ' + code));
        resolve();
      });
  });
}

module.exports = {
  formatSize, runtime, clockString, pickRandom, delay,
  jsonformat, isUrl, tmpName, fetchBuffer, systemInfo, exec
};
