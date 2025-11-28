import { Buffer } from 'buffer';

// Test configuration
const API_URL = 'http://localhost:3000/api/applications';
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

// Test results tracking
let passedTests = 0;
let failedTests = 0;
const results: string[] = [];

// Helper function to create a 1x1 PNG image (69 bytes)
function createValidPNG(): Buffer {
  const png = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
    0x00, 0x00, 0x00, 0x0d, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // Width: 1
    0x00, 0x00, 0x00, 0x01, // Height: 1
    0x08, 0x06, 0x00, 0x00, 0x00, // Bit depth, color type, etc.
    0x1f, 0x15, 0xc4, 0x89, // CRC
    0x00, 0x00, 0x00, 0x0a, // IDAT chunk length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, // Compressed data
    0x0d, 0x0a, 0x2d, 0xb4, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND chunk length
    0x49, 0x45, 0x4e, 0x44, // IEND
    0xae, 0x42, 0x60, 0x82  // CRC
  ]);
  return png;
}

// Helper function to create a 1x1 JPEG image (125 bytes)
function createValidJPEG(): Buffer {
  const jpeg = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, // SOI + APP0 marker
    0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
    0xff, 0xdb, 0x00, 0x43, 0x00, // DQT marker
    0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14,
    0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12, 0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a,
    0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c,
    0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32,
    0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, // SOF0 (1x1)
    0xff, 0xc4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x03,
    0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0xd2, 0xcf, 0x20, // SOS
    0xff, 0xd9 // EOI
  ]);
  return jpeg;
}

// Helper function to create an invalid text file
function createInvalidTextFile(): Buffer {
  return Buffer.from('This is not an image file', 'utf-8');
}

// Helper function to create a large file (>2MB)
function createLargeFile(): Buffer {
  const size = MAX_IMAGE_SIZE + 1024; // 2MB + 1KB
  return Buffer.alloc(size, 0);
}

// Helper function to create FormData with file
async function createFormData(fields: any, file?: { buffer: Buffer; filename: string; mimetype: string }): Promise<FormData> {
  const formData = new FormData();
  
  if (fields.name) formData.append('name', fields.name);
  if (fields.email) formData.append('email', fields.email);
  if (fields.whatsapp) formData.append('whatsapp', fields.whatsapp);
  if (fields.bio) formData.append('bio', fields.bio);
  
  if (file) {
    const blob = new Blob([file.buffer], { type: file.mimetype });
    formData.append('profileImage', blob, file.filename);
  }
  
  return formData;
}

// Helper function to run a test
async function runTest(testName: string, testFn: () => Promise<boolean>): Promise<void> {
  try {
    const passed = await testFn();
    if (passed) {
      passedTests++;
      results.push(`✅ ${testName}`);
      console.log(`✅ ${testName}`);
    } else {
      failedTests++;
      results.push(`❌ ${testName}`);
      console.log(`❌ ${testName}`);
    }
  } catch (error) {
    failedTests++;
    results.push(`❌ ${testName} - Error: ${error instanceof Error ? error.message : String(error)}`);
    console.log(`❌ ${testName} - Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Test 1: Missing image field
async function testMissingImage(): Promise<boolean> {
  const formData = await createFormData({
    name: 'Test User',
    email: 'test@example.com',
    whatsapp: '+1234567890'
  });
  
  const response = await fetch(API_URL, {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  return response.status === 400 && data.code === 'MISSING_IMAGE';
}

// Test 2: Invalid image type (text file)
async function testInvalidImageType(): Promise<boolean> {
  const formData = await createFormData(
    {
      name: 'Test User',
      email: 'test@example.com',
      whatsapp: '+1234567890'
    },
    {
      buffer: createInvalidTextFile(),
      filename: 'test.txt',
      mimetype: 'text/plain'
    }
  );
  
  const response = await fetch(API_URL, {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  return response.status === 400 && data.code === 'INVALID_IMAGE_TYPE';
}

// Test 3: Oversized image
async function testOversizedImage(): Promise<boolean> {
  const formData = await createFormData(
    {
      name: 'Test User',
      email: 'test@example.com',
      whatsapp: '+1234567890'
    },
    {
      buffer: createLargeFile(),
      filename: 'large.png',
      mimetype: 'image/png'
    }
  );
  
  const response = await fetch(API_URL, {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  return response.status === 400 && data.code === 'IMAGE_TOO_LARGE';
}

// Test 4: Valid PNG request
async function testValidPNG(): Promise<boolean> {
  const formData = await createFormData(
    {
      name: 'Test PNG User',
      email: 'png@example.com',
      whatsapp: '+1234567890',
      bio: 'Test bio for PNG user'
    },
    {
      buffer: createValidPNG(),
      filename: 'test.png',
      mimetype: 'image/png'
    }
  );
  
  const response = await fetch(API_URL, {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  return (
    response.status === 201 &&
    data.profileImage &&
    data.profileImage.startsWith('data:image/') &&
    data.name === 'Test PNG User' &&
    data.email === 'png@example.com'
  );
}

// Test 5: Valid JPEG request
async function testValidJPEG(): Promise<boolean> {
  const formData = await createFormData(
    {
      name: 'Test JPEG User',
      email: 'jpeg@example.com',
      whatsapp: '+0987654321',
      bio: 'Test bio for JPEG user'
    },
    {
      buffer: createValidJPEG(),
      filename: 'test.jpg',
      mimetype: 'image/jpeg'
    }
  );
  
  const response = await fetch(API_URL, {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  return (
    response.status === 201 &&
    data.profileImage &&
    data.profileImage.startsWith('data:image/') &&
    data.name === 'Test JPEG User' &&
    data.email === 'jpeg@example.com'
  );
}

// Test 6: Fill remaining slots and test NO_OPEN_SLOTS
async function testNoOpenSlots(): Promise<boolean> {
  // First, create applications until we have 6 total
  const getResponse = await fetch(API_URL);
  const existingApps = await getResponse.json();
  const currentCount = existingApps.length;
  const slotsToFill = Math.max(0, 6 - currentCount);
  
  // Fill remaining slots
  for (let i = 0; i < slotsToFill; i++) {
    const formData = await createFormData(
      {
        name: `Filler User ${i}`,
        email: `filler${i}@example.com`,
        whatsapp: `+123456789${i}`
      },
      {
        buffer: createValidPNG(),
        filename: 'filler.png',
        mimetype: 'image/png'
      }
    );
    
    await fetch(API_URL, {
      method: 'POST',
      body: formData
    });
  }
  
  // Now try to add one more - should fail with NO_OPEN_SLOTS
  const formData = await createFormData(
    {
      name: 'Overflow User',
      email: 'overflow@example.com',
      whatsapp: '+9999999999'
    },
    {
      buffer: createValidPNG(),
      filename: 'overflow.png',
      mimetype: 'image/png'
    }
  );
  
  const response = await fetch(API_URL, {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  return response.status === 400 && data.code === 'NO_OPEN_SLOTS';
}

// Test 7: GET applications returns profileImage field
async function testGetApplications(): Promise<boolean> {
  const response = await fetch(API_URL);
  const data = await response.json();
  
  return (
    response.status === 200 &&
    Array.isArray(data) &&
    data.length > 0 &&
    data.every((app: any) => app.profileImage && app.profileImage.startsWith('data:image/'))
  );
}

// Main test runner
async function runAllTests(): Promise<void> {
  console.log('🧪 Starting API Tests for /api/applications\n');
  console.log('Testing multipart/form-data POST requests with image uploads\n');
  
  await runTest('Test 1: Missing image field', testMissingImage);
  await runTest('Test 2: Invalid image type (text file)', testInvalidImageType);
  await runTest('Test 3: Oversized image (>2MB)', testOversizedImage);
  await runTest('Test 4: Valid PNG upload', testValidPNG);
  await runTest('Test 5: Valid JPEG upload', testValidJPEG);
  await runTest('Test 6: No open slots (max 6 applications)', testNoOpenSlots);
  await runTest('Test 7: GET applications returns profileImage', testGetApplications);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${passedTests + failedTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log('='.repeat(60));
  
  if (failedTests > 0) {
    console.log('\n❌ Some tests failed. Details:');
    results.forEach(result => {
      if (result.startsWith('❌')) {
        console.log(result);
      }
    });
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});