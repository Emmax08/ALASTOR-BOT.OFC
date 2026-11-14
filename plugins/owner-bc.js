// plugins/owner-bc.js  (CommonJS)
// Broadcast: envía un mensaje a todos los chats (sólo rowner).
const { runtime } = require('../lib/myfunc.js');

module.exports = {
    command: ['bc', 'broadcast', 'anuncio', 'transmision'],
    category: 'owner',
    rowner: true,
    execute: async (m, { conn, from, text, args, command, usedPrefix }) => {
        if (!text) {
            return conn.sendMessage(from, { text: `📢 *Uso:* ${usedPrefix}${command} <mensaje a transmitir>` }, { quoted: m });
        }

        await conn.sendMessage(from, { text: `📢 *Iniciando transmisión a todos los chats...*` }, { quoted: m });

        const chats = Object.entries(conn.chats || {}).filter(([jid]) => jid.endsWith('@s.whatsapp.net') || jid.endsWith('@g.us'));
        let enviados = 0, fallidos = 0;
        const msg =
            `📻 *TRANSMISIÓN DE ALASTOR RADIO* 🎙️\n\n` +
            `${text}\n\n` +
            `_Mensaje oficial del dueño del bot._`;

        for (const [jid] of chats) {
            try {
                await conn.sendMessage(jid, { text: msg });
                enviados++;
                // pausa breve para no saturar
                await new Promise(r => setTimeout(r, 800));
            } catch (e) {
                fallidos++;
            }
        }

        await conn.sendMessage(from, {
            text: `✅ *Transmisión finalizada.*\n\n📨 Enviados: ${enviados}\n❌ Fallidos: ${fallidos}\n📊 Total chats: ${chats.length}`
        }, { quoted: m });
    }
};
