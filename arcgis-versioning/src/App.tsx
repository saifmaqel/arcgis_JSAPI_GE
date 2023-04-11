import './App.css'
import React, { useEffect, useRef, useState, useReducer } from 'react'
import esriConfig from '@arcgis/core/config'
import OAuthInfo from '@arcgis/core/identity/OAuthInfo'
import Portal from '@arcgis/core/portal/Portal'
import IdentityManager from '@arcgis/core/identity/IdentityManager'
import MyMap from './components/MyMap'
import Coordinates from './components/Coordinates'
// import appReducer from './reducer/appReducer'
// import appContext from './context/appContext'
import { AppProvider } from './context/appContext'
import { coordinatesType } from './Types'
const clientId = 'fMBCeXXPTVF5gYLC'
const clientSecret = '2488e097c412456c8563152543195353'
const redirectUri = window.location.origin

function App() {
  const [coordinates, setCoordinates] = useState<coordinatesType>({
    x: 0,
    y: 0,
  })
  // const [appState, appDispatcher] = useReducer(
  //   appReducer,
  //   appContext
  // )
  useEffect(() => {
    esriConfig.portalUrl = 'https://gis.teklabz.com/portal'
    // // OAuthInfo
    // const oauthInfo2 = new OAuthInfo({
    //   appId: clientId,
    //   popup: false,
    //   portalUrl: 'https://gis.teklabz.com/portal',
    //   // redirectUrl: redirectUri
    // })
    // IdentityManager.registerOAuthInfos([oauthInfo2])
    // //  check Sign In Status
    // IdentityManager.checkSignInStatus('https://gis.teklabz.com/portal/sharing')
    //   .then((userCredential) => {
    //     console.log('credentials', userCredential)
    //     // setUpMapView()
    //     // hide sign in
    //   })
    //   .catch((e) => console.log('your are not logged in'))
    // // HANDLE PORTAL  **************
    // const portal = new Portal()
    // portal.authMode = 'immediate'
    // portal.load().then(() => {
    //   console.log('portal', portal)
    //   console.log('portal username', portal.user.fullName)
    // })
    // // *************************************** END USE EFFECT ********************************
  }, [])

  //
  // GET X,Y COORDINATES FROM MY MAP COMPONENT
  const getCoordinates = (data: coordinatesType) => {
    setCoordinates(data)
  }

  // HANDLE ON CLICK BUTTON TO SIGN IN ***************
  const handleSignInByPort = async () => {
    // IdentityManager.getCredential('https://gis.teklabz.com/portal/sharing')
    //   .then((res) => {
    //     console.log(res)
    //   })
    //   .catch((e) => console.log('error', e))
  }
  // HANDLE ON CLICK BUTTON TO SIGN OUT **************
  const handleSignOutByPort = () => {
    // IdentityManager.destroyCredentials()
    // window.location.reload()
  }
  // #####################  RETURN PAGE CONTENT  #############################
  return (
    <>
      <AppProvider>
        <div>
          <div className='App'>
            <MyMap />
            <Coordinates />
          </div>
        </div>
      </AppProvider>
    </>
  )
}

export default App

//
//
//
//
//
//
//
//
//
//
//
//
//
//
// view.ui

{
  /* <h3 onClick={handleSignInByPort}>Sign In</h3>
      <h3 onClick={handleSignOutByPort}>Sign Out</h3> */
}
// const myMap = new WebMap({
//   portalItem: {
//     id: 'a3b397710abe43c7a9afe785e840eb74',
//   } as __esri.PortalItem,
// })
