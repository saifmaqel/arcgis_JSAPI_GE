// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/** @jsxRuntime classic */
/** @jsx tsx */
import { tsx } from '@arcgis/core/widgets/support/widget'
import Widget from '@arcgis/core/widgets/Widget.js'
import '../App.css'
import {
  subclass,
  property,
} from '@arcgis/core/core/accessorSupport/decorators'
import Handles from '@arcgis/core/core/Handles'
import '../App.css'
import SketchSnappingViewModel, {
  SketchSnappingViewModelParameters,
} from '../view-model/WidgetViewModel'

interface SketchSnappingParams
  extends __esri.WidgetProperties,
    SketchSnappingViewModelParameters {
  view: __esri.MapView
}

console.log('widget loaded')
@subclass('esri.widgets.SketchViewModelUI')
class SketchViewModelUI extends Widget {
  //--------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------

  @property()
  view!: __esri.MapView

  @property()
  private _SketchSnappingVM: SketchSnappingViewModel

  //--------------------------------------------------------------------
  //
  //  constructor
  //
  //--------------------------------------------------------------------

  constructor(params: SketchSnappingParams) {
    super(params)
    this.view = params.view
    this._SketchSnappingVM = new SketchSnappingViewModel({
      view: this.view,
    })
  }

  render() {
    return (
      <div id='sketchVM-Widget'>
        <h1>sketchViewModel</h1>
        <button onClick={this._SketchSnappingVM.handleVMClick}>
          Draw Points
        </button>
        <button
          onClick={() => {
            console.log('show')
          }}
        >
          test
        </button>
      </div>
    )
  }
}
export default SketchViewModelUI
