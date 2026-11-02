import pg from 'pg';
import { MongoClient, Long } from 'mongodb';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PG_CONFIG = {
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5433'),
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || '365891',
};

const MONGO_PASSWORD = process.env.MONGODB_PASSWORD || 'novelforge_password';
const MONGO_URI = process.env.MONGO_URI || `mongodb://novelforge:${MONGO_PASSWORD}@localhost:27018/novelforge_chapters?authSource=admin`;
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8080';

const TEST_PASSWORD = 'Password123!';
const PASSWORD_HASH = bcrypt.hashSync(TEST_PASSWORD, 10);

console.log('--- Starting NovelForge Performance Data Seeding ---');
console.log(`Generated BCrypt hash for '${TEST_PASSWORD}': ${PASSWORD_HASH}`);

async function seedUsers() {
  const client = new pg.Client({ ...PG_CONFIG, database: 'userDB' });
  await client.connect();
  console.log('Connected to PostgreSQL: userDB');

  try {
    // 1. Ensure all test users have known password
    await client.query(`
      UPDATE users 
      SET password_hash = $1, email_verified = true, account_status = 'ACTIVE', creator_status = 'ACTIVE' 
      WHERE id = 1 OR username LIKE 'perf_user_%'
    `, [PASSWORD_HASH]);

    // 2. Check how many users exist
    const countRes = await client.query(`SELECT count(*) FROM users WHERE username LIKE 'perf_user_%'`);
    const existingPerfUsers = parseInt(countRes.rows[0].count);

    if (existingPerfUsers < 50) {
      console.log(`Seeding ${50 - existingPerfUsers} performance test users...`);
      for (let i = existingPerfUsers + 1; i <= 50; i++) {
        const username = `perf_user_${i}`;
        const email = `perf_user_${i}@novelforge.local`;
        
        const userRes = await client.query(`
          INSERT INTO users (username, email, password_hash, account_status, creator_status, email_verified, created_at, updated_at)
          VALUES ($1, $2, $3, 'ACTIVE', 'ACTIVE', true, NOW(), NOW())
          ON CONFLICT (username) DO UPDATE SET password_hash = $3
          RETURNING id
        `, [username, email, PASSWORD_HASH]);
        
        const userId = userRes.rows[0].id;
        
        await client.query(`
          INSERT INTO user_roles (user_id, role)
          VALUES ($1, 'USER')
          ON CONFLICT DO NOTHING
        `, [userId]);

        await client.query(`
          INSERT INTO user_profiles (id, display_name, bio, creator_status, visibility, created_at, updated_at)
          VALUES ($1, $2, $3, 'ACTIVE', 'PUBLIC', NOW(), NOW())
          ON CONFLICT (id) DO NOTHING
        `, [userId, `Performance User ${i}`, `Synthetically generated test account ${i}`]);
      }
      console.log('50 performance test users seeded successfully.');
    } else {
      console.log(`Already have ${existingPerfUsers} performance test users. Skipping user creation.`);
    }
  } finally {
    await client.end();
  }
}

async function seedNovelsAndChapters() {
  const pgNovel = new pg.Client({ ...PG_CONFIG, database: 'novelDB' });
  await pgNovel.connect();
  console.log('Connected to PostgreSQL: novelDB');

  const mongoClient = new MongoClient(MONGO_URI);
  await mongoClient.connect();
  const mongoDb = mongoClient.db('novelforge_chapters');
  const chaptersColl = mongoDb.collection('chapters');
  console.log('Connected to MongoDB: novelforge_chapters');

  try {
    // Ensure PostgreSQL identity sequence is aligned with existing records
    await pgNovel.query(`SELECT setval(pg_get_serial_sequence('novel', 'id'), COALESCE(max(id), 1)) FROM novel;`);

    const novelCountRes = await pgNovel.query(`SELECT count(*) FROM novel WHERE title LIKE 'Perf Epic %'`);
    const existingNovels = parseInt(novelCountRes.rows[0].count);

    const targetNovels = 200;
    const chaptersPerNovel = 10; // 200 * 10 = 2,000 chapters

    // Default studio ID
    const studioId = 'e8a2a781-6450-4d43-9844-3d90616bfa01';

    // Migrate any existing MongoDB chapters to ensure BSON Long novelId and deletedAt: null
    const allChapters = await chaptersColl.find({ novelId: { $type: 'double' } }).toArray();
    if (allChapters.length > 0) {
      console.log(`Migrating ${allChapters.length} existing chapters to BSON Long...`);
      for (const ch of allChapters) {
        await chaptersColl.updateOne(
          { _id: ch._id },
          { $set: { novelId: Long.fromNumber(Number(ch.novelId)), deletedAt: null } }
        );
      }
    }

    if (existingNovels < targetNovels) {
      console.log(`Seeding ${targetNovels - existingNovels} novels and ${(targetNovels - existingNovels) * chaptersPerNovel} chapters...`);
      
      const genresList = ['fantasy', 'scifi', 'action', 'adventure', 'romance', 'mystery', 'thriller', 'cyberpunk'];
      const tagsList = ['progression', 'martial-arts', 'magic', 'dystopian', 'space', 'supernatural', 'dragons'];

      for (let i = existingNovels + 1; i <= targetNovels; i++) {
        const title = `Perf Epic ${i}: Journey Beyond the Stars`;
        const synopsis = `An epic high-fantasy progression chronicle across celestial realms in volume ${i}. Experience rich worldbuilding and intense battles.`;
        const g1 = genresList[i % genresList.length];
        const g2 = genresList[(i + 3) % genresList.length];
        const t1 = tagsList[i % tagsList.length];
        const t2 = tagsList[(i + 2) % tagsList.length];

        const novelRes = await pgNovel.query(`
          INSERT INTO novel (studio_id, title, synopsis, category_type, publication_state, published_at, created_at, updated_at)
          VALUES ($1, $2, $3, 'FICTION', 'PUBLISHED', NOW(), NOW(), NOW())
          RETURNING id
        `, [studioId, title, synopsis]);

        const novelId = novelRes.rows[0].id;

        await pgNovel.query(`
          INSERT INTO novel_genre_values (novel_id, genre_slug) VALUES ($1, $2), ($1, $3)
          ON CONFLICT DO NOTHING
        `, [novelId, g1, g2]);

        await pgNovel.query(`
          INSERT INTO novel_tag_values (novel_id, tag_slug) VALUES ($1, $2), ($1, $3)
          ON CONFLICT DO NOTHING
        `, [novelId, t1, t2]);

        // Insert 10 chapters into MongoDB
        const chapterDocs = [];
        for (let ch = 1; ch <= chaptersPerNovel; ch++) {
          const chapterUuid = `perf-${novelId}-${ch}-${Date.now().toString(36)}`;
          chapterDocs.push({
            _id: chapterUuid,
            _class: 'com.vivek.novelforge.novel.entity.Chapter',
            novelId: Long.fromNumber(Number(novelId)),
            chapterNumber: ch,
            title: `Chapter ${ch}: Dawn of Section ${i}`,
            publicationState: 'PUBLISHED',
            publishedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            version: Long.fromNumber(0),
            blocks: [
              {
                id: `block-${chapterUuid}-1`,
                position: 0,
                type: 'TEXT',
                text: `The wind howled through the granite pass as warrior ${i} gripped their etched catalyst. Section ${ch} had begun with an unearthly hum that shook the temple foundation.`
              },
              {
                id: `block-${chapterUuid}-2`,
                position: 1,
                type: 'TEXT',
                text: `Beneath the crimson clouds, ancient runes sparked into life. Each line of prose resonates with centuries of celestial lore, awaiting the chosen protagonist.`
              },
              {
                id: `block-${chapterUuid}-3`,
                position: 2,
                type: 'TEXT',
                text: `Never falter in the face of the encroaching abyss, muttered the elder mentor. For beyond this trial lies the supreme ascension.`
              }
            ]
          });
        }
        await chaptersColl.insertMany(chapterDocs);
      }
      console.log('200 novels and 2,000 chapters seeded successfully.');
    } else {
      console.log(`Already have ${existingNovels} performance test novels. Skipping novel seeding.`);
    }
  } finally {
    await pgNovel.end();
    await mongoClient.close();
  }
}

async function seedEngagement() {
  const pgEngagement = new pg.Client({ ...PG_CONFIG, database: 'engagementDB' });
  await pgEngagement.connect();
  console.log('Connected to PostgreSQL: engagementDB');

  try {
    await pgEngagement.query(`SELECT setval(pg_get_serial_sequence('engagement_posts', 'id'), COALESCE(max(id), 1)) FROM engagement_posts;`);
    await pgEngagement.query(`SELECT setval(pg_get_serial_sequence('engagement_comments', 'id'), COALESCE(max(id), 1)) FROM engagement_comments;`);

    const postCountRes = await pgEngagement.query(`SELECT count(*) FROM engagement_posts WHERE content LIKE 'Perf Social Post %'`);
    const existingPosts = parseInt(postCountRes.rows[0].count);

    if (existingPosts < 50) {
      console.log('Seeding 50 community posts and sample likes/comments...');
      for (let i = existingPosts + 1; i <= 50; i++) {
        const postRes = await pgEngagement.query(`
          INSERT INTO engagement_posts (author_type, author_id, created_by_user_id, content, created_at, updated_at)
          VALUES ('CREATOR', $1, $2, $3, NOW(), NOW())
          RETURNING id
        `, [String(i), i, `Perf Social Post ${i}: What are your thoughts on chapter progression in fantasy arcs? #discussion #novels`]);

        const postId = postRes.rows[0].id;

        await pgEngagement.query(`
          INSERT INTO engagement_post_tags (post_id, tag)
          VALUES ($1, 'discussion'), ($1, 'novels')
          ON CONFLICT DO NOTHING
        `, [postId]);

        // Add 2 comments per post
        await pgEngagement.query(`
          INSERT INTO engagement_comments (target_type, target_id, user_id, content, created_at, updated_at)
          VALUES 
            ('POST', $1, 1, 'Incredible narrative depth! Excited for the next arc.', NOW(), NOW()),
            ('POST', $1, 2, 'The worldbuilding in this series is unmatched.', NOW(), NOW())
        `, [String(postId)]);

        // Add 3 likes per post
        await pgEngagement.query(`
          INSERT INTO engagement_likes (target_type, target_id, user_id, created_at, updated_at)
          VALUES 
            ('POST', $1, 1, NOW(), NOW()),
            ('POST', $1, 2, NOW(), NOW()),
            ('POST', $1, 3, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, [String(postId)]);
      }
      console.log('50 community posts, comments, and likes seeded.');
    } else {
      console.log(`Already have ${existingPosts} community posts.`);
    }
  } finally {
    await pgEngagement.end();
  }
}

async function harvestTokens() {
  console.log('Logging in test users to harvest valid JWT access tokens...');
  const tokens = [];

  for (let i = 1; i <= 50; i++) {
    const username = `perf_user_${i}`;
    try {
      const resp = await fetch(`${GATEWAY_URL}/api/v1/identity/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: username,
          password: TEST_PASSWORD
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        tokens.push({
          userId: data.id,
          username: data.username,
          accessToken: data.accessToken
        });
      } else {
        console.warn(`Failed login for ${username}: HTTP ${resp.status}`);
      }
    } catch (err) {
      console.error(`Error logging in ${username}:`, err.message);
    }
  }

  // Also include DevilKiller
  try {
    const devilResp = await fetch(`${GATEWAY_URL}/api/v1/identity/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'DevilKiller', password: TEST_PASSWORD })
    });
    if (devilResp.ok) {
      const dData = await devilResp.json();
      tokens.unshift({ userId: dData.id, username: dData.username, accessToken: dData.accessToken });
    }
  } catch (e) {}

  const tokensPath = path.join(__dirname, 'tokens.json');
  fs.writeFileSync(tokensPath, JSON.stringify(tokens, null, 2));
  console.log(`Harvested ${tokens.length} valid JWT access tokens saved to ${tokensPath}`);
}

async function run() {
  try {
    await seedUsers();
    await seedNovelsAndChapters();
    await seedEngagement();
    await harvestTokens();
    console.log('=== SEEDING COMPLETED SUCCESSFULLY ===');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

run();
