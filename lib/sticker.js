// lib/sticker.js  (CommonJS)
// Helper de stickers: crea stickers (imagen/video/gif) con pack/author usando
// wa-sticker-formatter, e inyecta metadatos EXIF con node-webpmux.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');
const { promisify } = require('util');
const fetch = require('node-fetch');
const { fileTypeFromBuffer } = require('file-type');

const execFileAsync = promisify(execFile);
const TMP = () => global.tmpDir || './tmp';

async function bufferFrom(img, url) {
  if (url) {
    const res = await fetch(url);
    if (res.status !== 200) throw new Error(`HTTP ${res.status} al descargar la imagen`);
    return await res.buffer();
  }
  return img;
}

// Crea un sticker con wa-sticker-formatter.
// type: 'default' (contiene, fondo transparente) o 'crop' (recorta al centro 1:1) o 'full'
async function makeSticker(buffer, { pack = 'Alastor Radio', author = 'Alastor', type = 'default' } = {}) {
  const { Sticker, StickerTypes } = require('wa-sticker-formatter');
  const stickerType = type === 'crop' ? StickerTypes.CROP : type === 'full' ? StickerTypes.FULL : StickerTypes.DEFAULT;
  return await new Sticker(buffer, {
    pack, author,
    type: stickerType,
    categories: ['🍂'],
    id: crypto.randomBytes(16).toString('hex')
  }).toBuffer();
}

// Convierte cualquier media (video/gif) a webp 512x512 con ffmpeg.
async function toWebp(buffer) {
  const id = `stk_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const input = path.join(TMP(), `${id}.bin`);
  const output = path.join(TMP(), `${id}.webp`);
  fs.writeFileSync(input, buffer);
  try {
    await execFileAsync('ffmpeg', [
      '-y', '-i', input,
      '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0.0,fps=15',
      '-c:v', 'libwebp', '-preset', 'default', '-an', '-f', 'webp', output
    ]);
    return fs.readFileSync(output);
  } finally {
    try { fs.unlinkSync(input); } catch (e) {}
    try { fs.unlinkSync(output); } catch (e) {}
  }
}

// Inyecta EXIF (pack/author) en un webp usando node-webpmux.
async function addExif(webpBuffer, pack = 'Alastor Radio', author = 'Alastor', categories = ['🍂']) {
  try {
    const webp = require('node-webpmux');
    const img = new webp.Image();
    const stickerPackId = crypto.randomBytes(32).toString('hex');
    const json = {
      'sticker-pack-id': stickerPackId,
      'sticker-pack-name': pack,
      'sticker-pack-publisher': author,
      'android-app-store-link': 'https://play.google.com/store/apps/details?id=com.marsvard.stickermakerforwhatsapp',
      'ios-app-store-link': 'https://itunes.apple.com/app/sticker-maker-studio/id1443326857',
      'emojis': categories
    };
    const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
    const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
    const exif = Buffer.concat([exifAttr, jsonBuffer]);
    exif.writeUIntLE(jsonBuffer.length, 14, 4);
    await img.load(webpBuffer);
    img.exif = exif;
    return await img.save(null);
  } catch (e) {
    console.error('[sticker] addExif falló (¿sin node-webpmux?):', e.message);
    return webpBuffer;
  }
}

// Función principal: dado un buffer o url, produce un sticker webp con EXIF.
async function sticker(img, url, packname = 'Alastor Radio', author = 'Alastor', isSquare = false) {
  const buffer = await bufferFrom(img, url);
  if (!buffer) throw new Error('Sin buffer de media para el sticker');

  const type = await fileTypeFromBuffer(buffer);
  const mime = (type && type.mime) || '';

  let webpBuffer;
  if (/video|gif/i.test(mime)) {
    const webp = await toWebp(buffer);
    webpBuffer = await makeSticker(webp, { pack: packname, author, type: isSquare ? 'crop' : 'default' });
  } else {
    webpBuffer = await makeSticker(buffer, { pack: packname, author, type: isSquare ? 'crop' : 'default' });
  }
  return webpBuffer;
}

module.exports = { sticker, makeSticker, toWebp, addExif };
