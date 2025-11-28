import { NextRequest, NextResponse } from 'next/server';

// Test data generators
function createValidPNG(): Buffer {
  // Minimal valid 1x1 PNG file (67 bytes)
  const pngData = Buffer.from([
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
  return pngData;
}

function createInvalidTextFile(): Buffer {
  return Buffer.from('This is a text file, not an image', 'utf-8');
}

function createOversizedBuffer(): Buffer {
  // Create 2MB + 1KB buffer
  const size = 2 * 1024 * 1024 + 1024;
  return Buffer.alloc(size, 0);
}

async function runTest(testName: string): Promise<any> {
  const baseUrl = 'http://localhost:3000/api/applications';
  
  try {
    switch (testName) {
      case 'missing_image': {
        const formData = new FormData();
        formData.append('name', 'Test User');
        formData.append('email', 'test@example.com');
        formData.append('whatsapp', '+1234567890');
        formData.append('bio', 'Test bio');
        
        const response = await fetch(baseUrl, {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        return {
          test: 'missing_image',
          description: 'Request without image field',
          status: response.status,
          expectedStatus: 400,
          expectedCode: 'MISSING_IMAGE',
          passed: response.status === 400 && data.code === 'MISSING_IMAGE',
          response: data,
        };
      }
      
      case 'invalid_type': {
        const formData = new FormData();
        const textBlob = new Blob([createInvalidTextFile()], { type: 'text/plain' });
        formData.append('profileImage', textBlob, 'test.txt');
        formData.append('name', 'Test User');
        formData.append('email', 'test@example.com');
        formData.append('whatsapp', '+1234567890');
        formData.append('bio', 'Test bio');
        
        const response = await fetch(baseUrl, {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        return {
          test: 'invalid_type',
          description: 'Request with text/plain file instead of image',
          status: response.status,
          expectedStatus: 400,
          expectedCode: 'INVALID_IMAGE_TYPE',
          passed: response.status === 400 && data.code === 'INVALID_IMAGE_TYPE',
          response: data,
        };
      }
      
      case 'oversized': {
        const formData = new FormData();
        const oversizedBlob = new Blob([createOversizedBuffer()], { type: 'image/png' });
        formData.append('profileImage', oversizedBlob, 'large.png');
        formData.append('name', 'Test User');
        formData.append('email', 'test@example.com');
        formData.append('whatsapp', '+1234567890');
        formData.append('bio', 'Test bio');
        
        const response = await fetch(baseUrl, {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        return {
          test: 'oversized',
          description: 'Request with image larger than 2MB',
          status: response.status,
          expectedStatus: 400,
          expectedCode: 'IMAGE_TOO_LARGE',
          passed: response.status === 400 && data.code === 'IMAGE_TOO_LARGE',
          response: data,
        };
      }
      
      case 'unsupported_content_type': {
        const jsonBody = JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          whatsapp: '+1234567890',
          bio: 'Test bio',
        });
        
        const response = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: jsonBody,
        });
        
        const data = await response.json();
        return {
          test: 'unsupported_content_type',
          description: 'Request with application/json instead of multipart/form-data',
          status: response.status,
          expectedStatus: 415,
          expectedCode: 'UNSUPPORTED_MEDIA_TYPE',
          passed: response.status === 415 && data.code === 'UNSUPPORTED_MEDIA_TYPE',
          response: data,
        };
      }
      
      case 'missing_name': {
        const formData = new FormData();
        const imageBlob = new Blob([createValidPNG()], { type: 'image/png' });
        formData.append('profileImage', imageBlob, 'test.png');
        formData.append('email', 'test@example.com');
        formData.append('whatsapp', '+1234567890');
        formData.append('bio', 'Test bio');
        
        const response = await fetch(baseUrl, {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        return {
          test: 'missing_name',
          description: 'Request without name field',
          status: response.status,
          expectedStatus: 400,
          expectedCode: 'MISSING_NAME',
          passed: response.status === 400 && data.code === 'MISSING_NAME',
          response: data,
        };
      }
      
      case 'missing_email': {
        const formData = new FormData();
        const imageBlob = new Blob([createValidPNG()], { type: 'image/png' });
        formData.append('profileImage', imageBlob, 'test.png');
        formData.append('name', 'Test User');
        formData.append('whatsapp', '+1234567890');
        formData.append('bio', 'Test bio');
        
        const response = await fetch(baseUrl, {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        return {
          test: 'missing_email',
          description: 'Request without email field',
          status: response.status,
          expectedStatus: 400,
          expectedCode: 'MISSING_EMAIL',
          passed: response.status === 400 && data.code === 'MISSING_EMAIL',
          response: data,
        };
      }
      
      case 'missing_whatsapp': {
        const formData = new FormData();
        const imageBlob = new Blob([createValidPNG()], { type: 'image/png' });
        formData.append('profileImage', imageBlob, 'test.png');
        formData.append('name', 'Test User');
        formData.append('email', 'test@example.com');
        formData.append('bio', 'Test bio');
        
        const response = await fetch(baseUrl, {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        return {
          test: 'missing_whatsapp',
          description: 'Request without whatsapp field',
          status: response.status,
          expectedStatus: 400,
          expectedCode: 'MISSING_WHATSAPP',
          passed: response.status === 400 && data.code === 'MISSING_WHATSAPP',
          response: data,
        };
      }
      
      case 'valid': {
        const formData = new FormData();
        const imageBlob = new Blob([createValidPNG()], { type: 'image/png' });
        formData.append('profileImage', imageBlob, 'test.png');
        formData.append('name', 'Valid Test User');
        formData.append('email', 'valid@example.com');
        formData.append('whatsapp', '+1234567890');
        formData.append('bio', 'Valid test bio');
        
        const response = await fetch(baseUrl, {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        return {
          test: 'valid',
          description: 'Valid request with all required fields and valid image',
          status: response.status,
          expectedStatus: 201,
          passed: response.status === 201 && data.profileImage !== undefined && data.profileImage.startsWith('data:image/'),
          response: data,
        };
      }
      
      default:
        return {
          error: 'Unknown test name',
          availableTests: [
            'missing_image',
            'invalid_type',
            'oversized',
            'unsupported_content_type',
            'missing_name',
            'missing_email',
            'missing_whatsapp',
            'valid',
          ],
        };
    }
  } catch (error) {
    return {
      test: testName,
      error: 'Test execution failed',
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testName = searchParams.get('test');
    
    if (!testName) {
      return NextResponse.json({
        message: 'Applications API Validation Test Suite',
        usage: 'Add ?test=<test_name> to run a specific test',
        availableTests: [
          {
            name: 'missing_image',
            description: 'Test missing image field → 400 MISSING_IMAGE',
          },
          {
            name: 'invalid_type',
            description: 'Test invalid image type (text/plain) → 400 INVALID_IMAGE_TYPE',
          },
          {
            name: 'oversized',
            description: 'Test oversized image (>2MB) → 400 IMAGE_TOO_LARGE',
          },
          {
            name: 'unsupported_content_type',
            description: 'Test non-multipart/form-data Content-Type → 415 UNSUPPORTED_MEDIA_TYPE',
          },
          {
            name: 'missing_name',
            description: 'Test missing name field → 400 MISSING_REQUIRED_FIELD',
          },
          {
            name: 'missing_email',
            description: 'Test missing email field → 400 MISSING_REQUIRED_FIELD',
          },
          {
            name: 'missing_whatsapp',
            description: 'Test missing whatsapp field → 400 MISSING_REQUIRED_FIELD',
          },
          {
            name: 'valid',
            description: 'Test valid request → 201 with profileImage field',
          },
        ],
        examples: [
          '/api/test-applications?test=missing_image',
          '/api/test-applications?test=invalid_type',
          '/api/test-applications?test=valid',
        ],
      });
    }
    
    const result = await runTest(testName);
    
    return NextResponse.json({
      testResult: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tests = searchParams.get('tests');
    
    if (tests === 'all') {
      const allTests = [
        'missing_image',
        'invalid_type',
        'oversized',
        'unsupported_content_type',
        'missing_name',
        'missing_email',
        'missing_whatsapp',
        'valid',
      ];
      
      const results = [];
      for (const testName of allTests) {
        const result = await runTest(testName);
        results.push(result);
      }
      
      const passedCount = results.filter(r => r.passed).length;
      const totalCount = results.length;
      
      return NextResponse.json({
        summary: {
          total: totalCount,
          passed: passedCount,
          failed: totalCount - passedCount,
          successRate: `${((passedCount / totalCount) * 100).toFixed(2)}%`,
        },
        results,
        timestamp: new Date().toISOString(),
      });
    }
    
    const body = await request.json();
    const testName = body.test;
    
    if (!testName) {
      return NextResponse.json(
        {
          error: 'Test name is required',
          code: 'MISSING_TEST_NAME',
          usage: 'POST with { "test": "<test_name>" } or use ?tests=all query parameter',
        },
        { status: 400 }
      );
    }
    
    const result = await runTest(testName);
    
    return NextResponse.json({
      testResult: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 }
    );
  }
}