import { describe, expect, test } from 'bun:test';
import app from '../src/index.js';

describe('response Content-Type charset', () => {
  test('appends charset=utf-8 to JSON responses', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toMatch(/application\/json;\s*charset=utf-8/i);
  });

  test('does not modify non-JSON responses', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toStartWith('text/html');
    const body = await res.text();
    expect(body.length).toBeGreaterThan(0);
  });
});
