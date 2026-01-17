import { MongoClient } from 'mongodb';

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export function getMongoClientPromise() {
  const uri = process.env.MONGODB_URI;
  // Do not throw synchronously (keeps `next build` and Docker builds working without secrets).
  if (!uri) {
    return Promise.reject(new Error('MONGODB_URI is not set'));
  }

  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }

  return global._mongoClientPromise;
}
