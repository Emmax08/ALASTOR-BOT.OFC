// plugins/rowner-darowner.js  (CommonJS)
// Otorga permisos de owner/rowner a otro número (sólo rowner).
module.exports = {
    command: ['addowner', 'addrowner', 'darpermisos'],
    rowner: true,
    execute: async (m, { conn, from, who, text }) => {
        let target = who || (text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);
        if (!target) {
            return conn.sendMessage(from, {
                text: '📻 *¿A quién pretendes otorgar tal privilegio?* Menciona a alguien o escribe su número, querido.'
            }, { quoted: m });
        }
        const number = String(target).split('@')[0];

        if (global.owner.includes(number) && global.rowner.includes(number)) {
            return conn.sendMessage(from, {
                text: '🎙️ *¡Ja! Ese individuo ya tiene un asiento en la primera fila del infierno. Ya es un dueño.*'
            }, { quoted: m });
        }

        if (!global.owner.includes(number)) global.owner.push(number);
        if (!global.rowner.includes(number)) global.rowner.push(number);

        await conn.sendMessage(from, {
            text: `🎼 *¡Atención a todos los presentes!*\n\n@${number} *ha firmado un contrato de exclusividad. Ahora goza de privilegios de Dueño y Real Owner.*`,
            mentions: [target]
        }, { quoted: m });
    }
};
