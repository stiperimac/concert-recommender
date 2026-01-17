import { getAllUsersWithLikes, getUserLikedArtistIds, isFollowing, getArtistById } from '@/lib/repo';
import { getSessionUser } from '@/lib/server-auth';
import { getDb } from '@/lib/repo';

// Get similar users for following recommendations
export async function GET(req: Request) {
  const { userId } = await getSessionUser();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  try {
    if (action === 'similar') {
      // Find similar users based on liked artists
      const myLikes = new Set(await getUserLikedArtistIds(userId, 100));
      const allUsers = await getAllUsersWithLikes(200);

      // Calculate Jaccard similarity
      const jaccard = (a: Set<string>, b: Set<string>) => {
        const inter = new Set([...a].filter((x) => b.has(x)));
        const union = new Set([...a, ...b]);
        return union.size ? inter.size / union.size : 0;
      };

      const scoredUsers = await Promise.all(
        allUsers
          .filter((u) => u._id !== userId)
          .map(async (u) => {
            const sim = jaccard(myLikes, new Set(u.likes));
            const following = await isFollowing(userId, u._id);

            // Get user info from NextAuth users collection
            const db = await getDb();
            const userDoc = await db.collection('users').findOne({ id: u._id }).catch(() => null);

            // Get some liked artists' names for display
            const likedArtistNames: string[] = [];
            for (const artistId of u.likes.slice(0, 3)) {
              try {
                const artist = await getArtistById(artistId);
                if (artist) likedArtistNames.push(artist.name);
              } catch {
                // Skip
              }
            }

            return {
              userId: u._id,
              similarity: Math.round(sim * 100),
              likesCount: u.likes.length,
              isFollowing: following,
              name: userDoc?.name || undefined,
              image: userDoc?.image || undefined,
              likedArtists: likedArtistNames,
            };
          })
      );

      const similar = scoredUsers
        .filter((u) => u.similarity > 0)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 20);

      return Response.json({ users: similar });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Error' }, { status: 500 });
  }
}

