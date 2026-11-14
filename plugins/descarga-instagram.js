// plugins/descarga-instagram.js  (CommonJS)
// Descarga fotos/videos/Reels de Instagram.
const { instagram } = require('../lib/downloader.js');

module.exports = {
    command: ['ig', 'instagram', 'igdl', 'insta'],
    category: 'descargas',
    execute: async (m, { conn, from, args, usedPrefix, command }) => {
        const url = (args || [])[0];
        if (!url || !/^https?:\/\//i.test(url) || !/instagram/i.test(url)) {
            return conn.sendMessage(from, {
                text: `📸 *Necesito un enlace de Instagram válido.*\n*Ejemplo:* ${usedPrefix}${command} https://www.instagram.com/reel/...`
            }, { quoted: m });
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        try {
            const items = await instagram(url);
            for (const it of items) {
                if (/video/i.test(it.type || '')) {
                    await conn.sendMessage(from, { video: { url: it.url }, mimetype: 'video/mp4' }, { quoted: m });
                } else {
                    await conn.sendMessage(from, { image: { url: it.url } }, { quoted: m });
                }
            }
            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        } catch (error) {
            console.error('[instagram] error:', error);
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            await conn.sendMessage(from, { text: `⚠️ *ERROR:* ${error.message || 'No se pudo descargar.'}` }, { quoted: m });
        }
    }
};
