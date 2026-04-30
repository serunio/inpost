import {woj} from './woj.json'
import {writeFile} from 'fs/promises'

type Point = { location_type: string, location_247: boolean }
type PointReduced = { count: number, location_outdoors: number, location_247: number }
type InpostResponse = { page: number, total_pages: number, items: Array<Point>, }

export default async function FetchData():Promise<Record<string, PointReduced>> {
  const obj: Record<string, PointReduced> = {}

  await Promise.all(woj.map(async w => {
    let page = 1
    let data: InpostResponse
    let count: PointReduced = {count: 0, location_247: 0, location_outdoors: 0}
    do {
      try {
        const response = await fetch(`https://api-global-points.easypack24.net/v1/points?province=${w.toLowerCase()}&per_page=10000&page=${page}`)
        data = await response.json()
        count = data.items.reduce((prev, cur) => {
          prev.count++
          if (cur.location_247 === true) prev.location_247++
          if(cur.location_type === 'Outdoor') prev.location_outdoors++
          return prev;
        }, count)
      } catch (e) {
        console.log(e)
        break
      }
    } while (page++ < data.total_pages)
    obj[w] = count
  }))

  await writeFile('wojdata.json', JSON.stringify(obj, null, 2), 'utf8');

  return obj
}

// FetchData()