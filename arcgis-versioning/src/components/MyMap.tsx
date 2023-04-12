// // WITH FUNCTIONS AND WITHOUT GRAPHICS LAYER
import React, { useEffect, useRef, useState } from 'react'
import Map from '@arcgis/core/Map.js'
import MapView from '@arcgis/core/views/MapView.js'
import LayerList from '@arcgis/core/widgets/LayerList.js'
import Layer from '@arcgis/core/layers/Layer.js'
import Graphic from '@arcgis/core/Graphic.js'
import { useApp } from '../context/appContext'
import Point from '@arcgis/core/geometry/Point'
import * as geometryEngineAsync from '@arcgis/core/geometry/geometryEngineAsync.js'
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils.js'
import AllUiComponent from './AllUiComponent'
import Expand from '@arcgis/core/widgets/Expand'
import { createRoot } from 'react-dom/client'
import { debounce } from 'lodash'
// let buffering = false

const polySym = {
  type: 'simple-fill', // autocasts as new SimpleFillSymbol()
  color: [37, 37, 37, 0.2],
  outline: {
    color: [0, 0, 0, 0.2],
    width: 2,
  },
}
const pointSym = {
  type: 'simple-marker', // autocasts as new SimpleMarkerSymbol()
  color: [37, 37, 37],
  size: 7,
}
let foundOneFeatureAtLeast = 0
function MyMap() {
  const { state, dispatch } = useApp()
  const container = document.createElement('div')
  createRoot(container).render(
    <AllUiComponent dispatch={dispatch} state={state} />
  )
  const mapRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<__esri.MapView>(new MapView())
  const [featureLayerViews, setFeatureLayerViews] = useState<
    __esri.FeatureLayerView[]
  >([])
  const [foundFeatures, setFoundFeatures] = useState<boolean>(false)
  const [mapCursorPointState, setMapCursorPointState] = useState<__esri.Point>(
    new Point()
  )
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
    const expand = new Expand({
      content: container,
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
            l.layers.map((layer) => {
              view.whenLayerView(layer).then((layerview: __esri.LayerView) => {
                const featureLayerView =
                  layerview.layer as unknown as __esri.FeatureLayerView
                featureLayerViews.push(featureLayerView)
                setFeatureLayerViews(featureLayerViews)
              })
            })
            // const featureLayerView = featureLayerViews.at(0)
            // if (featureLayerView && !featureLayerView.destroyed) {
            //   featureLayerView
            //     .queryExtent()
            //     .then((ext) => {
            //       view.goTo(ext)
            //       console.log('ext', ext)
            //     })
            //     .catch((r) => console.log(r))
            // }
            // console.log(layerviews);

            // view
            //   .whenLayerView(l.layers.getItemAt(2))
            //   .then((layerView: __esri.LayerView) => {
            //     setLayerViews(() => layerView)
            //     // view
            //     //   .goTo(
            //     //     { target: l.layers.getItemAt(0).fullExtent, zoom: 12 },
            //     //     { animate: true }
            //     //   )
            //     //   .then((res) => {
            //     //   })
            //   })
          })
        })
      }
    )
    view.ui.add(layerList, 'top-right')
    view.ui.add(expand, 'top-left')
    dispatch({ type: 'SET_ENABLE_SNAPPING', payload: false })
    dispatch({ type: 'SET_MAP_VIEW', payload: view })
    return () => {
      if (view) {
        view.destroy()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    const addPoint = (point: __esri.Point) => {
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
    const addBuffer = (point: __esri.Point) => {
      createBuffer(point, state.distance).then((buffer) => {
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
    const createBuffer = (
      point: __esri.Point,
      distance: number
    ): Promise<__esri.Polygon> => {
      return geometryEngineAsync.buffer(
        point,
        distance,
        'meters',
        false
      ) as Promise<__esri.Polygon>
    }
    const QueryFeature = (
      featureLayerViews: __esri.FeatureLayerView[],
      mapCursorPoint: __esri.Point,
      distance: number
    ) => {
      // debounce(async () => {
      foundOneFeatureAtLeast = 0
      featureLayerViews.map((FLV: __esri.FeatureLayerView) => {
        if (!FLV.destroyed) {
          FLV.queryFeatures({
            geometry: mapCursorPoint,
            returnGeometry: true,
            spatialRelationship: 'intersects',
            distance: distance,
            units: 'meters',
          })
            .then((featureSet: __esri.FeatureSet) => {
              if (featureSet.features.length > 0) {
                // foundOneFeatureAtLeast +=1
                const geometry = featureSet.features[0].geometry
                if (
                  geometry.type === 'polygon' ||
                  geometry.type === 'polyline'
                ) {
                  // setFoundFeatures(true)
                  geometryEngineAsync
                    .nearestVertex(geometry, mapCursorPoint)
                    .then((nearestVertex) => {
                      if (nearestVertex.distance <= state.distance) {
                        addPoint(nearestVertex.coordinate)
                        addBuffer(nearestVertex.coordinate)
                      }
                    })
                } else if (geometry.type === 'point') {
                  addPoint(geometry as __esri.Point)
                  addBuffer(geometry as __esri.Point)
                }
              } else foundOneFeatureAtLeast -= 1
            })
            .catch((r) => console.log(r))
        }
      })

      // structureFeatureLayerView
      //   .queryFeatures({
      //     geometry: mapCursorPoint,
      //     returnGeometry: true,
      //     spatialRelationship: 'contains',
      //     distance: distance,
      //     units: 'meters',
      //   })
      //   .then((featureSet: __esri.FeatureSet) => {
      //     if (featureSet.features.length > 0) {
      //       setFoundFeatures(true)
      //       const cursorPointGraphic = view.graphics.getItemAt(0)
      //       const bufferPolyGraphic = view.graphics.getItemAt(1)
      //       cursorPointGraphic.geometry = featureSet.features[0].geometry
      //       geometryEngineAsync
      //         .buffer(featureSet.features[0].geometry, state.distance, 'meters')
      //         .then((buffer) => {
      //           bufferPolyGraphic.geometry = buffer as Polygon
      //         })
      //     } else setFoundFeatures(false)
      //   })
    }
    if (view.ready && state.enableSnapping) {
      addBuffer(mapCursorPointState)
      addPoint(mapCursorPointState)
    } else if (view.ready && !state.enableSnapping) {
      view.graphics.removeAll()
    }
    // const pointerEvent = reactiveUtils.on(
    //   () => view,
    //   'pointer-move',
    //   debounce((event) => {
    //     event.stopPropagation() //  SEARCH ABOUT IT ****
    //     const screenPoint = {
    //       x: event.x,
    //       y: event.y,
    //     } as __esri.MapViewScreenPoint
    //     const mapCursorPoint: __esri.Point = view.toMap(screenPoint)
    //     if (mapCursorPoint && !foundFeatures) {
    //       if (pointLayer.graphics.length === 0) {
    //         pointLayer.add(
    //           new Graphic({
    //             geometry: mapCursorPoint,
    //             symbol: pointSym,
    //           })
    //         )
    //       } else {
    //         const graphic = pointLayer.graphics.getItemAt(0)
    //         graphic.geometry = mapCursorPoint
    //       }
    //       geometryEngineAsync
    //         .buffer(mapCursorPoint, state.distance, 'meters', false)
    //         .then((buffer) => {
    //           if (bufferLayer.graphics.length === 0) {
    //             const graphic = new Graphic({
    //               geometry: buffer as __esri.Polygon,
    //               symbol: polySym,
    //             })
    //             bufferLayer.add(graphic)
    //           } else {
    //             bufferLayer.graphics.getItemAt(0).geometry =
    //               buffer as __esri.Polygon
    //           }
    //         })
    //     }
    //     deboucedQueryFeature(
    //       structureLayerView,
    //       mapCursorPoint,
    //       state.distance,
    //       pointLayer,
    //       bufferLayer
    //     )
    //     // dispatch({
    //     //   type: 'SET_COORDINATES',
    //     //   payload: {
    //     //     x: mapCursorPoint.latitude,
    //     //     y: mapCursorPoint.longitude,
    //     //   },
    //     // })
    //   })
    // )
    const pointerEvent = view.on(
      'pointer-move',
      debounce(async (event) => {
        if (state.enableSnapping) {
          event.stopPropagation()
          const screenPoint = {
            x: event.x,
            y: event.y,
          } as __esri.MapViewScreenPoint
          const mapCursorPoint: __esri.Point = view.toMap(screenPoint)
          setMapCursorPointState(mapCursorPoint)
          console.log('found inside event', foundOneFeatureAtLeast)
          const deboucedQueryFeature = await debounce(async () => {
            QueryFeature(featureLayerViews, mapCursorPoint, state.distance)
          })
          await deboucedQueryFeature()
          if (mapCursorPoint && foundOneFeatureAtLeast === -3) {
            await addPoint(mapCursorPoint)
            await addBuffer(mapCursorPoint)
          }

          // const setCoordinates = debounce(() => {
          //   dispatch({
          //     type: 'SET_COORDINATES',
          //     payload: {
          //       x: mapCursorPoint.latitude,
          //       y: mapCursorPoint.longitude,
          //     },
          //   })
          // }, 100)
          // setCoordinates()
        }
      })
    )
    return () => {
      pointerEvent.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dispatch,
    foundFeatures,
    state.distance,
    state.enableSnapping,
    featureLayerViews,
    view,
  ])
  return (
    <div>
      <div className='MyMap' ref={mapRef}></div>
    </div>
  )
}
export default MyMap

// import React, { useEffect, useRef, useState } from 'react'
// import Map from '@arcgis/core/Map.js'
// import MapView from '@arcgis/core/views/MapView.js'
// import LayerList from '@arcgis/core/widgets/LayerList.js'
// import Layer from '@arcgis/core/layers/Layer.js'
// import Graphic from '@arcgis/core/Graphic.js'
// import { useApp } from '../context/appContext'
// import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
// import * as geometryEngineAsync from '@arcgis/core/geometry/geometryEngineAsync.js'
// import * as geometryEngine from '@arcgis/core/geometry/geometryEngine.js'
// import Polygon from '@arcgis/core/geometry/Polygon.js'
// import GroupLayer from '@arcgis/core/layers/GroupLayer'
// import LayerView from '@arcgis/core/views/layers/LayerView'
// import * as reactiveUtils from '@arcgis/core/core/reactiveUtils.js'
// import AllUiComponent from './AllUiComponent'
// import Expand from '@arcgis/core/widgets/Expand'
// import { createRoot } from 'react-dom/client'
// import { debounce } from 'lodash'
// import Point from '@arcgis/core/geometry/Point'
// const polySym = {
//   type: 'simple-fill', // autocasts as new SimpleFillSymbol()
//   color: [37, 37, 37, 0.2],
//   outline: {
//     color: [0, 0, 0, 0.2],
//     width: 2,
//   },
// }
// const pointSym = {
//   type: 'simple-marker', // autocasts as new SimpleMarkerSymbol()
//   color: [37, 37, 37],
//   outline: {
//     color: [255, 255, 255],
//     width: 1,
//   },
//   size: 7,
// }
// const bufferLayer = new GraphicsLayer()
// const pointLayer = new GraphicsLayer()
// function MyMap() {
//   const { state, dispatch } = useApp()
//   const container = document.createElement('div')
//   createRoot(container).render(
//     <AllUiComponent dispatch={dispatch} state={state} />
//   )
//   const mapRef = useRef<HTMLDivElement>(null)
//   const [groupLayer, setGroupLayer] = useState<__esri.GroupLayer>(
//     new GroupLayer()
//   )
//   const [mapCursorPointState, setMapCursorPointState] = useState<__esri.Point>(
//     new Point()
//   )
//   const [view, setView] = useState<__esri.MapView>(new MapView())
//   const [structureLayerView, setStructureLayerView] =
//     useState<__esri.LayerView>(new LayerView())
//   const [foundFeatures, setFoundFeatures] = useState<boolean>(false)

//   useEffect(() => {
//     const myMap = new Map({
//       basemap: 'streets-vector',
//     })
//     const view = new MapView({
//       container: mapRef.current as HTMLDivElement,
//       map: myMap,
//       zoom: 18,
//       center: [35.8907635223865, 31.968727310006464],
//     })
//     const layerList = new LayerList({
//       view,
//       listItemCreatedFunction: (event: { item: __esri.ListItem }) => {
//         const item = event.item
//         if (item.layer.type != 'group') {
//           item.panel = {
//             content: 'legend',
//             open: true,
//           } as __esri.ListItemPanel
//         }
//       },
//     })
//     const expand = new Expand({
//       content: container,
//       view: view,
//       group: 'top-right',
//       expanded: true,
//     })
//     reactiveUtils.when(
//       () => view.ready,
//       async () => {
//         setView(view)
//         Layer.fromPortalItem({
//           portalItem: {
//             id: 'a4a63941083a45399637f3ba48265bd2',
//           } as __esri.PortalItem,
//         }).then((layer) => {
//           layer.load().then((l: __esri.GroupLayer) => {
//             setGroupLayer(() => l)
//             view.map.addMany([l])
//             view
//               .whenLayerView(l.layers.getItemAt(2))
//               .then((layerView: __esri.LayerView) => {
//                 setStructureLayerView(() => layerView)
//                 // view
//                 //   .goTo(
//                 //     { target: l.layers.getItemAt(0).fullExtent, zoom: 12 },
//                 //     { animate: true }
//                 //   )
//                 //   .then((res) => {
//                 //     console.log(res)
//                 //   })
//               })
//           })
//         })
//       }
//     )
//     view.ui.add(layerList, 'top-right')
//     view.ui.add(expand, 'top-left')
//     return () => {
//       if (view) {
//         view.destroy()
//       }
//     }
//   }, [])
//   useEffect(() => {
//     const addPoint = (point: __esri.Point) => {
//       if (pointLayer.graphics.length === 0) {
//         pointLayer.add(
//           new Graphic({
//             geometry: point,
//             symbol: pointSym,
//           })
//         )
//       } else {
//         const graphic = pointLayer.graphics.getItemAt(0)
//         graphic.geometry = point
//       }
//     }
//     const addBuffer = (point: __esri.Point) => {
//       createBuffer(point, state.distance).then((buffer) => {
//         if (bufferLayer.graphics.length === 0) {
//           const graphic = new Graphic({
//             geometry: buffer as __esri.Polygon,
//             symbol: polySym,
//           })
//           bufferLayer.add(graphic)
//         } else {
//           bufferLayer.graphics.getItemAt(0).geometry = buffer as __esri.Polygon
//         }
//       })
//     }
//     const createBuffer = (
//       point: __esri.Point,
//       distance: number
//     ): Promise<__esri.Polygon> => {
//       return geometryEngineAsync.buffer(
//         point,
//         distance,
//         'meters',
//         false
//       ) as Promise<__esri.Polygon>
//     }
//     const QueryFeature = (
//       structureLayerView: __esri.LayerView,
//       mapCursorPoint: __esri.Point,
//       distance: number,
//       pointLayer: __esri.GraphicsLayer,
//       bufferLayer: __esri.GraphicsLayer
//     ) => {
//       // debounce(async () => {
//       const structureFeatureLayerView =
//         structureLayerView.layer as unknown as __esri.FeatureLayerView
//       structureFeatureLayerView
//         .queryFeatures({
//           geometry: mapCursorPoint,
//           returnGeometry: true,
//           spatialRelationship: 'contains',
//           distance: distance,
//           units: 'meters',
//         })
//         .then((featureSet: __esri.FeatureSet) => {
//           if (featureSet.features.length > 0) {
//             setFoundFeatures(true)
//             const cursorPointGraphic = pointLayer.graphics.getItemAt(0)
//             const bufferPolyGraphic = bufferLayer.graphics.getItemAt(0)
//             cursorPointGraphic.geometry = featureSet.features[0].geometry
//             geometryEngineAsync
//               .buffer(featureSet.features[0].geometry, state.distance, 'meters')
//               .then((buffer) => {
//                 bufferPolyGraphic.geometry = buffer as Polygon
//               })
//           } else setFoundFeatures(false)
//         })
//     }

//     if (view.ready && state.enableSnapping) {
//       addBuffer(mapCursorPointState)
//       view.map.addMany([pointLayer, bufferLayer])
//       console.log('addlayers')
//     } else if (
//       view.ready &&
//       !state.enableSnapping &&
//       view.map.layers.length > 1
//     ) {
//       view.map.removeMany([pointLayer, bufferLayer])
//       console.log('remove')
//     }
//     const pointerEvent = view.on(
//       'pointer-move',
//       debounce((event) => {
//         if (state.enableSnapping) {
//           event.stopPropagation()
//           const screenPoint = {
//             x: event.x,
//             y: event.y,
//           } as __esri.MapViewScreenPoint
//           const mapCursorPoint: __esri.Point = view.toMap(screenPoint)
//           setMapCursorPointState(mapCursorPoint)
//           if (mapCursorPoint && !foundFeatures) {
//             addPoint(mapCursorPoint)
//             addBuffer(mapCursorPoint)
//           }
//           // const deboucedQueryFeature = debounce(() => {
//           //   QueryFeature(
//           //     structureLayerView,
//           //     mapCursorPoint,
//           //     state.distance,
//           //     pointLayer,
//           //     bufferLayer
//           //   )
//           // })
//           // deboucedQueryFeature()
//           // const setCoordinates = debounce(() => {
//           //   dispatch({
//           //     type: 'SET_COORDINATES',
//           //     payload: {
//           //       x: mapCursorPoint.latitude,
//           //       y: mapCursorPoint.longitude,
//           //     },
//           //   })
//           // }, 100)
//           // setCoordinates()
//         }
//       })
//     )

//     return () => {
//       pointerEvent.remove()
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [foundFeatures, state.enableSnapping, state.distance])
//   return (
//     <div>
//       <div className='MyMap' ref={mapRef}></div>
//     </div>
//   )
// }

// export default MyMap
//  WITH FUNCTIONS WITH GRAPHICS LAYERS
// import React, { useEffect, useRef, useState } from 'react'
// import Map from '@arcgis/core/Map.js'
// import MapView from '@arcgis/core/views/MapView.js'
// import LayerList from '@arcgis/core/widgets/LayerList.js'
// import Layer from '@arcgis/core/layers/Layer.js'
// import Graphic from '@arcgis/core/Graphic.js'
// import { useApp } from '../context/appContext'
// import Point from '@arcgis/core/geometry/Point'
// import * as geometryEngineAsync from '@arcgis/core/geometry/geometryEngineAsync.js'
// import * as geometryEngine from '@arcgis/core/geometry/geometryEngine.js'
// import Polygon from '@arcgis/core/geometry/Polygon.js'
// import GroupLayer from '@arcgis/core/layers/GroupLayer'
// import LayerView from '@arcgis/core/views/layers/LayerView'
// import * as reactiveUtils from '@arcgis/core/core/reactiveUtils.js'
// import AllUiComponent from './AllUiComponent'
// import Expand from '@arcgis/core/widgets/Expand'
// import { createRoot } from 'react-dom/client'
// import { debounce } from 'lodash'
// // let buffering = false

// const polySym = {
//   type: 'simple-fill', // autocasts as new SimpleFillSymbol()
//   color: [37, 37, 37, 0.2],
//   outline: {
//     color: [0, 0, 0, 0.2],
//     width: 2,
//   },
// }
// const pointSym = {
//   type: 'simple-marker', // autocasts as new SimpleMarkerSymbol()
//   color: [37, 37, 37],
//   outline: {
//     color: [255, 255, 255],
//     width: 1,
//   },
//   size: 7,
// }
// // const bufferLayer = new GraphicsLayer()
// // const pointLayer = new GraphicsLayer()

// //  ************************ COED WITH TOW GRAPHICS LAYERS AND WITHOUT DEBOUNCING ************************ // //

// function MyMap() {
//   const { state, dispatch } = useApp()
//   const container = document.createElement('div')
//   createRoot(container).render(
//     <AllUiComponent dispatch={dispatch} state={state} />
//   )
//   const mapRef = useRef<HTMLDivElement>(null)
//   const [groupLayer, setGroupLayer] = useState<__esri.GroupLayer>(
//     new GroupLayer()
//   )
//   const [view, setView] = useState<__esri.MapView>(new MapView())
//   const [structureLayerView, setStructureLayerView] =
//     useState<__esri.LayerView>(new LayerView())
//   const [foundFeatures, setFoundFeatures] = useState<boolean>(false)
//   const [mapCursorPointState, setMapCursorPointState] = useState<__esri.Point>(
//     new Point()
//   )
//   useEffect(() => {
//     const myMap = new Map({
//       basemap: 'streets-vector',
//     })
//     const view = new MapView({
//       container: mapRef.current as HTMLDivElement,
//       map: myMap,
//       zoom: 18,
//       center: [35.8907635223865, 31.968727310006464],
//     })
//     const layerList = new LayerList({
//       view,
//       listItemCreatedFunction: (event: { item: __esri.ListItem }) => {
//         const item = event.item
//         if (item.layer.type != 'group') {
//           item.panel = {
//             content: 'legend',
//             open: true,
//           } as __esri.ListItemPanel
//         }
//       },
//     })
//     const expand = new Expand({
//       content: container,
//       view: view,
//       group: 'top-right',
//       expanded: true,
//     })
//     reactiveUtils.when(
//       () => view.ready,
//       async () => {
//         setView(view)
//         Layer.fromPortalItem({
//           portalItem: {
//             id: 'a4a63941083a45399637f3ba48265bd2',
//           } as __esri.PortalItem,
//         }).then((layer) => {
//           layer.load().then((l: __esri.GroupLayer) => {
//             setGroupLayer(() => l)
//             view.map.addMany([l])
//             view
//               .whenLayerView(l.layers.getItemAt(2))
//               .then((layerView: __esri.LayerView) => {
//                 setStructureLayerView(() => layerView)
//                 // view
//                 //   .goTo(
//                 //     { target: l.layers.getItemAt(0).fullExtent, zoom: 12 },
//                 //     { animate: true }
//                 //   )
//                 //   .then((res) => {
//                 //   })
//               })
//           })
//         })
//       }
//     )
//     view.ui.add(layerList, 'top-right')
//     view.ui.add(expand, 'top-left')
//     return () => {
//       if (view) {
//         view.destroy()
//       }
//     }
//   }, [])
//   useEffect(() => {
//     const addPoint = (point: __esri.Point) => {
//       if (view.graphics.length === 0) {
//         view.graphics.add(
//           new Graphic({
//             geometry: point,
//             symbol: pointSym,
//           })
//         )
//       } else {
//         // const graphic = pointLayer.graphics.getItemAt(0)
//         const graphic = view.graphics.getItemAt(0)
//         graphic.geometry = point
//       }
//     }
//     const addBuffer = (point: __esri.Point) => {
//       createBuffer(point, state.distance).then((buffer) => {
//         if (view.graphics.length <= 1) {
//           const graphic = new Graphic({
//             geometry: buffer as __esri.Polygon,
//             symbol: polySym,
//           })
//           view.graphics.add(graphic)
//           // bufferLayer.add(graphic)
//         } else {
//           // bufferLayer.graphics.getItemAt(0).geometry =
//           //   buffer as __esri.Polygon
//           view.graphics.getItemAt(1).geometry = buffer as __esri.Polygon
//         }
//       })
//     }
//     const createBuffer = (
//       point: __esri.Point,
//       distance: number
//     ): Promise<__esri.Polygon> => {
//       return geometryEngineAsync.buffer(
//         point,
//         distance,
//         'meters',
//         false
//       ) as Promise<__esri.Polygon>
//     }
//     const QueryFeature = (
//       structureLayerView: __esri.LayerView,
//       mapCursorPoint: __esri.Point,
//       distance: number
//       // pointLayer: __esri.GraphicsLayer,
//       // bufferLayer: __esri.GraphicsLayer
//     ) => {
//       // debounce(async () => {
//       const structureFeatureLayerView =
//         structureLayerView.layer as unknown as __esri.FeatureLayerView
//       structureFeatureLayerView
//         .queryFeatures({
//           geometry: mapCursorPoint,
//           returnGeometry: true,
//           spatialRelationship: 'contains',
//           distance: distance,
//           units: 'meters',
//         })
//         .then((featureSet: __esri.FeatureSet) => {
//           if (featureSet.features.length > 0) {
//             setFoundFeatures(true)
//             const cursorPointGraphic = view.graphics.getItemAt(0)
//             const bufferPolyGraphic = view.graphics.getItemAt(1)
//             cursorPointGraphic.geometry = featureSet.features[0].geometry
//             geometryEngineAsync
//               .buffer(featureSet.features[0].geometry, state.distance, 'meters')
//               .then((buffer) => {
//                 bufferPolyGraphic.geometry = buffer as Polygon
//               })
//           } else setFoundFeatures(false)
//         })
//     }
//     if (view.ready && state.enableSnapping) {
//       addBuffer(mapCursorPointState)
//       // view.map.addMany([pointLayer, bufferLayer])
//       console.log('addlayers')
//     } else if (view.ready && !state.enableSnapping) {
//       // view.map.removeMany([pointLayer, bufferLayer])
//       view.graphics.removeAll()
//       console.log('remove')
//     }
//     // const pointerEvent = reactiveUtils.on(
//     //   () => view,
//     //   'pointer-move',
//     //   debounce((event) => {
//     //     event.stopPropagation() //  SEARCH ABOUT IT ****
//     //     const screenPoint = {
//     //       x: event.x,
//     //       y: event.y,
//     //     } as __esri.MapViewScreenPoint
//     //     const mapCursorPoint: __esri.Point = view.toMap(screenPoint)
//     //     if (mapCursorPoint && !foundFeatures) {
//     //       if (pointLayer.graphics.length === 0) {
//     //         pointLayer.add(
//     //           new Graphic({
//     //             geometry: mapCursorPoint,
//     //             symbol: pointSym,
//     //           })
//     //         )
//     //       } else {
//     //         const graphic = pointLayer.graphics.getItemAt(0)
//     //         graphic.geometry = mapCursorPoint
//     //       }
//     //       geometryEngineAsync
//     //         .buffer(mapCursorPoint, state.distance, 'meters', false)
//     //         .then((buffer) => {
//     //           if (bufferLayer.graphics.length === 0) {
//     //             const graphic = new Graphic({
//     //               geometry: buffer as __esri.Polygon,
//     //               symbol: polySym,
//     //             })
//     //             bufferLayer.add(graphic)
//     //           } else {
//     //             bufferLayer.graphics.getItemAt(0).geometry =
//     //               buffer as __esri.Polygon
//     //           }
//     //         })
//     //     }
//     //     deboucedQueryFeature(
//     //       structureLayerView,
//     //       mapCursorPoint,
//     //       state.distance,
//     //       pointLayer,
//     //       bufferLayer
//     //     )
//     //     // dispatch({
//     //     //   type: 'SET_COORDINATES',
//     //     //   payload: {
//     //     //     x: mapCursorPoint.latitude,
//     //     //     y: mapCursorPoint.longitude,
//     //     //   },
//     //     // })
//     //   })
//     // )
//     const pointerEvent = view.on(
//       'pointer-move',
//       // debounce(
//       (event) => {
//         if (state.enableSnapping) {
//           // view.map.addMany([pointLayer, bufferLayer])
//           event.stopPropagation()
//           const screenPoint = {
//             x: event.x,
//             y: event.y,
//           } as __esri.MapViewScreenPoint
//           const mapCursorPoint: __esri.Point = view.toMap(screenPoint)
//           setMapCursorPointState(mapCursorPoint)
//           if (mapCursorPoint && !foundFeatures) {
//             // if (pointLayer.graphics.length === 0) {
//             addPoint(mapCursorPoint)
//             addBuffer(mapCursorPoint)
//           }
//           // const deboucedQueryFeature = debounce(() => {
//           // QueryFeature(
//           //   structureLayerView,
//           //   mapCursorPoint,
//           //   state.distance
//           // )
//           // })
//           // deboucedQueryFeature()
//           // const setCoordinates = debounce(() => {
//           //   dispatch({
//           //     type: 'SET_COORDINATES',
//           //     payload: {
//           //       x: mapCursorPoint.latitude,
//           //       y: mapCursorPoint.longitude,
//           //     },
//           //   })
//           // }, 100)
//           // setCoordinates()
//         }
//       }
//       // )
//     )

//     return () => {
//       pointerEvent.remove()
//     }
//   }, [dispatch, foundFeatures, state.distance, state.enableSnapping])
//   return (
//     <div>
//       <div className='MyMap' ref={mapRef}></div>
//     </div>
//   )
// }
// export default MyMap

// WITHOUT FUNCTIONS AND WITHOUT GRAPHICS LAYER
// import React, { useEffect, useRef, useState } from 'react'
// import Map from '@arcgis/core/Map.js'
// import MapView from '@arcgis/core/views/MapView.js'
// import LayerList from '@arcgis/core/widgets/LayerList.js'
// import Layer from '@arcgis/core/layers/Layer.js'
// import Graphic from '@arcgis/core/Graphic.js'
// import { useApp } from '../context/appContext'
// import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
// import * as geometryEngineAsync from '@arcgis/core/geometry/geometryEngineAsync.js'
// import * as geometryEngine from '@arcgis/core/geometry/geometryEngine.js'
// import Polygon from '@arcgis/core/geometry/Polygon.js'
// import GroupLayer from '@arcgis/core/layers/GroupLayer'
// import LayerView from '@arcgis/core/views/layers/LayerView'
// import * as reactiveUtils from '@arcgis/core/core/reactiveUtils.js'
// import AllUiComponent from './AllUiComponent'
// import Expand from '@arcgis/core/widgets/Expand'
// import { createRoot } from 'react-dom/client'
// import { debounce } from 'lodash'
// // let buffering = false

// const polySym = {
//   type: 'simple-fill', // autocasts as new SimpleFillSymbol()
//   color: [37, 37, 37, 0.2],
//   outline: {
//     color: [0, 0, 0, 0.2],
//     width: 2,
//   },
// }
// const pointSym = {
//   type: 'simple-marker', // autocasts as new SimpleMarkerSymbol()
//   color: [37, 37, 37],
//   outline: {
//     color: [255, 255, 255],
//     width: 1,
//   },
//   size: 7,
// }
// // const bufferLayer = new GraphicsLayer()
// // const pointLayer = new GraphicsLayer()

// //  ************************ COED WITH TOW GRAPHICS LAYERS AND WITHOUT DEBOUNCING ************************ // //

// function MyMap() {
//   const { state, dispatch } = useApp()
//   const container = document.createElement('div')
//   createRoot(container).render(
//     <AllUiComponent dispatch={dispatch} state={state} />
//   )
//   const mapRef = useRef<HTMLDivElement>(null)
//   const [groupLayer, setGroupLayer] = useState<__esri.GroupLayer>(
//     new GroupLayer()
//   )
//   const [view, setView] = useState<__esri.MapView>(new MapView())
//   const [structureLayerView, setStructureLayerView] =
//     useState<__esri.LayerView>(new LayerView())
//   const [foundFeatures, setFoundFeatures] = useState<boolean>(false)

//   useEffect(() => {
//     const myMap = new Map({
//       basemap: 'streets-vector',
//     })
//     const view = new MapView({
//       container: mapRef.current as HTMLDivElement,
//       map: myMap,
//       zoom: 18,
//       center: [35.8907635223865, 31.968727310006464],
//     })
//     const layerList = new LayerList({
//       view,
//       listItemCreatedFunction: (event: { item: __esri.ListItem }) => {
//         const item = event.item
//         if (item.layer.type != 'group') {
//           item.panel = {
//             content: 'legend',
//             open: true,
//           } as __esri.ListItemPanel
//         }
//       },
//     })
//     const expand = new Expand({
//       content: container,
//       view: view,
//       group: 'top-right',
//       expanded: true,
//     })
//     reactiveUtils.when(
//       () => view.ready,
//       async () => {
//         setView(view)
//         Layer.fromPortalItem({
//           portalItem: {
//             id: 'a4a63941083a45399637f3ba48265bd2',
//           } as __esri.PortalItem,
//         }).then((layer) => {
//           layer.load().then((l: __esri.GroupLayer) => {
//             setGroupLayer(() => l)
//             view.map.addMany([l])
//             view
//               .whenLayerView(l.layers.getItemAt(2))
//               .then((layerView: __esri.LayerView) => {
//                 setStructureLayerView(() => layerView)
//                 // view
//                 //   .goTo(
//                 //     { target: l.layers.getItemAt(0).fullExtent, zoom: 12 },
//                 //     { animate: true }
//                 //   )
//                 //   .then((res) => {
//                 //   })
//               })
//           })
//         })
//       }
//     )
//     view.ui.add(layerList, 'top-right')
//     view.ui.add(expand, 'top-left')
//     return () => {
//       if (view) {
//         view.destroy()
//       }
//     }
//   }, [])
//   useEffect(() => {
//     const QueryFeature = (
//       structureLayerView: __esri.LayerView,
//       mapCursorPoint: __esri.Point,
//       distance: number
//       // pointLayer: __esri.GraphicsLayer,
//       // bufferLayer: __esri.GraphicsLayer
//     ) => {
//       // debounce(async () => {
//       const structureFeatureLayerView =
//         structureLayerView.layer as unknown as __esri.FeatureLayerView
//       structureFeatureLayerView
//         .queryFeatures({
//           geometry: mapCursorPoint,
//           returnGeometry: true,
//           spatialRelationship: 'contains',
//           distance: distance,
//           units: 'meters',
//         })
//         .then((featureSet: __esri.FeatureSet) => {
//           if (featureSet.features.length > 0) {
//             setFoundFeatures(true)
//             const cursorPointGraphic = view.graphics.getItemAt(0)
//             const bufferPolyGraphic = view.graphics.getItemAt(1)
//             cursorPointGraphic.geometry = featureSet.features[0].geometry
//             geometryEngineAsync
//               .buffer(featureSet.features[0].geometry, state.distance, 'meters')
//               .then((buffer) => {
//                 bufferPolyGraphic.geometry = buffer as Polygon
//               })
//           } else setFoundFeatures(false)
//         })
//     }
//     // const pointerEvent = reactiveUtils.on(
//     //   () => view,
//     //   'pointer-move',
//     //   debounce((event) => {
//     //     event.stopPropagation() //  SEARCH ABOUT IT ****
//     //     const screenPoint = {
//     //       x: event.x,
//     //       y: event.y,
//     //     } as __esri.MapViewScreenPoint
//     //     const mapCursorPoint: __esri.Point = view.toMap(screenPoint)
//     //     if (mapCursorPoint && !foundFeatures) {
//     //       if (pointLayer.graphics.length === 0) {
//     //         pointLayer.add(
//     //           new Graphic({
//     //             geometry: mapCursorPoint,
//     //             symbol: pointSym,
//     //           })
//     //         )
//     //       } else {
//     //         const graphic = pointLayer.graphics.getItemAt(0)
//     //         graphic.geometry = mapCursorPoint
//     //       }
//     //       geometryEngineAsync
//     //         .buffer(mapCursorPoint, state.distance, 'meters', false)
//     //         .then((buffer) => {
//     //           if (bufferLayer.graphics.length === 0) {
//     //             const graphic = new Graphic({
//     //               geometry: buffer as __esri.Polygon,
//     //               symbol: polySym,
//     //             })
//     //             bufferLayer.add(graphic)
//     //           } else {
//     //             bufferLayer.graphics.getItemAt(0).geometry =
//     //               buffer as __esri.Polygon
//     //           }
//     //         })
//     //     }
//     //     deboucedQueryFeature(
//     //       structureLayerView,
//     //       mapCursorPoint,
//     //       state.distance,
//     //       pointLayer,
//     //       bufferLayer
//     //     )
//     //     // dispatch({
//     //     //   type: 'SET_COORDINATES',
//     //     //   payload: {
//     //     //     x: mapCursorPoint.latitude,
//     //     //     y: mapCursorPoint.longitude,
//     //     //   },
//     //     // })
//     //   })
//     // )
//     const pointerEvent = view.on(
//       'pointer-move',
//       // debounce(
//       (event) => {
//         if (state.enableSnapping) {
//           // view.map.addMany([pointLayer, bufferLayer])
//           event.stopPropagation()
//           const screenPoint = {
//             x: event.x,
//             y: event.y,
//           } as __esri.MapViewScreenPoint
//           const mapCursorPoint: __esri.Point = view.toMap(screenPoint)
//           if (mapCursorPoint && !foundFeatures) {
//             // if (pointLayer.graphics.length === 0) {
//             if (view.graphics.length === 0) {
//               view.graphics.add(
//                 new Graphic({
//                   geometry: mapCursorPoint,
//                   symbol: pointSym,
//                 })
//               )
//             } else {
//               // const graphic = pointLayer.graphics.getItemAt(0)
//               const graphic = view.graphics.getItemAt(0)
//               graphic.geometry = mapCursorPoint
//             }
//             geometryEngineAsync
//               .buffer(mapCursorPoint, state.distance, 'meters', false)
//               .then((buffer) => {
//                 // if (bufferLayer.graphics.length === 0) {
//                 if (view.graphics.length <= 1) {
//                   const graphic = new Graphic({
//                     geometry: buffer as __esri.Polygon,
//                     symbol: polySym,
//                   })
//                   view.graphics.add(graphic)
//                   // bufferLayer.add(graphic)
//                 } else {
//                   // bufferLayer.graphics.getItemAt(0).geometry =
//                   //   buffer as __esri.Polygon
//                   view.graphics.getItemAt(1).geometry = buffer as __esri.Polygon
//                 }
//               })
//           }
//           // const deboucedQueryFeature = debounce(() => {
//           QueryFeature(
//             structureLayerView,
//             mapCursorPoint,
//             state.distance
//             // pointLayer,
//             // bufferLayer
//           )
//           // })
//           // deboucedQueryFeature()
//           // const setCoordinates = debounce(() => {
//           //   dispatch({
//           //     type: 'SET_COORDINATES',
//           //     payload: {
//           //       x: mapCursorPoint.latitude,
//           //       y: mapCursorPoint.longitude,
//           //     },
//           //   })
//           // }, 100)
//           // setCoordinates()
//         } else if (!state.enableSnapping) {
//           // view.map.removeMany([pointLayer, bufferLayer])
//           view.graphics.removeAll()
//         }
//       }
//       // )
//     )

//     return () => {
//       pointerEvent.remove()
//     }
//   }, [
//     dispatch,
//     foundFeatures,
//     state.distance,
//     state.enableSnapping,
//     structureLayerView,
//     view,
//   ])
//   return (
//     <div>
//       <div className='MyMap' ref={mapRef}></div>
//     </div>
//   )
// }
// export default MyMap
