// plugins/bot-subs.js  (CommonJS)
// Lista los sub-bots activos.
const { db } = require('../src/database/db.js');

module.exports = {
    command: ['bots', 'listbots', 'subbots'],
    execute: async (m, { conn, from }) => {
        let activeSubs = [];
        try { activeSubs = db.prepare('SELECT jid FROM subbots').all(); } catch (e) {}
        const totalSubs = activeSubs.length;

        const memoryUsed = process.memoryUsage().rss / 1024 / 1024;
        const ramPerBot = (memoryUsed / (totalSubs + 1)).toFixed(2);

        let report = '🎙️ *¡SINTONIZANDO EL SHOW DE ALASTOR!* 🎙️\n\n';
        report += `📻 *Anfitrión Principal:* ¡En el aire y con una sonrisa!\n`;
        report += `👥 *Almas Vinculadas:* ${totalSubs}\n`;
        report += `📉 *Consumo de Energía:* ${memoryUsed.toFixed(2)} MB\n`;
        report += `⚡ *Costo por Pecador:* ${ramPerBot} MB\n\n`;

        if (totalSubs > 0) {
            report += `📜 *NUESTROS INVITADOS DE HONOR:*\n`;
            activeSubs.forEach((bot, i) => {
                report += `🎙️ [${i + 1}] wa.me/${String(bot.jid).split('@')[0]}\n`;
            });
            report += `\n_¡Qué entretenimiento tan... exquisito!_`;
        } else {
            report += `*¡Qué decepción! El escenario está vacío. No hay sub-bots para el espectáculo.*\n\nUsa *.code <número>* para vincular uno.`;
        }

        await conn.sendMessage(from, { text: report }, { quoted: m });
    }
};
