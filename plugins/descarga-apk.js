// plugins/descarga-apk.js  (CommonJS)
// Descarga APK desde ApkPure / repositorio configurado.
const { apkpure } = require('../lib/downloader.js');
const { fetchBuffer } = require('../lib/myfunc.js');

module.exports = {
    command: ['apk', 'apkpure', 'apkdl'],
    category: 'descargas',
    execute: async (m, { conn, from, args, usedPrefix, command }) => {
        const query = (args || []).join(' ').trim();
        if (!query) {
            return conn.sendMessage(from, {
                text: `📦 *¿Qué APK buscas, querido?*\n*Ejemplo:* ${usedPrefix}${command} whatsapp`
            }, { quoted: m });
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        try {
            const d = await apkpure(query);
            await conn.sendMessage(from, { text: `📦 *APK:* ${d.title}\n⌛ Descargando...` }, { quoted: m });

            const buffer = await fetchBuffer(d.url);
            await conn.sendMessage(from, {
                document: buffer,
                fileName: `${d.name}.apk`,
                mimetype: 'application/vnd.android.package-archive'
            }, { quoted: m });

            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        } catch (error) {
            console.error('[apk] error:', error);
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            await conn.sendMessage(from, { text: `⚠️ *ERROR:* ${error.message || 'No se encontró el APK.'}` }, { quoted: m });
        }
    }
};
