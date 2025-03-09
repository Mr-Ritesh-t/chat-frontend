const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const SVG_PATH = path.join(PUBLIC_DIR, 'chat-icon.svg');

async function generateIcons() {
  try {
    const svgBuffer = fs.readFileSync(SVG_PATH);

    // Generate favicon sizes
    const faviconSizes = [16, 32, 48];
    for (const size of faviconSizes) {
      await sharp(svgBuffer)
        .resize(size, size)
        .toFormat('png')
        .toFile(path.join(PUBLIC_DIR, `favicon-${size}.png`));
    }

    // Generate app icons
    const appIconSizes = [192, 512];
    for (const size of appIconSizes) {
      await sharp(svgBuffer)
        .resize(size, size)
        .toFormat('png')
        .toFile(path.join(PUBLIC_DIR, `logo${size}.png`));
    }

    console.log('✅ Icons generated successfully!');
    console.log('⚠️ Please use a tool like https://www.favicon-generator.org/ to convert the favicon-*.png files to favicon.ico');
  } catch (error) {
    console.error('❌ Error generating icons:', error);
  }
}

generateIcons(); 