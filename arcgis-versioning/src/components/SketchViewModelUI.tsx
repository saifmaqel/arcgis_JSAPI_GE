import React from 'react'
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel.js'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import SnappingControls from '@arcgis/core/widgets/support/SnappingControls'
import Graphic from '@arcgis/core/Graphic'
import { SimpleMarkerSymbol } from '@arcgis/core/symbols'
import FeatureSnappingLayerSource from '@arcgis/core/views/interactive/snapping/FeatureSnappingLayerSource.js'
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils'

// ERROR WHEN HOT RELODE WITHOUT CLICKING THE DRAW BUTTON
//
const pointSymbol = new SimpleMarkerSymbol({
  color: 'black',
  size: 7,
  style: 'circle',
})
type SketchViewModelUIProps = {
  view: __esri.MapView
}
let sketchViewModel: __esri.SketchViewModel = new SketchViewModel()
const graphicsLayer = new GraphicsLayer({ listMode: 'hide' })

const addGraphic = async (event: __esri.SketchViewModelCreateEvent) => {
  if (event.state !== 'complete') return
  graphicsLayer.remove(event.graphic)
  const pointGraphic = new Graphic({
    geometry: event.graphic.geometry,
    symbol: pointSymbol,
  })
  graphicsLayer.add(pointGraphic)
  // try {
  //   sketchViewModel.create('point')
  // } catch (e) {
  //   console.log(e)
  // }
}
const addChoosenFeaturesToMapView = async (
  view: __esri.MapView,
  sketchViewModel: __esri.SketchViewModel
) => {
  for (let index = 0; index < view.map.allLayers.length; index++) {
    const layer = view.map.allLayers.getItemAt(index)
    const layerView = await view.whenLayerView(layer)

    if (layer.type !== 'feature' || !layerView) continue

    const results = await (layerView as __esri.FeatureLayerView).queryFeatures({
      where: 'MOD(OBJECTID, 2) = 0',
      outFields: ['OBJECTID'],
      returnGeometry: true,
    })
    const choosenFeaturesLayer = new FeatureLayer({
      listMode: 'hide',
      source: [] as __esri.Graphic[],
    })
    for (let index = 0; index < results.features.length; index++) {
      const feature = results.features.at(index) as __esri.Graphic

      if (!feature) continue

      feature.attributes['FTR_TYPE'] = 'SNAPPING'

      choosenFeaturesLayer.source.push(feature)
      choosenFeaturesLayer.objectIdField = index.toString()
    }
    const snappingLayer = new FeatureSnappingLayerSource({
      layer: choosenFeaturesLayer as __esri.FeatureLayer,
      enabled: true,
    })
    sketchViewModel.snappingOptions.featureSources.push(snappingLayer)
  }
}
function SketchViewModelUI({ view }: SketchViewModelUIProps) {
  reactiveUtils
    .once(() => !view.updating)
    .then(async () => {
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
          distance: 50,
          featureSources: [],
        } as __esri.SketchViewModelProperties['snappingOptions'],
      })
      await addChoosenFeaturesToMapView(view, sketchViewModel)
      view.map.addMany([graphicsLayer]) // this added every hot relode try to out it insides
      sketchViewModel.on('create', addGraphic)
    })

  const handleClick = async () => {
    sketchViewModel.cancel()
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

// const choosenFeaturesLayer = new GraphicsLayer()
// choosenFeaturesGraphicsLayer: __esri.GraphicsLayer,
// choosenFeaturesGraphicsLayer.add(feature as __esri.Graphic)
// const snappingLayer = new FeatureSnappingLayerSource({
//   layer: choosenFeaturesGraphicsLayer as __esri.GraphicsLayer,
//   enabled: true,
// })
// sketchViewModel.snappingOptions.featureSources.push(snappingLayer)

// const snappingLayer = new FeatureSnappingLayerSource({
//   layer: choosenFeaturesGraphicsLayer as __esri.GraphicsLayer,
//   enabled: true,
// })
// sketchViewModel.snappingOptions.featureSources.push(snappingLayer)
