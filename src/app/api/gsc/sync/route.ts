import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runGscSync } from '@/lib/gscSync';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fire and forget (do not await)
  runGscSync().catch(console.error);

  return NextResponse.json({ success: true, message: 'Sync started in background' });
}
