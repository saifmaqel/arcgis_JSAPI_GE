import React, { useState, useCallback } from 'react'
import { AppActionType, InitialStateType, useApp } from '../context/appContext'

type inputFieldsType = {
  distance: number
  enableSnapping: boolean
}

const AllUiComponent = () => {
  const { state, dispatch } = useApp()

  const [inputFields, setInputFields] = useState<inputFieldsType>({
    distance: state.distance,
    enableSnapping: state.enableSnapping,
  })
  const handleClick = useCallback(() => {
    dispatch({ type: 'SET_DISTANCE', payload: inputFields.distance })
  }, [dispatch, inputFields.distance])

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target
      if (event.target.name === 'enableSnapping') {
        const updatedEnableSnapping = !inputFields.enableSnapping
        setInputFields({
          ...inputFields,
          enableSnapping: updatedEnableSnapping,
        })
        dispatch({
          type: 'SET_ENABLE_SNAPPING',
          payload: updatedEnableSnapping,
        })
        dispatch({ type: 'SET_DISTANCE', payload: inputFields.distance })
      } else setInputFields({ ...inputFields, [name]: value })
    },
    [dispatch, inputFields]
  )

  return (
    <div className='widget-component'>
      <div className='enable-snapping'>
        <label htmlFor='enable-snapping'>enable snapping: </label>
        <input
          type='checkbox'
          name='enableSnapping'
          id='enable-snapping'
          checked={inputFields.enableSnapping}
          onChange={handleInputChange}
        />
      </div>
      <button onClick={handleClick}>update buffer size</button>
      <label htmlFor='distance'>buffer size</label>
      <input
        type='number'
        value={inputFields.distance}
        onChange={handleInputChange}
        name='distance'
        id='distance'
        placeholder='Distance'
        min='0'
      />
    </div>
  )
}

export default AllUiComponent
