import type { TypeNode } from '@/ast/nodes';
import type { MapTypeOptions } from '@/dialects/types';

function createColumnType(
  selectType: TypeNode,
  insertType?: TypeNode,
  updateType?: TypeNode
): TypeNode {
  const typeArguments: TypeNode[] = [selectType];

  if (insertType) {
    typeArguments.push(insertType);

    if (updateType) {
      typeArguments.push(updateType);
    }
  }

  return {
    kind: 'generic',
    name: 'ColumnType',
    typeArguments,
  };
}

export function mapMysqlType(dataType: string, options: MapTypeOptions): TypeNode {
  const { isNullable, unknownTypes } = options;

  let baseType: TypeNode;
  const lowerType = dataType.toLowerCase();

  switch (lowerType) {
    case 'tinyint':
    case 'smallint':
    case 'mediumint':
    case 'int':
    case 'integer':
    case 'year':
      baseType = { kind: 'primitive', value: 'number' };
      break;

    case 'bigint':
      baseType = createColumnType(
        { kind: 'primitive', value: 'string' },
        {
          kind: 'union',
          types: [
            { kind: 'primitive', value: 'string' },
            { kind: 'primitive', value: 'number' },
            { kind: 'primitive', value: 'bigint' },
          ],
        },
        {
          kind: 'union',
          types: [
            { kind: 'primitive', value: 'string' },
            { kind: 'primitive', value: 'number' },
            { kind: 'primitive', value: 'bigint' },
          ],
        }
      );
      break;

    case 'float':
    case 'double':
    case 'real':
      baseType = { kind: 'primitive', value: 'number' };
      break;

    case 'decimal':
    case 'numeric':
      baseType = createColumnType(
        { kind: 'primitive', value: 'string' },
        {
          kind: 'union',
          types: [
            { kind: 'primitive', value: 'number' },
            { kind: 'primitive', value: 'string' },
          ],
        },
        {
          kind: 'union',
          types: [
            { kind: 'primitive', value: 'number' },
            { kind: 'primitive', value: 'string' },
          ],
        }
      );
      break;

    case 'char':
    case 'varchar':
    case 'text':
    case 'tinytext':
    case 'mediumtext':
    case 'longtext':
      baseType = { kind: 'primitive', value: 'string' };
      break;

    case 'bit':
      baseType = { kind: 'primitive', value: 'Buffer' };
      break;

    case 'binary':
    case 'varbinary':
    case 'blob':
    case 'tinyblob':
    case 'mediumblob':
    case 'longblob':
      baseType = { kind: 'primitive', value: 'Buffer' };
      break;

    case 'date':
    case 'datetime':
    case 'timestamp':
      baseType = createColumnType(
        { kind: 'primitive', value: 'Date' },
        {
          kind: 'union',
          types: [
            { kind: 'primitive', value: 'Date' },
            { kind: 'primitive', value: 'string' },
          ],
        },
        {
          kind: 'union',
          types: [
            { kind: 'primitive', value: 'Date' },
            { kind: 'primitive', value: 'string' },
          ],
        }
      );
      break;

    case 'time':
      baseType = { kind: 'primitive', value: 'string' };
      break;

    case 'json':
      baseType = { kind: 'reference', name: 'JsonValue' };
      break;

    case 'set':
      baseType = { kind: 'primitive', value: 'string' };
      break;

    case 'point':
      baseType = { kind: 'reference', name: 'Point' };
      break;

    case 'linestring':
      baseType = { kind: 'reference', name: 'LineString' };
      break;

    case 'polygon':
      baseType = { kind: 'reference', name: 'Polygon' };
      break;

    case 'geometry':
    case 'geometrycollection':
    case 'multipoint':
    case 'multilinestring':
    case 'multipolygon':
      baseType = { kind: 'reference', name: 'Geometry' };
      break;

    default:
      if (unknownTypes) {
        unknownTypes.add(dataType);
      }
      baseType = { kind: 'primitive', value: 'unknown' };
  }

  if (isNullable) {
    return {
      kind: 'union',
      types: [baseType, { kind: 'primitive', value: 'null' }],
    };
  }

  return baseType;
}
