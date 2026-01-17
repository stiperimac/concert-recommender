import { getFollowedUsersActivity, getArtistById, getEventById } from '@/lib/repo';
import { getSessionUser } from '@/lib/server-auth';
import { getDb } from '@/lib/repo';

export async function GET(req: Request) {
  const { userId } = await getSessionUser();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const limit = Number(url.searchParams.get('limit')) || 50;

  try {
    const activity = await getFollowedUsersActivity(userId, limit);
    const db = await getDb();

    // Enrich activity with user and target details
    const enrichedActivity = await Promise.all(
      activity.map(async (item) => {
        // Get user info
        const userDoc = await db.collection('users').findOne({ id: item.userId }).catch(() => null);

        // Get target info
        let targetName = '';
        let targetUrl = '';

        if (item.targetType === 'artist') {
          try {
            const artist = await getArtistById(item.targetId);
            if (artist) {
              targetName = artist.name;
              targetUrl = `/artists/${item.targetId}`;
            }
          } catch {
            // Skip
          }
        } else if (item.targetType === 'event') {
          try {
            const event = await getEventById(item.targetId);
            if (event) {
              targetName = event.name;
              targetUrl = `/events/${item.targetId}`;
            }
          } catch {
            // Skip
          }
        }

        // Generate action text
        let actionText = '';
        switch (item.type) {
          case 'like_artist':
            actionText = 'je označio/la izvođača kao omiljenog';
            break;
          case 'save_event':
            actionText = 'je spremio/la koncert';
            break;
          case 'view_event':
            actionText = 'je pregledao/la koncert';
            break;
          default:
            actionText = 'je interaktirao s';
        }

        return {
          id: item.id,
          userId: item.userId,
          userName: userDoc?.name || 'Korisnik',
          userImage: userDoc?.image || undefined,
          type: item.type,
          actionText,
          targetType: item.targetType,
          targetId: item.targetId,
          targetName,
          targetUrl,
          createdAt: item.createdAt,
        };
      })
    );

    // Filter out items where we couldn't get target info
    const filtered = enrichedActivity.filter((item) => item.targetName);

    return Response.json({ items: filtered });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Error' }, { status: 500 });
  }
}

