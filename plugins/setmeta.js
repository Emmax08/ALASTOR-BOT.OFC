// plugins/setmeta.js  (CommonJS)
// Personaliza el pack y autor de los stickers del usuario.
//   .setmeta Mi Pack | Autor
//   .setmeta Mi Pack
//   .setmeta | Solo Autor
//   .delmeta   (restablece al por defecto)
const fs = require('fs');
const path = require('path');
const { loadDatabase } = require('../lib/database.js');

const META_FILE = global.stickerMetaFile || path.join(process.cwd(), 'sticker_meta.json');

function ensureUser(senderNum) {
    if (!global.db || !global.db.data) loadDatabase();
    if (!global.db.data.users) global.db.data.users = {};
    if (!global.db.data.users[senderNum]) {
        global.db.data.users[senderNum] = {
            nombre: '', edad: 0, registrado: false, exp: 0, nivel: 0,
            limit: 25, premium: false, banned: false,
            meta: { packname: 'Alastor Radio', author: 'Alastor' }
        };
    }
    if (!global.db.data.users[senderNum].meta) {
        global.db.data.users[senderNum].meta = { packname: 'Alastor Radio', author: 'Alastor' };
    }
    return global.db.data.users[senderNum];
}

module.exports = {
    command: ['setmeta', 'delmeta', 'setpack', 'setautor'],
    execute: async (m, { conn, from, args, command, usedPrefix, senderNum }) => {
        try {
            const texto = (args || []).join(' ').trim();
            const cmd = (command || '').toLowerCase();

            if (cmd === 'delmeta') {
                const u = ensureUser(senderNum);
                u.meta = { packname: 'Alastor Radio', author: 'Alastor' };
                global.db.write();
                return conn.sendMessage(from, { text: '✅ Se restableció el pack y autor por defecto (*Alastor Radio* | *Alastor*).' }, { quoted: m });
            }

            if (!texto) {
                const prefix = usedPrefix || '.';
                return conn.sendMessage(from, {
                    text:
                        `⚠️ *Uso:* ${prefix}setmeta Nombre del Pack | Autor\n\n` +
                        `*Ejemplos:*\n` +
                        `• ${prefix}setmeta Alastor ofc | Emmax\n` +
                        `• ${prefix}setmeta Solo Pack\n` +
                        `• ${prefix}setmeta | Solo Autor`
                }, { quoted: m });
            }

            const separator = /[|\u2022]/;
            let packname = '', author = '';
            if (separator.test(texto)) {
                const [p = '', a = ''] = texto.split(separator);
                packname = p.trim(); author = a.trim();
            } else {
                packname = texto; author = '';
            }

            const u = ensureUser(senderNum);
            u.meta.packname = packname || 'Alastor Radio';
            u.meta.author = author || 'Alastor';
            global.db.write();

            // respaldo en sticker_meta.json por compatibilidad
            try {
                fs.writeFileSync(META_FILE, JSON.stringify({
                    packname: u.meta.packname, author: u.meta.author,
                    users: { [senderNum]: { packname: u.meta.packname, author: u.meta.author } }
                }, null, 2), 'utf8');
            } catch (e) {}

            await conn.sendMessage(from, {
                text:
                    `✅ *Metadatos guardados correctamente.*\n\n` +
                    `📦 *Pack:* ${u.meta.packname}\n` +
                    `✍️ *Autor:* ${u.meta.author}\n\n` +
                    `_Crea un sticker con .s para ver tu firma._`
            }, { quoted: m });
        } catch (error) {
            console.error('[setmeta] error:', error);
            await conn.sendMessage(from, { text: '❌ Ocurrió un error al guardar los metadatos.' }, { quoted: m });
        }
    }
};
