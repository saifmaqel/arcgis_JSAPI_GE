import React, { useEffect, useRef, useState } from 'react'
import Map from '@arcgis/core/Map.js'
import MapView from '@arcgis/core/views/MapView.js'
import LayerList from '@arcgis/core/widgets/LayerList.js'
import Layer from '@arcgis/core/layers/Layer.js'
import Graphic from '@arcgis/core/Graphic.js'
import { useApp } from '../context/appContext'
import * as geometryEngineAsync from '@arcgis/core/geometry/geometryEngineAsync.js'
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils.js'
import AllUiComponent from './AllUiComponent'
import Expand from '@arcgis/core/widgets/Expand'
import FeatureLayerView from 'esri/views/layers/FeatureLayerView'
import { debounce } from 'lodash'
const polySym = {
  type: 'simple-fill',
  color: [37, 37, 37, 0.2],
  outline: {
    color: [0, 0, 0, 0.2],
    width: 2,
  },
}
const pointSym = {
  type: 'simple-marker',
  color: [37, 37, 37],
  size: 7,
}
let tempMapCursorPoint: __esri.Point
async function QueryFeature(
  view: MapView,
  mapCursorPoint: __esri.Point,
  distance: number
) {
  let foundFeature = false
  for (let index = 0; index < view.map.allLayers.length; index++) {
    const l = view.map.allLayers.getItemAt(index)
    if (l.type !== 'feature') continue
    try {
      const lv: __esri.LayerView = await view.whenLayerView(l)
      if (lv.destroyed) return
      const flv = lv as FeatureLayerView
      const queryResult = await flv.queryFeatures({
        geometry: mapCursorPoint,
        returnGeometry: true,
        spatialRelationship: 'intersects',
        distance: distance,
        units: 'meters',
      })
      if (!queryResult || queryResult.features.length === 0) {
        continue
      }
      const geometry = queryResult.features[0].geometry
      if (geometry.type === 'polygon' || geometry.type === 'polyline') {
        const nearestVertex = await geometryEngineAsync.nearestVertex(
          geometry,
          mapCursorPoint
        )
        if (nearestVertex.distance <= distance) {
          addPointAndBuffer(view, nearestVertex.coordinate, distance)
          foundFeature = true
          break
        }
      } else if (geometry.type === 'point') {
        addPointAndBuffer(view, geometry as __esri.Point, distance)
        foundFeature = true
        break
      }
    } catch (err) {
      console.log('Erro in for loop', err)
    }
  }
  if (!foundFeature) {
    addPointAndBuffer(view, mapCursorPoint, distance)
  }
}
function addPoint(view: MapView, point: __esri.Point) {
  if (view.graphics.length === 0) {
    view.graphics.add(
      new Graphic({
        geometry: point,
        symbol: pointSym,
      })
    )
  } else {
    const graphic = view.graphics.getItemAt(0)
    graphic.geometry = point
  }
}

function addBuffer(view: MapView, point: __esri.Point, distance: number) {
  geometryEngineAsync
    .buffer(point, distance, 'meters', false)
    .then((buffer) => {
      if (view.graphics.length <= 1) {
        const graphic = new Graphic({
          geometry: buffer as __esri.Polygon,
          symbol: polySym,
        })
        view.graphics.add(graphic)
      } else {
        view.graphics.getItemAt(1).geometry = buffer as __esri.Polygon
      }
    })
}
function addPointAndBuffer(
  view: MapView,
  point: __esri.Point,
  distance: number
) {
  addPoint(view, point)
  addBuffer(view, point, distance)
}
function pointerEventFunction(
  event: __esri.ViewPointerMoveEvent,
  view: __esri.MapView,
  distance: number
) {
  event.stopPropagation()
  const screenPoint = {
    x: event.x,
    y: event.y,
  } as __esri.MapViewScreenPoint
  const mapCursorPoint: __esri.Point = view.toMap(screenPoint)
  tempMapCursorPoint = mapCursorPoint
  QueryFeature(view, mapCursorPoint, distance)
}
function MyMap() {
  const { state } = useApp()
  const mapRef = useRef<HTMLDivElement>(null)
  const expandedRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<__esri.MapView>(new MapView())
  useEffect(() => {
    const myMap = new Map({
      basemap: 'streets-vector',
    })
    const view = new MapView({
      container: mapRef.current as HTMLDivElement,
      map: myMap,
      zoom: 18,
      center: [35.8907635223865, 31.968727310006464],
    })
    const layerList = new LayerList({
      view,
      listItemCreatedFunction: (event: { item: __esri.ListItem }) => {
        const item = event.item
        if (item.layer.type != 'group') {
          item.panel = {
            content: 'legend',
            open: true,
          } as __esri.ListItemPanel
        }
      },
    })
    const expand: __esri.Expand = new Expand({
      content: expandedRef.current as HTMLDivElement,
      view: view,
      group: 'top-right',
      expanded: true,
    })

    reactiveUtils.when(
      () => view.ready,
      async () => {
        setView(view)
        Layer.fromPortalItem({
          portalItem: {
            id: 'a4a63941083a45399637f3ba48265bd2',
          } as __esri.PortalItem,
        }).then((layer) => {
          layer.load().then((l: __esri.GroupLayer) => {
            view.map.addMany([l])
          })
        })
      }
    )
    view.ui.add(layerList, 'top-right')
    view.ui.add(expand, 'top-left')
    return () => {
      if (view) {
        view.destroy()
      }
    }
  }, [])

  useEffect(() => {
    if (!state.enableSnapping) {
      view.graphics.removeAll()
      return
    }
    if (tempMapCursorPoint)
      addPointAndBuffer(view, tempMapCursorPoint, state.distance)

    const pointerEvent = view.on(
      'pointer-move',
      debounce((event) => {
        pointerEventFunction(event, view, state.distance)
      })
    )
    return function cleanup() {
      pointerEvent.remove()
    }
  }, [state, state.distance, state.enableSnapping, view])

  return (
    <div>
      <div className='MyMap' ref={mapRef}></div>
      <div id='expandedDiv' ref={expandedRef}>
        <AllUiComponent />
      </div>
    </div>
  )
}
export default MyMap
