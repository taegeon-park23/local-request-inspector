import { describe, expect, it } from 'vitest';
import { CurlImportParseError, parseCurlCommandToDraftSeed } from '@client/features/workspace/curl-import';

describe('parseCurlCommandToDraftSeed', () => {
  it('parses a basic GET command', () => {
    const seed = parseCurlCommandToDraftSeed('curl https://api.example.com/users');

    expect(seed.method).toBe('GET');
    expect(seed.url).toBe('https://api.example.com/users');
    expect(seed.name).toBe('users');
    expect(seed.headers).toEqual([]);
    expect(seed.bodyMode).toBeUndefined();
    expect(seed.bodyText).toBeUndefined();
  });

  it('parses headers and json body', () => {
    const seed = parseCurlCommandToDraftSeed(
      `curl -X POST https://api.example.com/users -H "Content-Type: application/json" -H "Authorization: Bearer token" -d '{"name":"Ada"}'`,
    );

    expect(seed.method).toBe('POST');
    expect(seed.url).toBe('https://api.example.com/users');
    expect(seed.headers).toHaveLength(2);
    expect(seed.bodyMode).toBe('json');
    expect(seed.bodyText).toBe('{"name":"Ada"}');
  });

  it('defaults method to POST when data is present', () => {
    const seed = parseCurlCommandToDraftSeed('curl https://api.example.com/check -d "ping=true"');

    expect(seed.method).toBe('POST');
    expect(seed.bodyMode).toBe('text');
    expect(seed.bodyText).toBe('ping=true');
  });

  it('throws when URL is missing', () => {
    expect(() => parseCurlCommandToDraftSeed('curl -X GET')).toThrow(CurlImportParseError);
  });
});
