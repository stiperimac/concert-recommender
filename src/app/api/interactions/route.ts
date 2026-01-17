import { addInteraction } from '@/lib/repo';
import { getSessionUser } from '@/lib/server-auth';

export async function POST(req: Request) {
  const { userId } = await getSessionUser();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body: any = await req.json().catch(() => ({}));
  const type = body.type;
  const targetType = body.targetType;
  const targetId = body.targetId;

  if (!['like_artist', 'save_event', 'view_event'].includes(type)) {
    return Response.json({ error: 'Invalid type' }, { status: 400 });
  }
  if (!['artist', 'event'].includes(targetType)) {
    return Response.json({ error: 'Invalid targetType' }, { status: 400 });
  }
  if (typeof targetId !== 'string' || targetId.length < 8) {
    return Response.json({ error: 'Invalid targetId' }, { status: 400 });
  }

  await addInteraction({ userId, type, targetType, targetId });
  return Response.json({ ok: true });
}
