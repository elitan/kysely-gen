import { describe, expect, test } from 'bun:test';
import { mapMysqlType } from '@/dialects/mysql/type-mapper';

describe('MySQL Type Mapper', () => {
  describe('integer types', () => {
    test('should map integer types to number', () => {
      expect(mapMysqlType('tinyint', { isNullable: false })).toEqual({ kind: 'primitive', value: 'number' });
      expect(mapMysqlType('smallint', { isNullable: false })).toEqual({ kind: 'primitive', value: 'number' });
      expect(mapMysqlType('mediumint', { isNullable: false })).toEqual({ kind: 'primitive', value: 'number' });
      expect(mapMysqlType('int', { isNullable: false })).toEqual({ kind: 'primitive', value: 'number' });
      expect(mapMysqlType('integer', { isNullable: false })).toEqual({ kind: 'primitive', value: 'number' });
    });

    test('should map bigint to ColumnType with string select', () => {
      const result = mapMysqlType('bigint', { isNullable: false });
      expect(result).toEqual({
        kind: 'generic',
        name: 'ColumnType',
        typeArguments: [
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
          },
        ],
      });
    });

    test('should map year to number', () => {
      expect(mapMysqlType('year', { isNullable: false })).toEqual({ kind: 'primitive', value: 'number' });
    });
  });

  describe('floating point types', () => {
    test('should map float/double to number', () => {
      expect(mapMysqlType('float', { isNullable: false })).toEqual({ kind: 'primitive', value: 'number' });
      expect(mapMysqlType('double', { isNullable: false })).toEqual({ kind: 'primitive', value: 'number' });
      expect(mapMysqlType('real', { isNullable: false })).toEqual({ kind: 'primitive', value: 'number' });
    });
  });

  describe('decimal types', () => {
    test('should map decimal/numeric to ColumnType', () => {
      const result = mapMysqlType('decimal', { isNullable: false });
      expect(result).toEqual({
        kind: 'generic',
        name: 'ColumnType',
        typeArguments: [
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
          },
        ],
      });
    });
  });

  describe('string types', () => {
    test('should map string types to string', () => {
      expect(mapMysqlType('char', { isNullable: false })).toEqual({ kind: 'primitive', value: 'string' });
      expect(mapMysqlType('varchar', { isNullable: false })).toEqual({ kind: 'primitive', value: 'string' });
      expect(mapMysqlType('text', { isNullable: false })).toEqual({ kind: 'primitive', value: 'string' });
      expect(mapMysqlType('tinytext', { isNullable: false })).toEqual({ kind: 'primitive', value: 'string' });
      expect(mapMysqlType('mediumtext', { isNullable: false })).toEqual({ kind: 'primitive', value: 'string' });
      expect(mapMysqlType('longtext', { isNullable: false })).toEqual({ kind: 'primitive', value: 'string' });
    });
  });

  describe('binary types', () => {
    test('should map binary types to Buffer', () => {
      expect(mapMysqlType('binary', { isNullable: false })).toEqual({ kind: 'primitive', value: 'Buffer' });
      expect(mapMysqlType('varbinary', { isNullable: false })).toEqual({ kind: 'primitive', value: 'Buffer' });
      expect(mapMysqlType('blob', { isNullable: false })).toEqual({ kind: 'primitive', value: 'Buffer' });
      expect(mapMysqlType('tinyblob', { isNullable: false })).toEqual({ kind: 'primitive', value: 'Buffer' });
      expect(mapMysqlType('mediumblob', { isNullable: false })).toEqual({ kind: 'primitive', value: 'Buffer' });
      expect(mapMysqlType('longblob', { isNullable: false })).toEqual({ kind: 'primitive', value: 'Buffer' });
      expect(mapMysqlType('bit', { isNullable: false })).toEqual({ kind: 'primitive', value: 'Buffer' });
    });
  });

  describe('date/time types', () => {
    test('should map date/datetime/timestamp to ColumnType with Date', () => {
      const expected = {
        kind: 'generic',
        name: 'ColumnType',
        typeArguments: [
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
          },
        ],
      };

      expect(mapMysqlType('date', { isNullable: false })).toEqual(expected);
      expect(mapMysqlType('datetime', { isNullable: false })).toEqual(expected);
      expect(mapMysqlType('timestamp', { isNullable: false })).toEqual(expected);
    });

    test('should map time to string', () => {
      expect(mapMysqlType('time', { isNullable: false })).toEqual({ kind: 'primitive', value: 'string' });
    });
  });

  describe('json type', () => {
    test('should map json to JsonValue reference', () => {
      expect(mapMysqlType('json', { isNullable: false })).toEqual({ kind: 'reference', name: 'JsonValue' });
    });
  });

  describe('set type', () => {
    test('should map set to string', () => {
      expect(mapMysqlType('set', { isNullable: false })).toEqual({ kind: 'primitive', value: 'string' });
    });
  });

  describe('geometry types', () => {
    test('should map point to Point reference', () => {
      expect(mapMysqlType('point', { isNullable: false })).toEqual({ kind: 'reference', name: 'Point' });
    });

    test('should map linestring to LineString reference', () => {
      expect(mapMysqlType('linestring', { isNullable: false })).toEqual({ kind: 'reference', name: 'LineString' });
    });

    test('should map polygon to Polygon reference', () => {
      expect(mapMysqlType('polygon', { isNullable: false })).toEqual({ kind: 'reference', name: 'Polygon' });
    });

    test('should map geometry types to Geometry reference', () => {
      expect(mapMysqlType('geometry', { isNullable: false })).toEqual({ kind: 'reference', name: 'Geometry' });
      expect(mapMysqlType('geometrycollection', { isNullable: false })).toEqual({ kind: 'reference', name: 'Geometry' });
      expect(mapMysqlType('multipoint', { isNullable: false })).toEqual({ kind: 'reference', name: 'Geometry' });
      expect(mapMysqlType('multilinestring', { isNullable: false })).toEqual({ kind: 'reference', name: 'Geometry' });
      expect(mapMysqlType('multipolygon', { isNullable: false })).toEqual({ kind: 'reference', name: 'Geometry' });
    });
  });

  describe('nullable types', () => {
    test('should wrap nullable types in union with null', () => {
      const result = mapMysqlType('int', { isNullable: true });
      expect(result).toEqual({
        kind: 'union',
        types: [
          { kind: 'primitive', value: 'number' },
          { kind: 'primitive', value: 'null' },
        ],
      });
    });

    test('should wrap complex types in union with null', () => {
      const result = mapMysqlType('point', { isNullable: true });
      expect(result).toEqual({
        kind: 'union',
        types: [
          { kind: 'reference', name: 'Point' },
          { kind: 'primitive', value: 'null' },
        ],
      });
    });
  });

  describe('unknown types', () => {
    test('should map unknown types to unknown', () => {
      expect(mapMysqlType('custom_type', { isNullable: false })).toEqual({ kind: 'primitive', value: 'unknown' });
    });

    test('should track unknown types', () => {
      const unknownTypes = new Set<string>();
      mapMysqlType('my_custom_type', { isNullable: false, unknownTypes });
      expect(unknownTypes.has('my_custom_type')).toBe(true);
    });
  });

  describe('case insensitivity', () => {
    test('should handle uppercase type names', () => {
      expect(mapMysqlType('INT', { isNullable: false })).toEqual({ kind: 'primitive', value: 'number' });
      expect(mapMysqlType('VARCHAR', { isNullable: false })).toEqual({ kind: 'primitive', value: 'string' });
      expect(mapMysqlType('DATETIME', { isNullable: false })).toMatchObject({ kind: 'generic', name: 'ColumnType' });
    });
  });
});
