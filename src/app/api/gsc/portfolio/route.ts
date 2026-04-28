import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function periodToDays(period: string): number {
  const today = new Date();
  const map: Record<string, number> = {
    yesterday: 1,
    '7d': 7, '14d': 14, '28d': 28,
    last_week: 7,
    this_month: today.getDate(),
    last_month: new Date(today.getFullYear(), today.getMonth(), 0).getDate(),
    this_quarter: 90, last_quarter: 90,
    ytd: Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / 86400000),
    '3m': 90, '6m': 180, '8m': 240, '12m': 365, '16m': 480, '2y': 730, '3y': 1095,
  };
  return map[period] ?? 28;
}

function pct(curr: number, prev: number) {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || '7d';
  const days = periodToDays(period);

  // Date windows (GSC lags ~2 days)
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 2);
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - days + 1);
  startDate.setHours(0, 0, 0, 0);

  const prevEnd = new Date(startDate);
  prevEnd.setDate(startDate.getDate() - 1);
  prevEnd.setHours(23, 59, 59, 999);

  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevEnd.getDate() - days + 1);
  prevStart.setHours(0, 0, 0, 0);

  const sites = await prisma.site.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });

  const result = await Promise.all(
    sites.map(async (site) => {
      const [currRows, prevRows] = await Promise.all([
        prisma.dailyMetric.findMany({
          where: { siteId: site.id, date: { gte: startDate, lte: endDate }, url: '', query: '' },
          orderBy: { date: 'asc' },
        }),
        prisma.dailyMetric.findMany({
          where: { siteId: site.id, date: { gte: prevStart, lte: prevEnd }, url: '', query: '' },
        }),
      ]);

      // Summaries
      const sum = (rows: typeof currRows) =>
        rows.reduce(
          (a, m) => ({ clicks: a.clicks + m.clicks, impressions: a.impressions + m.impressions, ctr: a.ctr + m.ctr, position: a.position + m.position, n: a.n + 1 }),
          { clicks: 0, impressions: 0, ctr: 0, position: 0, n: 0 }
        );

      const c = sum(currRows);
      const p = sum(prevRows);

      const avgCtr = (s: typeof c) => (s.n > 0 ? +((s.ctr / s.n) * 100).toFixed(2) : 0);
      const avgPos = (s: typeof c) => (s.n > 0 ? +(s.position / s.n).toFixed(1) : 0);

      const summary = {
        clicks:      { value: c.clicks,      change: pct(c.clicks, p.clicks) },
        impressions: { value: c.impressions,  change: pct(c.impressions, p.impressions) },
        ctr:         { value: avgCtr(c),      change: pct(avgCtr(c), avgCtr(p)) },
        position:    { value: avgPos(c),      change: pct(avgPos(c), avgPos(p)) },
      };

      // Chart data (normalised 0–85 for sparkline)
      const norm = (arr: number[]) => {
        const lo = Math.min(...arr, 0), hi = Math.max(...arr, 1);
        return arr.map(v => hi === lo ? 50 : Math.round(((v - lo) / (hi - lo)) * 85 + 5));
      };

      const clicks      = currRows.map(r => r.clicks);
      const impressions = currRows.map(r => r.impressions);
      const ctrs        = currRows.map(r => +((r.ctr * 100).toFixed(2)));
      const positions   = currRows.map(r => +r.position.toFixed(1));

      const nC = norm(clicks), nI = norm(impressions), nT = norm(ctrs), nP = norm(positions);

      const data = currRows.map((r, i) => ({
        date: r.date.toISOString().split('T')[0],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: ctrs[i],
        position: positions[i],
        // comparison placeholders (prev period aligned to end)
        clicksC: 0, impressionsC: 0, ctrC: 0, positionC: 0,
        cN: nC[i], iN: nI[i], tN: nT[i], pN: nP[i],
        cCN: 0, iCN: 0, tCN: 0, pCN: 0,
      }));

      return { ...site, data, summary, hasData: currRows.length > 0 };
    })
  );

  return NextResponse.json({ sites: result });
}
