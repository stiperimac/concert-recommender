import { getOrComputePopularity } from '@/lib/services/popularity';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const scope = (url.searchParams.get('scope') || 'artist') as any;
  const period = (url.searchParams.get('period') || 'month') as any;
  const limit = Number(url.searchParams.get('limit') || '30');

  try {
    const data = await getOrComputePopularity({ scope, period, limit });
    return Response.json(data);
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Error' }, { status: 400 });
  }
}
