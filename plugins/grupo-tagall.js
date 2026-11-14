// plugins/grupo-tagall.js  (CommonJS)
// Menciona a todos los miembros del grupo (visible).
module.exports = {
    command: ['tagall', 'invocar', 'todos', 'marcar'],
    category: 'grupo',
    group: true,
    admin: true,
    botAdmin: true,
    execute: async (m, { conn, from, text, participants, groupMetadata }) => {
        try {
            const grupo = groupMetadata && groupMetadata.subject ? groupMetadata.subject : 'Grupo';
            const ps = (participants || []).map(p => p.id).filter(Boolean);
            if (!ps.length) return conn.sendMessage(from, { text: '⚠️ No hay miembros para etiquetar.' }, { quoted: m });

            let txt = `📻 *INVOCACIÓN DEL ETER* 🎙️\n`;
            txt += `_grupo: ${grupo}_\n`;
            if (text) txt += `📝 *Mensaje:* ${text}\n`;
            txt += `\n`;
            txt += ps.map((id, i) => `@${id.split('@')[0]}`).join('  ');

            await conn.sendMessage(from, { text: txt, mentions: ps }, { quoted: m });
        } catch (error) {
            console.error('[tagall] error:', error);
            await conn.sendMessage(from, { text: '⚠️ No pude etiquetar a todos.' }, { quoted: m });
        }
    }
};
