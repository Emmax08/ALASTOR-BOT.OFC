// plugins/bot-code.js  (CommonJS)
// Sub-Bot / Jadibot: genera un código de emparejamiento para vincular otro número.
const { db } = require('../src/database/db.js');
const { connectBot } = require('../lib/connection.js');

module.exports = {
    command: ['serbot', 'code', 'jadibot', 'fenixcode'],
    execute: async (m, { sock, from, args, senderNum, conn }) => {
        const num = (args[0] || senderNum || '').replace(/[^0-9]/g, '');
        if (!num) {
            return conn.sendMessage(from, {
                text: '🎙️ *¿A quién deseas vincular al Hotel?*\n\nResponde con un número o escribe:\n*Ejemplo:* .code 18255699594'
            }, { quoted: m });
        }

        // ¿Ya existe un sub-bot activo para ese número?
        let exists = false;
        try {
            const row = db.prepare('SELECT * FROM subbots WHERE jid = ?').get(num);
            exists = !!row;
        } catch (e) {}
        if (exists) {
            return conn.sendMessage(from, { text: `🔥 *¡Recluta!* Ya hay un motor activo para *${num}*.` }, { quoted: m });
        }

        const wait = await conn.sendMessage(from, {
            text: `⌛ *¡Cargando el combustible!* Preparando anomalía para *${num}*...`
        }, { quoted: m });

        try {
            await connectBot({
                basePath: global.alastorsubs,
                jid: num,
                isSub: true,
                pairingNumber: num,
                onCode: async (code) => {
                    const formatted = code.length >= 8 ? (code.slice(0, 4) + '-' + code.slice(4)) : code;
                    const tutorial =
                        `🔥 *¡¡ALASTOR SUB-BOT!!* 🔥\n\n` +
                        `*Instrucciones:* 🧨\n` +
                        `1️⃣ Ajustes > Dispositivos vinculados.\n` +
                        `2️⃣ Vincular con número de teléfono.\n` +
                        `3️⃣ Pon el código que te envío ahora.\n\n` +
                        `⚠️ Tienes 5 minutos para encender la mecha.`;
                    await sock.sendMessage(from, { text: tutorial, edit: wait.key });
                    await sock.sendMessage(from, { text: '```' + formatted + '```' }, { quoted: m });
                },
                onConnected: async () => {
                    try { db.prepare('INSERT OR REPLACE INTO subbots (jid, status) VALUES (?, ?)').run(num, 'online'); } catch (e) {}
                    await conn.sendMessage(from, { text: `🔥 *¡BIENVENIDO A LA FAMILIA!* Sub-bot *${num}* operando.` }, { quoted: m });
                }
            });
        } catch (e) {
            console.error('[bot-code] error:', e);
            await conn.sendMessage(from, { text: `⚠️ No pude iniciar el sub-bot: ${e.message || e}` }, { quoted: m });
        }
    }
};
