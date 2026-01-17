import {
  addFollow,
  removeFollow,
  getFollowing,
  getFollowers,
  isFollowing,
  countFollowers,
  countFollowing,
} from '@/lib/repo';
import { getSessionUser } from '@/lib/server-auth';

export async function GET(req: Request) {
  const { userId } = await getSessionUser();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const action = url.searchParams.get('action');
  const targetUserId = url.searchParams.get('userId');

  try {
    if (action === 'check' && targetUserId) {
      // Check if current user is following target user
      const following = await isFollowing(userId, targetUserId);
      return Response.json({ following });
    }

    if (action === 'stats' && targetUserId) {
      // Get follow stats for a user
      const followers = await countFollowers(targetUserId);
      const following = await countFollowing(targetUserId);
      return Response.json({ followers, following });
    }

    if (action === 'followers') {
      // Get followers of current user (or specified user)
      const target = targetUserId || userId;
      const followers = await getFollowers(target, 100);
      return Response.json({ followers });
    }

    if (action === 'following') {
      // Get users that current user (or specified user) is following
      const target = targetUserId || userId;
      const following = await getFollowing(target, 100);
      return Response.json({ following });
    }

    // Default: return current user's follow stats
    const followers = await countFollowers(userId);
    const following = await countFollowing(userId);
    const followingList = await getFollowing(userId, 50);
    return Response.json({ followers, following, followingList });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId } = await getSessionUser();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return Response.json({ error: 'targetUserId is required' }, { status: 400 });
    }

    if (targetUserId === userId) {
      return Response.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    await addFollow(userId, targetUserId);
    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { userId } = await getSessionUser();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const targetUserId = url.searchParams.get('userId');

  if (!targetUserId) {
    return Response.json({ error: 'userId is required' }, { status: 400 });
  }

  try {
    await removeFollow(userId, targetUserId);
    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Error' }, { status: 500 });
  }
}

