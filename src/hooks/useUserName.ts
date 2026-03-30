'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const DEVICE_ID_KEY = 'eventify_device_id'
const LEGACY_NAME_KEY = 'eventify_user_name'
const LEGACY_AVATAR_KEY = 'eventify_user_avatar'

function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY)
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, deviceId)
  }
  return deviceId
}

export function useUserName() {
  const [userName, setUserName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function init() {
      const did = getOrCreateDeviceId()
      setDeviceId(did)

      const supabase = createClient()

      // Cerca utente nel DB tramite device_id
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('device_id', did)
        .single()

      if (user) {
        setUserName(user.name)
        setAvatarUrl(user.avatar_url)
        setUserId(user.id)
        // Mantieni localStorage sincronizzato per backward compat
        localStorage.setItem(LEGACY_NAME_KEY, user.name)
        if (user.avatar_url) localStorage.setItem(LEGACY_AVATAR_KEY, user.avatar_url)
      } else {
        // Migrazione: se ci sono dati legacy in localStorage, crea l'utente nel DB
        const legacyName = localStorage.getItem(LEGACY_NAME_KEY)
        const legacyAvatar = localStorage.getItem(LEGACY_AVATAR_KEY)

        if (legacyName) {
          const { data: newUser } = await supabase
            .from('users')
            .insert({
              device_id: did,
              name: legacyName,
              avatar_url: legacyAvatar || null,
            })
            .select()
            .single()

          if (newUser) {
            setUserName(newUser.name)
            setAvatarUrl(newUser.avatar_url)
            setUserId(newUser.id)
          }
        }
      }

      setLoaded(true)
    }

    init()
  }, [])

  const saveUserName = useCallback(async (name: string) => {
    const trimmed = name.trim()
    if (!trimmed || !deviceId) return

    const supabase = createClient()

    if (userId) {
      await supabase.from('users').update({ name: trimmed }).eq('id', userId)
    } else {
      const { data: newUser } = await supabase
        .from('users')
        .insert({ device_id: deviceId, name: trimmed })
        .select()
        .single()
      if (newUser) setUserId(newUser.id)
    }

    setUserName(trimmed)
    localStorage.setItem(LEGACY_NAME_KEY, trimmed)
  }, [deviceId, userId])

  const clearUserName = useCallback(async () => {
    if (userId) {
      const supabase = createClient()
      await supabase.from('users').delete().eq('id', userId)
    }
    setUserName('')
    setAvatarUrl(null)
    setUserId(null)
    localStorage.removeItem(LEGACY_NAME_KEY)
    localStorage.removeItem(LEGACY_AVATAR_KEY)
  }, [userId])

  const saveAvatarUrl = useCallback(async (url: string) => {
    if (userId) {
      const supabase = createClient()
      await supabase.from('users').update({ avatar_url: url }).eq('id', userId)
    }
    setAvatarUrl(url)
    localStorage.setItem(LEGACY_AVATAR_KEY, url)
  }, [userId])

  const clearAvatarUrl = useCallback(async () => {
    if (userId) {
      const supabase = createClient()
      await supabase.from('users').update({ avatar_url: null }).eq('id', userId)
    }
    setAvatarUrl(null)
    localStorage.removeItem(LEGACY_AVATAR_KEY)
  }, [userId])

  return { userName, avatarUrl, userId, loaded, saveUserName, clearUserName, saveAvatarUrl, clearAvatarUrl }
}
