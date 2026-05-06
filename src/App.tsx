import './App.css'
import {GeoJSON, type GeoJSONProps, MapContainer, TileLayer} from 'react-leaflet'
import {type ChangeEvent, useEffect, useState} from "react";
import woj from './wojdata.json'
import pow from './powdata.json'
import {Layer, type StyleFunction} from "leaflet";

type feature = { properties: { nazwa: string } }

type RegionData = {
  count: number
  location_247: number
  location_outdoors: number
  ludnosc: number
  powierzchnia: number
}

type scope = 'pow' | 'woj'

function App() {

  const wojLink = 'https://raw.githubusercontent.com/ppatrzyk/polska-geojson/master/wojewodztwa/wojewodztwa-min.geojson'
  const powLink = 'https://raw.githubusercontent.com/ppatrzyk/polska-geojson/master/powiaty/powiaty-min.geojson'
  const [scope, setScope] = useState<scope>('woj')
  const [geoJson, setGeoJson] = useState<GeoJSONProps | null>(null)
  const [variable, setVariable] = useState<keyof RegionData>('count')
  const [denominator, setDenominator] = useState<keyof RegionData | null>(null)
  const [dataMap, setDataMap] = useState<Record<string, RegionData>>(woj)
  const steps = getScale(variable, denominator)

  const getColor = (value: number) => {
    if (steps === null) return '#000'
    if (value > steps.max - (steps.max - steps.min) / 7) return '#005824'
    if (value > steps.max - 2*(steps.max - steps.min) / 7) return '#238b45'
    if (value > steps.max - 3*(steps.max - steps.min) / 7) return '#41ae76'
    if (value > steps.min + 3*(steps.max - steps.min) / 7) return '#66c2a4'
    if (value > steps.min + 2*(steps.max - steps.min) / 7) return '#99d8c9'
    if (value > steps.min + (steps.max - steps.min) / 7) return '#ccece6'
    return '#edf8fb'
  }


  function getScale<K extends keyof RegionData>(variable: K, denominator: K | null) {
    const list: number[] = Object.values(dataMap).map(d => d[variable] / (denominator === null ? 1 : d[denominator]))
    if (list.length === 0) return null;

    const min = Math.min(...list);
    const max = Math.max(...list);
    const avg = list.reduce((a, b) => a + b, 0) / list.length;

    const midLow = (min + avg) / 2;
    const midHigh = (avg + max) / 2;

    console.log({
      min,
      midLow,
      avg,
      midHigh,
      max
    })

    return {
      min,
      midLow,
      avg,
      midHigh,
      max
    };
  }

  const getValue = (regionData: RegionData): number => {
    const variableValue = regionData[variable]
    const denominatorValue = denominator === null ? 1 : regionData[denominator]
    if (denominatorValue === 0) return 0
    return variableValue / denominatorValue
  }


  useEffect(() => {
    async function fetchMap(): Promise<void> {
      try {
        setGeoJson(null)
        const response = await fetch(scope === 'woj' ? wojLink : powLink)
        const json = await response.json()
        setGeoJson({data: json})
        setDataMap(scope === 'woj' ? woj : pow)
      } catch (e) {
        console.log(e)
      }
    }

    fetchMap()
  }, [scope])

  const style: StyleFunction = (feature) => {
    if (feature === undefined)
      return {}
    const nameLowerCase = feature.properties.nazwa
    const regionData = dataMap[nameLowerCase]
    if(regionData === undefined) console.log(nameLowerCase)
    const value = regionData === undefined ? 0 : getValue(regionData)

    return {
      fillColor: getColor(value),
      weight: 1,
      color: 'black',
      fillOpacity: 1
    }
  }

  const onEachFeature = (feature: feature, layer: Layer) => {
    const nameLowerCase = feature.properties.nazwa
    const name = nameLowerCase[0].toUpperCase() + nameLowerCase.substring(1)
    const regionData = dataMap[nameLowerCase]
    const value = regionData === undefined ? 0 : getValue(regionData)

    layer.bindPopup(`${name}: ${Number(value.toPrecision(2))}`)
  }

  const changeVariable = (event:ChangeEvent<HTMLInputElement, HTMLInputElement>) => {
    setVariable(event.target.value as keyof RegionData);
  };
  const changeDenominator = (event:ChangeEvent<HTMLInputElement, HTMLInputElement>) => {
    if(event.target.value === 'null'){
      setDenominator(null)
      return
    }
    setDenominator(event.target.value as keyof RegionData);
  };

  console.log(denominator)
  return (
    <>
      <MapContainer center={[52, 19]}
                    zoom={7}
                    style={{height: '1000px'}}
                    wheelPxPerZoomLevel={100000}
                    maxBounds={[[49, 14], [55, 24.5]]}
                    maxBoundsViscosity={1}
                    minZoom={6}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geoJson && (<GeoJSON
          key={`${variable}-${denominator ?? 'none'}-${scope}`}
          data={geoJson.data}
          style={style}
          onEachFeature={onEachFeature}
        />)}
      </MapContainer>

      <table>
        <tbody>
        <tr>
          <th>Województwa/Powiaty:</th>
          <th>Select variable:</th>
          <th>Select denominator:</th>
        </tr>
        <tr>
          <td>
            <label>
              <input
                type="radio"
                value="woj"
                checked={scope === 'woj'}
                onChange={() => setScope('woj')}/> Województwa
            </label>
          </td>
          <td>
            <label>
              <input
                type="radio"
                value="count"
                checked={variable === 'count'}
                onChange={changeVariable}/> Count
            </label>
          </td>
          <td>
            <label>
              <input
                type="radio"
                value={'null'}
                checked={denominator === null}
                onChange={changeDenominator}/> Nic
            </label>
          </td>
        </tr>
        <tr>
          <td>
            <label>
              <input
                type="radio"
                value="pow"
                checked={scope === 'pow'}
                onChange={() => setScope('pow')}/> Powiaty
            </label>
          </td>
          <td>
            <label>
              <input
                type="radio"
                value="location_247"
                checked={variable === 'location_247'}
                onChange={changeVariable}/> Location 24/7
            </label>
          </td>
          <td>
            <label>
              <input
                type="radio"
                value="ludnosc"
                checked={denominator=== 'ludnosc'}
                onChange={changeDenominator}/> Ludność
            </label>
          </td>
        </tr>
        <tr>
          <td></td>
          <td>
            <label>
              <input
                type="radio"
                value="location_outdoors"
                checked={variable === 'location_outdoors'}
                onChange={changeVariable}/> Location outdoors
            </label>
          </td>
          <td>
            <label>
              <input
                type="radio"
                value="powierzchnia"
                checked={denominator === 'powierzchnia'}
                onChange={changeDenominator}/> Powierzchnia
            </label>
          </td>
        </tr>
        </tbody>
      </table>
    </>)
}

export default App
