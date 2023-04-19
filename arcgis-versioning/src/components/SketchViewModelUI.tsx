import React, { useEffect, useState } from 'react'
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel.js'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
// import SnappingControls from '@arcgis/core/widgets/support/SnappingControls'
import Graphic from '@arcgis/core/Graphic'
import { SimpleMarkerSymbol } from '@arcgis/core/symbols'
import FeatureSnappingLayerSource from '@arcgis/core/views/interactive/snapping/FeatureSnappingLayerSource.js'
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils'
import FeatureEffect from '@arcgis/core/layers/support/FeatureEffect.js'
import FeatureFilter from '@arcgis/core/layers/support/FeatureFilter.js'

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
const graphicsLayer = new GraphicsLayer()
const choosenFeaturesLayer = new GraphicsLayer()
function SketchViewModelUI({ view }: SketchViewModelUIProps) {
  const [graphicsLayerAdded, setGraphicsLayerAdded] = useState(false)

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
    choosenFeaturesGraphicsLayer: __esri.GraphicsLayer,
    view: __esri.MapView,
    sketchViewModel: __esri.SketchViewModel
  ) => {
    for (let index = 0; index < view.map.allLayers.length; index++) {
      const layer = view.map.allLayers.getItemAt(index)
      const layerView = await view.whenLayerView(layer)

      if (layer.type !== 'feature' || !layerView) continue
      const featureLayerView = layerView as __esri.FeatureLayerView
      const results = await featureLayerView.queryFeatures({
        where: 'MOD(OBJECTID, 2) = 0',
        outFields: ['OBJECTID'],
        returnGeometry: true,
      })
      const featureFilter = {
        where: 'MOD(OBJECTID, 2) = 0',
      }
      const featureEffect = new FeatureEffect({
        filter: new FeatureFilter(featureFilter),
        includedEffect:
          'contrast(120%) drop-shadow(1px, 2px, 3px rgba(0, 0, 0, 0.2))',
        excludedEffect: 'grayscale(100%) opacity(25%)',
      })

      featureLayerView.featureEffect = featureEffect

      for (let index = 0; index < results.features.length; index++) {
        const feature = results.features.at(index) as __esri.Graphic

        if (!feature) continue

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

  useEffect(() => {
    const setUpSketchViewModel = async () => {
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
      // view.map.addMany([graphicsLayer]) // this added every hot relode try to out it insides
      sketchViewModel.on('create', addGraphic)
    }
    setUpSketchViewModel()
    reactiveUtils.once(() => !view.updating).then(setUpSketchViewModel)
    return function cleanup() {
      sketchViewModel.destroy()
    }
  }, [view])

  const handleClick = async () => {
    console.log(graphicsLayerAdded) //  DEBUG THIS
    sketchViewModel.cancel()
    sketchViewModel.create('point')
    if (!graphicsLayerAdded) {
      view.map.addMany([graphicsLayer])
      setGraphicsLayerAdded(true)
    }
  }
  return (
    <div className='SketchViewModelUI'>
      <div className='SketchViewModelUI-content'>
        <h1>sketchViewModel</h1>
        <button onClick={handleClick}>Draw Point</button>
        <button
          onClick={() =>
            addChoosenFeaturesToMapView(
              choosenFeaturesLayer,
              view,
              sketchViewModel
            )
          }
        >
          filter features
        </button>
      </div>
    </div>
  )
}
export default SketchViewModelUI

// import React, { useEffect } from 'react'
// import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel.js'
// import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
// // import SnappingControls from '@arcgis/core/widgets/support/SnappingControls'
// import Graphic from '@arcgis/core/Graphic'
// import { SimpleMarkerSymbol } from '@arcgis/core/symbols'
// import FeatureSnappingLayerSource from '@arcgis/core/views/interactive/snapping/FeatureSnappingLayerSource.js'
// import * as reactiveUtils from '@arcgis/core/core/reactiveUtils'
// import FeatureEffect from '@arcgis/core/layers/support/FeatureEffect.js'
// import FeatureFilter from '@arcgis/core/layers/support/FeatureFilter.js'

// // ERROR WHEN HOT RELODE WITHOUT CLICKING THE DRAW BUTTON
// //
// const pointSymbol = new SimpleMarkerSymbol({
//   color: 'black',
//   size: 7,
//   style: 'circle',
// })
// type SketchViewModelUIProps = {
//   view: __esri.MapView
// }
// let sketchViewModel: __esri.SketchViewModel = new SketchViewModel()
// const graphicsLayer = new GraphicsLayer()
// const choosenFeaturesLayer = new GraphicsLayer()
// function SketchViewModelUI({ view }: SketchViewModelUIProps) {
//   // const hasMounted = useRef(false)
//   const addGraphic = async (event: __esri.SketchViewModelCreateEvent) => {
//     if (event.state !== 'complete') return
//     graphicsLayer.remove(event.graphic)
//     const pointGraphic = new Graphic({
//       geometry: event.graphic.geometry,
//       symbol: pointSymbol,
//     })
//     graphicsLayer.add(pointGraphic)
//     // try {
//     //   sketchViewModel.create('point')
//     // } catch (e) {
//     //   console.log(e)
//     // }
//   }
//   const addChoosenFeaturesToMapView = async (
//     choosenFeaturesGraphicsLayer: __esri.GraphicsLayer,
//     view: __esri.MapView,
//     sketchViewModel: __esri.SketchViewModel
//   ) => {
//     for (let index = 0; index < view.map.allLayers.length; index++) {
//       const layer = view.map.allLayers.getItemAt(index)
//       const layerView = await view.whenLayerView(layer)

//       if (layer.type !== 'feature' || !layerView) continue
//       const featureLayerView = layerView as __esri.FeatureLayerView
//       const results = await featureLayerView.queryFeatures({
//         where: 'MOD(OBJECTID, 2) = 0',
//         outFields: ['OBJECTID'],
//         returnGeometry: true,
//       })
//       const featureFilter = {
//         where: 'MOD(OBJECTID, 2) = 0',
//       }
//       const featureEffect = new FeatureEffect({
//         filter: new FeatureFilter(featureFilter),
//         includedEffect:
//           'contrast(120%) drop-shadow(1px, 2px, 3px rgba(0, 0, 0, 0.2))',
//         excludedEffect: 'grayscale(100%) opacity(25%)',
//       })

//       featureLayerView.featureEffect = featureEffect

//       for (let index = 0; index < results.features.length; index++) {
//         const feature = results.features.at(index) as __esri.Graphic

//         if (!feature) continue

//         feature.attributes['FTR_TYPE'] = 'SNAPPING'
//         choosenFeaturesGraphicsLayer.add(feature as __esri.Graphic)
//       }
//     }
//     const snappingLayer = new FeatureSnappingLayerSource({
//       layer: choosenFeaturesGraphicsLayer as __esri.GraphicsLayer,
//       enabled: true,
//     })
//     sketchViewModel.snappingOptions.featureSources.push(snappingLayer)
//   }

//   useEffect(() => {
//     const setUpSketchViewModel = async () => {
//       sketchViewModel = new SketchViewModel({
//         view: view,
//         layer: graphicsLayer,
//         pointSymbol: new SimpleMarkerSymbol({
//           color: [204, 186, 252],
//           size: 8,
//           style: 'circle',
//         }),
//         snappingOptions: {
//           enabled: true,
//           selfEnabled: true,
//           featureEnabled: true,
//           distance: 50,
//           featureSources: [],
//         } as __esri.SketchViewModelProperties['snappingOptions'],
//       })
//       await addChoosenFeaturesToMapView(
//         choosenFeaturesLayer,
//         view,
//         sketchViewModel
//       )
//       view.map.addMany([graphicsLayer]) // this added every hot relode try to out it insides
//       sketchViewModel.on('create', addGraphic)
//     }
//     setUpSketchViewModel()
//     reactiveUtils.once(() => !view.updating).then(setUpSketchViewModel)
//   }, [view])

//   const handleClick = async () => {
//     sketchViewModel.cancel()
//     sketchViewModel.create('point')
//   }
//   return (
//     <div className='SketchViewModelUI'>
//       <div className='SketchViewModelUI-content'>
//         <h1>sketchViewModel</h1>
//         <button onClick={handleClick}>Draw Point</button>
//         <button>filter features</button>
//       </div>
//     </div>
//   )
// }
// export default SketchViewModelUI
