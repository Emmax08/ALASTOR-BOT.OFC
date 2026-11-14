// plugins/owner-getfile.js  (CommonJS)
// Obtiene un archivo del servidor y lo envía como documento (sólo rowner).
//   .getfile ./package.json
const fs = require('fs');
const path = require('path');

module.exports = {
    command: ['getfile', 'gf', 'archivo', 'fetchfile'],
    category: 'owner',
    rowner: true,
    execute: async (m, { conn, from, text, usedPrefix }) => {
        if (!text) {
            return conn.sendMessage(from, { text: `📁 *Uso:* ${usedPrefix}getfile <ruta/al/archivo>` }, { quoted: m });
        }
        const filePath = path.resolve(text);
        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
            return conn.sendMessage(from, { text: '⚠️ El archivo no existe: ' + filePath }, { quoted: m });
        }
        try {
            const buffer = fs.readFileSync(filePath);
            const name = path.basename(filePath);
            await conn.sendMessage(from, {
                document: buffer,
                fileName: name,
                mimetype: 'application/octet-stream'
            }, { quoted: m });
        } catch (error) {
            console.error('[getfile] error:', error);
            await conn.sendMessage(from, { text: '⚠️ No pude leer el archivo: ' + error.message }, { quoted: m });
        }
    }
};
