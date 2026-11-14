// plugins/descarga-facebook.js  (CommonJS)
// Descarga videos de Facebook.
const { facebook } = require('../lib/downloader.js');

module.exports = {
    command: ['fb', 'facebook', 'fbdl', 'mp4'],
    category: 'descargas',
    execute: async (m, { conn, from, args, usedPrefix, command }) => {
        const url = (args || [])[0];
        if (!url || !/^https?:\/\//i.test(url) || !/facebook|fb\.watch/i.test(url)) {
            return conn.sendMessage(from, {
                text: `📘 *Necesito un enlace de Facebook válido.*\n*Ejemplo:* ${usedPrefix}${command} https://www.facebook.com/.../videos/...`
            }, { quoted: m });
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        try {
            const d = await facebook(url);
            await conn.sendMessage(from, {
                video: { url: d.url },
                mimetype: 'video/mp4',
                caption: `📘 *${d.title}*\n\n_Alastor Radio_`
            }, { quoted: m });
            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        } catch (error) {
            console.error('[facebook] error:', error);
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            await conn.sendMessage(from, { text: `⚠️ *ERROR:* ${error.message || 'No se pudo descargar.'}` }, { quoted: m });
        }
    }
};
