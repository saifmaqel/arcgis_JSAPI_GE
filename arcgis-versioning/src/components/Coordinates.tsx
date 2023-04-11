import React from 'react'
import '../App.css'
import { useApp } from '../context/appContext'

function Coordinates() {
  const { state } = useApp()

  return (
    <div className='coordinates-container'>
      <div className='coordinates-content'></div>
      {/* <h1>X: {state.coordinates.x}</h1>
      <h1>Y: {state.coordinates.y}</h1> */}
    </div>
  )
}

export default Coordinates
