// plugins/exec.js  (CommonJS)
// Ejecuta comandos de shell (sólo rowner). ¡Peligroso!
const { exec } = require('child_process');

module.exports = {
    command: ['$', 'exec', 'shell', 'term'],
    rowner: true,
    execute: async (m, { conn, from, text }) => {
        if (!text) {
            return conn.sendMessage(from, {
                text: '🎙️ *¡Vaya falta de iniciativa!*\n\n¿Quieres que mueva los hilos del sistema pero no me das órdenes? ¡Dime qué comando ejecutar!\n*Ejemplo:* $ ls -la'
            }, { quoted: m });
        }

        await conn.sendMessage(from, { react: { text: '⚙️', key: m.key } });

        exec(text, { timeout: 60000 }, async (error, stdout, stderr) => {
            let response = '📻 *TERMINAL DEL INFIERNO*\n\n';
            if (error) {
                response += '❌ *¡Zzzt... Error estático!*\n```\n' + (error.message || error) + '\n```';
                await conn.sendMessage(from, { react: { text: '💥', key: m.key } });
                return conn.sendMessage(from, { text: response }, { quoted: m });
            }
            if (stderr) response += '⚠️ *Advertencia en la sintonía:*\n```\n' + stderr + '\n```';
            if (stdout) response += '✅ *Resultado de la transmisión:*\n```\n' + (stdout.length > 3000 ? stdout.slice(0, 3000) + '\n... (truncado)' : stdout) + '\n```';
            else if (!stderr) response += '🎶 *¡Silencio absoluto! El comando se ejecutó sin dejar rastro.*';

            await conn.sendMessage(from, { react: { text: '🎙️', key: m.key } });
            await conn.sendMessage(from, { text: response }, { quoted: m });
        });
    }
};
