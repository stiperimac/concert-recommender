import { addComment, getCommentsForTarget, deleteComment } from '@/lib/repo';
import { getSessionUser } from '@/lib/server-auth';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const targetType = url.searchParams.get('targetType') as 'artist' | 'event' | null;
  const targetId = url.searchParams.get('targetId');
  const limit = Number(url.searchParams.get('limit')) || 50;

  if (!targetType || !targetId) {
    return Response.json({ error: 'targetType and targetId are required' }, { status: 400 });
  }

  if (targetType !== 'artist' && targetType !== 'event') {
    return Response.json({ error: 'targetType must be artist or event' }, { status: 400 });
  }

  try {
    const comments = await getCommentsForTarget(targetType, targetId, limit);
    return Response.json({ comments });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId, name, image } = await getSessionUser();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { targetType, targetId, text } = body;

    if (!targetType || !targetId || !text) {
      return Response.json({ error: 'targetType, targetId, and text are required' }, { status: 400 });
    }

    if (targetType !== 'artist' && targetType !== 'event') {
      return Response.json({ error: 'targetType must be artist or event' }, { status: 400 });
    }

    if (typeof text !== 'string' || text.trim().length === 0) {
      return Response.json({ error: 'text cannot be empty' }, { status: 400 });
    }

    if (text.length > 1000) {
      return Response.json({ error: 'text is too long (max 1000 chars)' }, { status: 400 });
    }

    const commentId = await addComment({
      userId,
      userName: name || undefined,
      userImage: image || undefined,
      targetType,
      targetId,
      text: text.trim(),
    });

    return Response.json({ id: commentId });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { userId } = await getSessionUser();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const commentId = url.searchParams.get('id');

  if (!commentId) {
    return Response.json({ error: 'id is required' }, { status: 400 });
  }

  try {
    const deleted = await deleteComment(commentId, userId);
    if (!deleted) {
      return Response.json({ error: 'Comment not found or not authorized' }, { status: 404 });
    }
    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Error' }, { status: 500 });
  }
}

