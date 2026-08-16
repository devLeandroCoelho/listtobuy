import { beforeEach, describe, expect, it, vi } from 'vitest';
import { checkRateLimit, clearRateLimitStore, getClientIp } from '@/lib/rate-limit';

describe('getClientIp', () => {
  it('retorna primeiro IP do x-forwarded-for', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '203.0.113.5, 198.51.100.2' },
    });
    expect(getClientIp(req)).toBe('203.0.113.5');
  });

  it('retorna x-real-ip se x-forwarded-for ausente', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-real-ip': '203.0.113.10' },
    });
    expect(getClientIp(req)).toBe('203.0.113.10');
  });

  it('retorna unknown se nenhum header de IP presente', () => {
    const req = new Request('http://localhost');
    expect(getClientIp(req)).toBe('unknown');
  });
});

describe('checkRateLimit', () => {
  beforeEach(() => {
    clearRateLimitStore();
  });

  function makeRequest(ip = '127.0.0.1'): Request {
    return new Request('http://localhost/api/test', {
      headers: { 'x-forwarded-for': ip },
    });
  }

  it('primeira requisição passa', () => {
    const res = checkRateLimit(makeRequest());
    expect(res).toBeNull();
  });

  it('retorna 429 após 30 requisições do mesmo IP', async () => {
    for (let i = 0; i < 30; i++) {
      expect(checkRateLimit(makeRequest())).toBeNull();
    }

    const res = checkRateLimit(makeRequest())!;
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body).toEqual({ error: 'Muitas requisições. Tente novamente mais tarde.' });
    expect(res.headers.get('Retry-After')).not.toBeNull();
  });

  it('permite requisições após janela expirar', async () => {
    vi.useFakeTimers();

    for (let i = 0; i < 30; i++) {
      expect(checkRateLimit(makeRequest())).toBeNull();
    }

    expect(checkRateLimit(makeRequest())!.status).toBe(429);

    await vi.advanceTimersByTimeAsync(61_000);

    const res = checkRateLimit(makeRequest());
    expect(res).toBeNull();

    vi.useRealTimers();
  });

  it('IPs diferentes tem limites independentes', () => {
    for (let i = 0; i < 30; i++) {
      expect(checkRateLimit(makeRequest('127.0.0.1'))).toBeNull();
    }
    expect(checkRateLimit(makeRequest('127.0.0.1'))!.status).toBe(429);

    const res = checkRateLimit(makeRequest('127.0.0.2'));
    expect(res).toBeNull();
  });
});
