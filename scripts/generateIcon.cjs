const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const root = path.resolve(__dirname, '..')
const svgPath = path.join(root, 'public/logo.svg')
const buildDir = path.join(root, 'build')
const outPath = path.join(buildDir, 'icon.png')

if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true })

const swiftScript = `
import AppKit

let svgPath = "${svgPath}"
guard let image = NSImage(contentsOfFile: svgPath) else {
    print("Could not load SVG")
    exit(1)
}

let targetSize = NSSize(width: 1024, height: 1024)
guard let bitmapRep = NSBitmapImageRep(
    bitmapDataPlanes: nil,
    pixelsWide: Int(targetSize.width),
    pixelsHigh: Int(targetSize.height),
    bitsPerSample: 8,
    samplesPerPixel: 4,
    hasAlpha: true,
    isPlanar: false,
    colorSpaceName: .calibratedRGB,
    bytesPerRow: 0,
    bitsPerPixel: 0
) else {
    print("Could not create bitmap")
    exit(1)
}

NSGraphicsContext.saveGraphicsState()
guard let context = NSGraphicsContext(bitmapImageRep: bitmapRep) else {
    print("Could not create context")
    exit(1)
}
NSGraphicsContext.current = context

image.draw(
    in: NSRect(origin: .zero, size: targetSize),
    from: NSRect(origin: .zero, size: image.size),
    operation: .copy,
    fraction: 1.0
)
context.flushGraphics()
NSGraphicsContext.restoreGraphicsState()

guard let pngData = bitmapRep.representation(using: .png, properties: [:]) else {
    print("Could not encode PNG")
    exit(1)
}

try pngData.write(to: URL(fileURLWithPath: "${outPath}"))
print("Saved 1024x1024 PNG to ${outPath}")
`

const tmpSwift = path.join('/tmp', `convert_icon_${Date.now()}.swift`)
fs.writeFileSync(tmpSwift, swiftScript)
const tmpCache = path.join('/tmp', 'clang-cache')
if (!fs.existsSync(tmpCache)) fs.mkdirSync(tmpCache, { recursive: true })
const tmpBin = path.join('/tmp', `convert_icon_${Date.now()}`)
execSync(`swiftc -module-cache-path ${tmpCache} ${tmpSwift} -o ${tmpBin} && ${tmpBin}`, { stdio: 'inherit' })
try { fs.unlinkSync(tmpSwift) } catch {}
try { fs.unlinkSync(tmpBin) } catch {}
