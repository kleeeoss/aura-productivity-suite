import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchWeather, clearWeatherCache, getCachedWeather, CACHE_TTL_MS, MAX_OFFLINE_CACHE_MS, FETCH_TIMEOUT_MS } from '../utils/weather';

describe('Weather Service Privacy & Offline Hardening', () => {
  beforeEach(() => {
    clearWeatherCache();
    vi.restoreAllMocks();
  });

  it('exports valid cache TTL and timeout constants', () => {
    expect(CACHE_TTL_MS).toBe(30 * 60 * 1000);
    expect(MAX_OFFLINE_CACHE_MS).toBe(2 * 60 * 60 * 1000);
    expect(FETCH_TIMEOUT_MS).toBe(1500);
  });

  it('fetches fresh weather data and caches it for 30 minutes', async () => {
    const mockGeo = { latitude: '51.5074', longitude: '-0.1278', city: 'London' };
    const mockWeather = {
      current: {
        temperature_2m: 18.4,
        apparent_temperature: 17.8,
        relative_humidity_2m: 65,
        wind_speed_10m: 12,
        weather_code: 1,
      },
      daily: {
        sunrise: ['2026-09-24T06:45:00'],
        sunset: ['2026-09-24T19:00:00'],
      },
    };

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeo,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockWeather,
      });

    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchWeather('celsius');
    expect(result.city).toBe('London');
    expect(result.temp).toBe(18);
    expect(result.condition).toBe('Partly Cloudy ⛅');
    expect(result.isOffline).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Second call should hit in-memory cache directly with 0 network calls
    const cachedResult = await fetchWeather('celsius');
    expect(cachedResult).toEqual(result);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const cacheEntry = getCachedWeather('celsius');
    expect(cacheEntry).not.toBeNull();
    expect(cacheEntry?.data.city).toBe('London');
  });

  it('caches celsius and fahrenheit independently', async () => {
    const mockWeather = {
      current: {
        temperature_2m: 20,
        apparent_temperature: 20,
        relative_humidity_2m: 50,
        wind_speed_10m: 5,
        weather_code: 0,
      },
      daily: { sunrise: [], sunset: [] },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockWeather,
    });
    vi.stubGlobal('fetch', fetchMock);

    await fetchWeather('celsius');
    expect(getCachedWeather('celsius')).not.toBeNull();
    expect(getCachedWeather('fahrenheit')).toBeNull();

    await fetchWeather('fahrenheit');
    expect(getCachedWeather('fahrenheit')).not.toBeNull();
  });

  it('silently falls back to offline default when offline with no prior cache', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network disconnected (Airplane Mode)')));

    const result = await fetchWeather('celsius');
    expect(result.isOffline).toBe(true);
    expect(result.isCachedOffline).toBe(false);
    expect(result.city).toBe('New York');
    expect(result.temp).toBe(20);
    expect(result.condition).toBe('Clear ☀️');
  });

  it('falls back to stale cache when network fails and prior cache is within 2 hours', async () => {
    // Prime the cache
    const mockWeather = {
      current: {
        temperature_2m: 25,
        apparent_temperature: 25,
        relative_humidity_2m: 40,
        wind_speed_10m: 8,
        weather_code: 0,
      },
      daily: { sunrise: [], sunset: [] },
    };

    const successFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockWeather,
    });
    vi.stubGlobal('fetch', successFetch);

    const initial = await fetchWeather('celsius');
    expect(initial.isOffline).toBe(false);

    // Simulate expiration by manipulating timestamp to 45 mins ago (stale for live fetch, but valid for offline fallback)
    const entry = getCachedWeather('celsius');
    if (entry) {
      entry.timestamp = Date.now() - (45 * 60 * 1000);
    }

    // Now make network fail
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Fetch failed')));

    const fallback = await fetchWeather('celsius');
    expect(fallback.temp).toBe(25);
    expect(fallback.isOffline).toBe(true);
    expect(fallback.isCachedOffline).toBe(true);
  });

  it('falls back to default coordinates when offline and cache is older than 2 hours', async () => {
    // Prime the cache
    const mockWeather = {
      current: {
        temperature_2m: 28,
        apparent_temperature: 28,
        relative_humidity_2m: 40,
        wind_speed_10m: 8,
        weather_code: 0,
      },
      daily: { sunrise: [], sunset: [] },
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockWeather,
    }));

    await fetchWeather('celsius');

    // Simulate expiration beyond 2 hours (e.g. 2.5 hours ago)
    const entry = getCachedWeather('celsius');
    if (entry) {
      entry.timestamp = Date.now() - (150 * 60 * 1000);
    }

    // Now network fails
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Airplane mode')));

    const fallback = await fetchWeather('celsius');
    // Stale cache should NOT be used beyond 2 hours; should revert to default offline fallback
    expect(fallback.temp).toBe(20);
    expect(fallback.city).toBe('New York');
    expect(fallback.isOffline).toBe(true);
    expect(fallback.isCachedOffline).toBe(false);
  });
});
