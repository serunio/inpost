import {point} from "@turf/helpers";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import {readFile, writeFile} from 'fs/promises'

type Summary = {
  count: number;
  location_247: number;
  location_outdoors: number;
};

export default async function FetchData() {
  const pageCount = await fetch('https://api-global-points.easypack24.net/v1/points?per_page=10000')
    .then(r => r.json())
    .then(j => j.total_pages)
    .catch(() => 0);

  const features = await fetch('https://raw.githubusercontent.com/ppatrzyk/polska-geojson/refs/heads/master/powiaty/powiaty-min.geojson')
    .then(r => r.json())
    .then(j => j.features)
    .catch(() => []);

  const result: Record<string, Summary> = await loadCSV();

  // for (const f of features) {
  //   result[f.properties.nazwa] = {
  //     count: 0,
  //     location_247: 0,
  //     location_outdoors: 0
  //   };
  // }

  const range = [...Array(pageCount).keys()].map(i => i + 1);

  await Promise.all(range.map(async page => {
    const points = await fetch(`https://api-global-points.easypack24.net/v1/points?per_page=10000&page=${page}`)
      .then(r => r.json())
      .then(j => j.items)
      .catch(() => []);

    for (const p of points) {
      const pt = point([p.location.longitude, p.location.latitude]);

      for (const feature of features) {
        if (booleanPointInPolygon(pt, feature)) {
          const name = feature.properties.nazwa;
          const entry = result[name];
          if (entry === undefined) continue
          entry.count += 1;
          if (p.location_247) entry.location_247 += 1;
          if (p.location_type === "Outdoor") entry.location_outdoors += 1;

          break;
        }
      }
    }
  }));
  await writeFile('powdata.json', JSON.stringify(result, null, 2), 'utf8');

  return result
}

async function loadCSV() {
  const text = await readFile('PowData.csv', 'utf-8')

  const lines = text.split('\n').slice(1);
  return Object.fromEntries(
    lines
      .filter(line => line.trim() !== '')
      .map(line => {
        const [nazwa, ludnosc, powierzchnia] = line.split(';');
        const trimmedName = nazwa
          .replace(/\b(m\.|st\.)\s*/g, '')
          .replace(/\bod 2013\b/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .replace(/^./, c => c.toLowerCase());
        return [
          trimmedName,
          {
            ludnosc: Number(ludnosc),
            powierzchnia: Number(powierzchnia),
            count: 0,
            location_247: 0,
            location_outdoors: 0
          }
        ];
      })
  );
}

FetchData()
// loadCSV()