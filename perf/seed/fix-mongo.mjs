import { MongoClient, Long } from 'mongodb';

const MONGO_PASSWORD = process.env.MONGODB_PASSWORD || 'novelforge_password';
const MONGO_URI = `mongodb://novelforge:${MONGO_PASSWORD}@localhost:27018/novelforge_chapters?authSource=admin`;

const client = new MongoClient(MONGO_URI);
await client.connect();
const db = client.db('novelforge_chapters');
const coll = db.collection('chapters');

console.log('Migrating chapters in MongoDB...');
const chapters = await coll.find({}).toArray();
console.log(`Found ${chapters.length} total chapters.`);

for (const ch of chapters) {
  const nid = Long.fromNumber(Number(ch.novelId));
  await coll.updateOne(
    { _id: ch._id },
    { $set: { novelId: nid, deletedAt: null } }
  );
}

console.log('Migration completed.');
await client.close();
