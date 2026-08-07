import { describe, expect, test } from 'bun:test';
import { Hono } from 'hono';
import app, { ensureJsonUtf8 } from '../src/index.js';

function fixtureApp() {
  const fixture = new Hono();
  fixture.use('/*', ensureJsonUtf8);
  fixture.get('/json', (c) =>
    new Response('{"a":1}', { headers: { 'Content-Type': 'application/json' } }),
  );
  fixture.get('/json-lower-charset', (c) =>
    new Response('{"a":1}', {
      headers: { 'Content-Type': 'application/json; charset=iso-8859-1' },
    }),
  );
  fixture.get('/json-mixed-charset', (c) =>
    new Response('{"a":1}', { headers: { 'Content-Type': 'application/json; Charset=UTF-8' } }),
  );
  fixture.get('/json-patch', (c) =>
    new Response('{"a":1}', { headers: { 'Content-Type': 'application/json-patch+json' } }),
  );
  fixture.get('/html', (c) =>
    new Response('<h1>hi</h1>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } }),
  );
  return fixture;
}

describe('response Content-Type charset', () => {
  test('appends charset=utf-8 to real JSON responses', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/json; charset=utf-8');
  });

  test('appends charset=utf-8 to charset-less JSON', async () => {
    const res = await fixtureApp().request('/json');
    expect(res.headers.get('Content-Type')).toBe('application/json; charset=utf-8');
  });

  test('preserves an existing lower-case charset', async () => {
    const res = await fixtureApp().request('/json-lower-charset');
    expect(res.headers.get('Content-Type')).toBe('application/json; charset=iso-8859-1');
  });

  test('preserves a mixed-case charset without appending a conflicting one', async () => {
    const res = await fixtureApp().request('/json-mixed-charset');
    expect(res.headers.get('Content-Type')).toBe('application/json; Charset=UTF-8');
  });

  test('does not touch other application/* media types', async () => {
    const res = await fixtureApp().request('/json-patch');
    expect(res.headers.get('Content-Type')).toBe('application/json-patch+json');
  });

  test('does not modify non-JSON responses', async () => {
    const res = await fixtureApp().request('/html');
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/html; charset=utf-8');
    expect(await res.text()).toBe('<h1>hi</h1>');
  });
});
