'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface CopyLinkButtonProps {
  slug: string
  className?: string
}

export default function CopyLinkButton({ slug, className }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleClick = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
    const url = `${baseUrl}/evento/${slug}`

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback per browser che non supportano clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = url
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Button
      variant="secondary"
      size="lg"
      onClick={handleClick}
      className={`bg-surface-container-highest text-on-surface hover:bg-surface-bright ${className ?? ''}`}
      aria-label={copied ? 'Link copiato negli appunti' : 'Copia link evento'}
      aria-live="polite"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
          Copiato!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />
          Copia link
        </>
      )}
    </Button>
  )
}
