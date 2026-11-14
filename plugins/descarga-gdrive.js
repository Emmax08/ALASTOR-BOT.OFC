// plugins/descarga-gdrive.js  (CommonJS)
// Descarga archivos de Google Drive.
const { gdrive } = require('../lib/downloader.js');
const { fetchBuffer } = require('../lib/myfunc.js');

module.exports = {
    command: ['gdrive', 'gdr', 'drive', 'googledrive'],
    category: 'descargas',
    execute: async (m, { conn, from, args, usedPrefix, command }) => {
        const url = (args || [])[0];
        if (!url || !/^https?:\/\//i.test(url) || !/drive\.google|docs\.google/i.test(url)) {
            return conn.sendMessage(from, {
                text: `📁 *Necesito un enlace de Google Drive válido.*\n*Ejemplo:* ${usedPrefix}${command} https://drive.google.com/file/d/XXXX/view`
            }, { quoted: m });
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        try {
            const d = await gdrive(url);
            await conn.sendMessage(from, { text: `📁 *DRIVE*\n\n📄 ${d.title}\n💾 ${d.size}\n\n⌛ Descargando...` }, { quoted: m });

            const buffer = await fetchBuffer(d.url);
            await conn.sendMessage(from, {
                document: buffer,
                fileName: d.filename,
                mimetype: d.mime
            }, { quoted: m });

            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        } catch (error) {
            console.error('[gdrive] error:', error);
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            await conn.sendMessage(from, { text: `⚠️ *ERROR:* ${error.message || 'No se pudo descargar de Drive.'}` }, { quoted: m });
        }
    }
};
