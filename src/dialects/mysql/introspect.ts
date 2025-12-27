import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { ColumnMetadata, DatabaseMetadata, EnumMetadata, TableMetadata } from '@/introspect/types';
import type { IntrospectOptions } from '@/dialects/types';
import { parseEnumValues, isEnumType } from './enum-parser';

type RawColumn = {
  TABLE_SCHEMA: string;
  TABLE_NAME: string;
  COLUMN_NAME: string;
  DATA_TYPE: string;
  COLUMN_TYPE: string;
  IS_NULLABLE: string;
  COLUMN_DEFAULT: string | null;
  EXTRA: string;
  COLUMN_COMMENT: string | null;
};

export async function introspectMysql(
  db: Kysely<any>,
  options: IntrospectOptions,
): Promise<DatabaseMetadata> {
  const [baseTables, views] = await Promise.all([
    introspectTables(db, options.schemas),
    introspectViews(db, options.schemas),
  ]);

  const tables = [...baseTables, ...views];
  const enums = extractEnums(tables);

  return {
    tables,
    enums,
  };
}

async function introspectTables(db: Kysely<any>, schemas: string[]): Promise<TableMetadata[]> {
  const rawColumns = await sql<RawColumn>`
    SELECT
      c.TABLE_SCHEMA,
      c.TABLE_NAME,
      c.COLUMN_NAME,
      c.DATA_TYPE,
      c.COLUMN_TYPE,
      c.IS_NULLABLE,
      c.COLUMN_DEFAULT,
      c.EXTRA,
      c.COLUMN_COMMENT
    FROM INFORMATION_SCHEMA.COLUMNS c
    INNER JOIN INFORMATION_SCHEMA.TABLES t
      ON c.TABLE_SCHEMA = t.TABLE_SCHEMA
      AND c.TABLE_NAME = t.TABLE_NAME
    WHERE t.TABLE_TYPE = 'BASE TABLE'
      AND c.TABLE_SCHEMA IN (${sql.join(schemas.map(s => sql`${s}`))})
    ORDER BY c.TABLE_SCHEMA, c.TABLE_NAME, c.ORDINAL_POSITION
  `.execute(db);

  return buildTableMetadata(rawColumns.rows, false);
}

async function introspectViews(db: Kysely<any>, schemas: string[]): Promise<TableMetadata[]> {
  const rawColumns = await sql<RawColumn>`
    SELECT
      c.TABLE_SCHEMA,
      c.TABLE_NAME,
      c.COLUMN_NAME,
      c.DATA_TYPE,
      c.COLUMN_TYPE,
      c.IS_NULLABLE,
      c.COLUMN_DEFAULT,
      c.EXTRA,
      c.COLUMN_COMMENT
    FROM INFORMATION_SCHEMA.COLUMNS c
    INNER JOIN INFORMATION_SCHEMA.TABLES t
      ON c.TABLE_SCHEMA = t.TABLE_SCHEMA
      AND c.TABLE_NAME = t.TABLE_NAME
    WHERE t.TABLE_TYPE = 'VIEW'
      AND c.TABLE_SCHEMA IN (${sql.join(schemas.map(s => sql`${s}`))})
    ORDER BY c.TABLE_SCHEMA, c.TABLE_NAME, c.ORDINAL_POSITION
  `.execute(db);

  return buildTableMetadata(rawColumns.rows, true);
}

function buildTableMetadata(rows: RawColumn[], isView: boolean): TableMetadata[] {
  const tableMap = new Map<string, TableMetadata>();

  for (const row of rows) {
    const tableKey = `${row.TABLE_SCHEMA}.${row.TABLE_NAME}`;

    if (!tableMap.has(tableKey)) {
      tableMap.set(tableKey, {
        schema: row.TABLE_SCHEMA,
        name: row.TABLE_NAME,
        columns: [],
        ...(isView && { isView: true }),
      });
    }

    const table = tableMap.get(tableKey);
    if (table) {
      const dataType = normalizeDataType(row.DATA_TYPE, row.COLUMN_TYPE);
      const isAutoIncrement = row.EXTRA.toLowerCase().includes('auto_increment');

      const columnMetadata: ColumnMetadata = {
        name: row.COLUMN_NAME,
        dataType,
        dataTypeSchema: row.TABLE_SCHEMA,
        isNullable: row.IS_NULLABLE === 'YES',
        isAutoIncrement: isView ? false : isAutoIncrement,
        hasDefaultValue: row.COLUMN_DEFAULT !== null || isAutoIncrement,
      };

      if (row.COLUMN_COMMENT) {
        columnMetadata.comment = row.COLUMN_COMMENT;
      }

      table.columns.push(columnMetadata);
    }
  }

  return Array.from(tableMap.values());
}

function normalizeDataType(dataType: string, columnType: string): string {
  const lowerDataType = dataType.toLowerCase();

  if (lowerDataType === 'tinyint' && columnType.toLowerCase() === 'tinyint(1)') {
    return 'boolean';
  }

  if (isEnumType(columnType)) {
    return columnType;
  }

  return lowerDataType;
}

function extractEnums(tables: TableMetadata[]): EnumMetadata[] {
  const enumMap = new Map<string, EnumMetadata>();

  for (const table of tables) {
    for (const column of table.columns) {
      if (isEnumType(column.dataType)) {
        const values = parseEnumValues(column.dataType);
        if (values) {
          const enumName = `${table.name}_${column.name}_enum`;
          const key = `${table.schema}.${enumName}`;

          if (!enumMap.has(key)) {
            enumMap.set(key, {
              schema: table.schema,
              name: enumName,
              values,
            });
          }
        }
      }
    }
  }

  return Array.from(enumMap.values());
}
