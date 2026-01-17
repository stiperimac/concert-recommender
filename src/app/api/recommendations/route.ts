import { computeRecommendations, getLatestRecommendations } from '@/lib/services/recommender';
import { getSessionUser } from '@/lib/server-auth';

export async function GET() {
  const { userId } = await getSessionUser();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const rec = await getLatestRecommendations(userId);
  if (!rec) return Response.json({ generatedAt: null, items: [] });
  return Response.json(rec);
}

export async function POST() {
  const { userId } = await getSessionUser();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await computeRecommendations({ userId, horizonDays: 60, limit: 15 });
    return Response.json(data);
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Error' }, { status: 400 });
  }
}
