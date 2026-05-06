import './App.css'
import {GeoJSON, type GeoJSONProps, MapContainer, TileLayer} from 'react-leaflet'
import {type ChangeEvent, useEffect, useState} from "react";
import woj from './wojdata.json'
import pow from './powdata.json'
import {Layer, type StyleFunction} from "leaflet";
import {Legend} from "./Legend.tsx";

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
  const [scale, setScale] = useState<number[] | null>(null)

  const colors = ['#edf8fb', '#ccece6', '#99d8c9', '#66c2a4', '#41ae76', '#238b45', '#005824']

  function getQuantileScale(values: number[], steps = 7) {
    const sorted = [...values].sort((a, b) => a - b)
    const thresholds = []

    for (let i = 1; i < steps; i++) {
      const qIndex = Math.floor((i / steps) * sorted.length)
      thresholds.push(sorted[qIndex])
    }

    return thresholds
  }

  function getColor(value: number, thresholds: number[] | null) {
    if (thresholds === null) return '#000'
    for (let i = 0; i < thresholds.length; i++) {
      if (value <= thresholds[i]) return colors[i]
    }
    return colors[colors.length - 1]
  }

  function getValue(regionData: RegionData): number {
    const variableValue = regionData[variable]
    if (denominator === null)
      return variableValue

    const denominatorValue = regionData[denominator]

    if (denominatorValue === 0)
      return 0
    if (denominator === 'ludnosc')
      return variableValue / (denominatorValue / 1000) //na 1000 osób
    if (denominator === 'powierzchnia')
      return variableValue / (denominatorValue / 100) //na 100km^2

    return variableValue
  }

  useEffect(() => {
    async function fetchMap(): Promise<void> {
      try {
        setGeoJson(null)
        const response = await fetch(scope === 'woj' ? wojLink : powLink)
        const json = await response.json()
        setGeoJson({data: json})
        const newData = scope === 'woj' ? woj : pow
        setDataMap(newData)
        const values: number[] = Object.values(newData).map(f => getValue(f))
        setScale(getQuantileScale(values))
      } catch (e) {
        console.log(e)
      }
    }

    fetchMap()
  }, [scope, variable, denominator])

  const style: StyleFunction = (feature) => {
    if (feature === undefined)
      return {}
    const nameLowerCase = feature.properties.nazwa
    const regionData = dataMap[nameLowerCase]
    if (regionData === undefined) console.log(nameLowerCase)
    const value = regionData === undefined ? 0 : getValue(regionData)

    return {
      fillColor: getColor(value, scale),
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
    const valueRounded = denominator !== null ? value.toFixed(2) : value

    layer.bindPopup(`${name}: ${valueRounded}`)
  }

  const changeVariable = (event: ChangeEvent<HTMLInputElement, HTMLInputElement>) => {
    setVariable(event.target.value as keyof RegionData);
  };
  const changeDenominator = (event: ChangeEvent<HTMLInputElement, HTMLInputElement>) => {
    if (event.target.value === 'null') {
      setDenominator(null)
      return
    }
    setDenominator(event.target.value as keyof RegionData);
  };

  return (
    <>
      <MapContainer center={[52, 19]}
                    zoom={7}
                    style={{height: '80vh'}}
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
        {scale && <Legend thresholds={scale} colors={colors} denominator={denominator}/>}

      </MapContainer>

      <table>
        <tbody>
        <tr>
          <th>Województwa/Powiaty:</th>
          <th>Paczkomaty:</th>
          <th>Zmienna:</th>
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
                onChange={changeVariable}/> Wszystkie
            </label>
          </td>
          <td>
            <label>
              <input
                type="radio"
                value={'null'}
                checked={denominator === null}
                onChange={changeDenominator}/> Paczkomaty
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
                onChange={changeVariable}/> Dostępne 24h na dobę
            </label>
          </td>
          <td>
            <label>
              <input
                type="radio"
                value="ludnosc"
                checked={denominator === 'ludnosc'}
                onChange={changeDenominator}/> Paczkomaty na 1000 osób
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
                onChange={changeVariable}/> Położone na zewnątrz
            </label>
          </td>
          <td>
            <label>
              <input
                type="radio"
                value="powierzchnia"
                checked={denominator === 'powierzchnia'}
                onChange={changeDenominator}/> Paczkomaty na 100km²
            </label>
          </td>
        </tr>
        </tbody>
      </table>
    </>)
}

export default App
