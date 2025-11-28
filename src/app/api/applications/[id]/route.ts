import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { applications } from '@/db/schema';
import { eq } from 'drizzle-orm';

const ALLOWED_STATUS_VALUES = ['pending', 'approved', 'rejected'] as const;

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Validate ID parameter
    if (!id || isNaN(parseInt(id)) || parseInt(id) <= 0) {
      return NextResponse.json(
        {
          error: 'Valid ID is required',
          code: 'INVALID_ID',
        },
        { status: 400 }
      );
    }

    const applicationId = parseInt(id);

    // Parse request body
    const body = await request.json();
    const { status } = body;

    // Validate status field
    if (!status) {
      return NextResponse.json(
        {
          error: 'Status field is required',
          code: 'MISSING_STATUS',
        },
        { status: 400 }
      );
    }

    // Validate status value
    if (!ALLOWED_STATUS_VALUES.includes(status)) {
      return NextResponse.json(
        {
          error: `Status must be one of: ${ALLOWED_STATUS_VALUES.join(', ')}`,
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    // Check if application exists
    const existingApplication = await db
      .select()
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1);

    if (existingApplication.length === 0) {
      return NextResponse.json(
        {
          error: 'Application not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Update application status
    const updated = await db
      .update(applications)
      .set({
        status: status,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, applicationId))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
}