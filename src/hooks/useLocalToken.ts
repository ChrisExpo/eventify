'use client'

import { useState, useEffect, useCallback } from 'react'

export function useLocalToken(slug: string) {
  const [creatorToken, setCreatorTokenState] = useState<string | null>(null)
  const [participantToken, setParticipantTokenState] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setCreatorTokenState(localStorage.getItem(`event_${slug}_creator`))
    setParticipantTokenState(localStorage.getItem(`event_${slug}_participant`))
    setLoaded(true)
  }, [slug])

  const saveCreatorToken = useCallback(
    (token: string) => {
      localStorage.setItem(`event_${slug}_creator`, token)
      setCreatorTokenState(token)
    },
    [slug]
  )

  const saveParticipantToken = useCallback(
    (token: string) => {
      localStorage.setItem(`event_${slug}_participant`, token)
      setParticipantTokenState(token)
    },
    [slug]
  )

  return {
    creatorToken,
    participantToken,
    loaded,
    isCreator: !!creatorToken,
    saveCreatorToken,
    saveParticipantToken,
  }
}
