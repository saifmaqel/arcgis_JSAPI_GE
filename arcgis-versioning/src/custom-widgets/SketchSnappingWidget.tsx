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
  // _SketchSnappingVM: SketchSnappingViewModel
  // _test: boolean | undefined
  // _handle: Handles | undefined
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

  @property()
  private _test: boolean | undefined

  private _handle: Handles | undefined
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
  postInitialize() {
    this._handle = new Handles()
    this._test = true
  }
  // destroy(): void {
  //   this._handle.destroy()
  // }

  render() {
    const { _test, _SketchSnappingVM } = this
    return (
      <div id='sketchVM-Widget'>
        <h1>sketchViewModel</h1>
        <button onClick={_SketchSnappingVM.handleVMClick}>Draw Points</button>
        <button onClick={this._testh}>{_test}</button>
      </div>
    )
  }
  private _testh = (): void => {
    this._test = !this._test
    console.log('Test button clicked', this._test)
  }
}
export default SketchViewModelUI
