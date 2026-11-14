// plugins/descarga-pinterest.js  (CommonJS)
// Busca imágenes en Pinterest y las envía (álbum o una por una).
const { pinterest } = require('../lib/downloader.js');

module.exports = {
    command: ['pin', 'pinterest', 'pinterestsearch', 'psearch', 'dpin'],
    execute: async (m, { conn, from, args, usedPrefix, command }) => {
        const query = (args || []).join(' ').trim();
        if (!query) {
            return conn.sendMessage(from, {
                text: `🎨 *Ingresa un término de búsqueda.*\n*Ejemplo:* ${usedPrefix}${command} alastor hazbin`
            }, { quoted: m });
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        try {
            const images = await pinterest(query, 8);
            if (!images.length) throw new Error('No se obtuvieron imágenes.');

            // álbum
            const album = images.map(url => ({ image: { url } }));
            await conn.sendMessage(from, {
                caption: `🎨 *Resultados Pinterest para: "${query}"*`,
                album
            }, { quoted: m }).catch(async () => {
                // fallback: enviar una por una
                for (const url of images) {
                    await conn.sendMessage(from, { image: { url } }, { quoted: m });
                }
            });

            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        } catch (error) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            await conn.sendMessage(from, { text: `⚠️ *ERROR:* ${error.message}` }, { quoted: m });
        }
    }
};
