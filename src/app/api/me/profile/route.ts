import { ensureUserProfile, updateUserProfile } from '@/lib/repo';
import { getSessionUser } from '@/lib/server-auth';

export async function GET() {
  const { userId } = await getSessionUser();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await ensureUserProfile(userId);
  return Response.json({ profile });
}

export async function PATCH(req: Request) {
  const { userId } = await getSessionUser();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body: any = await req.json().catch(() => ({}));
  const patch: any = {};
  if (typeof body.city === 'string') patch.city = body.city;
  if (Array.isArray(body.favoriteArtists)) patch.favoriteArtists = body.favoriteArtists.map((x: any) => String(x)).filter(Boolean).slice(0, 30);
  if (typeof body.onboardingCompleted === 'boolean') patch.onboardingCompleted = body.onboardingCompleted;

  const profile = await updateUserProfile(userId, patch);
  return Response.json({ profile });
}
