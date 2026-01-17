export type WeatherSummary = {
  date: string;
  tempMin?: number;
  tempMax?: number;
  precipitation?: number;
  code?: number;
  label: string;
};

function weatherLabel(code?: number) {
  if (code == null) return 'N/A';
  if (code === 0) return 'Vedro';
  if ([1,2,3].includes(code)) return 'Djelomično oblačno';
  if ([45,48].includes(code)) return 'Magla';
  if ([51,53,55,56,57].includes(code)) return 'Rominjanje';
  if ([61,63,65,66,67].includes(code)) return 'Kiša';
  if ([71,73,75,77].includes(code)) return 'Snijeg';
  if ([80,81,82].includes(code)) return 'Pljuskovi';
  if ([95,96,99].includes(code)) return 'Grmljavina';
  return `Kod ${code}`;
}

export async function getWeatherForDate({ lat, lon, date }: { lat: number; lon: number; date: string }) {
  const params = new URLSearchParams();
  params.set('latitude', String(lat));
  params.set('longitude', String(lon));
  params.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode');
  params.set('timezone', 'auto');
  params.set('start_date', date);
  params.set('end_date', date);

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    return { date, label: 'N/A' } as WeatherSummary;
  }
  const json: any = await res.json();
  const daily = json?.daily;
  const tempMax = Array.isArray(daily?.temperature_2m_max) ? daily.temperature_2m_max?.[0] : undefined;
  const tempMin = Array.isArray(daily?.temperature_2m_min) ? daily.temperature_2m_min?.[0] : undefined;
  const precip = Array.isArray(daily?.precipitation_sum) ? daily.precipitation_sum?.[0] : undefined;
  const code = Array.isArray(daily?.weathercode) ? daily.weathercode?.[0] : undefined;

  const label = `${weatherLabel(code)} • ${tempMin ?? '-'}-${tempMax ?? '-'}C • oborine ${precip ?? '-'}mm`;
  return {
    date,
    tempMin,
    tempMax,
    precipitation: precip,
    code,
    label,
  } as WeatherSummary;
}
