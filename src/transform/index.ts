import type { InterfaceNode, TypeAliasNode } from '@/ast/nodes';
import type { DatabaseMetadata } from '@/introspect/types';
import type { TransformOptions, TransformResult, TransformWarning } from '@/transform/types';
import { filterTables } from '@/transform/filter';
import { transformEnum } from '@/transform/enum';
import { transformTable, createDBInterface } from '@/transform/table';

export { mapPostgresType } from '@/transform/type-mapper';
export type { TransformOptions, TransformResult, TransformWarning } from '@/transform/types';

export function transformDatabase(metadata: DatabaseMetadata, options?: TransformOptions): TransformResult {
  const declarations: (InterfaceNode | TypeAliasNode)[] = [];
  const unknownTypes = new Set<string>();

  declarations.push({
    kind: 'import',
    imports: ['ColumnType'],
    from: 'kysely',
    typeOnly: true,
  });

  declarations.push({
    kind: 'typeAlias',
    name: 'Generated<T>',
    type: {
      kind: 'raw',
      value: `T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>`,
    },
    exported: true,
  });

  for (const enumMetadata of metadata.enums) {
    declarations.push(transformEnum(enumMetadata));
  }

  const filteredTables = filterTables(metadata.tables, options);

  const tableInterfaces: InterfaceNode[] = [];
  for (const table of filteredTables) {
    tableInterfaces.push(transformTable(table, metadata.enums, options, unknownTypes));
  }
  declarations.push(...tableInterfaces);

  declarations.push(createDBInterface(filteredTables, options));

  const warnings: TransformWarning[] = Array.from(unknownTypes).map((pgType) => ({
    type: 'unknown_type',
    pgType,
  }));

  return { program: { declarations }, warnings };
}
