import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTransformation,
  checkDimensions,
  cleanName,
  detectImageFormat,
  isFormatAllowed,
  normalizePublicId,
} from './gallery.utils';
import { GALLERY_MAX_DIMENSION, GALLERY_MIN_DIMENSION, GALLERY_PRODUCT_MAX_WIDTH } from '../../constants';

const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(16)]);
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(16),
]);
const webp = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.from([0, 0, 0, 0]),
  Buffer.from('WEBP'),
  Buffer.alloc(8),
]);
const gif = Buffer.concat([Buffer.from('GIF89a'), Buffer.alloc(16)]);
const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>');

test('detecta el formato por los bytes de cabecera, no por la extensión', () => {
  assert.equal(detectImageFormat(jpeg), 'jpeg');
  assert.equal(detectImageFormat(png), 'png');
  assert.equal(detectImageFormat(webp), 'webp');
  assert.equal(detectImageFormat(gif), 'gif');
});

test('rechaza formatos que no son imágenes seguras', () => {
  assert.equal(detectImageFormat(svg), null);
  assert.equal(detectImageFormat(Buffer.from('no soy una imagen')), null);
  assert.equal(detectImageFormat(Buffer.alloc(0)), null);
});

test('el GIF solo se acepta en el carrusel', () => {
  assert.equal(isFormatAllowed('gif', 'banner'), true);
  assert.equal(isFormatAllowed('gif', 'product'), false);
  assert.equal(isFormatAllowed('webp', 'product'), true);
  assert.equal(isFormatAllowed(null, 'banner'), false);
});

test('limpia el nombre del archivo para usarlo como public_id', () => {
  assert.equal(cleanName('Foto de Hamburguesa.JPG'), 'Foto_de_Hamburguesa');
  assert.equal(cleanName('  ñandú  con  acento.png'), 'nandu_con_acento');
  assert.equal(cleanName('!!!.png'), 'imagen');
  assert.equal(cleanName(''), 'imagen');
});

test('normaliza el id recibido sin permitir navegación', () => {
  assert.equal(normalizePublicId('KOGO/foto'), 'KOGO/foto');
  assert.equal(normalizePublicId('KOGO%2Ffoto'), 'KOGO/foto');
  assert.equal(normalizePublicId('Veggie'), 'Veggie');
  assert.equal(normalizePublicId('../../etc/passwd'), 'etc/passwd');
  assert.equal(normalizePublicId(''), '');
  assert.equal(normalizePublicId('../..'), '');
});

test('valida la resolución por el lado mayor y no bloquea sin dimensiones', () => {
  assert.equal(checkDimensions(undefined, undefined).ok, true);
  assert.equal(checkDimensions(1200, 1000).ok, true);
  assert.equal(checkDimensions(GALLERY_MIN_DIMENSION, GALLERY_MIN_DIMENSION).ok, true);
  // Banner ancho y bajo: el lado menor es chico, pero el mayor no.
  assert.equal(checkDimensions(1600, 400).ok, true);

  const chica = checkDimensions(300, 200);
  assert.equal(chica.ok, false);

  const grande = checkDimensions(GALLERY_MAX_DIMENSION + 1, 1000);
  assert.equal(grande.ok, false);
});

test('la foto de producto se entrega en 6:5 sin recortar y acotada', () => {
  const product = buildTransformation('product');
  assert.equal(product.length, 3);
  assert.equal((product[0] as any).crop, 'pad');
  assert.equal((product[0] as any).aspect_ratio, '6:5');
  assert.equal((product[1] as any).crop, 'limit');
  assert.equal((product[1] as any).width, GALLERY_PRODUCT_MAX_WIDTH);
});

test('el banner mantiene su proporción y no se le aplica el pad de producto', () => {
  const banner = buildTransformation('banner');
  assert.equal(banner.length, 2);
  assert.equal((banner[0] as any).crop, 'limit');
  assert.equal((banner[0] as any).aspect_ratio, undefined);
});

test('un GIF animado se entrega sin transformar para no perder la animación', () => {
  assert.deepEqual(buildTransformation('banner', true), []);
  assert.deepEqual(buildTransformation('product', true), []);
});
