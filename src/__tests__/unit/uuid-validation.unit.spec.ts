import { describe, it, expect } from 'vitest';
import { validate as isUuid } from 'uuid';
import { ValidationError } from '../../common/errors/app-errors';

function parseUUID(id: string): string {
  if (!isUuid(id)) {
    throw new ValidationError(`${id} is not a valid UUID`);
  }
  return id;
}

describe('UUID Validation', () => {
  it('passes valid UUID v4', () => {
    const id = '97cf267d-ce98-4b79-b199-7d2fffa39ad4';
    expect(parseUUID(id)).toBe(id);
  });

  it('throws ValidationError for empty string', () => {
    expect(() => parseUUID('')).toThrow(ValidationError);
  });

  it('throws ValidationError for random string', () => {
    expect(() => parseUUID('some-invalid-id')).toThrow(ValidationError);
  });

  it('throws ValidationError for numeric string', () => {
    expect(() => parseUUID('12345')).toThrow(ValidationError);
  });

  it('throws ValidationError for partial UUID', () => {
    expect(() => parseUUID('97cf267d-ce98')).toThrow(ValidationError);
  });

  it('throws ValidationError for UUID with wrong format', () => {
    expect(() =>
      parseUUID('97cf267d-ce98-4b79-b199-7d2fffa39ad4-extra'),
    ).toThrow(ValidationError);
  });
});
