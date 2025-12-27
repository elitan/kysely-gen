import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { Kysely, MysqlDialect } from 'kysely';
import { createPool } from 'mysql2';
import { introspectMysql } from '@/dialects/mysql/introspect';

const TEST_DATABASE_URL = 'mysql://test_user:test_password@localhost:3307/test_db';

describe('MySQL Introspector', () => {
  let db: Kysely<any>;

  beforeAll(async () => {
    const pool = createPool(TEST_DATABASE_URL);
    db = new Kysely({
      dialect: new MysqlDialect({ pool }),
    });
  });

  afterAll(async () => {
    await db.destroy();
  });

  test('should introspect tables from database', async () => {
    const metadata = await introspectMysql(db, { schemas: ['test_db'] });

    expect(metadata.tables.length).toBeGreaterThan(0);

    const users = metadata.tables.find((t) => t.name === 'users');
    expect(users).toBeDefined();
    expect(users?.schema).toBe('test_db');
  });

  test('should introspect columns with correct types', async () => {
    const metadata = await introspectMysql(db, { schemas: ['test_db'] });

    const users = metadata.tables.find((t) => t.name === 'users');
    expect(users).toBeDefined();

    const idColumn = users?.columns.find((c) => c.name === 'id');
    expect(idColumn).toBeDefined();
    expect(idColumn?.dataType).toBe('int');
    expect(idColumn?.isNullable).toBe(false);
    expect(idColumn?.isAutoIncrement).toBe(true);

    const emailColumn = users?.columns.find((c) => c.name === 'email');
    expect(emailColumn).toBeDefined();
    expect(emailColumn?.dataType).toBe('varchar');
    expect(emailColumn?.isNullable).toBe(false);
  });

  test('should detect tinyint(1) as boolean', async () => {
    const metadata = await introspectMysql(db, { schemas: ['test_db'] });

    const users = metadata.tables.find((t) => t.name === 'users');
    const isActiveColumn = users?.columns.find((c) => c.name === 'is_active');

    expect(isActiveColumn).toBeDefined();
    expect(isActiveColumn?.dataType).toBe('boolean');
  });

  test('should identify nullable columns', async () => {
    const metadata = await introspectMysql(db, { schemas: ['test_db'] });

    const users = metadata.tables.find((t) => t.name === 'users');
    const updatedAtColumn = users?.columns.find((c) => c.name === 'updated_at');

    expect(updatedAtColumn).toBeDefined();
    expect(updatedAtColumn?.isNullable).toBe(true);
  });

  test('should identify auto_increment columns', async () => {
    const metadata = await introspectMysql(db, { schemas: ['test_db'] });

    const users = metadata.tables.find((t) => t.name === 'users');
    const idColumn = users?.columns.find((c) => c.name === 'id');

    expect(idColumn?.isAutoIncrement).toBe(true);
    expect(idColumn?.hasDefaultValue).toBe(true);
  });

  test('should introspect enum columns', async () => {
    const metadata = await introspectMysql(db, { schemas: ['test_db'] });

    const posts = metadata.tables.find((t) => t.name === 'posts');
    const statusColumn = posts?.columns.find((c) => c.name === 'status');

    expect(statusColumn).toBeDefined();
    expect(statusColumn?.dataType).toMatch(/^enum\(/i);
  });

  test('should extract enum values as EnumMetadata', async () => {
    const metadata = await introspectMysql(db, { schemas: ['test_db'] });

    expect(metadata.enums.length).toBeGreaterThan(0);

    const postStatusEnum = metadata.enums.find((e) => e.name === 'posts_status_enum');
    expect(postStatusEnum).toBeDefined();
    expect(postStatusEnum?.values).toEqual(['draft', 'published', 'archived']);
  });

  test('should introspect JSON columns', async () => {
    const metadata = await introspectMysql(db, { schemas: ['test_db'] });

    const users = metadata.tables.find((t) => t.name === 'users');
    const metadataColumn = users?.columns.find((c) => c.name === 'metadata');

    expect(metadataColumn).toBeDefined();
    expect(metadataColumn?.dataType).toBe('json');
    expect(metadataColumn?.isNullable).toBe(true);
  });

  test('should introspect geometry columns', async () => {
    const metadata = await introspectMysql(db, { schemas: ['test_db'] });

    const locations = metadata.tables.find((t) => t.name === 'locations');
    expect(locations).toBeDefined();

    const coordsColumn = locations?.columns.find((c) => c.name === 'coordinates');
    expect(coordsColumn).toBeDefined();
    expect(coordsColumn?.dataType).toBe('point');

    const boundaryColumn = locations?.columns.find((c) => c.name === 'boundary');
    expect(boundaryColumn?.dataType).toBe('polygon');

    const pathColumn = locations?.columns.find((c) => c.name === 'path');
    expect(pathColumn?.dataType).toBe('linestring');
  });

  test('should introspect binary columns', async () => {
    const metadata = await introspectMysql(db, { schemas: ['test_db'] });

    const files = metadata.tables.find((t) => t.name === 'files');
    expect(files).toBeDefined();

    const contentColumn = files?.columns.find((c) => c.name === 'content');
    expect(contentColumn?.dataType).toBe('blob');

    const checksumColumn = files?.columns.find((c) => c.name === 'checksum');
    expect(checksumColumn?.dataType).toBe('binary');
  });

  test('should introspect SET columns', async () => {
    const metadata = await introspectMysql(db, { schemas: ['test_db'] });

    const preferences = metadata.tables.find((t) => t.name === 'preferences');
    const notificationsColumn = preferences?.columns.find((c) => c.name === 'notifications');

    expect(notificationsColumn).toBeDefined();
    expect(notificationsColumn?.dataType).toBe('set');
  });

  test('should introspect BIGINT columns', async () => {
    const metadata = await introspectMysql(db, { schemas: ['test_db'] });

    const metrics = metadata.tables.find((t) => t.name === 'metrics');
    const bigValColumn = metrics?.columns.find((c) => c.name === 'big_val');

    expect(bigValColumn).toBeDefined();
    expect(bigValColumn?.dataType).toBe('bigint');
  });

  test('should introspect views', async () => {
    const metadata = await introspectMysql(db, { schemas: ['test_db'] });

    const activeUsers = metadata.tables.find((t) => t.name === 'active_users');
    expect(activeUsers).toBeDefined();
    expect(activeUsers?.isView).toBe(true);
    expect(activeUsers?.schema).toBe('test_db');

    const columns = activeUsers?.columns ?? [];
    expect(columns.length).toBe(4);

    const idColumn = columns.find((c) => c.name === 'id');
    expect(idColumn).toBeDefined();
    expect(idColumn?.dataType).toBe('int');
  });

  test('should introspect multiple schemas', async () => {
    const metadata = await introspectMysql(db, { schemas: ['test_db', 'test_schema'] });

    const tableSchemas = metadata.tables.map((t) => t.schema);
    expect(tableSchemas).toContain('test_db');
    expect(tableSchemas).toContain('test_schema');

    const tasksTable = metadata.tables.find(
      (t) => t.schema === 'test_schema' && t.name === 'tasks'
    );
    expect(tasksTable).toBeDefined();
    expect(tasksTable?.columns.length).toBeGreaterThan(0);
  });

  test('should introspect views from different schemas', async () => {
    const metadata = await introspectMysql(db, { schemas: ['test_db', 'test_schema'] });

    const activeTasksView = metadata.tables.find(
      (t) => t.schema === 'test_schema' && t.name === 'active_tasks'
    );
    expect(activeTasksView).toBeDefined();
    expect(activeTasksView?.isView).toBe(true);
  });

  test('should introspect enums from different schemas', async () => {
    const metadata = await introspectMysql(db, { schemas: ['test_db', 'test_schema'] });

    const testSchemaEnums = metadata.enums.filter((e) => e.schema === 'test_schema');
    expect(testSchemaEnums.length).toBeGreaterThan(0);

    const priorityEnum = testSchemaEnums.find((e) => e.name === 'tasks_priority_enum');
    expect(priorityEnum?.values).toEqual(['low', 'medium', 'high']);
  });
});
