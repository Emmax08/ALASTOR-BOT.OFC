// lib/uploadlmage.js  (CommonJS)
// Sube una imagen/archivo a un host (qu.ax) y devuelve la URL.
// Usa FormData/Blob globales de Node 18+ (no requiere formdata-node).
const fetch = require('node-fetch');
const { fileTypeFromBuffer } = require('file-type');

/**
 * @param {Buffer} buffer
 * @return {Promise<string>} URL pública del archivo subido
 */
async function uploadImage(buffer) {
  const detected = await fileTypeFromBuffer(buffer);
  const ext = (detected && detected.ext) || 'bin';
  const mime = (detected && detected.mime) || 'application/octet-stream';

  const form = new FormData();
  const blob = new Blob([buffer], { type: mime });
  form.append('files[]', blob, 'tmp.' + ext);

  const res = await fetch('https://qu.ax/upload.php', { method: 'POST', body: form });
  const result = await res.json();
  if (result && result.success && result.files && result.files[0]) {
    return result.files[0].url;
  }
  throw new Error('No se pudo subir el archivo a qu.ax');
}

module.exports = uploadImage;
module.exports.default = uploadImage;
