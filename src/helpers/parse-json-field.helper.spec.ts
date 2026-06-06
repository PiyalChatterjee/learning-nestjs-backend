import { parseJsonField, parseJsonFields } from './parse-json-field.helper';

describe('parseJsonField', () => {
  it('should parse valid JSON string', () => {
    const json = JSON.stringify({ key: 'value' });
    const result = parseJsonField(json);

    expect(result).toEqual({ key: 'value' });
  });

  it('should parse JSON array', () => {
    const json = JSON.stringify([1, 2, 3]);
    const result = parseJsonField(json);

    expect(result).toEqual([1, 2, 3]);
  });

  it('should parse JSON with nested objects', () => {
    const json = JSON.stringify({
      user: { name: 'John', age: 30 },
      tags: ['a', 'b'],
    });
    const result = parseJsonField(json);

    expect(result).toEqual({
      user: { name: 'John', age: 30 },
      tags: ['a', 'b'],
    });
  });

  it('should return null for null input', () => {
    const result = parseJsonField(null);
    expect(result).toBeNull();
  });

  it('should return null for undefined input', () => {
    const result = parseJsonField(undefined);
    expect(result).toBeNull();
  });

  it('should return original string for invalid JSON', () => {
    const invalidJson = 'not valid json {';
    const result = parseJsonField(invalidJson);

    expect(result).toBe(invalidJson);
  });

  it('should return original string for malformed JSON', () => {
    const malformedJson = '{"key": "value"';
    const result = parseJsonField(malformedJson);

    expect(result).toBe(malformedJson);
  });

  it('should handle empty string', () => {
    const result = parseJsonField('');
    expect(result).toBeNull();
  });

  it('should parse JSON boolean', () => {
    const result = parseJsonField('true');
    expect(result).toBe(true);
  });

  it('should parse JSON number', () => {
    const result = parseJsonField('123');
    expect(result).toBe(123);
  });

  it('should parse JSON string', () => {
    const result = parseJsonField('"hello world"');
    expect(result).toBe('hello world');
  });

  it('should handle JSON with special characters', () => {
    const json = JSON.stringify({
      text: 'Line 1\nLine 2\tTabbed',
      symbol: '@#$%',
    });
    const result = parseJsonField(json);

    expect(result.text).toBe('Line 1\nLine 2\tTabbed');
    expect(result.symbol).toBe('@#$%');
  });

  it('should handle deeply nested JSON', () => {
    const json = JSON.stringify({
      level1: {
        level2: {
          level3: {
            level4: 'deep value',
          },
        },
      },
    });
    const result = parseJsonField(json);

    expect(result.level1.level2.level3.level4).toBe('deep value');
  });
});

describe('parseJsonFields', () => {
  it('should parse multiple JSON fields in object', () => {
    const obj = {
      id: 1,
      name: 'Test',
      metadata: JSON.stringify({ key: 'value' }),
      config: JSON.stringify({ enabled: true }),
    };

    const result = parseJsonFields(obj, ['metadata', 'config']);

    expect(result.id).toBe(1);
    expect(result.name).toBe('Test');
    expect(result.metadata).toEqual({ key: 'value' });
    expect(result.config).toEqual({ enabled: true });
  });

  it('should return new object without mutating original', () => {
    const obj = {
      id: 1,
      data: JSON.stringify({ key: 'value' }),
    };

    const result = parseJsonFields(obj, ['data']);

    expect(obj.data).toBe(JSON.stringify({ key: 'value' }));
    expect(result.data).toEqual({ key: 'value' });
  });

  it('should handle fields with invalid JSON', () => {
    const obj = {
      id: 1,
      valid: JSON.stringify({ key: 'value' }),
      invalid: 'not json {',
    };

    const result = parseJsonFields(obj, ['valid', 'invalid']);

    expect(result.valid).toEqual({ key: 'value' });
    expect(result.invalid).toBe('not json {');
  });

  it('should handle empty field names array', () => {
    const obj = {
      id: 1,
      data: JSON.stringify({ key: 'value' }),
    };

    const result = parseJsonFields(obj, []);

    expect(result.id).toBe(1);
    expect(result.data).toBe(JSON.stringify({ key: 'value' }));
  });

  it('should handle non-existent field names', () => {
    const obj = {
      id: 1,
      name: 'Test',
    };

    const result = parseJsonFields(obj, ['nonExistent' as any]);

    expect(result.id).toBe(1);
    expect(result.name).toBe('Test');
  });

  it('should handle null values in fields', () => {
    const obj = {
      id: 1,
      data: null,
    };

    const result = parseJsonFields(obj, ['data']);

    expect(result.data).toBeNull();
  });

  it('should handle multiple fields with mixed types', () => {
    const obj = {
      id: 1,
      obj: JSON.stringify({ nested: 'value' }),
      arr: JSON.stringify([1, 2, 3]),
      str: JSON.stringify('string value'),
      num: JSON.stringify(42),
    };

    const result = parseJsonFields(obj, ['obj', 'arr', 'str', 'num']);

    expect(result.obj).toEqual({ nested: 'value' });
    expect(result.arr).toEqual([1, 2, 3]);
    expect(result.str).toBe('string value');
    expect(result.num).toBe(42);
  });
});
