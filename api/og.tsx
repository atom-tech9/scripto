import { ImageResponse } from '@vercel/og'

export const config = { runtime: 'edge' }

const MAX_TITLE_LENGTH = 110
const MAX_TAG_LENGTH = 40

const CONTROL_CHARS = new RegExp('[\\u0000-\\u001F\\u007F]', 'g')

/** Clamp + sanitize untrusted query input for rendering. */
const sanitize = (value: string | null, maxLength: number, fallback: string): string => {
  if (!value) return fallback
  const cleaned = value.replace(CONTROL_CHARS, '').trim()
  if (!cleaned) return fallback
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength - 1)}…` : cleaned
}

/**
 * Dynamic Open Graph card (1200×630) for every marketing page:
 * /api/og?title=…&tag=…&lang=ar
 */
export default function handler(request: Request): ImageResponse {
  const { searchParams } = new URL(request.url)
  const title = sanitize(searchParams.get('title'), MAX_TITLE_LENGTH, 'Markdown in. Pixel-perfect PDF out.')
  const tag = sanitize(searchParams.get('tag'), MAX_TAG_LENGTH, 'Markdown → PDF')
  const isArabic = searchParams.get('lang') === 'ar'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          backgroundColor: '#0b0f17',
          backgroundImage:
            'radial-gradient(800px 420px at 12% -10%, rgba(99,102,241,0.35), transparent 60%), radial-gradient(700px 380px at 90% 6%, rgba(168,85,247,0.28), transparent 60%)',
          color: '#eef1f8',
          fontFamily: 'sans-serif',
          direction: isArabic ? 'rtl' : 'ltr',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              fontSize: 30,
              fontWeight: 800,
              color: 'white',
            }}
          >
            S
          </div>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 700 }}>Scripto</div>
          <div
            style={{
              display: 'flex',
              marginLeft: isArabic ? 0 : 'auto',
              marginRight: isArabic ? 'auto' : 0,
              padding: '10px 22px',
              borderRadius: 999,
              border: '1px solid rgba(129,140,248,0.5)',
              backgroundColor: 'rgba(99,102,241,0.15)',
              color: '#c7d2fe',
              fontSize: 24,
            }}
          >
            {tag}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: title.length > 60 ? 56 : 68,
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            maxWidth: 1000,
          }}
        >
          {title}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', fontSize: 26, color: '#9aa6c0' }}>
            md.atom.sa · free · open source · 100% client-side
          </div>
          <div style={{ display: 'flex', fontSize: 24, color: '#7c86a3' }}>Built by Atom</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
