import React, { createContext, useContext, useReducer } from 'react'
import Point from '@arcgis/core/geometry/Point.js'

// ######################### START FROM HERE
import { coordinatesType, InputFieldType } from '../Types'
type InitialStateType = {
  coordinates: coordinatesType
  mapCursorPoint: __esri.Point
  distance: number
  enableSnapping: boolean
}
const initialState: InitialStateType = {
  coordinates: { x: 0, y: 0 },
  mapCursorPoint: new Point(),
  distance: 10,
  enableSnapping: false,
}
type AppActionType =
  | { type: 'SET_COORDINATES'; payload: coordinatesType }
  | { type: 'SET_MAP_CURSOR_POINT'; payload: __esri.Point }
  | { type: 'SET_DISTANCE'; payload: number }
  | { type: 'SET_ENABLE_SNAPPING'; payload: boolean }
type AppDispatch = (action: AppActionType) => void
//
//
const AppContext = createContext<{
  state: InitialStateType
  dispatch: AppDispatch
}>({
  state: initialState,
  dispatch: () => {
    return
  },
})
function appReducer(
  state: InitialStateType,
  action: AppActionType
): InitialStateType {
  switch (action.type) {
    case 'SET_COORDINATES':
      return { ...state, coordinates: action.payload }
    case 'SET_MAP_CURSOR_POINT':
      return { ...state, mapCursorPoint: action.payload }
    case 'SET_DISTANCE':
      return { ...state, distance: action.payload }
    case 'SET_ENABLE_SNAPPING':
      return { ...state, enableSnapping: action.payload }

    default:
      throw new Error(`Unhandled action type`)
  }
}
// ######################### TO HERE
function AppProvider(props: React.PropsWithChildren<object>) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {props.children}
    </AppContext.Provider>
  )
}
function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useCounter must be used within a CounterProvider')
  }
  return context
}
export { AppProvider, useApp, AppActionType, InitialStateType }
