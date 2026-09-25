export interface WeatherData {
  temp: number;
  condition: string;
  city: string;
  feelsLike?: number;
  humidity?: number;
  windSpeed?: number;
  sunrise?: string;
  sunset?: string;
  isOffline?: boolean;
  isCachedOffline?: boolean;
}

export interface CachedWeatherEntry {
  data: WeatherData;
  timestamp: number;
  unit: 'celsius' | 'fahrenheit';
}

export const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
export const MAX_OFFLINE_CACHE_MS = 2 * 60 * 60 * 1000; // 2 hours offline cache limit
export const FETCH_TIMEOUT_MS = 1500; // 1.5s timeout for zero lag on offline/slow networks

const weatherCache = new Map<'celsius' | 'fahrenheit', CachedWeatherEntry>();

export const clearWeatherCache = (): void => {
  weatherCache.clear();
};

export const getCachedWeather = (unit: 'celsius' | 'fahrenheit'): CachedWeatherEntry | null => {
  return weatherCache.get(unit) || null;
};

const getWeatherCodeString = (code: number) => {
  if (code === 0) return 'Clear ☀️';
  if (code >= 1 && code <= 3) return 'Partly Cloudy ⛅';
  if (code >= 45 && code <= 48) return 'Fog 🌫️';
  if (code >= 51 && code <= 67) return 'Rain 🌧️';
  if (code >= 71 && code <= 77) return 'Snow ❄️';
  if (code >= 80 && code <= 82) return 'Showers ☔';
  if (code >= 95 && code <= 99) return 'Thunderstorm ⛈️';
  return 'Unknown';
};

export const fetchWeather = async (tempUnit: 'celsius' | 'fahrenheit'): Promise<WeatherData> => {
  const cached = weatherCache.get(tempUnit);
  const now = Date.now();

  // Return fresh cached weather if available (0ms latency, zero network traffic)
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    let latitude = 40.7128; // Default NYC
    let longitude = -74.0060;
    let city = 'New York';

    // Try to get IP-based location with timeout
    try {
      const geoRes = await fetch('https://get.geojs.io/v1/ip/geo.json', { signal: controller.signal });
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.latitude && geoData.longitude) {
          latitude = parseFloat(geoData.latitude);
          longitude = parseFloat(geoData.longitude);
          city = geoData.city || 'Your Location';
        }
      }
    } catch {
      // Quietly fall back to default coordinates
    }

    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=sunrise,sunset&temperature_unit=${tempUnit}&timezone=auto`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!weatherRes.ok) throw new Error('Failed to fetch weather data');

    const weatherData = await weatherRes.json();
    const current = weatherData.current;
    const daily = weatherData.daily;

    const temp = Math.round(current.temperature_2m);
    const feelsLike = Math.round(current.apparent_temperature);
    const humidity = current.relative_humidity_2m;
    const windSpeed = current.wind_speed_10m;
    const conditionCode = current.weather_code;

    let sunrise = '';
    let sunset = '';
    if (daily && daily.sunrise && daily.sunrise.length > 0) {
      sunrise = new Date(daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (daily && daily.sunset && daily.sunset.length > 0) {
      sunset = new Date(daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const freshData: WeatherData = {
      temp,
      feelsLike,
      humidity,
      windSpeed,
      sunrise,
      sunset,
      condition: getWeatherCodeString(conditionCode),
      city,
      isOffline: false,
      isCachedOffline: false,
    };

    // Update in-memory session cache
    weatherCache.set(tempUnit, { data: freshData, timestamp: Date.now(), unit: tempUnit });
    return freshData;
  } catch {
    clearTimeout(timeoutId);

    // Silent offline fallback:
    // 1. If we have cached data within the 2-hour offline limit, use it
    if (cached && now - cached.timestamp <= MAX_OFFLINE_CACHE_MS) {
      return { ...cached.data, isOffline: true, isCachedOffline: true };
    }

    // 2. Otherwise return a silent offline default with zero latency and zero exceptions
    return {
      temp: tempUnit === 'celsius' ? 20 : 68,
      feelsLike: tempUnit === 'celsius' ? 20 : 68,
      humidity: 50,
      windSpeed: 0,
      sunrise: '06:00 AM',
      sunset: '08:00 PM',
      condition: 'Clear ☀️',
      city: 'New York',
      isOffline: true,
      isCachedOffline: false,
    };
  }
};
