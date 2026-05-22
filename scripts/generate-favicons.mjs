import { readFile, writeFile } from 'node:fs/promises'
import { execSync } from 'node:child_process'
import toIco from 'to-ico'

// Regenerate PNGs from SVG (Google needs 48px+; ICO needs 16/32/48)
for (const size of [16, 32, 48, 96, 192, 180]) {
  const out = size === 180 ? 'public/apple-touch-icon.png' : `public/favicon-${size}.png`
  execSync(`npx --yes sharp-cli resize ${size} ${size} -i public/favicon.svg -o ${out}`, {
    stdio: 'inherit',
  })
}

const pngs = await Promise.all([16, 32, 48].map((s) => readFile(`public/favicon-${s}.png`)))
const ico = await toIco(pngs)
await writeFile('public/favicon.ico', ico)
console.log('Wrote public/favicon.ico', ico.length, 'bytes')
