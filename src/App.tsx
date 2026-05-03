import './App.css'
import {GeoJSON, MapContainer, TileLayer, type GeoJSONProps} from 'react-leaflet'
import {useEffect, useState} from "react";
import woj from './wojdata.json'

type feature = {properties: {nazwa:string}}

type RegionData = {
    count: number
    location_247: number
    location_outdoors: number
}

const getColor = (value:number) => {
    if (value > 3000) return '#800026'
    if (value > 2000) return '#BD0026'
    if (value > 1000) return '#E31A1C'
    return '#FFEDA0'
}

function App() {

    const [geoJson, setGeoJson] = useState<GeoJSONProps | null>(null)
    const dataMap:Record<string, RegionData> = woj

    useEffect(() => {
        async function fetchMap():Promise<void> {
            try {
                const response = await fetch('https://raw.githubusercontent.com/ppatrzyk/polska-geojson/refs/heads/master/wojewodztwa/wojewodztwa-min.geojson')
                const json = await response.json()
                setGeoJson({data: json})
                console.log(json)
            } catch(e) {
                console.log(e)
            }
        }

        fetchMap()
    }, [])

    const style = (feature:feature) => {
        const nameLowerCase = feature.properties.nazwa
        const name = nameLowerCase[0].toUpperCase() + nameLowerCase.substring(1)
        const value = dataMap[name].count || 0

        return {
            fillColor: getColor(value),
            weight: 2,
            color: 'white',
            fillOpacity: 0.7
        }
    }

    const onEachFeature = (feature:feature, layer) => {
        const nameLowerCase = feature.properties.nazwa
        const name = nameLowerCase[0].toUpperCase() + nameLowerCase.substring(1)
        console.log(name)
        const value = dataMap[name].count || 0

        layer.bindPopup(`${name}: ${value}`)
    }

  return (
    <>
        <MapContainer center={[52, 19]}
                      zoom={7}
                      style={{ height: '1000px' }}
                      wheelPxPerZoomLevel={100000}
                      maxBounds={[[49, 14], [55, 24.5]]}
                      maxBoundsViscosity={1}
                      minZoom={6}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {geoJson && (<GeoJSON
                data={geoJson.data}
                style={style}
                onEachFeature={onEachFeature}
            />)}
        </MapContainer>
      </>)
}

export default App
