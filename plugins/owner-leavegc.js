// plugins/owner-leavegc.js  (CommonJS)
// Hace que el bot abandone el grupo actual (sólo rowner).
module.exports = {
    command: ['leavegc', 'salirgrupo', 'leave', 'salir'],
    category: 'owner',
    rowner: true,
    group: true,
    execute: async (m, { conn, from }) => {
        try {
            await conn.sendMessage(from, { text: '👋 *El demonio se retira del estudio. ¡Hasta pronto, queridos!*' }, { quoted: m });
            await conn.groupLeave(from);
        } catch (error) {
            console.error('[leavegc] error:', error);
            await conn.sendMessage(from, { text: '⚠️ No pude salir del grupo.' }, { quoted: m });
        }
    }
};
