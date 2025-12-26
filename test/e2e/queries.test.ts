import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { CamelCasePlugin, Kysely, PostgresDialect, sql, type Insertable, type Updateable } from 'kysely';
import { Pool } from 'pg';
import type { DB, User, StatusEnum } from '../fixtures/generated-types';
import type { DB as CamelDB, User as CamelUser } from '../fixtures/generated-types-camel';

const TEST_DATABASE_URL = 'postgres://test_user:test_password@localhost:5433/test_db';

describe('E2E: Queries', () => {
  let db: Kysely<DB>;
  let camelDb: Kysely<CamelDB>;

  beforeAll(async () => {
    db = new Kysely<DB>({
      dialect: new PostgresDialect({ pool: new Pool({ connectionString: TEST_DATABASE_URL }) }),
    });
    camelDb = new Kysely<CamelDB>({
      dialect: new PostgresDialect({ pool: new Pool({ connectionString: TEST_DATABASE_URL }) }),
      plugins: [new CamelCasePlugin()],
    });
  });

  afterAll(async () => {
    await db.destroy();
    await camelDb.destroy();
  });

  beforeEach(async () => {
    await db.deleteFrom('comments').execute();
    await db.deleteFrom('posts').execute();
    await db.deleteFrom('users').execute();
  });

  describe('snake_case types', () => {
    describe('SELECT', () => {
      test('selectAll', async () => {
        await db.insertInto('users').values({ email: 'test@example.com', username: 'testuser' }).execute();
        const users = await db.selectFrom('users').selectAll().execute();

        expect(users.length).toBe(1);
        expect(users[0].email).toBe('test@example.com');
      });

      test('select specific columns', async () => {
        await db.insertInto('users').values({ email: 'test@example.com', username: 'testuser' }).execute();
        const result = await db.selectFrom('users').select(['id', 'email', 'is_active']).executeTakeFirst();

        expect(typeof result!.id).toBe('number');
        expect(typeof result!.email).toBe('string');
        expect(typeof result!.is_active).toBe('boolean');
      });

      test('nullable columns', async () => {
        await db.insertInto('users').values({ email: 'test@example.com', username: 'testuser' }).execute();
        const result = await db.selectFrom('users').select(['updated_at', 'metadata']).executeTakeFirst();

        expect(result!.updated_at).toBeNull();
        expect(result!.metadata).toBeNull();
      });
    });

    describe('INSERT', () => {
      test('Generated columns are optional', async () => {
        const newUser: Insertable<User> = { email: 'test@example.com', username: 'testuser' };
        const result = await db.insertInto('users').values(newUser).returning(['id', 'created_at']).executeTakeFirstOrThrow();

        expect(result.id).toBeGreaterThan(0);
        expect(result.created_at).toBeInstanceOf(Date);
      });

      test('string accepted for Date fields (ColumnType)', async () => {
        const result = await db
          .insertInto('users')
          .values({ email: 'test@example.com', username: 'testuser', created_at: '2024-01-01T00:00:00Z' })
          .returning('created_at')
          .executeTakeFirstOrThrow();

        expect(result.created_at).toBeInstanceOf(Date);
      });

      test('enum columns', async () => {
        const user = await db.insertInto('users').values({ email: 'test@example.com', username: 'testuser' }).returning('id').executeTakeFirstOrThrow();
        const post = await db.insertInto('posts').values({ user_id: user.id, title: 'Post' }).returning('id').executeTakeFirstOrThrow();

        const status: StatusEnum = 'approved';
        const comment = await db
          .insertInto('comments')
          .values({ post_id: post.id, user_id: user.id, content: 'Comment', status })
          .returning('status')
          .executeTakeFirstOrThrow();

        expect(comment.status).toBe('approved');
      });

      test('array columns', async () => {
        const result = await db
          .insertInto('users')
          .values({ email: 'test@example.com', username: 'testuser', tags: ['a', 'b'], scores: [1, 2, 3] })
          .returning(['tags', 'scores'])
          .executeTakeFirstOrThrow();

        expect(result.tags).toEqual(['a', 'b']);
        expect(result.scores).toEqual([1, 2, 3]);
      });
    });

    describe('UPDATE', () => {
      test('Updateable type', async () => {
        const user = await db.insertInto('users').values({ email: 'test@example.com', username: 'testuser' }).returning('id').executeTakeFirstOrThrow();

        const update: Updateable<User> = { username: 'updated', updated_at: new Date() };
        const result = await db.updateTable('users').set(update).where('id', '=', user.id).returning(['username', 'updated_at']).executeTakeFirstOrThrow();

        expect(result.username).toBe('updated');
        expect(result.updated_at).toBeInstanceOf(Date);
      });
    });

    describe('JOIN', () => {
      test('inner join', async () => {
        const user = await db.insertInto('users').values({ email: 'test@example.com', username: 'testuser' }).returning('id').executeTakeFirstOrThrow();
        await db.insertInto('posts').values({ user_id: user.id, title: 'Post' }).execute();

        const result = await db
          .selectFrom('users')
          .innerJoin('posts', 'posts.user_id', 'users.id')
          .select(['users.email', 'posts.title'])
          .executeTakeFirst();

        expect(result?.email).toBe('test@example.com');
        expect(result?.title).toBe('Post');
      });

      test('three-way join', async () => {
        const user = await db.insertInto('users').values({ email: 'test@example.com', username: 'testuser' }).returning('id').executeTakeFirstOrThrow();
        const post = await db.insertInto('posts').values({ user_id: user.id, title: 'Post' }).returning('id').executeTakeFirstOrThrow();
        await db.insertInto('comments').values({ post_id: post.id, user_id: user.id, content: 'Comment', status: 'pending' }).execute();

        const result = await db
          .selectFrom('users')
          .innerJoin('posts', 'posts.user_id', 'users.id')
          .innerJoin('comments', 'comments.post_id', 'posts.id')
          .select(['users.username', 'posts.title', 'comments.content'])
          .executeTakeFirst();

        expect(result?.username).toBe('testuser');
        expect(result?.title).toBe('Post');
        expect(result?.content).toBe('Comment');
      });
    });

    describe('Views', () => {
      test('materialized view', async () => {
        const user = await db.insertInto('users').values({ email: 'test@example.com', username: 'viewuser' }).returning('id').executeTakeFirstOrThrow();
        await db.insertInto('posts').values({ user_id: user.id, title: 'Post 1' }).execute();
        await db.insertInto('posts').values({ user_id: user.id, title: 'Post 2' }).execute();

        await sql`REFRESH MATERIALIZED VIEW user_stats`.execute(db);

        const stats = await db.selectFrom('user_stats').selectAll().where('username', '=', 'viewuser').executeTakeFirst();

        expect(stats?.post_count).toBe('2');
      });
    });
  });

  describe('camelCase types', () => {
    test('select with camelCase column names', async () => {
      await camelDb.insertInto('users').values({ email: 'test@example.com', username: 'testuser' }).execute();
      const user = await camelDb.selectFrom('users').select(['id', 'email', 'isActive', 'createdAt']).executeTakeFirst();

      expect(user!.isActive).toBe(true);
      expect(user!.createdAt).toBeInstanceOf(Date);
    });

    test('insert with camelCase column names', async () => {
      const newUser: Insertable<CamelUser> = { email: 'test@example.com', username: 'testuser' };
      const result = await camelDb.insertInto('users').values(newUser).returning(['id', 'createdAt', 'isActive']).executeTakeFirstOrThrow();

      expect(result.id).toBeGreaterThan(0);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.isActive).toBe(true);
    });

    test('join with camelCase foreign keys', async () => {
      const user = await camelDb.insertInto('users').values({ email: 'test@example.com', username: 'testuser' }).returning('id').executeTakeFirstOrThrow();
      await camelDb.insertInto('posts').values({ userId: user.id, title: 'Post' }).execute();

      const result = await camelDb
        .selectFrom('users')
        .innerJoin('posts', 'posts.userId', 'users.id')
        .select(['users.email', 'posts.title', 'posts.viewCount'])
        .executeTakeFirst();

      expect(result?.email).toBe('test@example.com');
      expect(result?.title).toBe('Post');
      expect(result?.viewCount).toBe(0);
    });

    test('update with camelCase column names', async () => {
      const user = await camelDb.insertInto('users').values({ email: 'test@example.com', username: 'testuser' }).returning('id').executeTakeFirstOrThrow();

      const update: Updateable<CamelUser> = { username: 'updated', updatedAt: new Date() };
      const result = await camelDb.updateTable('users').set(update).where('id', '=', user.id).returning(['username', 'updatedAt']).executeTakeFirstOrThrow();

      expect(result.username).toBe('updated');
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });
});
