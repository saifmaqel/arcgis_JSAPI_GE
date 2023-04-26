import React from 'react'
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel.js'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
// import SnappingControls from '@arcgis/core/widgets/support/SnappingControls'
import Graphic from '@arcgis/core/Graphic'
import { SimpleMarkerSymbol } from '@arcgis/core/symbols'
import FeatureSnappingLayerSource from '@arcgis/core/views/interactive/snapping/FeatureSnappingLayerSource.js'
import FeatureEffect from '@arcgis/core/layers/support/FeatureEffect.js'
import FeatureFilter from '@arcgis/core/layers/support/FeatureFilter.js'

const GfxLayerName = 'MYGRAPHICLAYER'

const gfxLayer = new GraphicsLayer({
  listMode: 'hide',
  id: GfxLayerName,
})
const pointSymbol = new SimpleMarkerSymbol({
  color: 'black',
  size: 7,
  style: 'circle',
})
type SketchViewModelUIProps = {
  view: __esri.MapView
}
let sketchViewModel: __esri.SketchViewModel | undefined = undefined
const choosenFeaturesLayer = new GraphicsLayer()
function SketchViewModelUI({ view }: SketchViewModelUIProps) {
  const clearFilter = () => {
    if (!sketchViewModel) return
    sketchViewModel.snappingOptions.featureSources =
      [] as unknown as __esri.Collection<FeatureSnappingLayerSource>
    view.map.allLayers.forEach((layer) => {
      if (layer.type === 'feature') {
        const layerView = view.whenLayerView(
          layer
        ) as Promise<__esri.FeatureLayerView>
        layerView.then((layerView) => {
          layerView.featureEffect = new FeatureEffect({})
        })
      }
    })
  }
  const addChoosenFeaturesToMapView = async () => {
    if (!sketchViewModel) return
    for (let index = 0; index < view.map.allLayers.length; index++) {
      const layer = view.map.allLayers.getItemAt(index)
      const layerView = await view.whenLayerView(layer)

      if (layer.type !== 'feature' || !layerView) continue
      const featureLayerView = layerView as __esri.FeatureLayerView
      const queryFeatures = await featureLayerView.queryFeatures({
        where: 'MOD(OBJECTID, 2) = 0',
        outFields: ['OBJECTID'],
        returnGeometry: true,
      })

      for (let index = 0; index < queryFeatures.features.length; index++) {
        const feature = queryFeatures.features.at(index) as __esri.Graphic

        if (!feature) continue

        choosenFeaturesLayer.add(feature as __esri.Graphic)
      }
      const snappingLayer = new FeatureSnappingLayerSource({
        layer: choosenFeaturesLayer as __esri.GraphicsLayer,
        enabled: true,
      })
      sketchViewModel.snappingOptions.featureSources.push(snappingLayer)
      const featureEffect = new FeatureEffect({
        filter: new FeatureFilter({
          where: 'MOD(OBJECTID, 2) = 0',
        }),
        includedEffect:
          'contrast(120%) drop-shadow(1px, 2px, 3px rgba(0, 0, 0, 0.2))',
        excludedEffect: 'grayscale(100%) opacity(25%)',
      })

      featureLayerView.featureEffect = featureEffect
    }
  }
  const addGraphic = (event: __esri.SketchViewModelCreateEvent) => {
    if (!sketchViewModel) return

    if (event.state !== 'complete') return

    let foundLayer = view.map.allLayers.find(
      (l) => l.id === GfxLayerName
    ) as __esri.GraphicsLayer
    if (!foundLayer) {
      foundLayer = gfxLayer
      view.map.addMany([foundLayer])
    }
    foundLayer.remove(event.graphic)
    const pointGraphic = new Graphic({
      geometry: event.graphic.geometry,
      symbol: pointSymbol,
    })
    foundLayer.add(pointGraphic)
    sketchViewModel.create('point')
  }

  const handleClick = async () => {
    if (!sketchViewModel) {
      sketchViewModel = new SketchViewModel({
        view: view,
        layer: gfxLayer,
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
      sketchViewModel.on('create', addGraphic)
    }
    if (sketchViewModel.state === 'active') {
      sketchViewModel.cancel()
      clearFilter()
    } else {
      addChoosenFeaturesToMapView()
      sketchViewModel.create('point')
    }
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

// import React from 'react'
// import {
//   subclass,
//   property,
// } from '@arcgis/core/core/accessorSupport/decorators'
// import Widget from '@arcgis/core/widgets/Widget'

// // import { renderable, tsx } from '@arcgis/core/widgets/support/widget'

// const CSS = {
//   base: 'esri-hello-world',
//   emphasis: 'esri-hello-world--emphasis',
// }
// @subclass('esri.widgets.SketchViewModelUI')
// class SketchViewModelUI extends Widget {
//   @property()
//   firstName = 'John'
//   @property()
//   lastName = 'John'
//   @property()
//   emphasized = false
//   render() {
//     const greeting = this._getGreeting()
//     const classes = {
//       [CSS.emphasis]: this.emphasized,
//     }

//     return <div className={CSS.base}>{greeting}</div>
//   }

//   // Private method
//   private _getGreeting(): string {
//     return `Hello, my name is ${this.firstName} ${this.lastName}!`
//   }
// }
// export default SketchViewModelUI
