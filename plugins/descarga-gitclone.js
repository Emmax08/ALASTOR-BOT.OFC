// plugins/descarga-gitclone.js  (CommonJS)
// Descarga un repositorio de GitHub como archivo .zip y lo envía.
const { gitClone } = require('../lib/downloader.js');
const { fetchBuffer } = require('../lib/myfunc.js');
const https = require('https');

function fetchRedirect(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchRedirect(res.headers.location));
      }
      resolve({ url, res });
    }).on('error', reject);
  });
}

module.exports = {
    command: ['gitclone', 'github', 'repo', 'clonar'],
    category: 'descargas',
    execute: async (m, { conn, from, args, usedPrefix, command }) => {
        const url = (args || [])[0];
        if (!url) {
            return conn.sendMessage(from, {
                text: `🐙 *Clona un repositorio de GitHub.*\n*Ejemplo:* ${usedPrefix}${command} https://github.com/usuario/repo`
            }, { quoted: m });
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        try {
            const info = await gitClone(url);
            await conn.sendMessage(from, { text: `🐙 *Clonando:* ${info.repo}\n⌛ Descargando .zip...` }, { quoted: m });

            // Probar rama main, luego master.
            let zipUrl = info.zipUrl;
            let buffer;
            try {
                buffer = await fetchBuffer(zipUrl);
            } catch (e) {
                zipUrl = `https://github.com/${info.repo}/archive/refs/heads/master.zip`;
                buffer = await fetchBuffer(zipUrl);
            }

            await conn.sendMessage(from, {
                document: buffer,
                fileName: `${info.name}.zip`,
                mimetype: 'application/zip'
            }, { quoted: m });

            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        } catch (error) {
            console.error('[gitclone] error:', error);
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            await conn.sendMessage(from, { text: `⚠️ *ERROR:* ${error.message || 'No se pudo clonar el repo.'}` }, { quoted: m });
        }
    }
};
