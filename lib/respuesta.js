// --- VALORES DE CANAL / RED (configurables) ---
const newsletterJid = '120363401893800327@newsletter';
const newsletterName = "Alastor Radio's Service";
const packname = 'Alastor Radio';
// FIX: antes se referenciaban `icons` y `redes` sin definir, lo que lanzaba ReferenceError.
const icons = 'https://i.imgur.com/0R1xEXt.jpeg'; // miniatura por defecto
const redes = 'https://wa.me/12892581751';        // enlace del dueño por defecto

/**
 * Plugin centralizado para manejar todos los mensajes de error de permisos.
 * @param {string} type - El tipo de error (ej. 'admin', 'owner', 'unreg').
 * @param {object} conn - La conexión del bot.
 * @param {object} m - El objeto del mensaje.
 * @param {string} comando - El nombre del comando que se intentó usar.
 */
const handler = (type, conn, m, comando) => {
    // Objeto con todos los posibles mensajes de error al puro estilo del Demonio de la Radio.
    const msg = {
        rowner: `『🎙️』 ¡Sintonía equivocada, querido! El comando *${comando}* le pertenece únicamente a mi creador supremo. ¡No me hagas borrar tu sonrisa! 📻💥`,
        owner: `『🎙️』 ¡Jajaja! Qué intento tan adorable, pero *${comando}* es un truco exclusivo del dueño de este espectáculo. ¡Sigue participando! 🦌✨`,
        mods: `『🎙️』 ¡Alto ahí! Las ondas de frecuencia para *${comando}* están reservadas solo para mis moderadores de confianza. ¡Buenas noches! 📻`,
        premium: `『🎙️』 ¡Vaya, qué decepción! Para usar *${comando}* necesitas un pase Premium. El talento no es gratis en este hotel, estimado. 🎟️🩸`,
        group: `『🎙️』 ¡Modulen sus frecuencias! El comando *${comando}* requiere de una audiencia completa. ¡Solo funciona en grupos! 👥🎙️`,
        private: `『🎙️』 ¡Qué atrevimiento! Este comando *${comando}* es para mi entretenimiento privado. ¡Regresa al escenario principal! 📢✖️`,
        admin: `『🎙️』 ¡Querido, te falta un poco de autoridad! Necesitas ser Administrador para ejecutar *${comando}*. ¿Dónde quedó tu estatus? 🤷‍♂️📻`,
        botAdmin: `『🎙️』 ¡Pero qué sarta de tonterías! ¿Cómo pretendes que ejecute *${comando}* si ni siquiera me has otorgado el rango de Administrador? ¡Hazlo ya! ⚡👹`,
        unreg: `『🎙️』 ¡Un pecador sin registrar! Qué absoluto descaro. Regístrate ahora mismo con el comando correspondiente o tendré que ofrecerte como el menú del día. 📝🥩`,
        restrict: `『🎙️』 ¡Oh, qué lástima! Esta transmisión ha sido saboteada. La función *${comando}* está desactivada... por ahora. ¡No pierdas la sonrisa! ⚙️🎙️`
    }[type];

    // Si se encontró un mensaje para el 'type' dado, se envía.
    if (msg) {
        // --- CONSTRUCCIÓN DEL CONTEXTINFO ---
        // Aquí se crea el objeto con la apariencia de reenviado de canal y el anuncio externo.
        const contextInfo = {
            mentionedJid: [m.sender],
            isForwarded: true,
            forwardingScore: 999,
            forwardedNewsletterMessageInfo: {
                newsletterJid,
                newsletterName,
                serverMessageId: -1
            },
            externalAdReply: {
                title: packname,
                body: '🌺 ¡Acceso Denegado! 🐦‍🔥',
                thumbnailUrl: icons,
                sourceUrl: redes,
                mediaType: 1,
                renderLargerThumbnail: false
            }
        };

        // Se envía el mensaje de error utilizando el contextInfo creado.
        return conn.reply(m.chat, msg, m, { contextInfo }).then(_ => m.react('✖️'));
    }
    return true; // Devuelve true si no hay mensaje, para seguir el flujo si es necesario.
};

// Exportamos la función para que handler.js la cargue con require()
module.exports = handler;
