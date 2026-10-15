import sharp from 'sharp'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const outputDir = join(process.cwd(), 'public', 'icons')

// Create a simple icon with "SD" text on dark background
async function generateIcons() {
  mkdirSync(outputDir, { recursive: true })

  for (const size of sizes) {
    const fontSize = Math.floor(size * 0.4)
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="#1a1a2e"/>
        <text
          x="50%"
          y="55%"
          font-family="Georgia, serif"
          font-size="${fontSize}px"
          font-weight="bold"
          fill="#c9a227"
          text-anchor="middle"
          dominant-baseline="middle"
        >SD</text>
      </svg>
    `

    const buffer = await sharp(Buffer.from(svg))
      .png()
      .toBuffer()

    writeFileSync(join(outputDir, `icon-${size}x${size}.png`), buffer)
    console.log(`Generated icon-${size}x${size}.png`)
  }

  console.log('All icons generated!')
}

generateIcons().catch(console.error)
