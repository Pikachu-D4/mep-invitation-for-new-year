#!/usr/bin/env node
import { Buffer } from 'node:buffer';

const API_BASE = 'http://localhost:3000';
const API_URL = `${API_BASE}/api/applications`;

// Minimal valid 1x1 PNG binary data
const VALID_PNG = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
  0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
  0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, // IDAT chunk
  0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
  0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, // IEND chunk
  0x42, 0x60, 0x82
]);

// Minimal valid 1x1 JPEG binary data
const VALID_JPEG = Buffer.from([
  0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, // JPEG SOI + APP0
  0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
  0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, // DQT
  0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
  0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C,
  0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
  0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D,
  0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
  0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
  0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
  0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34,
  0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01, // SOF0
  0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, // DHT
  0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x03, 0xFF, 0xC4, 0x00, 0x14,
  0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, // SOS
  0x00, 0x00, 0x3F, 0x00, 0xD2, 0xCF, 0x20, 0xFF,
  0xD9 // EOI
]);

// Invalid text file
const INVALID_TEXT = Buffer.from('This is not an image file');

// Oversized file (>2MB)
const OVERSIZED_FILE = Buffer.alloc(2 * 1024 * 1024 + 1, 0xFF);

const testResults = [];
let testNumber = 0;

async function runTest(description, testFn) {
  testNumber++;
  try {
    await testFn();
    console.log(`✅ Test ${testNumber}: ${description}`);
    testResults.push(true);
  } catch (error) {
    console.log(`❌ Test ${testNumber}: ${description}`);
    console.error(`   Error: ${error.message}`);
    testResults.push(false);
  }
}

async function clearDatabase() {
  try {
    const response = await fetch(API_URL);
    const applications = await response.json();
    
    for (const app of applications) {
      await fetch(`${API_URL}?id=${app.id}`, { method: 'DELETE' });
    }
  } catch (error) {
    // Database might be empty
  }
}

console.log('🧪 Starting Tests...\n');

// Test 1: Missing profileImage field
await runTest('Missing profileImage field → 400 MISSING_IMAGE', async () => {
  const formData = new FormData();
  formData.append('name', 'Test User');
  formData.append('email', 'test@example.com');
  formData.append('whatsapp', '+1234567890');
  
  const response = await fetch(API_URL, {
    method: 'POST',
    body: formData,
  });
  
  const data = await response.json();
  
  if (response.status !== 400) {
    throw new Error(`Expected 400, got ${response.status}`);
  }
  
  if (data.code !== 'MISSING_IMAGE') {
    throw new Error(`Expected MISSING_IMAGE, got ${data.code}`);
  }
});

// Test 2: Invalid mime type (text/plain)
await runTest('Invalid mime type (text/plain) → 400 INVALID_IMAGE_TYPE', async () => {
  const formData = new FormData();
  formData.append('name', 'Test User');
  formData.append('email', 'test@example.com');
  formData.append('whatsapp', '+1234567890');
  formData.append('profileImage', new Blob([INVALID_TEXT], { type: 'text/plain' }), 'invalid.txt');
  
  const response = await fetch(API_URL, {
    method: 'POST',
    body: formData,
  });
  
  const data = await response.json();
  
  if (response.status !== 400) {
    throw new Error(`Expected 400, got ${response.status}`);
  }
  
  if (data.code !== 'INVALID_IMAGE_TYPE') {
    throw new Error(`Expected INVALID_IMAGE_TYPE, got ${data.code}`);
  }
});

// Test 3: File >2MB
await runTest('File >2MB → 400 IMAGE_TOO_LARGE', async () => {
  const formData = new FormData();
  formData.append('name', 'Test User');
  formData.append('email', 'test@example.com');
  formData.append('whatsapp', '+1234567890');
  formData.append('profileImage', new Blob([OVERSIZED_FILE], { type: 'image/png' }), 'large.png');
  
  const response = await fetch(API_URL, {
    method: 'POST',
    body: formData,
  });
  
  const data = await response.json();
  
  if (response.status !== 400) {
    throw new Error(`Expected 400, got ${response.status}`);
  }
  
  if (data.code !== 'IMAGE_TOO_LARGE') {
    throw new Error(`Expected IMAGE_TOO_LARGE, got ${data.code}`);
  }
});

// Clear database before valid tests
await clearDatabase();

// Test 4: Valid PNG with all fields
await runTest('Valid PNG with all fields → 201 with profileImage starting with "data:image/png"', async () => {
  const formData = new FormData();
  formData.append('name', 'John Doe');
  formData.append('email', 'john@example.com');
  formData.append('whatsapp', '+1234567890');
  formData.append('bio', 'Test bio for John');
  formData.append('profileImage', new Blob([VALID_PNG], { type: 'image/png' }), 'profile.png');
  
  const response = await fetch(API_URL, {
    method: 'POST',
    body: formData,
  });
  
  const data = await response.json();
  
  if (response.status !== 201) {
    throw new Error(`Expected 201, got ${response.status}`);
  }
  
  if (!data.profileImage || !data.profileImage.startsWith('data:image/png')) {
    throw new Error(`Expected profileImage to start with "data:image/png", got ${data.profileImage?.substring(0, 20)}`);
  }
  
  if (data.name !== 'John Doe' || data.email !== 'john@example.com') {
    throw new Error('Response data does not match input');
  }
});

// Test 5: Valid JPEG
await runTest('Valid JPEG → 201 with profileImage starting with "data:image/jpeg"', async () => {
  const formData = new FormData();
  formData.append('name', 'Jane Smith');
  formData.append('email', 'jane@example.com');
  formData.append('whatsapp', '+0987654321');
  formData.append('profileImage', new Blob([VALID_JPEG], { type: 'image/jpeg' }), 'profile.jpg');
  
  const response = await fetch(API_URL, {
    method: 'POST',
    body: formData,
  });
  
  const data = await response.json();
  
  if (response.status !== 201) {
    throw new Error(`Expected 201, got ${response.status}`);
  }
  
  if (!data.profileImage || !data.profileImage.startsWith('data:image/jpeg')) {
    throw new Error(`Expected profileImage to start with "data:image/jpeg", got ${data.profileImage?.substring(0, 20)}`);
  }
});

// Test 6: Fill remaining slots then try 7th
await runTest('Fill all 6 slots then try 7th → 400 NO_OPEN_SLOTS', async () => {
  // Create applications for remaining slots (we already have 2)
  for (let i = 3; i <= 6; i++) {
    const formData = new FormData();
    formData.append('name', `User ${i}`);
    formData.append('email', `user${i}@example.com`);
    formData.append('whatsapp', `+123456789${i}`);
    formData.append('profileImage', new Blob([VALID_PNG], { type: 'image/png' }), 'profile.png');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
    });
    
    if (response.status !== 201) {
      throw new Error(`Failed to create application ${i}, got status ${response.status}`);
    }
  }
  
  // Try to create 7th application
  const formData = new FormData();
  formData.append('name', 'User 7');
  formData.append('email', 'user7@example.com');
  formData.append('whatsapp', '+1234567897');
  formData.append('profileImage', new Blob([VALID_PNG], { type: 'image/png' }), 'profile.png');
  
  const response = await fetch(API_URL, {
    method: 'POST',
    body: formData,
  });
  
  const data = await response.json();
  
  if (response.status !== 400) {
    throw new Error(`Expected 400, got ${response.status}`);
  }
  
  if (data.code !== 'NO_OPEN_SLOTS') {
    throw new Error(`Expected NO_OPEN_SLOTS, got ${data.code}`);
  }
});

// Test 7: GET returns applications with profileImage field
await runTest('GET /api/applications returns applications with profileImage field', async () => {
  const response = await fetch(API_URL);
  const data = await response.json();
  
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }
  
  if (!Array.isArray(data)) {
    throw new Error('Expected response to be an array');
  }
  
  if (data.length !== 6) {
    throw new Error(`Expected 6 applications, got ${data.length}`);
  }
  
  for (const app of data) {
    if (!app.profileImage || (!app.profileImage.startsWith('data:image/png') && !app.profileImage.startsWith('data:image/jpeg'))) {
      throw new Error(`Application ${app.id} has invalid profileImage: ${app.profileImage?.substring(0, 20)}`);
    }
    
    if (!app.name || !app.email || !app.whatsapp) {
      throw new Error(`Application ${app.id} is missing required fields`);
    }
  }
});

// Print summary
console.log('\n📊 Test Summary');
console.log('═'.repeat(40));
const passed = testResults.filter(r => r).length;
const total = testResults.length;
console.log(`Tests Passed: ${passed}/${total}`);
console.log(`Tests Failed: ${total - passed}/${total}`);

if (passed === total) {
  console.log('\n✅ All tests passed!');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed!');
  process.exit(1);
}