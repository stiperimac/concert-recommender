import { computeRecommendations, getLatestRecommendations } from '@/lib/services/recommender';
import { getSessionUser } from '@/lib/server-auth';

export async function GET() {
  const { userId } = await getSessionUser();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const rec = await getLatestRecommendations(userId);
  if (!rec) return Response.json({ generatedAt: null, items: [] });
  return Response.json(rec);
}

export async function POST(req: Request) {
  const { userId } = await getSessionUser();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // Parse query parameters for filters
  const url = new URL(req.url);
  const cityFilter = url.searchParams.get('city') || undefined;
  const dateFrom = url.searchParams.get('dateFrom') || undefined;
  const dateTo = url.searchParams.get('dateTo') || undefined;
  const horizonDays = Number(url.searchParams.get('horizon')) || 60;
  const limit = Number(url.searchParams.get('limit')) || 15;

  try {
    const data = await computeRecommendations({
      userId,
      horizonDays,
      limit,
      cityFilter,
      dateFrom,
      dateTo,
    });
    return Response.json(data);
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Error' }, { status: 400 });
  }
}
