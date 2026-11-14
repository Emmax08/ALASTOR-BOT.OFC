// plugins/autoadmin.js  (CommonJS)
// El dueño se auto-da admin en el grupo al instante (rowner + grupo + bot admin).
//   .autoadmin (toggle) está en owner-toggle.js
module.exports = {
    command: ['dameadmin', 'dameadm', 'promoteme', 'autoadminme'],
    group: true,
    botAdmin: true,
    rowner: true,
    execute: async (m, { conn, from, sender }) => {
        try {
            await conn.sendMessage(from, { react: { text: '⚡', key: m.key } });
            await conn.groupParticipantsUpdate(from, [sender], 'promote');
            await conn.sendMessage(from, {
                text: '⚡ *RADIO ALASTOR: ACCESO TOTAL*\n\nTe he devuelto tus privilegios de administrador, jefe.'
            }, { quoted: m });
        } catch (error) {
            console.error('[autoadmin] error:', error);
            await conn.sendMessage(from, {
                text: '⚠️ *INTERFERENCIA:* No pude darte admin. Asegúrate de que yo sea administrador primero.'
            }, { quoted: m });
        }
    }
};
