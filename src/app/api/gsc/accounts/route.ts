import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { google } from 'googleapis';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accounts = await prisma.account.findMany({
    where: { userId, provider: 'google' },
    select: { id: true, providerAccountId: true, scope: true, expires_at: true, access_token: true },
  });

  // Для каждого аккаунта получаем email через Google API
  const enriched = await Promise.all(
    accounts.map(async (acc: typeof accounts[number]) => {
      try {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET
        );
        oauth2Client.setCredentials({ access_token: acc.access_token });
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const info = await oauth2.userinfo.get();
        return {
          id: acc.id,
          email: info.data.email || acc.providerAccountId,
          picture: info.data.picture,
          connected: true,
        };
      } catch {
        return { id: acc.id, email: acc.providerAccountId, picture: null, connected: false };
      }
    })
  );

  return NextResponse.json({ accounts: enriched });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { accountId } = await req.json();

  await prisma.account.deleteMany({
    where: { id: accountId, userId },
  });

  return NextResponse.json({ success: true });
}
