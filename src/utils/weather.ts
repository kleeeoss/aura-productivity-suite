export interface WeatherData {
  temp: number;
  condition: string;
  city: string;
  feelsLike?: number;
  humidity?: number;
  windSpeed?: number;
  sunrise?: string;
  sunset?: string;
}

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
  try {
    let latitude = 40.7128; // Default NYC
    let longitude = -74.0060;
    let city = 'New York';

    // Try to get IP-based location as a reliable fallback/default with a timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const geoRes = await fetch('https://get.geojs.io/v1/ip/geo.json', { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        latitude = parseFloat(geoData.latitude);
        longitude = parseFloat(geoData.longitude);
        city = geoData.city || 'Your Location';
      }
    } catch (_e) {
      console.warn("IP Geolocation failed or timed out, using default location.");
    }

    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=sunrise,sunset&temperature_unit=${tempUnit}&timezone=auto`
    );
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

    return {
      temp,
      feelsLike,
      humidity,
      windSpeed,
      sunrise,
      sunset,
      condition: getWeatherCodeString(conditionCode),
      city
    };
  } catch (err: any) {
    throw new Error(err.message || 'Unknown weather error');
  }
};
