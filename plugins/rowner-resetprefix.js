// plugins/rowner-resetprefix.js  (CommonJS)
// Restablece los prefijos a los originales (sólo rowner).
module.exports = {
    command: ['resetprefix', 'resetearprefijos', 'rprefix'],
    rowner: true,
    execute: async (m) => {
        global.prefix = [...(global.prefijoDefecto || ['.', '/', '#', '!'])];
        await m.reply(`🎼 *¡El show vuelve a sus raíces! La sintonía ha regresado a los prefijos originales:* [ ${global.prefix.join(' ')} ]`);
    }
};
