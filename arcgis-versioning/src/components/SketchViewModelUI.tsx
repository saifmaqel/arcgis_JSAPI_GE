import React from 'react'
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel.js'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import SnappingControls from '@arcgis/core/widgets/support/SnappingControls'
import Graphic from '@arcgis/core/Graphic'
import { SimpleMarkerSymbol } from '@arcgis/core/symbols'
import FeatureSnappingLayerSource from '@arcgis/core/views/interactive/snapping/FeatureSnappingLayerSource.js'
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils'
//  SOLVE OTHER BUGS, TRY TO HIDE GRAPHICS LAYER FROM THE LAYER LIST, USE FEATURE LAYER INSTADE OF GRAPHICS LAYER
// ERROR WHEN HOT RELODE WITHOUT CLICKING THE DRAW BUTTON
const pointSymbol = new SimpleMarkerSymbol({
  color: 'black',
  size: 7,
  style: 'circle',
})
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
const choosenFeaturesLayer = new GraphicsLayer()

const addGraphic = (event: __esri.SketchViewModelCreateEvent) => {
  if (event.state !== 'complete') return
  graphicsLayer.remove(event.graphic)
  const pointGraphic = new Graphic({
    geometry: event.graphic.geometry,
    symbol: pointSymbol,
  })
  graphicsLayer.add(pointGraphic)
  // graphicsLayer.graphics.find()
  sketchViewModel.create('point')
}
const addChoosenFeaturesToMapView = async (
  choosenFeaturesGraphicsLayer: __esri.GraphicsLayer,
  view: __esri.MapView,
  sketchViewModel: __esri.SketchViewModel
) => {
  for (let index = 0; index < view.map.allLayers.length; index++) {
    const layer = view.map.allLayers.getItemAt(index)
    const layerView = await view.whenLayerView(layer)

    if (layer.type !== 'feature') continue

    if (!layerView) continue

    const results = await (layerView as __esri.FeatureLayerView).queryFeatures({
      where: 'MOD(OBJECTID, 2) = 0',
      outFields: ['OBJECTID'],
      returnGeometry: true,
    })
    // console.log('results', results)

    for (let index = 0; index < results.features.length; index++) {
      const feature = results.features.at(index)

      if (!feature) continue

      // feature.symbol = transparentSymbol
      feature.attributes['FTR_TYPE'] = 'SNAPPING'
      choosenFeaturesGraphicsLayer.add(feature as __esri.Graphic)
    }
  }
  const snappingLayer = new FeatureSnappingLayerSource({
    layer: choosenFeaturesGraphicsLayer as __esri.GraphicsLayer,
    enabled: true,
  })
  sketchViewModel.snappingOptions.featureSources.push(snappingLayer)
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
      await addChoosenFeaturesToMapView(
        choosenFeaturesLayer,
        view,
        sketchViewModel
      )
      view.map.addMany([graphicsLayer]) // this added every hot relode try to out it inside
      sketchViewModel.on('create', addGraphic)
    })

  const handleClick = () => {
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
