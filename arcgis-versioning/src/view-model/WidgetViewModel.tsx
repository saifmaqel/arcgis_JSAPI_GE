import Accessor from '@arcgis/core/core/Accessor.js'
import {
  property,
  subclass,
} from '@arcgis/core/core/accessorSupport/decorators.js'
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel.js'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import Graphic from '@arcgis/core/Graphic'
import {
  SimpleFillSymbol,
  SimpleLineSymbol,
  SimpleMarkerSymbol,
} from '@arcgis/core/symbols'
import FeatureSnappingLayerSource from '@arcgis/core/views/interactive/snapping/FeatureSnappingLayerSource.js'
import FeatureEffect from '@arcgis/core/layers/support/FeatureEffect.js'
import FeatureFilter from '@arcgis/core/layers/support/FeatureFilter.js'
type GeometryTypes =
  | 'circle'
  | 'point'
  | 'multipoint'
  | 'polyline'
  | 'polygon'
  | 'rectangle'

export interface SketchSnappingViewModelParameters {
  view: __esri.MapView | undefined
  enableSnapping: boolean | undefined
  distance: number | undefined
}
@subclass('custom.SketchSnappingViewModel')
export default class SketchSnappingViewModel extends Accessor {
  //--------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------

  @property()
  view: __esri.MapView | undefined

  private _enableSnapping: boolean | undefined

  private _distance: number | undefined

  private _isFeaturesFilterd = false

  private _GfxLayerName = 'MYGRAPHICLAYER'

  private _gfxLayer: __esri.GraphicsLayer = new GraphicsLayer({
    listMode: 'hide',
    id: this._GfxLayerName,
  })

  private _choosenFeaturesLayer: __esri.GraphicsLayer = new GraphicsLayer()

  private _pointSymbolToAdd: __esri.SimpleMarkerSymbol = new SimpleMarkerSymbol(
    {
      color: [204, 186, 252],
      size: 7,
      style: 'circle',
      outline: {},
    }
  )
  private _polylineSymbolToAdd: __esri.SimpleLineSymbol = new SimpleLineSymbol({
    color: [204, 186, 252],
    width: 2,
  })

  private _polygonSymbolToAdd: __esri.SimpleFillSymbol = new SimpleFillSymbol({
    color: [204, 186, 252],
  })

  private _sketchViewModel: __esri.SketchViewModel | undefined = undefined

  //--------------------------------------------------------------------
  //
  //  constructor
  //
  //--------------------------------------------------------------------
  constructor(params?: SketchSnappingViewModelParameters) {
    super()
    this.view = params?.view

    this._sketchViewModel = new SketchViewModel({
      view: params?.view,
      layer: this._gfxLayer,
      updateOnGraphicClick: true,
      pointSymbol: new SimpleMarkerSymbol({
        color: [204, 186, 252],
        size: 8,
        style: 'circle',
      }),
      polylineSymbol: new SimpleLineSymbol({
        color: [204, 186, 252, 0.8],
        width: 6,
      }),
      polygonSymbol: new SimpleFillSymbol({
        color: [204, 186, 252, 0.9],
      }),
      defaultCreateOptions: { hasZ: false },
      snappingOptions: {
        enabled: this._enableSnapping,
        selfEnabled: true,
        featureEnabled: true,
        distance: this._distance,
        featureSources: [],
      } as __esri.SketchViewModelProperties['snappingOptions'],
    })
  }
  //--------------------------------------------------------------------
  //
  //  PUBLIC METHODS
  //
  //--------------------------------------------------------------------
  drawGraphic = (geometryType: GeometryTypes) => {
    if (!this._sketchViewModel || !this.view) return

    let prevGeometryType = null
    // console.log(this.view?.allLayerViews)

    if (this._sketchViewModel.state === 'active') {
      if (geometryType == prevGeometryType) this._sketchViewModel.cancel()
      else this._sketchViewModel.create(geometryType)
    } else {
      this._sketchViewModel.view = this.view
      this._sketchViewModel.create(geometryType)
    }

    prevGeometryType = geometryType
    this._sketchViewModel.on('create', this._onGraphicCreate)
    this._sketchViewModel.on('update', this._onGrahicUpdate)
  }
  filterFeatures = async () => {
    if (!this._sketchViewModel || !this.view) return
    if (this._choosenFeaturesLayer.graphics.length) {
      this._clearFilter()
      this.isFeaturesFilterd = false
      console.log(this._isFeaturesFilterd)

      return
    }

    this._sketchViewModel.snappingOptions.featureSources =
      [] as unknown as __esri.Collection<FeatureSnappingLayerSource>

    // this._clearFilter()
    this._isFeaturesFilterd = true
    console.log('f', this._isFeaturesFilterd)

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

        this._choosenFeaturesLayer.add(feature as __esri.Graphic)
      }
      const snappingLayer = new FeatureSnappingLayerSource({
        layer: this._choosenFeaturesLayer as __esri.GraphicsLayer,
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
  undo = () => {
    if (!this._sketchViewModel) return
    this._sketchViewModel.undo()
  }
  redo = () => {
    if (!this._sketchViewModel) return
    this._sketchViewModel.redo()
  }
  @property()
  get enableSnapping(): boolean | undefined {
    return this._enableSnapping
  }

  set enableSnapping(value: boolean | undefined) {
    if (!this._sketchViewModel || !this.view) return
    this._enableSnapping = value
    this._sketchViewModel.snappingOptions.enabled = value || false
    this.notifyChange('enableSnapping')
  }
  @property()
  get distance(): number | undefined {
    return this._distance
  }

  set distance(value: number | undefined) {
    if (!this._sketchViewModel) return
    this._distance = value
    this._sketchViewModel.snappingOptions.distance = value || 0
    this.notifyChange('distance')
  }
  @property()
  get isFeaturesFilterd(): boolean {
    return this._isFeaturesFilterd
  }

  set isFeaturesFilterd(value: boolean) {
    if (!this._sketchViewModel) return
    this._isFeaturesFilterd = value
    this.notifyChange('isFeaturesFilterd')
  }
  //--------------------------------------------------------------------
  //
  //  PRIVATE METHODS
  //
  //--------------------------------------------------------------------
  private _clearFilter = () => {
    if (!this._sketchViewModel || !this.view) return
    this.enableSnapping = false
    this._sketchViewModel.snappingOptions.featureSources =
      [] as unknown as __esri.Collection<FeatureSnappingLayerSource>
    this._choosenFeaturesLayer = new GraphicsLayer()
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
    // this.isFeaturesFilterd = false
  }
  private _onGraphicCreate = (event: __esri.SketchViewModelCreateEvent) => {
    const { tool } = event
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
    const graphicToAdd: __esri.Graphic = new Graphic({
      geometry: event.graphic.geometry,
    })
    switch (tool) {
      case 'point':
        graphicToAdd.symbol = this._pointSymbolToAdd
        break
      case 'polyline':
        graphicToAdd.symbol = this._polylineSymbolToAdd
        break
      case 'polygon':
        graphicToAdd.symbol = this._polygonSymbolToAdd
        break
    }
    foundLayer.add(graphicToAdd)
    console.log(event.graphic)

    // this._sketchViewModel.create(tool)
  }
  private _onGrahicUpdate = (event: __esri.SketchViewModelUpdateEvent) => {
    const graphic = event.graphics[0]
    if (event.state === 'complete') console.log(event)
  }
  // private _updateGraphic = (event: __esri.SketchViewModelUpdateEvent) => {
  //   console.log(event, this._sketchViewModel?.updateGraphics)
  // }
}
