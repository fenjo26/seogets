import { prisma } from '@/lib/prisma';
import { google } from 'googleapis';

let isSyncing = false;

function cleanSiteUrl(siteUrl: string): string {
  if (siteUrl.startsWith('sc-domain:')) {
    return siteUrl.slice('sc-domain:'.length);
  }
  try {
    return new URL(siteUrl).hostname;
  } catch {
    return siteUrl;
  }
}

export async function runGscSync() {
  if (isSyncing) {
    console.log('[GSC Sync] Already in progress — skipping.');
    return;
  }
  isSyncing = true;

  try {
    console.log('[GSC Sync] Starting…');

    // Include userId via the user relation so we can create sites per user
    const accounts = await prisma.account.findMany({
      where: { provider: 'google' },
      include: { user: { select: { id: true } } },
    });

    if (accounts.length === 0) {
      console.log('[GSC Sync] No Google accounts found.');
      return;
    }

    // GSC lags ~2 days
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 2);
    endDate.setHours(23, 59, 59, 999);

    // 16 months of history so all period selectors have real data
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 480);
    startDate.setHours(0, 0, 0, 0);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr   = endDate.toISOString().split('T')[0];

    console.log(`[GSC Sync] ${startDateStr} → ${endDateStr}`);

    for (const account of accounts) {
      const userId = account.user.id;
      console.log(`[GSC Sync] Account: ${account.providerAccountId} (user: ${userId})`);

      const oauth2 = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      oauth2.setCredentials({
        access_token:  account.access_token,
        refresh_token: account.refresh_token,
        expiry_date:   account.expires_at ? account.expires_at * 1000 : undefined,
      });
      oauth2.on('tokens', async (tokens) => {
        await prisma.account.update({
          where: { id: account.id },
          data: {
            access_token:  tokens.access_token  ?? account.access_token,
            refresh_token: tokens.refresh_token ?? account.refresh_token,
            expires_at:    tokens.expiry_date
              ? Math.floor(tokens.expiry_date / 1000)
              : account.expires_at,
          },
        });
      });

      const wm = google.webmasters({ version: 'v3', auth: oauth2 });

      let siteList: { siteUrl?: string | null; permissionLevel?: string | null }[] = [];
      try {
        const res = await wm.sites.list();
        siteList = res.data.siteEntry ?? [];
        console.log(`[GSC Sync]   Found ${siteList.length} sites in GSC`);
      } catch (err: any) {
        console.error(`[GSC Sync]   Failed to list sites: ${err.message}`);
        continue;
      }

      for (const gscSite of siteList) {
        if (!gscSite.siteUrl) continue;

        const gscUrl   = gscSite.siteUrl;
        const hostname = cleanSiteUrl(gscUrl);
        const hostnameNoWww = hostname.replace(/^www\./, '');

        // ── Step 1: ensure site exists in DB for this user ──────────────────
        let dbSite = await prisma.site.findFirst({
          where: {
            userId,
            OR: [
              { siteId: gscUrl },
              { url: hostname },
              { url: hostnameNoWww },
            ],
          },
        });

        if (!dbSite) {
          // Auto-create site for this user from this GSC account
          console.log(`[GSC Sync]   Creating new site: ${hostname} for user ${userId}`);
          try {
            dbSite = await prisma.site.create({
              data: {
                userId,
                siteId: gscUrl,
                url:    hostnameNoWww || hostname,
                tags:   '',
              },
            });
          } catch (err: any) {
            // May fail on duplicate userId+siteId — try to fetch instead
            dbSite = await prisma.site.findFirst({
              where: { userId, siteId: gscUrl },
            });
            if (!dbSite) {
              console.error(`[GSC Sync]   Could not create site: ${err.message}`);
              continue;
            }
          }
        } else if (dbSite.siteId !== gscUrl) {
          // Fix siteId if it was stored differently
          await prisma.site.update({
            where: { id: dbSite.id },
            data:  { siteId: gscUrl },
          }).catch(() => {});
        }

        // ── Step 2: sync daily metrics ───────────────────────────────────────
        console.log(`[GSC Sync]   Syncing ${hostname}…`);
        try {
          const res = await wm.searchanalytics.query({
            siteUrl: gscUrl,
            requestBody: {
              startDate:  startDateStr,
              endDate:    endDateStr,
              dimensions: ['date'],
              rowLimit:   25000,
              dataState:  'final',
            },
          });

          const rows = res.data.rows ?? [];
          console.log(`[GSC Sync]     ${rows.length} days of data`);

          for (const row of rows) {
            if (!row.keys?.[0]) continue;
            const dateObj = new Date(row.keys[0]);

            const existing = await prisma.dailyMetric.findFirst({
              where: { siteId: dbSite.id, date: dateObj, url: '', query: '' },
            });

            if (!existing) {
              await prisma.dailyMetric.create({
                data: {
                  siteId:      dbSite.id,
                  date:        dateObj,
                  url:         '',
                  query:       '',
                  clicks:      row.clicks      ?? 0,
                  impressions: row.impressions ?? 0,
                  ctr:         row.ctr         ?? 0,
                  position:    row.position    ?? 0,
                },
              });
            } else {
              await prisma.dailyMetric.update({
                where: { id: existing.id },
                data: {
                  clicks:      row.clicks      ?? 0,
                  impressions: row.impressions ?? 0,
                  ctr:         row.ctr         ?? 0,
                  position:    row.position    ?? 0,
                },
              });
            }
          }
        } catch (err: any) {
          console.error(`[GSC Sync]     Error syncing ${hostname}: ${err.message}`);
        }
      }
    }
  } catch (e) {
    console.error('[GSC Sync] Fatal error:', e);
  } finally {
    isSyncing = false;
    console.log('[GSC Sync] Done.');
  }
}
