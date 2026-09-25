import { connect } from "mongoose";

const cache = (global.mongoose ??= { conn: null, promise: null });

/** Cached Mongo connection (survives hot reloads and serverless warm starts). */
export default async function connectDb() {
  if (cache.conn) return cache.conn;
  const url = process.env.MONGODB_URL;
  if (!url) throw new Error("MONGODB_URL is not set");
  cache.promise ??= connect(url).then((m) => m.connection);
  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null; // allow a retry on the next request
    throw err;
  }
  return cache.conn;
}
