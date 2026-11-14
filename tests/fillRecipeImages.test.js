import assert from 'node:assert/strict'
import test from 'node:test'

// Because fill-recipe-images.mjs reads env vars at module level, we need to set
// stubs before importing — but since we export functions, we test them directly.
import {
  cleanDishName,
  isValidImageUrl,
} from '../scripts/fill-recipe-images.mjs'

test('cleanDishName removes round brackets and contents', () => {
  assert.equal(cleanDishName('Palak Paneer (Spinach Curry)'), 'Palak Paneer')
  assert.equal(cleanDishName('Dal Makhani (restaurant style)'), 'Dal Makhani')
})

test('cleanDishName removes square brackets', () => {
  assert.equal(cleanDishName('Biryani [Hyderabadi]'), 'Biryani')
  assert.equal(cleanDishName('Chicken [raw]'), 'Chicken')
})

test('cleanDishName removes the word "raw" (case-insensitive)', () => {
  assert.equal(cleanDishName('Raw Mango Chutney'), 'Mango Chutney')
  assert.equal(cleanDishName('Poha RAW'), 'Poha')
  assert.equal(cleanDishName('craw fish soup'), 'craw fish soup') // "craw" is not "raw"
})

test('cleanDishName handles multiple spaces', () => {
  const result = cleanDishName('  Pav   Bhaji  ')
  assert.equal(result, 'Pav Bhaji')
})

test('cleanDishName returns empty string for bad inputs', () => {
  assert.equal(cleanDishName(''), '')
  assert.equal(cleanDishName(null), '')
  assert.equal(cleanDishName(undefined), '')
  assert.equal(cleanDishName(42), '')
})

test('isValidImageUrl accepts .jpg, .jpeg, .webp extensions', () => {
  assert.equal(isValidImageUrl('https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Palak_paneer.jpg/960px-Palak_paneer.jpg'), true)
  assert.equal(isValidImageUrl('https://upload.wikimedia.org/something/image.jpeg'), true)
  assert.equal(isValidImageUrl('https://upload.wikimedia.org/something/image.webp'), true)
})

test('isValidImageUrl rejects non-photo extensions', () => {
  assert.equal(isValidImageUrl('https://example.com/image.png'), false)
  assert.equal(isValidImageUrl('https://example.com/image.gif'), false)
  assert.equal(isValidImageUrl('https://example.com/image.svg'), false)
  assert.equal(isValidImageUrl('https://example.com/image.avif'), false)
})

test('isValidImageUrl rejects blacklisted keywords in URL', () => {
  assert.equal(isValidImageUrl('https://upload.wikimedia.org/flag_of_india.jpg'), false)
  assert.equal(isValidImageUrl('https://upload.wikimedia.org/india_map.jpg'), false)
  assert.equal(isValidImageUrl('https://example.com/logo.jpg'), false)
  assert.equal(isValidImageUrl('https://example.com/icon.webp'), false)
  assert.equal(isValidImageUrl('https://example.com/symbol.jpg'), false)
  assert.equal(isValidImageUrl('https://example.com/coat_of_arms.jpg'), false)
  assert.equal(isValidImageUrl('https://example.com/diagram.jpg'), false)
})

test('isValidImageUrl rejects query string extension tricks', () => {
  // The .jpg appears only in query string, not the actual path extension
  assert.equal(isValidImageUrl('https://example.com/page?src=image.jpg'), false)
  // But real jpg URL with query params should still pass
  assert.equal(isValidImageUrl('https://cdn.example.com/photo.jpg?v=123'), true)
})

test('isValidImageUrl rejects empty or null values', () => {
  assert.equal(isValidImageUrl(''), false)
  assert.equal(isValidImageUrl(null), false)
  assert.equal(isValidImageUrl(undefined), false)
})

