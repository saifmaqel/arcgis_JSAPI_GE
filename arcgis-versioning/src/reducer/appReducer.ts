import React from 'react'
type coordinatesType = { x: number; y: number }
export const appReducer = (
  state: {
    coordinates: coordinatesType
  },
  action: {
    type: string
    payload: object
  }
) => {}
