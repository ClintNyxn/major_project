import assert from 'node:assert/strict'
import test from 'node:test'
import {
  cleanDishName,
  getPhotoCredit,
  isValidImageUrl,
  CACHE_PREFIX,
} from '../src/utils/recipeImageFallback.js'

test('cleanDishName removes round brackets', () => {
  assert.equal(cleanDishName('Palak Paneer (Spinach Curry)'), 'Palak Paneer')
})

test('cleanDishName removes square brackets', () => {
  assert.equal(cleanDishName('Biryani [Hyderabadi]'), 'Biryani')
})

test('cleanDishName removes curly brackets', () => {
  assert.equal(cleanDishName('Dosa {crispy}'), 'Dosa')
})

test('cleanDishName removes the word raw (case insensitive)', () => {
  assert.equal(cleanDishName('Raw Mango Chutney'), 'Mango Chutney')
  assert.equal(cleanDishName('Poha RAW'), 'Poha')
})

test('cleanDishName handles empty input', () => {
  assert.equal(cleanDishName(''), '')
  assert.equal(cleanDishName(null), '')
  assert.equal(cleanDishName(undefined), '')
})

test('isValidImageUrl accepts jpg, jpeg, webp', () => {
  assert.equal(isValidImageUrl('https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Biryani.jpg/960px-Biryani.jpg'), true)
  assert.equal(isValidImageUrl('https://upload.wikimedia.org/something/image.jpeg'), true)
  assert.equal(isValidImageUrl('https://upload.wikimedia.org/something/image.webp'), true)
})

test('isValidImageUrl rejects non-photo extensions', () => {
  assert.equal(isValidImageUrl('https://example.com/image.png'), false)
  assert.equal(isValidImageUrl('https://example.com/image.gif'), false)
  assert.equal(isValidImageUrl('https://example.com/image.svg'), false)
})

test('isValidImageUrl rejects blacklisted keywords', () => {
  assert.equal(isValidImageUrl('https://upload.wikimedia.org/flag_of_india.jpg'), false)
  assert.equal(isValidImageUrl('https://example.com/india_map.jpg'), false)
  assert.equal(isValidImageUrl('https://example.com/logo.jpg'), false)
  assert.equal(isValidImageUrl('https://example.com/icon.webp'), false)
  assert.equal(isValidImageUrl('https://example.com/symbol.jpg'), false)
  assert.equal(isValidImageUrl('https://example.com/coat_of_arms.jpg'), false)
  assert.equal(isValidImageUrl('https://example.com/diagram.jpg'), false)
})

test('isValidImageUrl rejects empty or null', () => {
  assert.equal(isValidImageUrl(''), false)
  assert.equal(isValidImageUrl(null), false)
  assert.equal(isValidImageUrl(undefined), false)
})

test('getPhotoCredit returns Wikipedia for Wikimedia URLs', () => {
  assert.equal(getPhotoCredit('https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Biryani.jpg/960px.jpg'), 'Wikipedia')
  assert.equal(getPhotoCredit('https://en.wikipedia.org/page-image.jpg'), 'Wikipedia')
})

test('getPhotoCredit returns Pexels for Pexels URLs', () => {
  assert.equal(getPhotoCredit('https://images.pexels.com/photos/12345/image.jpg'), 'Pexels')
})

test('getPhotoCredit returns null for unknown hosts', () => {
  assert.equal(getPhotoCredit('https://cdn.example.com/photo.jpg'), null)
  assert.equal(getPhotoCredit(''), null)
  assert.equal(getPhotoCredit(null), null)
})

test('CACHE_PREFIX has expected format', () => {
  assert.ok(typeof CACHE_PREFIX === 'string')
  assert.ok(CACHE_PREFIX.length > 0)
  assert.ok(CACHE_PREFIX.includes('kk_recipe'))
})

