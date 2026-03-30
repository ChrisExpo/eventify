import { ImageResponse } from 'next/og'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { formatDateItalian } from '@/lib/utils'

export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!event) {
    return new Response('Not found', { status: 404 })
  }

  const { count } = await supabase
    .from('participants')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event.id)
    .eq('status', 'confirmed')

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          fontFamily: 'sans-serif',
        }}
      >
        {event.image_url ? (
          /* Layout con foto di copertina */
          <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.image_url}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, #140727 0%, rgba(20,7,39,0.6) 50%, transparent 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: 48,
              }}
            >
              <h1
                style={{
                  fontSize: 52,
                  fontWeight: 700,
                  color: '#d394ff',
                  margin: 0,
                  marginBottom: 12,
                  lineHeight: 1.15,
                  maxWidth: '85%',
                }}
              >
                {event.title}
              </h1>
              <p style={{ fontSize: 24, color: '#b5a4cd', margin: 0, marginBottom: 6 }}>
                📅 {formatDateItalian(event.date)}
              </p>
              {event.location_name && (
                <p style={{ fontSize: 22, color: '#b5a4cd', margin: 0, marginBottom: 6 }}>
                  📍 {event.location_name}
                </p>
              )}
              {(count ?? 0) > 0 && (
                <p style={{ fontSize: 20, color: '#69fd5d', margin: 0, marginTop: 8 }}>
                  👥 {count} partecipanti confermati
                </p>
              )}
              <p style={{ fontSize: 16, color: '#d394ff', margin: 0, marginTop: 16, opacity: 0.7 }}>
                FriendsFest
              </p>
            </div>
          </div>
        ) : (
          /* Layout con emoji centrata */
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #140727 0%, #201139 50%, #271641 100%)',
            }}
          >
            <span style={{ fontSize: 120 }}>{event.emoji}</span>
            <h1
              style={{
                fontSize: 48,
                fontWeight: 700,
                color: '#d394ff',
                marginTop: 20,
                marginBottom: 10,
                textAlign: 'center',
                maxWidth: '80%',
              }}
            >
              {event.title}
            </h1>
            <p style={{ fontSize: 24, color: '#b5a4cd', marginBottom: 8 }}>
              📅 {formatDateItalian(event.date)}
            </p>
            {event.location_name && (
              <p style={{ fontSize: 22, color: '#b5a4cd' }}>
                📍 {event.location_name}
              </p>
            )}
            {(count ?? 0) > 0 && (
              <p style={{ fontSize: 20, color: '#69fd5d', marginTop: 16 }}>
                👥 {count} partecipanti confermati
              </p>
            )}
            <p
              style={{
                fontSize: 18,
                color: '#d394ff',
                marginTop: 24,
                opacity: 0.8,
              }}
            >
              FriendsFest
            </p>
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
