import { ImageResponse } from '@vercel/og'

export const config = { runtime: 'edge' }

const MAX_TITLE_LENGTH = 110
const MAX_TAG_LENGTH = 40

/** Bidi/RTL-override formatting chars — stripped to prevent visual spoofing. */
const BIDI_CONTROLS = new Set([0x200e, 0x200f, 0x202a, 0x202b, 0x202c, 0x202d, 0x202e, 0x2066, 0x2067, 0x2068, 0x2069])

/**
 * Clamp + sanitize untrusted query input: drop C0/DEL and bidi controls, cap
 * length. Works on codepoints so surrogate pairs are never split by the cut.
 */
const sanitize = (value: string | null, maxLength: number, fallback: string): string => {
  if (!value) return fallback
  const codepoints = [...value].filter((char) => {
    const code = char.codePointAt(0) ?? 0
    return code > 0x1f && code !== 0x7f && !BIDI_CONTROLS.has(code)
  })
  const cleaned = codepoints.join('').trim()
  if (!cleaned) return fallback
  if (codepoints.length <= maxLength) return cleaned
  return `${codepoints.slice(0, maxLength - 1).join('').trimEnd()}…`
}

/** Output is a pure function of the query — cache aggressively at the edge. */
const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=86400, s-maxage=31536000, immutable',
} as const

const DEFAULT_TITLE = 'Markdown in. Pixel-perfect PDF out.'

/**
 * Dynamic Open Graph card (1200×630) for every marketing page:
 * /api/og?title=…&tag=…&lang=ar
 */
export default function handler(request: Request): ImageResponse {
  let title = DEFAULT_TITLE
  let tag = 'Markdown → PDF'
  let isArabic = false
  try {
    const { searchParams } = new URL(request.url)
    title = sanitize(searchParams.get('title'), MAX_TITLE_LENGTH, DEFAULT_TITLE)
    tag = sanitize(searchParams.get('tag'), MAX_TAG_LENGTH, tag)
    isArabic = searchParams.get('lang') === 'ar'
    return renderCard(title, tag, isArabic)
  } catch {
    // Never 500 a link-unfurler: fall back to the branded default card.
    return renderCard(DEFAULT_TITLE, 'Markdown → PDF', false)
  }
}

function renderCard(title: string, tag: string, isArabic: boolean): ImageResponse {
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
    { width: 1200, height: 630, headers: CACHE_HEADERS },
  )
}
