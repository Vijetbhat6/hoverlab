import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { encodeAse } from './ase'

/**
 * A binary format nobody can eyeball. These tests read the bytes back the
 * way Photoshop would, because the failure mode for every mistake here is
 * the same: the file opens without an error and the swatches are wrong.
 */

/** Reads an .ase back into swatches, the way a consumer would. */
function decode(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const signature = String.fromCharCode(...bytes.slice(0, 4))
  const major = view.getUint16(4, false)
  const minor = view.getUint16(6, false)
  const blockCount = view.getUint32(8, false)

  const swatches: Array<{ name: string; model: string; rgb: number[]; type: number }> = []
  let o = 12
  for (let i = 0; i < blockCount; i++) {
    const type = view.getUint16(o, false)
    const length = view.getUint32(o + 2, false)
    let p = o + 6
    assert.equal(type, 0x0001, 'every block written here is a colour entry')

    const nameUnits = view.getUint16(p, false)
    p += 2
    let name = ''
    // The declared count includes the terminator, so read one fewer.
    for (let n = 0; n < nameUnits - 1; n++) {
      name += String.fromCharCode(view.getUint16(p, false))
      p += 2
    }
    const terminator = view.getUint16(p, false)
    assert.equal(terminator, 0, 'the name is null-terminated')
    p += 2

    const model = String.fromCharCode(...bytes.slice(p, p + 4))
    p += 4
    const rgb = [
      view.getFloat32(p, false),
      view.getFloat32(p + 4, false),
      view.getFloat32(p + 8, false),
    ]
    p += 12
    const colorType = view.getUint16(p, false)
    p += 2

    assert.equal(p - (o + 6), length, 'the declared block length matches the body')
    swatches.push({ name, model, rgb, type: colorType })
    o = p
  }
  assert.equal(o, bytes.length, 'no trailing bytes')
  return { signature, major, minor, blockCount, swatches }
}

describe('encodeAse', () => {
  test('writes the ASEF signature and version 1.0', () => {
    const out = decode(encodeAse([{ name: 'Primary', hex: '#10b981' }]))
    assert.equal(out.signature, 'ASEF')
    assert.equal(out.major, 1)
    assert.equal(out.minor, 0)
  })

  test('round-trips a colour to within a float of the original channels', () => {
    const out = decode(encodeAse([{ name: 'Primary', hex: '#10b981' }]))
    const [r, g, b] = out.swatches[0]!.rgb
    assert.equal(Math.round(r! * 255), 0x10)
    assert.equal(Math.round(g! * 255), 0xb9)
    assert.equal(Math.round(b! * 255), 0x81)
  })

  test('names round-trip, which is what the length field is for', () => {
    const out = decode(encodeAse([
      { name: 'Brand', hex: '#000000' },
      { name: 'Accent 2', hex: '#ffffff' },
    ]))
    assert.deepEqual(out.swatches.map((s) => s.name), ['Brand', 'Accent 2'])
  })

  test('counts UTF-16 code units, so a surrogate pair does not derail the parse', () => {
    // '🎨' is two code units. A character count here would under-declare the
    // name by one and every subsequent block would be read at the wrong
    // offset — which the decoder's trailing-byte assert would catch.
    const out = decode(encodeAse([
      { name: '🎨 Art', hex: '#123456' },
      { name: 'After', hex: '#654321' },
    ]))
    assert.deepEqual(out.swatches.map((s) => s.name), ['🎨 Art', 'After'])
  })

  test('uses the RGB model with its required trailing space', () => {
    const out = decode(encodeAse([{ name: 'x', hex: '#010203' }]))
    assert.equal(out.swatches[0]!.model, 'RGB ')
  })

  test('marks colours normal rather than global or spot', () => {
    const out = decode(encodeAse([{ name: 'x', hex: '#010203' }]))
    assert.equal(out.swatches[0]!.type, 2)
  })

  test('accepts three-digit hex', () => {
    const out = decode(encodeAse([{ name: 'x', hex: '#fff' }]))
    assert.deepEqual(out.swatches[0]!.rgb, [1, 1, 1])
  })

  test('skips an unparseable colour rather than writing black in its place', () => {
    const out = decode(encodeAse([
      { name: 'good', hex: '#10b981' },
      { name: 'bad', hex: 'not-a-colour' },
    ]))
    assert.equal(out.blockCount, 1)
    assert.deepEqual(out.swatches.map((s) => s.name), ['good'])
  })

  test('an empty palette is a valid file with no blocks', () => {
    const out = decode(encodeAse([]))
    assert.equal(out.signature, 'ASEF')
    assert.equal(out.blockCount, 0)
  })

  test('an empty name still carries its terminator', () => {
    const out = decode(encodeAse([{ name: '', hex: '#000000' }]))
    assert.equal(out.swatches[0]!.name, '')
  })
})
