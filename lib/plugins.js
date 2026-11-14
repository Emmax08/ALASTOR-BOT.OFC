// lib/plugins.js
// Cargador de plugins (CommonJS). Todos los plugins deben usar module.exports.
// Un plugin se desactiva renombrándolo para que empiece con '_' o poniendo `disabled: true`.
const { readdirSync } = require('fs');
const { join } = require('path');
const chalk = require('chalk');

global.plugins = global.plugins || {};

async function loadPlugins() {
    const pluginsFolder = join(__dirname, '../plugins');
    let files;

    try {
        files = readdirSync(pluginsFolder).filter(f => f.endsWith('.js') && !f.startsWith('_'));
        files.sort();
    } catch (err) {
        console.log(chalk.redBright(`❌ Error leyendo la carpeta de plugins: ${pluginsFolder}`), err);
        return;
    }

    let cargados = 0, fallidos = 0;

    for (let file of files) {
        const filePath = join(pluginsFolder, file);
        try {
            // Limpiar caché para permitir recargas en vivo
            delete require.cache[require.resolve(filePath)];
            const plugin = require(filePath);

            // Soporta tanto `module.exports = { execute, command }` como
            // `module.exports = function` (con .command adjunto)
            const real = plugin && typeof plugin === 'function' ? plugin : plugin;
            real.name = real.name || file.replace(/\.js$/, '');

            global.plugins[file] = real;
            cargados++;
            const cmds = Array.isArray(real.command) ? real.command.join(', ') : (real.command || '—');
            console.log(chalk.greenBright(`✨ [CARGADO] -> ${file}  `) + chalk.gray(`(${cmds})`));
        } catch (e) {
            fallidos++;
            console.log(chalk.redBright(`❌ No se pudo cargar el plugin "${file}": ${e?.message || e}`));
        }
    }

    console.log(chalk.bgRed.white.bold(` 📻 ${cargados} plugin(s) cargado(s), ${fallidos} fallido(s) `));
}

module.exports = { loadPlugins };
