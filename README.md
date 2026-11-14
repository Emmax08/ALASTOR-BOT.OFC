# 🎙️ ALASTOR BOT (v2.0)

Bot de WhatsApp basado en **Baileys** (`@whiskeysockets/baileys`) con sistema de plugins en **CommonJS**, descargas, stickers, administración de grupos y comandos exclusivos del dueño.

> *"¡Es un placer conocerte, querido!"* — Alastor, el Demonio de la Radio.

---

## 📦 Requisitos

- **Node.js 18+** (recomendado 20+)
- **ffmpeg** instalado en el sistema (para stickers de video y conversión de audio)
- **git** (para clonar el repo de baileys)
- Un teléfono con WhatsApp (para vincular el bot)

### Instalar ffmpeg (si no lo tienes)

```bash
# Ubuntu / Debian
sudo apt update && sudo apt install -y ffmpeg

# Termux
pkg install ffmpeg

# Windows: descarga desde https://ffmpeg.org y añádelo al PATH
```

---

## 🚀 Instalación

```bash
# 1. Descomprime el proyecto y entra a la carpeta
cd ALASTOR-BOT.OFC

# 2. Instala las dependencias
npm install
# (baileys se instala desde github: si falla, vuelve a intentarlo o usa tu propio fork)

# 3. Configura tus números de dueño
#    Edita settings.js -> global.rowner y global.owner con TU número (formato: código país + número, sin +)

# 4. (Opcional) configura tu API de descargas
cp .env.example .env
#    Edita .env con tu API key

# 5. Arranca el bot
npm start
#    o: node main.js
```

La primera vez te pedirá elegir entre **Código QR** o **Pairing Code** para vincular WhatsApp.

---

## ⚙️ Configuración (settings.js)

| Variable | Descripción |
|---|---|
| `global.rowner` | Lista de números del dueño supremo (puede usar TODO, incluido dar/quitar owner) |
| `global.owner` | Lista de owners (pueden usar comandos de dueño) |
| `global.prefix` | Prefijos del bot (por defecto `. / # !`) |
| `global.botname` | Nombre del bot |
| `global.APIKeys.alyacore` | API key para las descargas (TikTok, Facebook, Instagram, etc.) |
| `global.selfMode` | `false` = público, `true` = sólo el dueño usa el bot |
| `global.autoread` | `true` = lee mensajes automáticamente |

---

## 🔐 Restricciones conectadas al Handler

Cada plugin declara restricciones y el **Handler las hace cumplir automáticamente** (no hace falta comprobarlas dentro del comando):

| Flag | Quién puede usarlo |
|---|---|
| `rowner: true` | Sólo el dueño supremo (`global.rowner`) |
| `owner: true` | Owners (`global.owner`) |
| `admin: true` | Administradores del grupo |
| `botAdmin: true` | Requiere que el bot sea admin del grupo |
| `group: true` | Sólo en grupos |
| `private: true` | Sólo en privado |
| `register: true` | Sólo usuarios registrados (`.reg`) |
| `premium: true` | Sólo usuarios premium |
| `restrict: true` | Sólo si `global.restrict` está activado |

Ejemplo de plugin con restricción:
```js
module.exports = {
    command: ['setbotname'],
    rowner: true,        // <-- el Handler bloquea a quien no sea rowner
    execute: async (m, { conn, from, text }) => { /* ... */ }
};
```

---

## 🧩 Comandos disponibles (195 comandos / 49 plugins)

Usa `.menu` dentro de WhatsApp para ver el menú completo y actualizado. Resumen por categoría:

### 📻 Información
`.menu` `.ping` `.status`

### 📝 Registro
`.reg <nombre> <edad>` `.unreg`

### 🎵 Música / YouTube
`.play <nombre>` `.yta <url>` `.ytv <url>` `.spotify <nombre>` `.spotifys <nombre>` `.video <nombre>`

### 🎨 Stickers
`.s` (responde a imagen/video) `.s Mi Pack | Autor` `.s2` (recorta 1:1) `.setmeta Pack | Autor` `.delmeta`

### 📥 Descargas
`.tiktok <url>` `.fb <url>` `.ig <url>` `.tw <url>` `.mediafire <url>` `.gdrive <url>` `.gitclone <url>` `.apk <nombre>` `.pin <búsqueda>`

### 👥 Administración de grupos
`.open` `.close` `.kick` `.promote` `.demote` `.dameadmin` `.link` `.revokelink` `.setname` `.setdesc` `.setppgc` `.tagall` `.hidetag` `.infogroup` `.add` `.delete` `.poll`

### 🤖 Sub-Bots (Jadibot)
`.code <número>` `.bots`

### 👑 Comandos del dueño (rowner)
`.setbotname` `.setpp` `.setbio` `.bc` `.mode` `.autoread` `.autoadmin` `.restrict` `.ban` `.unban` `.banchat` `.leavegc` `.getfile` `.setprefix` `.resetprefix` `.addowner` `.exec` `.restart` `.update`

---

## 📁 Estructura

```
ALASTOR-BOT.OFC/
├── main.js                  # Punto de entrada (CJS)
├── settings.js              # Configuración global
├── package.json
├── src/
│   ├── handler.js           # Núcleo: despacha + aplica restricciones
│   └── database/db.js       # Auth state SQLite + tabla subbots
├── lib/
│   ├── connection.js        # Conexión Baileys (QR / pairing code)
│   ├── simple.js            # Serialización de mensajes (m.reply, m.chat, ...)
│   ├── store.js             # Almacenamiento de chats
│   ├── plugins.js           # Cargador de plugins
│   ├── database.js          # DB JSON global (global.db)
│   ├── respuesta.js         # Mensajes de error de permisos (dfail)
│   ├── downloader.js        # Helper unificado de descargas
│   ├── myfunc.js            # Utilidades (runtime, formatSize, ...)
│   ├── converter.js         # ffmpeg (audio/video)
│   ├── sticker.js           # Helper de stickers
│   ├── exif.js              # EXIF para stickers
│   ├── youtobedl.js         # Descarga de YouTube (ogmp3)
│   └── ...
└── plugins/                 # 49 plugins de comandos
    ├── menu.js
    ├── info-ping.js
    ├── sticker2.js
    ├── play.js
    ├── ytdl.js
    ├── descarga-*.js
    ├── grupo-*.js
    ├── owner-*.js
    └── ...
```

---

## ➕ Crear un plugin nuevo

Crea un archivo `.js` en `plugins/`. Ejemplo:

```js
// plugins/mi-comando.js
module.exports = {
    command: ['hola', 'hello'],
    category: 'info',           // opcional: info, descargas, musica, stickers, grupo, owner, ...
    group: false,               // true = sólo grupos
    owner: false,               // true = sólo dueño
    execute: async (m, { conn, from, text, args, senderNum, isOwner }) => {
        await conn.sendMessage(from, { text: '¡Hola, ' + (m.pushName || 'querido') + '!' }, { quoted: m });
    }
};
```

El cargador lo detecta automáticamente al reiniciar (o recarga en vivo si cambias un plugin existente).

### Contexto que recibe `execute(m, ctx)`

`ctx` incluye: `conn` (socket), `sock`, `from`, `isGroup`, `sender`, `senderNum`, `botNumber`, `pushName`, `isOwner`, `isROwner`, `isMod`, `isPremium`, `who` (usuario objetivo), `participants`, `groupMetadata`, `isAdmin`, `isBotAdmin`, `mentionedJid`, `quoted`, `args`, `text`, `command`, `usedPrefix`, `db`.

---

## 🛠️ Solución de problemas

- **No responde a comandos**: revisa que el prefijo sea correcto (`.menu`) y que tu número esté en `global.rowner`/`global.owner`.
- **Las descargas fallan**: la API de descargas puede estar caída. Cambia `global.APIs` y `global.APIKeys` en `settings.js` o usa variables de entorno en `.env`.
- **Stickers de video no funcionan**: instala `ffmpeg`.
- **`Cannot find module '@whiskeysockets/baileys'`**: corre `npm install` de nuevo (viene de github).
- **Sesión corrupta**: borra la carpeta `alastor_sessions/` y vuelve a vincular.

---

## ⚠️ Aviso

Este bot es para uso personal/educativo. No uses las funciones de descarga para infringir derechos de autor. Respeta los Términos de Servicio de WhatsApp.

El token de GitHub que estaba hardcodeado en el `rowner-update.js` original **fue eliminado** por seguridad: ahora usa `git pull` sin credenciales. Si tu repo es privado, configura el remote con tus credenciales fuera del código.
