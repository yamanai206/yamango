import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compressImage, POPULAR_VEHICLE_PHOTO_PRESETS } from './imageCompressor';

test('POPULAR_VEHICLE_PHOTO_PRESETS contains realistic presets with valid categories and URLs', () => {
  assert.ok(POPULAR_VEHICLE_PHOTO_PRESETS.length >= 4);
  for (const preset of POPULAR_VEHICLE_PHOTO_PRESETS) {
    assert.ok(preset.title.length > 0);
    assert.ok(preset.category.length > 0);
    assert.ok(preset.url.startsWith('https://'));
    assert.ok(preset.description.length > 0);
  }
});

test('compressImage falls back gracefully in Node.js test environment without canvas error', async () => {
  // Create a mock blob or file
  const mockBlob = new Blob(['mock-binary-image-data'], { type: 'image/jpeg' });
  const result = await compressImage(mockBlob);
  assert.ok(typeof result === 'string');
  assert.ok(result.startsWith('data:'));
});
