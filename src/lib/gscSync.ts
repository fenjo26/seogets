import { prisma } from '@/lib/prisma';
import { google } from 'googleapis';

let isSyncing = false;

/**
 * Extract a clean hostname from a GSC siteUrl.
 * sc-domain:example.com  → example.com
 * https://example.com/   → example.com
 */
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

    const accounts = await prisma.account.findMany({
      where: { provider: 'google' },
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
      console.log(`[GSC Sync] Account: ${account.providerAccountId}`);

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

      let siteList: { siteUrl?: string | null }[] = [];
      try {
        const res = await wm.sites.list();
        siteList = res.data.siteEntry ?? [];
      } catch (err: any) {
        console.error(`[GSC Sync] Failed to list sites: ${err.message}`);
        continue;
      }

      for (const gscSite of siteList) {
        if (!gscSite.siteUrl) continue;

        const gscUrl   = gscSite.siteUrl;       // exact GSC key, e.g. sc-domain:foo.gr
        const hostname = cleanSiteUrl(gscUrl);  // e.g. foo.gr

        // Match DB site by siteId (exact) OR by url / url-without-www
        const dbSite = await prisma.site.findFirst({
          where: {
            OR: [
              { siteId: gscUrl },
              { url: hostname },
              { url: hostname.replace(/^www\./, '') },
            ],
          },
        });

        if (!dbSite) {
          console.log(`[GSC Sync]   ${hostname} — not in DB, skipping`);
          continue;
        }

        console.log(`[GSC Sync]   Syncing ${hostname}`);

        // Fix siteId in DB if it was stored differently
        if (dbSite.siteId !== gscUrl) {
          await prisma.site.update({
            where: { id: dbSite.id },
            data:  { siteId: gscUrl },
          }).catch(() => {});
        }

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
          console.log(`[GSC Sync]     ${rows.length} days`);

          for (const row of rows) {
            if (!row.keys?.[0]) continue;

            const dateObj = new Date(row.keys[0]);

            const existing = await prisma.dailyMetric.findFirst({
              where: {
                siteId: dbSite.id,
                date:   dateObj,
                url:    '',
                query:  '',
              },
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
          console.error(`[GSC Sync]     Error: ${err.message}`);
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
