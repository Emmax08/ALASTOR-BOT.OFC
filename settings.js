const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { platform } = require('process');

// ===================== IDENTIDAD DEL BOT =====================
global.botname = 'Alastor';
global.authorBot = 'nevi-dev';
global.ownerName = 'Alastor Dev';
global.prefijoDefecto = ['.', '/', '#', '!'];
global.prefix = [...global.prefijoDefecto];

// ===================== DUEÑOS =====================
// rowner = Real Owner (dueño supremo, único que puede dar/delegar owner)
// owner  = Owner (puede usar comandos de dueño, pero no los exclusivos de rowner)
// Sustituye estos números por los tuyos. Formato: código de país + número, sin + ni espacios.
global.rowner = ['12892581751', '18096758983', '573135180876'];
global.owner  = ['12892581751', '12892581751', '573135180876'];

// ===================== MODERADORES / PREMIUM (opcional) =====================
global.mods = [];
global.prems = [];

// ===================== RUTAS =====================
global.alastorsessions = './alastor_sessions';
global.alastorsubs = './alastor_sub_sessions';
global.tmpDir = './tmp';
global.databaseFile = './database.json';   // base de datos JSON principal
global.stickerMetaFile = './sticker_meta.json';

// ===================== CONFIGURACIÓN DE APIs =====================
// Clave por defecto para las APIs de descarga (cámbiala o usa .env).
// Si una API deja de funcionar, sólo cambia estas variables.
global.APIs = {
  alyacore: 'https://api.alyacore.xyz',
  neoxr: 'https://api.neoxr.eu.org',
  apisNetlify: 'https://apis.netlify.app'
};
global.APIKeys = {
  alyacore: process.env.ALYA_API_KEY || 'Alya-IjpvW9oR',
  neoxr: process.env.NEOXR_API_KEY || 'tu_key_neoxr_aqui'
};

// Atajos para usar dentro de los plugins
global.alyaBase = global.APIs.alyacore;
global.alyaKey = global.APIKeys.alyacore;

// ===================== OPCIONES GLOBALES =====================
global.opts = { legacy: false };
global.multiplier = 1;       // multiplicador de XP (levelling)
global.autoread = false;     // leer mensajes automáticamente
global.autoadminToggle = false; // auto-promover al dueño al entrar a un grupo
global.restrict = true;      // restricciones activadas
global.selfMode = false;     // false = público (todos usan el bot), true = sólo dueño

// ===================== HELPERS GLOBALES PARA handler.js (ESM) =====================
global.__filename = function filename(pathURL, rmPrefix = platform !== 'win32') {
  const path_ = typeof pathURL === 'string' && pathURL.startsWith('file://')
    ? require('url').fileURLToPath(pathURL)
    : pathURL;
  return rmPrefix ? path_.substring(path.parse(path_).root.length) : path_;
};

global.__dirname = function dirname(pathURL) {
  const dirname_ = path.dirname(global.__filename(pathURL, false));
  return platform !== 'win32' ? dirname_.substring(path.parse(dirname_).root.length) : dirname_;
};

// ===================== BASE DE DATOS JSON (carga diferida) =====================
// Se inicializa en main.js con loadDatabase(). No sobrescribir aquí.
global.db = null;

// ===================== DICCIONARIO DE COMANDOS (lo llena el loader) =====================
global.plugins = global.plugins || {};
global.comando = '';

module.exports = { settings: global };
