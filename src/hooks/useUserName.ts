'use client'
import { useState, useEffect, useCallback } from 'react'

const NAME_KEY = 'eventify_user_name'
const AVATAR_KEY = 'eventify_user_avatar'

export function useUserName() {
  const [userName, setUserNameState] = useState('')
  const [avatarUrl, setAvatarUrlState] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const storedName = localStorage.getItem(NAME_KEY)
    const storedAvatar = localStorage.getItem(AVATAR_KEY)
    if (storedName) setUserNameState(storedName)
    if (storedAvatar) setAvatarUrlState(storedAvatar)
    setLoaded(true)
  }, [])

  const saveUserName = useCallback((name: string) => {
    const trimmed = name.trim()
    if (trimmed) {
      localStorage.setItem(NAME_KEY, trimmed)
      setUserNameState(trimmed)
    }
  }, [])

  const clearUserName = useCallback(() => {
    localStorage.removeItem(NAME_KEY)
    setUserNameState('')
  }, [])

  const saveAvatarUrl = useCallback((url: string) => {
    localStorage.setItem(AVATAR_KEY, url)
    setAvatarUrlState(url)
  }, [])

  const clearAvatarUrl = useCallback(() => {
    localStorage.removeItem(AVATAR_KEY)
    setAvatarUrlState(null)
  }, [])

  return { userName, avatarUrl, loaded, saveUserName, clearUserName, saveAvatarUrl, clearAvatarUrl }
}
