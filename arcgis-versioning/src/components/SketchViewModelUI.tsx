import React from 'react'
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel.js'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import SnappingControls from '@arcgis/core/widgets/support/SnappingControls'
import Graphic from '@arcgis/core/Graphic'
import { SimpleMarkerSymbol } from '@arcgis/core/symbols'
import FeatureSnappingLayerSource from '@arcgis/core/views/interactive/snapping/FeatureSnappingLayerSource.js'

const pointSymbol = new SimpleMarkerSymbol({
  color: 'black',
  size: 7,
  style: 'circle',
})
const polySym = {
  type: 'simple-fill',
  color: [37, 37, 37, 0.2],
  outline: {
    color: [0, 0, 0, 0.2],
    width: 2,
  },
}
const transparentSymbol = new SimpleMarkerSymbol({
  color: [0, 0, 0, 0],
  outline: {
    color: [0, 0, 0, 0],
  },
})
type SketchViewModelUIProps = {
  view: __esri.MapView
}
let sketchViewModel: __esri.SketchViewModel = new SketchViewModel()
const graphicsLayer = new GraphicsLayer()
const choosenFeaturesGraphicsLayer = new GraphicsLayer()

const addGraphic = (event: __esri.SketchViewModelCreateEvent) => {
  if (event.state !== 'complete') return
  graphicsLayer.remove(event.graphic) // try to comment this
  const pointGraphic = new Graphic({
    geometry: event.graphic.geometry,
    symbol: pointSymbol,
  })
  graphicsLayer.add(pointGraphic)
  // graphicsLayer.graphics.find()
  sketchViewModel.create('point')
}
function SketchViewModelUI({ view }: SketchViewModelUIProps) {
  // reactiveUtils.when(
  //   () => !view.updating,
  //   async () => {
  //     console.log(view.updating)
  //   }
  // )
  view.when(async () => {
    view.map.add(choosenFeaturesGraphicsLayer)
    sketchViewModel = new SketchViewModel({
      view: view,
      layer: graphicsLayer,
      pointSymbol: new SimpleMarkerSymbol({
        color: [204, 186, 252],
        size: 8,
        style: 'circle',
      }),
      snappingOptions: {
        enabled: true,
        selfEnabled: true,
        featureEnabled: true,
        distance: 100,
        featureSources: [],
      } as __esri.SketchViewModelProperties['snappingOptions'],
    })
    for (let index = 0; index < view.map.allLayers.length; index++) {
      const layer = view.map.allLayers.getItemAt(index)
      const layerView = await view.whenLayerView(layer)

      if (layer.type !== 'feature') continue
      console.log('feature layers on the view map', layer)

      const results = await (
        layerView as __esri.FeatureLayerView
      ).queryFeatures({
        where: 'MOD(OBJECTID, 2) = 0',
        outFields: ['OBJECTID'],
        returnGeometry: true,
      })

      for (let index = 0; index < results.features.length; index++) {
        const feature = results.features.at(index)

        if (!feature) continue

        feature.symbol = transparentSymbol
        feature.attributes['FTR_TYPE'] = 'SNAPPING'
        choosenFeaturesGraphicsLayer.add(feature as __esri.Graphic)
      }
    }
    const snappingLayer = new FeatureSnappingLayerSource({
      layer: choosenFeaturesGraphicsLayer as __esri.GraphicsLayer,
      enabled: true,
    })
    sketchViewModel.snappingOptions.featureSources.push(snappingLayer)
    sketchViewModel.on('create', addGraphic)
  })

  const handleClick = () => {
    sketchViewModel.cancel()
    view.map.add(graphicsLayer)
    sketchViewModel.create('point')
  }
  return (
    <div className='SketchViewModelUI'>
      <div className='SketchViewModelUI-content'>
        <h1>sketchViewModel</h1>
        <button onClick={handleClick}>Draw Point</button>
      </div>
    </div>
  )
}
export default SketchViewModelUI
