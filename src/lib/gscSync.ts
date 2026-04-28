import { prisma } from '@/lib/prisma';
import { google } from 'googleapis';

let isSyncing = false;

export async function runGscSync() {
  if (isSyncing) {
    console.log('Sync already in progress. Skipping.');
    return;
  }
  isSyncing = true;
  try {
    console.log('Starting GSC Data Sync...');

  // 1. Get all Google accounts
  const accounts = await prisma.account.findMany({
    where: { provider: 'google' },
  });

  if (accounts.length === 0) {
    console.log('No Google accounts found. Exiting.');
    return;
  }

  // Define date range (e.g., last 3 days for a quick test)
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 2); // GSC data is usually 2 days behind
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 30); // fetch last 30 days

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  console.log(`Syncing data from ${startDateStr} to ${endDateStr}`);

  for (const account of accounts) {
    console.log(`Processing account: ${account.providerAccountId}`);
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: account.access_token,
      refresh_token: account.refresh_token,
      expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
    });

    oauth2Client.on('tokens', async (tokens) => {
      await prisma.account.update({
        where: { id: account.id },
        data: {
          access_token: tokens.access_token ?? account.access_token,
          refresh_token: tokens.refresh_token ?? account.refresh_token,
          expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : account.expires_at,
        },
      });
    });

    const webmasters = google.webmasters({ version: 'v3', auth: oauth2Client });

    let siteList;
    try {
      const response = await webmasters.sites.list();
      siteList = response.data.siteEntry || [];
    } catch (err: any) {
      console.error(`Failed to list sites for account ${account.id}: ${err.message}`);
      continue;
    }

    for (const site of siteList) {
      if (!site.siteUrl) continue;
      
      const cleanUrl = site.siteUrl.replace('sc-domain:', '');
      console.log(`- Fetching data for ${cleanUrl}...`);

      // Check if site exists in our DB
      const dbSite = await prisma.site.findFirst({
        where: { url: cleanUrl }
      });

      if (!dbSite) {
        console.log(`  Skipping (not in DB yet)`);
        continue;
      }

      try {
        // Fetch site-wide daily aggregates (no dimensions except date)
        const res = await webmasters.searchanalytics.query({
          siteUrl: site.siteUrl,
          requestBody: {
            startDate: startDateStr,
            endDate: endDateStr,
            dimensions: ['date'],
            rowLimit: 25000,
          },
        });

        const rows = res.data.rows || [];
        console.log(`  Found ${rows.length} days of data`);

        for (const row of rows) {
          if (!row.keys || !row.keys[0]) continue;
          
          const dateStr = row.keys[0]; // e.g. "2024-01-01"
          const dateObj = new Date(dateStr);

          // We use query="" and url="" to represent site-wide aggregates
          // For query-level and page-level data, we would add another API call with those dimensions.
          const existing = await prisma.dailyMetric.findFirst({
            where: {
              siteId: dbSite.id,
              date: dateObj,
              query: "",
              url: "",
            }
          });

          if (!existing) {
            await prisma.dailyMetric.create({
              data: {
                siteId: dbSite.id,
                date: dateObj,
                query: "",
                url: "",
                clicks: row.clicks || 0,
                impressions: row.impressions || 0,
                ctr: row.ctr || 0,
                position: row.position || 0,
              }
            });
          } else {
            await prisma.dailyMetric.update({
              where: { id: existing.id },
              data: {
                clicks: row.clicks || 0,
                impressions: row.impressions || 0,
                ctr: row.ctr || 0,
                position: row.position || 0,
              }
            });
          }
        }

      } catch (err: any) {
        console.error(`  Error fetching analytics: ${err.message}`);
      }
    }
  }

  } catch (e) {
    console.error("Sync failed:", e);
  } finally {
    isSyncing = false;
    console.log('Sync complete!');
  }
}
