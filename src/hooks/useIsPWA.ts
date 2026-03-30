'use client'
import { useState, useEffect } from 'react'

export function useIsPWA() {
  const [isPWA, setIsPWA] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // iOS Safari standalone
    const isIOSStandalone = (window.navigator as any).standalone === true
    // Android / Chrome / Edge standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    // TWA (Trusted Web Activity)
    const isTWA = document.referrer.includes('android-app://')

    setIsPWA(isIOSStandalone || isStandalone || isTWA)
    setLoaded(true)
  }, [])

  return { isPWA, loaded }
}
