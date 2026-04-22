import { describe, it, expect } from 'vitest';
import { validate as isUuid } from 'uuid';
import { BadRequestException } from '@nestjs/common';

function parseUUID(id: string): string {
  if (!isUuid(id)) {
    throw new BadRequestException(`${id} is not a valid UUID`);
  }
  return id;
}

describe('UUID Validation', () => {
  it('passes valid UUID v4', () => {
    const id = '97cf267d-ce98-4b79-b199-7d2fffa39ad4';
    expect(parseUUID(id)).toBe(id);
  });

  it('throws BadRequestException for empty string', () => {
    expect(() => parseUUID('')).toThrow(BadRequestException);
  });

  it('throws BadRequestException for random string', () => {
    expect(() => parseUUID('some-invalid-id')).toThrow(BadRequestException);
  });

  it('throws BadRequestException for numeric string', () => {
    expect(() => parseUUID('12345')).toThrow(BadRequestException);
  });

  it('throws BadRequestException for partial UUID', () => {
    expect(() => parseUUID('97cf267d-ce98')).toThrow(BadRequestException);
  });

  it('throws BadRequestException for UUID with wrong format', () => {
    expect(() =>
      parseUUID('97cf267d-ce98-4b79-b199-7d2fffa39ad4-extra'),
    ).toThrow(BadRequestException);
  });
});
