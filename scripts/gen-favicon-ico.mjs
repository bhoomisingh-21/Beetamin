import { writeFileSync } from 'fs'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const mod = require('png-to-ico')
const pngToIco = typeof mod === 'function' ? mod : mod.default

const buf = await pngToIco(['public/favicon-16x16.png', 'public/favicon-32x32.png'])
writeFileSync('public/favicon.ico', buf)
console.log('Wrote public/favicon.ico', buf.length, 'bytes')
