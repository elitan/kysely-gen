import { describe, expect, test } from 'bun:test';
import { parseEnumValues, parseSetValues, isEnumType, isSetType } from '@/dialects/mysql/enum-parser';

describe('MySQL Enum Parser', () => {
  describe('parseEnumValues', () => {
    test('should parse simple enum values', () => {
      const result = parseEnumValues("enum('a','b','c')");
      expect(result).toEqual(['a', 'b', 'c']);
    });

    test('should parse enum with spaces in values', () => {
      const result = parseEnumValues("enum('draft post','published post')");
      expect(result).toEqual(['draft post', 'published post']);
    });

    test('should parse enum with escaped single quotes', () => {
      const result = parseEnumValues("enum('it''s','test')");
      expect(result).toEqual(["it's", 'test']);
    });

    test('should return null for non-enum types', () => {
      expect(parseEnumValues('varchar(255)')).toBeNull();
      expect(parseEnumValues('int')).toBeNull();
      expect(parseEnumValues('text')).toBeNull();
    });

    test('should handle case-insensitive ENUM', () => {
      const result = parseEnumValues("ENUM('A','B')");
      expect(result).toEqual(['A', 'B']);
    });

    test('should return null for empty enum', () => {
      const result = parseEnumValues('enum()');
      expect(result).toBeNull();
    });
  });

  describe('parseSetValues', () => {
    test('should parse simple set values', () => {
      const result = parseSetValues("set('email','sms','push')");
      expect(result).toEqual(['email', 'sms', 'push']);
    });

    test('should return null for non-set types', () => {
      expect(parseSetValues('varchar(255)')).toBeNull();
      expect(parseSetValues("enum('a','b')")).toBeNull();
    });

    test('should handle case-insensitive SET', () => {
      const result = parseSetValues("SET('A','B')");
      expect(result).toEqual(['A', 'B']);
    });
  });

  describe('isEnumType', () => {
    test('should return true for enum types', () => {
      expect(isEnumType("enum('a','b')")).toBe(true);
      expect(isEnumType("ENUM('A','B')")).toBe(true);
    });

    test('should return false for non-enum types', () => {
      expect(isEnumType('varchar(255)')).toBe(false);
      expect(isEnumType('int')).toBe(false);
      expect(isEnumType("set('a','b')")).toBe(false);
    });
  });

  describe('isSetType', () => {
    test('should return true for set types', () => {
      expect(isSetType("set('a','b')")).toBe(true);
      expect(isSetType("SET('A','B')")).toBe(true);
    });

    test('should return false for non-set types', () => {
      expect(isSetType('varchar(255)')).toBe(false);
      expect(isSetType("enum('a','b')")).toBe(false);
    });
  });
});
