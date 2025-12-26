import type { InterfaceNode, PropertyNode, TypeNode } from '@/ast/nodes';
import type { ColumnMetadata, EnumMetadata, TableMetadata } from '@/introspect/types';
import { toCamelCase } from '@/utils/case-converter';
import type { TransformOptions } from '@/transform/types';
import { mapPostgresType } from '@/transform/type-mapper';
import { toPascalCase, singularize } from '@/transform/utils';
import { getEnumTypeName } from '@/transform/enum';

export function transformTable(
  table: TableMetadata,
  enums: EnumMetadata[],
  options?: TransformOptions,
  unknownTypes?: Set<string>
): InterfaceNode {
  const properties: PropertyNode[] = table.columns.map((column) =>
    transformColumn(column, enums, options, unknownTypes)
  );

  return {
    kind: 'interface',
    name: toPascalCase(singularize(table.name)),
    properties,
    exported: true,
  };
}

export function transformColumn(
  column: ColumnMetadata,
  enums: EnumMetadata[],
  options?: TransformOptions,
  unknownTypes?: Set<string>
): PropertyNode {
  const matchingEnum = enums.find(
    (e) => e.name === column.dataType && e.schema === (column.dataTypeSchema ?? 'public')
  );

  let type: TypeNode;
  if (matchingEnum) {
    const enumTypeName = getEnumTypeName(matchingEnum);
    type = { kind: 'reference', name: enumTypeName };

    if (column.isNullable) {
      type = {
        kind: 'union',
        types: [type, { kind: 'primitive', value: 'null' }],
      };
    }
  } else {
    type = mapPostgresType(column.dataType, column.isNullable, column.isArray, unknownTypes);
  }

  if (column.isAutoIncrement) {
    type = {
      kind: 'generic',
      name: 'Generated',
      typeArguments: [type],
    };
  }

  const columnName = options?.camelCase ? toCamelCase(column.name) : column.name;

  return {
    name: columnName,
    type,
    optional: false,
  };
}

export function createDBInterface(tables: TableMetadata[], options?: TransformOptions): InterfaceNode {
  const properties: PropertyNode[] = tables.map((table) => {
    const tableName = options?.camelCase ? toCamelCase(table.name) : table.name;

    return {
      name: tableName,
      type: {
        kind: 'reference',
        name: toPascalCase(singularize(table.name)),
      },
      optional: false,
    };
  });

  return {
    kind: 'interface',
    name: 'DB',
    properties,
    exported: true,
  };
}
