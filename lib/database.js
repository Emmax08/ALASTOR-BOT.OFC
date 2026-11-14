// lib/database.js
// Base de datos JSON simple y robusta para Alastor Bot.
// Expone global.db = { data, write() } y global.loadDatabase().
// Compatible con los plugins existentes (global.db.data.users, global.db.data.chats, etc.)

const fs = require('fs');
const path = require('path');

const DB_FILE = global.databaseFile || './database.json';

function loadDatabase() {
  if (global.db && global.db.data) return global.db;

  let data = {};
  if (fs.existsSync(DB_FILE)) {
    try {
      data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
      console.error('[DB] JSON corrupto, empezando limpio:', e.message);
      data = {};
    }
  }

  // Estructura por defecto
  if (!data.users) data.users = {};
  if (!data.chats) data.chats = {};
  if (!data.groups) data.groups = {};
  if (!data.sticker) data.sticker = {};
  if (!data.settings) data.settings = {};
  if (!data.banned) data.banned = { users: [], chats: [] };

  global.db = {
    data,
    write() {
      try {
        // escritura atómica: escribe en .tmp y renombra
        const tmp = DB_FILE + '.tmp';
        fs.writeFileSync(tmp, JSON.stringify(global.db.data, null, 2));
        fs.renameSync(tmp, DB_FILE);
        return true;
      } catch (e) {
        console.error('[DB] Error al escribir:', e.message);
        return false;
      }
    },
    // helper para asegurar el objeto de usuario
    asegurarUsuario(jid) {
      const key = jid && jid.includes('@') ? jid.split('@')[0] : jid;
      if (!global.db.data.users[key]) {
        global.db.data.users[key] = {
          nombre: '',
          edad: 0,
          registrado: false,
          exp: 0,
          nivel: 0,
          limit: 25,
          premium: false,
          banned: false,
          meta: { packname: 'Alastor Radio', author: 'Alastor' }
        };
      }
      return global.db.data.users[key];
    }
  };

  // Guarda periódicamente (cada 60s) si hubo cambios
  if (!global._dbSaveTimer) {
    global._dbSaveTimer = setInterval(() => {
      if (global.db && global.db.write) {
        try { global.db.write(); } catch (e) {}
      }
    }, 60 * 1000);
  }

  return global.db;
}

// helper global usado por plugins de sticker: ¿está registrado?
function isRegistered(jid) {
  if (!global.db || !global.db.data) return false;
  const key = jid && jid.includes('@') ? jid.split('@')[0] : jid;
  const u = global.db.data.users[key];
  return !!(u && u.registrado);
}

module.exports = { loadDatabase, isRegistered };
