import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import zlib from 'zlib'
import * as XLSX from 'xlsx'
import JSZip from 'jszip'

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function createTrafficPng({
  width = 320,
  height = 200,
  type = 'Car',
  plate = 'TS 09 AB 4521',
  isOverSpeed = false,
  speed = 72,
  limit = 60,
  obsId = 'OBS-0001',
}) {
  const rowLen = 1 + width * 3
  const raw = Buffer.alloc(rowLen * height)

  function setPixel(x, y, r, g, b) {
    if (x < 0 || x >= width || y < 0 || y >= height) return
    const offset = y * rowLen + 1 + x * 3
    raw[offset] = r
    raw[offset + 1] = g
    raw[offset + 2] = b
  }

  function fillRect(x1, y1, w, h, r, g, b) {
    for (let y = y1; y < y1 + h; y++) {
      for (let x = x1; x < x1 + w; x++) {
        setPixel(x, y, r, g, b)
      }
    }
  }

  function strokeRect(x1, y1, w, h, r, g, b, thickness = 1) {
    for (let t = 0; t < thickness; t++) {
      for (let x = x1; x < x1 + w; x++) {
        setPixel(x, y1 + t, r, g, b)
        setPixel(x, y1 + h - 1 - t, r, g, b)
      }
      for (let y = y1; y < y1 + h; y++) {
        setPixel(x1 + t, y, r, g, b)
        setPixel(x1 + w - 1 - t, y, r, g, b)
      }
    }
  }

  // 1. Dark asphalt background
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const grad = Math.floor(18 + (y / height) * 16)
      setPixel(x, y, grad, grad + 4, grad + 10)
    }
  }

  // 2. Perspective road markings
  for (let y = 30; y < height - 24; y++) {
    const lx = Math.floor(52 - (y - 30) * 0.22)
    const rx = Math.floor(268 + (y - 30) * 0.22)
    setPixel(lx, y, 68, 82, 92)
    setPixel(rx, y, 68, 82, 92)
    if (Math.floor(y / 16) % 2 === 0) {
      setPixel(160, y, 218, 198, 70)
      setPixel(161, y, 218, 198, 70)
    }
  }

  // 3. Vehicle silhouette & color by vehicle type
  const colorMap = {
    Car: [37, 99, 235],
    Bike: [234, 88, 12],
    Auto: [217, 119, 6],
    Bus: [13, 148, 136],
    Truck: [124, 58, 237],
    Tractor: [101, 163, 13],
    Jeep: [79, 70, 229],
    Van: [2, 132, 199],
    Train: [225, 29, 72],
    Pedestrians: [236, 72, 153],
  }
  const color = colorMap[type] || [59, 130, 246]

  const vx = 105
  const vy = 55
  const vw = 110
  const vh = 75

  fillRect(vx, vy, vw, vh, color[0], color[1], color[2])
  // Windshield
  fillRect(vx + 14, vy + 8, vw - 28, 24, 15, 23, 42)
  // Headlights
  fillRect(vx + 6, vy + 50, 14, 12, 254, 240, 138)
  fillRect(vx + vw - 20, vy + 50, 14, 12, 254, 240, 138)
  // Plate rectangle
  fillRect(vx + 26, vy + 52, 58, 12, 248, 250, 252)

  // 4. AI Detection Bounding Box
  const boxColor = isOverSpeed ? [239, 68, 68] : [16, 185, 129]
  strokeRect(vx - 8, vy - 10, vw + 16, vh + 20, boxColor[0], boxColor[1], boxColor[2], 2)

  // Bracket corners
  fillRect(vx - 12, vy - 14, 12, 3, boxColor[0], boxColor[1], boxColor[2])
  fillRect(vx - 12, vy - 14, 3, 12, boxColor[0], boxColor[1], boxColor[2])
  fillRect(vx + vw + 1, vy - 14, 12, 3, boxColor[0], boxColor[1], boxColor[2])
  fillRect(vx + vw + 10, vy - 14, 3, 12, boxColor[0], boxColor[1], boxColor[2])

  // 5. HUD Top Bar
  fillRect(0, 0, width, 22, 15, 23, 42)
  // REC dot
  fillRect(8, 8, 6, 6, 239, 68, 68)
  // Live indicator green pill
  fillRect(18, 9, 24, 4, 34, 197, 94)

  // 6. HUD Bottom Bar
  fillRect(0, height - 24, width, 24, 15, 23, 42)
  // Speed pill in bottom bar
  const speedPillColor = isOverSpeed ? [239, 68, 68] : [16, 185, 129]
  fillRect(width - 70, height - 19, 62, 14, speedPillColor[0], speedPillColor[1], speedPillColor[2])

  // PNG chunks
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr.writeUInt8(8, 8)
  ihdr.writeUInt8(2, 9)
  ihdr.writeUInt8(0, 10)
  ihdr.writeUInt8(0, 11)
  ihdr.writeUInt8(0, 12)

  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[i] = c
  }
  function crc32(buf) {
    let crc = -1
    for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff]
    return (crc ^ -1) >>> 0
  }
  function makeChunk(t, d) {
    const b = Buffer.alloc(d.length + 12)
    b.writeUInt32BE(d.length, 0)
    b.write(t, 4)
    d.copy(b, 8)
    b.writeUInt32BE(crc32(Buffer.concat([Buffer.from(t), d])), d.length + 8)
    return b
  }

  const comp = zlib.deflateSync(raw)
  return Buffer.concat([sig, makeChunk('IHDR', ihdr), makeChunk('IDAT', comp), makeChunk('IEND', Buffer.alloc(0))])
}

async function main() {
  const csvPath = path.join(frontendDir, 'public', 'sample_traffic_feed.csv')
  const xlsxPath = path.join(frontendDir, 'public', 'sample_traffic_feed.xlsx')
  const csvText = fs.readFileSync(csvPath, 'utf8')
  const wb = XLSX.read(csvText, { type: 'string' })
  const xlsxBuf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  const zip = await JSZip.loadAsync(xlsxBuf)
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet)

  const drawingRelEntries = []
  const anchors = []

  rows.forEach((row, i) => {
    const imgIndex = i + 1
    const rId = 'rId' + imgIndex
    const pngName = 'image' + imgIndex + '.png'
    const pngBuf = createTrafficPng({
      type: row['Vehicle Type'] || 'Car',
      plate: row['Vehicle Number Plate'] || '',
      isOverSpeed: (row['Over Speed'] || '').toLowerCase() === 'yes',
      speed: Number(row['Speed (km/h)']) || 60,
      limit: Number(row['Speed Limit (km/h)']) || 60,
      obsId: row['ID'] || 'OBS-' + String(imgIndex).padStart(4, '0'),
    })

    zip.file('xl/media/' + pngName, pngBuf)

    drawingRelEntries.push(
      `<Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${pngName}"/>`
    )

    // Col 5 is 'Vehicle Image' (0-indexed)
    const excelRow = i + 1
    anchors.push(`
    <xdr:twoCellAnchor editAs="oneCell">
      <xdr:from>
        <xdr:col>5</xdr:col>
        <xdr:colOff>0</xdr:colOff>
        <xdr:row>${excelRow}</xdr:row>
        <xdr:rowOff>0</xdr:rowOff>
      </xdr:from>
      <xdr:to>
        <xdr:col>6</xdr:col>
        <xdr:colOff>0</xdr:colOff>
        <xdr:row>${excelRow + 1}</xdr:row>
        <xdr:rowOff>0</xdr:rowOff>
      </xdr:to>
      <xdr:pic>
        <xdr:nvPicPr>
          <xdr:cNvPr id="${imgIndex + 10}" name="Picture ${imgIndex}"/>
          <xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr>
        </xdr:nvPicPr>
        <xdr:blipFill>
          <a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="${rId}"/>
          <a:stretch><a:fillRect/></a:stretch>
        </xdr:blipFill>
        <xdr:spPr>
          <a:xfrm><a:off x="0" y="0"/><a:ext cx="1600000" cy="1000000"/></a:xfrm>
          <a:prstGeom geom="rect"><a:avLst/></a:prstGeom>
        </xdr:spPr>
      </xdr:pic>
      <xdr:clientData/>
    </xdr:twoCellAnchor>`)
  })

  // Add xl/drawings/_rels/drawing1.xml.rels
  const drawing1RelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${drawingRelEntries.join('\n  ')}
</Relationships>`
  zip.file('xl/drawings/_rels/drawing1.xml.rels', drawing1RelsXml)

  // Add xl/drawings/drawing1.xml
  const drawing1Xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  ${anchors.join('\n')}
</xdr:wsDr>`
  zip.file('xl/drawings/drawing1.xml', drawing1Xml)

  // Update [Content_Types].xml
  let ctXml = await zip.file('[Content_Types].xml').async('text')
  if (!ctXml.includes('Extension="png"')) {
    ctXml = ctXml.replace('</Types>', '<Default Extension="png" ContentType="image/png"/></Types>')
  }
  if (!ctXml.includes('/xl/drawings/drawing1.xml')) {
    ctXml = ctXml.replace(
      '</Types>',
      '<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/></Types>'
    )
  }
  zip.file('[Content_Types].xml', ctXml)

  // Update xl/worksheets/_rels/sheet1.xml.rels
  let sheet1RelsXml = ''
  const sheetRelsEntry = zip.file('xl/worksheets/_rels/sheet1.xml.rels')
  if (sheetRelsEntry) {
    sheet1RelsXml = await sheetRelsEntry.async('text')
  } else {
    sheet1RelsXml =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>'
  }
  if (!sheet1RelsXml.includes('drawing1.xml')) {
    sheet1RelsXml = sheet1RelsXml.replace(
      '</Relationships>',
      '<Relationship Id="rIdDrawing1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/></Relationships>'
    )
  }
  zip.file('xl/worksheets/_rels/sheet1.xml.rels', sheet1RelsXml)

  // Update xl/worksheets/sheet1.xml
  let sheet1Xml = await zip.file('xl/worksheets/sheet1.xml').async('text')
  if (!sheet1Xml.includes('<drawing r:id=')) {
    if (sheet1Xml.includes('</worksheet>')) {
      sheet1Xml = sheet1Xml.replace(
        '</worksheet>',
        '<drawing xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rIdDrawing1"/></worksheet>'
      )
    }
  }
  zip.file('xl/worksheets/sheet1.xml', sheet1Xml)

  const finalBuf = await zip.generateAsync({ type: 'nodebuffer' })
  fs.writeFileSync(xlsxPath, finalBuf)
  console.log('Generated frontend/public/sample_traffic_feed.xlsx with', rows.length, 'embedded images! Size:', finalBuf.length)

  // Validate reading with XLSX
  const testWb = XLSX.read(finalBuf, { type: 'buffer' })
  const testRows = XLSX.utils.sheet_to_json(testWb.Sheets[testWb.SheetNames[0]])
  console.log('Verified reading XLSX:', testRows.length, 'records loaded.')
}

main().catch((err) => {
  console.error('Error generating sample xlsx:', err)
  process.exit(1)
})
