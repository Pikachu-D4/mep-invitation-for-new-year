import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { leaders } from '@/db/schema';
import { sql, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const allLeaders = await db.select()
      .from(leaders)
      .orderBy(asc(leaders.position));

    return NextResponse.json(allLeaders, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)),
        code: 'SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const existingLeaders = await db.select({ count: sql<number>`count(*)` })
      .from(leaders);

    const count = existingLeaders[0]?.count || 0;

    if (count > 0) {
      return NextResponse.json(
        {
          error: 'Leaders already exist. Cannot initialize again.',
          code: 'LEADERS_ALREADY_EXIST'
        },
        { status: 400 }
      );
    }

    const currentTimestamp = new Date();
    const leaderSlots = Array.from({ length: 6 }, (_, index) => ({
      name: null,
      role: null,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
      status: 'open' as const,
      position: index + 1,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp
    }));

    const createdLeaders = await db.insert(leaders)
      .values(leaderSlots)
      .returning();

    return NextResponse.json(createdLeaders, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)),
        code: 'SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}