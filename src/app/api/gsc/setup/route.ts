import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { google } from 'googleapis';

// ─── Stop words for query clustering ─────────────────────────────────────────
const STOP = new Set([
  'the','a','an','to','from','in','at','for','with','how','what','where','when',
  'near','me','my','on','of','by','is','are','and','or','but','not','no',
  'best','top','cheap','good','great','new','old','get','all','this','that',
  'its','i','you','we','they','he','she','it','can','do','did','does','will',
  'was','were','be','been','being','have','has','had','vs','vs.','per',
]);

// ─── Language code prefixes to skip in URL paths ─────────────────────────────
const LANG = new Set(['el','de','fr','ru','en','es','it','pl','nl','pt','tr','ar','zh','bg','ro','cs','sk','hr','sr','uk','hu']);

function humanizeSlug(s: string): string {
  return s
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

function cuid(): string {
  return 'c' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
}

// ─── Build OAuth2 client ──────────────────────────────────────────────────────
function makeOAuth2(account: { id: string; access_token: string | null; refresh_token: string | null; expires_at: number | null }) {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });
  return oauth2;
}

// ─── Try each account until one succeeds ─────────────────────────────────────
async function queryGSC(
  accounts: { id: string; access_token: string | null; refresh_token: string | null; expires_at: number | null }[],
  siteUrl: string, startDate: string, endDate: string, dimension: string, rowLimit = 500
) {
  for (const account of accounts) {
    try {
      const oauth2 = makeOAuth2(account);
      const wm = google.webmasters({ version: 'v3', auth: oauth2 });
      const res = await wm.searchanalytics.query({
        siteUrl,
        requestBody: { startDate, endDate, dimensions: [dimension], rowLimit, dataState: 'final' },
      });
      return res.data.rows ?? [];
    } catch { continue; }
  }
  return [];
}

// ─── Algorithmic query clustering ────────────────────────────────────────────
function clusterQueries(rows: { label: string; impr: number }[]) {
  type WordEntry = { word: string; impr: number };

  // Extract significant words per query
  const queries = rows.map(r => ({
    ...r,
    words: r.label.toLowerCase()
      .split(/[\s,.()/]+/)
      .map(w => w.replace(/[^a-z0-9]/g, ''))
      .filter(w => w.length >= 3 && !STOP.has(w)),
  }));

  // Count word weight (impressions sum)
  const wordImpr = new Map<string, number>();
  for (const q of queries) {
    for (const w of q.words) {
      wordImpr.set(w, (wordImpr.get(w) ?? 0) + q.impr);
    }
  }

  // Top 14 seed words by impression weight
  const seeds: string[] = [...wordImpr.entries()]
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 14)
    .map(([w]) => w);

  // For each seed, collect queries that contain it
  const clusters: { name: string; values: string[]; count: number }[] = [];
  const assigned = new Set<number>();

  for (const seed of seeds) {
    const matching = queries
      .map((q, i) => ({ q, i }))
      .filter(({ q, i }) => !assigned.has(i) && q.words.includes(seed));

    if (matching.length < 2) continue;

    // Mark as assigned
    matching.forEach(({ i }) => assigned.add(i));

    // Collect up to 30 representative queries as pattern values
    const values = matching
      .sort((a, b) => b.q.impr - a.q.impr)
      .slice(0, 30)
      .map(({ q }) => q.label);

    clusters.push({ name: humanizeSlug(seed), values, count: matching.length });
  }

  // "Other" bucket for unassigned queries
  const others = queries.filter((_, i) => !assigned.has(i));
  if (others.length >= 3) {
    clusters.push({
      name: 'Other Queries',
      values: others.slice(0, 20).map(q => q.label),
      count: others.length,
    });
  }

  return clusters.slice(0, 15);
}

// ─── Algorithmic URL grouping ─────────────────────────────────────────────────
function groupPages(rows: { label: string; impr: number }[], domain: string) {
  type PageEntry = { label: string; impr: number; slug: string; seg: string };

  const pages: PageEntry[] = rows.map(r => {
    // Strip domain
    const path = r.label
      .replace(/^https?:\/\/[^/]+/, '')
      .replace(/\?.*$/, '')
      .replace(/\/$/, '') || '/';

    const segs = path.split('/').filter(Boolean);
    // Skip language codes
    const meaningful = segs.filter(s => !LANG.has(s.toLowerCase()));
    const seg = meaningful[0] || segs[0] || '';
    return { label: r.label, impr: r.impr, slug: path, seg: seg.toLowerCase() };
  });

  // Separate homepage
  const home = pages.filter(p => p.seg === '');
  const rest = pages.filter(p => p.seg !== '');

  // Group by first segment
  const segMap = new Map<string, PageEntry[]>();
  for (const p of rest) {
    if (!segMap.has(p.seg)) segMap.set(p.seg, []);
    segMap.get(p.seg)!.push(p);
  }

  const groups: { name: string; values: string[]; count: number; isEquals?: boolean }[] = [];

  // Homepage group
  if (home.length > 0) {
    groups.push({
      name: 'Homepage',
      values: home.map(p => p.label),
      count: home.length,
      isEquals: true,
    });
  }

  // Sorted by total impressions
  const sorted = [...segMap.entries()]
    .map(([seg, ps]) => ({ seg, ps, impr: ps.reduce((s, p) => s + p.impr, 0) }))
    .sort((a, b) => b.impr - a.impr)
    .slice(0, 14);

  for (const { seg, ps } of sorted) {
    groups.push({
      name: humanizeSlug(seg),
      // Use the slug fragment as the contains value (works across languages)
      values: [`/${seg}`],
      count: ps.length,
    });
  }

  return groups;
}

// ─── POST /api/gsc/setup ──────────────────────────────────────────────────────
// Body: { siteId: string }  (our DB siteId, not the GSC siteId)
// Returns generated clusters + groups for preview (does NOT save to DB)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const dbSiteId: string = body.siteId;

  const site = await prisma.site.findFirst({ where: { id: dbSiteId, userId } });
  if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 });

  const accounts = await prisma.account.findMany({
    where: { userId, provider: 'google' },
    select: { id: true, access_token: true, refresh_token: true, expires_at: true },
  });

  // Fetch last 90 days of query + page data
  const end = new Date(); end.setDate(end.getDate() - 3);
  const start = new Date(end); start.setDate(end.getDate() - 89);
  const endStr   = end.toISOString().split('T')[0];
  const startStr = start.toISOString().split('T')[0];

  const [queryRows, pageRows] = await Promise.all([
    queryGSC(accounts, site.siteId, startStr, endStr, 'query', 500),
    queryGSC(accounts, site.siteId, startStr, endStr, 'page',  500),
  ]);

  const queries = queryRows.map(r => ({ label: r.keys?.[0] ?? '', impr: r.impressions ?? 0 }));
  const pages   = pageRows.map(r =>  ({ label: r.keys?.[0] ?? '', impr: r.impressions ?? 0 }));

  const clusterDefs = clusterQueries(queries);
  const groupDefs   = groupPages(pages, site.url);

  // Shape for the client
  const clusters = clusterDefs.map(c => ({
    name:  c.name,
    rules: JSON.stringify([{ type: 'contains', values: c.values }]),
    count: c.count,
  }));

  const groups = groupDefs.map(g => ({
    name:  g.name,
    rules: JSON.stringify([{ type: g.isEquals ? 'equals' : 'contains', values: g.values }]),
    count: g.count,
  }));

  return NextResponse.json({ clusters, groups });
}
