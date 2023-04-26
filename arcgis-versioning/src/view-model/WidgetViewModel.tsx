import Accessor from '@arcgis/core/core/Accessor.js'
import { property } from '@arcgis/core/core/accessorSupport/decorators.js'
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel.js'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import Graphic from '@arcgis/core/Graphic'
import { SimpleMarkerSymbol } from '@arcgis/core/symbols'
import FeatureSnappingLayerSource from '@arcgis/core/views/interactive/snapping/FeatureSnappingLayerSource.js'
import FeatureEffect from '@arcgis/core/layers/support/FeatureEffect.js'
import FeatureFilter from '@arcgis/core/layers/support/FeatureFilter.js'

export interface SketchSnappingViewModelParameters {
  view: __esri.MapView | undefined
}

export default class SketchSnappingViewModel extends Accessor {
  //--------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------

  @property()
  view: __esri.MapView | undefined

  @property()
  private _GfxLayerName = 'MYGRAPHICLAYER'

  @property()
  private _gfxLayer: __esri.GraphicsLayer = new GraphicsLayer({
    listMode: 'hide',
    id: this._GfxLayerName,
  })

  @property()
  private choosenFeaturesLayer: __esri.GraphicsLayer = new GraphicsLayer()

  @property()
  private _pointSymbol: __esri.SimpleMarkerSymbol = new SimpleMarkerSymbol({
    color: 'black',
    size: 7,
    style: 'circle',
  })

  @property()
  private _sketchViewModel: __esri.SketchViewModel | undefined = undefined

  //--------------------------------------------------------------------
  //
  //  constructor
  //
  //--------------------------------------------------------------------
  constructor(params?: SketchSnappingViewModelParameters) {
    super()
    this.view = params?.view
  }
  //--------------------------------------------------------------------
  //
  //  PUBLIC METHODS
  //
  //--------------------------------------------------------------------
  handleVMClick = async () => {
    console.log('handle')
    if (!this._sketchViewModel) {
      this._sketchViewModel = new SketchViewModel({
        view: this.view,
        layer: this._gfxLayer,
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
      this._sketchViewModel.on('create', this._addGraphic)
    }
    if (this._sketchViewModel.state === 'active') {
      this._sketchViewModel.cancel()
      this._clearFilter()
    } else {
      this._addChoosenFeaturesToMapView()
      this._sketchViewModel.create('point')
    }
  }
  //--------------------------------------------------------------------
  //
  //  PRIVATE METHODS
  //
  //--------------------------------------------------------------------
  private _clearFilter = () => {
    if (!this._sketchViewModel || !this.view) return
    this._sketchViewModel.snappingOptions.featureSources =
      [] as unknown as __esri.Collection<FeatureSnappingLayerSource>
    this.view.map.allLayers.forEach((layer) => {
      if (layer.type === 'feature' && this.view) {
        const layerView = this.view.whenLayerView(
          layer
        ) as Promise<__esri.FeatureLayerView>
        layerView.then((layerView) => {
          layerView.featureEffect = new FeatureEffect({})
        })
      }
    })
  }
  private _addChoosenFeaturesToMapView = async () => {
    if (!this._sketchViewModel || !this.view) return
    for (let index = 0; index < this.view.map.allLayers.length; index++) {
      const layer = this.view.map.allLayers.getItemAt(index)
      const layerView = await this.view.whenLayerView(layer)

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

        this.choosenFeaturesLayer.add(feature as __esri.Graphic)
      }
      const snappingLayer = new FeatureSnappingLayerSource({
        layer: this.choosenFeaturesLayer as __esri.GraphicsLayer,
        enabled: true,
      })
      this._sketchViewModel.snappingOptions.featureSources.push(snappingLayer)
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
  private _addGraphic = (event: __esri.SketchViewModelCreateEvent) => {
    if (!this._sketchViewModel || !this.view) return

    if (event.state !== 'complete') return

    let foundLayer = this.view.map.allLayers.find(
      (l) => l.id === this._GfxLayerName
    ) as __esri.GraphicsLayer
    if (!foundLayer) {
      foundLayer = this._gfxLayer
      this.view.map.addMany([foundLayer])
    }
    foundLayer.remove(event.graphic)
    const pointGraphic = new Graphic({
      geometry: event.graphic.geometry,
      symbol: this._pointSymbol,
    })
    foundLayer.add(pointGraphic)
    this._sketchViewModel.create('point')
  }
}
