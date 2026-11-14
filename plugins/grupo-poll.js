// plugins/grupo-poll.js  (CommonJS)
// Crea una encuesta en el grupo.
//   .poll ¿Pregunta? | Opción 1, Opción 2, Opción 3
module.exports = {
    command: ['poll', 'encuesta', 'vote'],
    category: 'grupo',
    group: true,
    admin: true,
    botAdmin: true,
    execute: async (m, { conn, from, text, usedPrefix }) => {
        if (!text || !text.includes('|')) {
            return conn.sendMessage(from, {
                text: `📊 *Crea una encuesta.*\n*Uso:* ${usedPrefix}poll ¿Pregunta? | Opción 1, Opción 2, Opción 3`
            }, { quoted: m });
        }
        const [pregunta, opts] = text.split('|');
        const opciones = (opts || '').split(',').map(s => s.trim()).filter(Boolean);
        if (opciones.length < 2) {
            return conn.sendMessage(from, { text: '⚠️ Debes dar al menos 2 opciones separadas por comas.' }, { quoted: m });
        }
        try {
            await conn.sendMessage(from, {
                poll: {
                    name: pregunta.trim(),
                    values: opciones,
                    selectableCount: 1,
                    toEnc: 1
                }
            }, { quoted: m });
        } catch (error) {
            console.error('[poll] error:', error);
            await conn.sendMessage(from, { text: '⚠️ No pude crear la encuesta.' }, { quoted: m });
        }
    }
};
