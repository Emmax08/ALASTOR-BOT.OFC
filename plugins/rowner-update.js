// plugins/rowner-update.js  (CommonJS)
// Actualiza el bot con git pull (sólo rowner).
// NOTA: se eliminó el token de GitHub hardcodeado del código original (exposición de credencial).
// Si el repo es privado, configura un remote con credenciales vía git externamente.
const { exec } = require('child_process');
const fs = require('fs');

module.exports = {
    command: ['update', 'actualizar'],
    rowner: true,
    execute: async (m, { conn, from }) => {
        const reply = (text) => conn.sendMessage(from, { text }, { quoted: m });

        await reply('🎙️ *¡Sintonizando la frecuencia del Hotel! Iniciando actualización...*');

        if (!fs.existsSync('.git')) {
            await reply('📻 *No hay un contrato firmado (.git). No puedo actualizar: inicializa el repositorio primero.*');
            return;
        }

        exec('git pull', (err, stdout, stderr) => {
            if (err) {
                return reply(`🎙️ *La señal está fallando:* ${err.message}\nIntenta manualmente con \`git pull\`.`);
            }
            if (stdout.includes('Already up to date') || stdout.includes('Ya está actualizado')) {
                return reply('📻 *¡Ja! Ya estamos en la cima de la frecuencia, nada nuevo que mostrar.*');
            }
            reply(`📻 *¡Transmisión completada con éxito! Mira todas estas delicias:*\n\n${stdout}\n\n*Reinicia el bot para aplicar los cambios.*`);
        });
    }
};
