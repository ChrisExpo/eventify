'use client'
import { useLocalToken } from '@/hooks/useLocalToken'
import FAB from '@/components/ui/FAB'

export default function EventFAB({ slug }: { slug: string }) {
  const { isCreator, loaded } = useLocalToken(slug)

  if (!loaded || !isCreator) return null

  return (
    <FAB
      href={`/evento/${slug}/modifica`}
      label="Modifica evento"
      className="bottom-24 right-4"
    />
  )
}
