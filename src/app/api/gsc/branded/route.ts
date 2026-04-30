import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function fetchLLM(prompt: string, provider: string, apiKey: string): Promise<string | null> {
  try {
    let text = '';
    if (provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 512, messages: [{ role: 'user', content: prompt }] }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      text = data.content?.[0]?.text ?? '';
    } else if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }] }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      text = data.choices?.[0]?.message?.content ?? '';
    } else if (provider === 'gemini') {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    } else if (provider === 'openrouter') {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'anthropic/claude-3.5-haiku', messages: [{ role: 'user', content: prompt }] }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      text = data.choices?.[0]?.message?.content ?? '';
    }
    return text;
  } catch { return null; }
}

// GET /api/gsc/branded?siteId=&aiProvider=&aiApiKey=
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const siteId   = searchParams.get('siteId') ?? '';
  const provider = searchParams.get('aiProvider') ?? 'anthropic';
  const apiKey   = searchParams.get('aiApiKey') ?? '';

  const site = await prisma.site.findFirst({ where: { id: siteId, userId } });
  if (!site) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Extract domain brand from siteId
  const domainBrand = site.siteId
    .replace(/^https?:\/\//, '')
    .replace(/^sc-domain:/, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .split('.')[0]
    .toLowerCase();

  if (!apiKey) {
    return NextResponse.json({ branded: [domainBrand] });
  }

  // Fetch top 100 queries
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const rows = await prisma.dailyMetric.groupBy({
    by: ['query'],
    where: { siteId, date: { gte: since } },
    _sum: { impressions: true },
    orderBy: { _sum: { impressions: 'desc' } },
    take: 100,
  });

  const queries = rows.map(r => r.query);

  const prompt = `You are an SEO expert. The website domain is "${domainBrand}".

Identify which of these search queries are branded (contain the brand name, company name, or branded product names).

Queries:
${queries.map(q => `"${q}"`).join('\n')}

Return ONLY a JSON array of the brand terms found (lowercase, max 10), no explanation:
["brand1", "brand2"]

If no clear brand terms found beyond the domain name, return: ["${domainBrand}"]`;

  const text = await fetchLLM(prompt, provider, apiKey);
  if (!text) return NextResponse.json({ branded: [domainBrand] });

  try {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      const branded = JSON.parse(match[0]) as string[];
      const unique = [...new Set([domainBrand, ...branded.map((b: string) => b.toLowerCase())])].slice(0, 15);
      return NextResponse.json({ branded: unique });
    }
  } catch {}

  return NextResponse.json({ branded: [domainBrand] });
}
