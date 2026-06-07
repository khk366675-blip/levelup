import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const EFFECTS_DIR = 'src/assets/effects';
const files = [
  'effect-physical-slash.png',
  'effect-physical-strike.png',
  'effect-physical-pierce.png',
  'effect-fire-slash.png',
  'effect-fire-strike.png',
  'effect-fire-burst.png',
  'effect-ice-strike.png',
  'effect-ice-burst.png',
  'effect-ice-pierce.png',
  'effect-lightning-slash.png',
  'effect-lightning-strike.png',
  'effect-lightning-burst.png',
  'effect-dark-slash.png',
  'effect-dark-burst.png',
  'effect-dark-aura.png',
  'effect-holy-aura.png',
  'effect-holy-heal.png',
  'effect-holy-strike.png',
  'effect-space-burst.png',
  'effect-space-strike.png'
];

async function processEffects() {
  console.log('Starting transparency processing for effect images...');

  for (const filename of files) {
    const filePath = path.join(EFFECTS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      continue;
    }

    console.log(`Processing: ${filePath}`);
    
    // Read the image metadata and raw pixel buffer
    const image = sharp(filePath);
    const { info, data } = await image.raw().toBuffer({ resolveWithObject: true });
    
    const width = info.width;
    const height = info.height;
    const channels = info.channels; // Expecting 3 (RGB) or 4 (RGBA)
    
    const outputBuffer = Buffer.alloc(width * height * 4); // Output is always RGBA (4 channels)
    
    for (let i = 0; i < width * height; i++) {
      const srcOffset = i * channels;
      const destOffset = i * 4;
      
      const r = data[srcOffset];
      const g = data[srcOffset + 1];
      const b = data[srcOffset + 2];
      
      // Calculate max value of RGB to serve as base alpha
      const maxVal = Math.max(r, g, b);
      
      // If color is very dark, make it completely transparent
      let alpha = maxVal;
      if (alpha < 10) {
        alpha = 0;
      } else {
        // Boost alpha slightly to keep the semi-transparent glow visible
        alpha = Math.min(255, Math.round(alpha * 1.3));
      }
      
      let newR = r;
      let newG = g;
      let newB = b;
      
      if (alpha > 0) {
        // Unmultiply alpha to restore original vivid color saturation on transparent background
        newR = Math.min(255, Math.round((r * 255) / alpha));
        newG = Math.min(255, Math.round((g * 255) / alpha));
        newB = Math.min(255, Math.round((b * 255) / alpha));
      } else {
        newR = 0;
        newG = 0;
        newB = 0;
      }
      
      outputBuffer[destOffset] = newR;
      outputBuffer[destOffset + 1] = newG;
      outputBuffer[destOffset + 2] = newB;
      outputBuffer[destOffset + 3] = alpha;
    }
    
    // Save processed image back, overwriting the original file with pure RGBA PNG
    await sharp(outputBuffer, {
      raw: {
        width,
        height,
        channels: 4
      }
    })
    .png()
    .toFile(filePath + '.tmp');

    // Replace the original file with the processed one
    fs.unlinkSync(filePath);
    fs.renameSync(filePath + '.tmp', filePath);
    console.log(`Successfully processed and saved transparent PNG to ${filePath}`);
  }

  console.log('All effect images have been successfully processed!');
}

processEffects().catch(err => {
  console.error('Error processing transparency:', err);
});
