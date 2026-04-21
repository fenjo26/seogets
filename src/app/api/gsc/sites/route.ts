import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { google } from 'googleapis';

async function fetchSitesForAccount(account: {
  id: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: number | null;
}) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  // Auto-save refreshed tokens back to DB
  oauth2Client.on('tokens', async (tokens) => {
    await prisma.account.update({
      where: { id: account.id },
      data: {
        access_token: tokens.access_token ?? account.access_token,
        refresh_token: tokens.refresh_token ?? account.refresh_token,
        expires_at: tokens.expiry_date
          ? Math.floor(tokens.expiry_date / 1000)
          : account.expires_at,
      },
    });
  });

  const webmasters = google.webmasters({ version: 'v3', auth: oauth2Client });
  const response = await webmasters.sites.list();
  return response.data.siteEntry || [];
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Fetch ALL linked Google accounts for the admin user ──────────────────
  const googleAccounts = await prisma.account.findMany({
    where: {
      userId,
      provider: 'google',
    },
    select: {
      id: true,
      access_token: true,
      refresh_token: true,
      expires_at: true,
    },
  });

  if (googleAccounts.length === 0) {
    // Return DB sites even if no accounts connected yet
    const dbSites = await prisma.site.findMany({ where: { userId } });
    return NextResponse.json({ sites: dbSites, connected_accounts: 0 });
  }

  // ── Process all accounts in parallel ─────────────────────────────────────
  const errors: string[] = [];
  const allSiteEntries: Array<{ siteUrl: string; accountId: string }> = [];

  await Promise.allSettled(
    googleAccounts.map(async (account: Parameters<typeof fetchSitesForAccount>[0]) => {
      try {
        const entries = await fetchSitesForAccount(account);
        entries.forEach((e) => {
          if (e.siteUrl) allSiteEntries.push({ siteUrl: e.siteUrl, accountId: account.id });
        });
      } catch (err: any) {
        errors.push(`Account ${account.id}: ${err.message}`);
      }
    })
  );

  // ── Upsert all sites into DB ──────────────────────────────────────────────
  for (const { siteUrl } of allSiteEntries) {
    const cleanUrl = siteUrl.replace('sc-domain:', '');
    await prisma.site.upsert({
      where: {
        userId_siteId: {
          userId,
          siteId: siteUrl,
        },
      },
      update: {},
      create: {
        userId,
        url: cleanUrl,
        siteId: siteUrl,
        tags: '',
      },
    });
  }

  const userSites = await prisma.site.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({
    sites: userSites,
    connected_accounts: googleAccounts.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
