const fs = require('node:fs/promises');
const sharp = require('sharp');
const toIco = require('png-to-ico').default;
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const svg = path.join(root, 'assets/icons/app.svg');
const pngFile = path.join(root, 'assets/icons/app.png');
(async () => {
  const source = await fs.readFile(svg);
  await sharp(source).resize(1024, 1024).png().toFile(pngFile);
  const ico = await toIco(await sharp(source).resize(256, 256).png().toBuffer());
  await fs.writeFile(path.join(root, 'assets/icons/app.ico'), ico);
  const sizes = [16, 32, 64, 128, 256, 512, 1024];
  const codes = ['icp4', 'icp5', 'icp6', 'ic07', 'ic08', 'ic09', 'ic10'];
  const chunks = [];
  for (let i = 0; i < sizes.length; i++) {
    const png = await sharp(source).resize(sizes[i], sizes[i]).png().toBuffer();
    const header = Buffer.alloc(8); header.write(codes[i], 0, 4, 'ascii'); header.writeUInt32BE(png.length + 8, 4);
    chunks.push(header, png);
  }
  const body = Buffer.concat(chunks); const header = Buffer.alloc(8); header.write('icns', 0, 4, 'ascii'); header.writeUInt32BE(body.length + 8, 4);
  await fs.writeFile(path.join(root, 'assets/icons/app.icns'), Buffer.concat([header, body]));
})().catch((error) => { console.error(error); process.exitCode = 1; });
