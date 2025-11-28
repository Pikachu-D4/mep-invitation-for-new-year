import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Create a minimal 1x1 PNG image (base64 encoded)
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const pngBuffer = Buffer.from(pngBase64, 'base64');
    
    // Create a Blob from the buffer
    const imageBlob = new Blob([pngBuffer], { type: 'image/png' });
    
    // Create FormData with test values
    const formData = new FormData();
    formData.append('name', 'Test User');
    formData.append('email', 'test@example.com');
    formData.append('whatsapp', '+1234567890');
    formData.append('bio', 'Test bio');
    formData.append('profileImage', imageBlob, 'test.png');

    // Get the base URL from the request
    const baseUrl = request.nextUrl.origin;
    
    // Forward the request to /api/applications
    const response = await fetch(`${baseUrl}/api/applications`, {
      method: 'POST',
      body: formData,
    });

    // Get the response data
    const responseData = await response.json();

    // Return the response with the same status code
    return NextResponse.json(
      {
        success: response.ok,
        status: response.status,
        data: responseData,
      },
      { status: response.status }
    );
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      {
        error: 'Test endpoint failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'TEST_ENDPOINT_ERROR',
      },
      { status: 500 }
    );
  }
}