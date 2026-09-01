// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { flattenImages } from '@/pdf/flattenImages'

function docWith(html: string): HTMLElement {
  const root = document.createElement('div')
  root.innerHTML = html
  return root
}

/** jsdom never loads images, so intrinsic size has to be faked. */
function setNatural(img: HTMLImageElement, width: number, height: number): void {
  Object.defineProperty(img, 'naturalWidth', { value: width, configurable: true })
  Object.defineProperty(img, 'naturalHeight', { value: height, configurable: true })
}

describe('flattenImages', () => {
  it('replaces an image with an equivalent non-replaced box', () => {
    const root = docWith('<p><img src="data:image/gif;base64,AAAA" alt="a chart"></p>')
    setNatural(root.querySelector('img')!, 800, 400)
    flattenImages(root)

    expect(root.querySelector('img')).toBeNull()
    const box = root.querySelector('div[role="img"]')!
    expect(box.getAttribute('aria-label')).toBe('a chart')
    const style = (box as HTMLElement).style
    expect(style.backgroundImage).toContain('data:image/gif;base64,AAAA')
    expect(style.width).toBe('800px')
    expect(style.maxWidth).toBe('100%')
  })

  it('carries the picture through a print dialog with backgrounds off', () => {
    const root = docWith('<img src="x.png">')
    setNatural(root.querySelector('img')!, 10, 10)
    flattenImages(root)
    // Without this the browser drops the picture entirely, which is worse than
    // the pagination stall the swap exists to avoid.
    expect((root.querySelector('div[role="img"]') as HTMLElement).style.printColorAdjust).toBe(
      'exact',
    )
  })

  it('leaves an image alone when it has no intrinsic size', () => {
    const root = docWith('<img src="broken.png">')
    flattenImages(root)
    expect(root.querySelector('img')).not.toBeNull()
  })

  it('falls back to the width and height attributes', () => {
    const root = docWith('<img src="a.png" width="120" height="60">')
    flattenImages(root)
    const box = root.querySelector('div[role="img"]') as HTMLElement
    expect(box.style.width).toBe('120px')
  })

  it('reads intrinsic sizes from the live tree when given a clone', () => {
    const live = docWith('<img src="a.png">')
    setNatural(live.querySelector('img')!, 300, 150)
    const clone = live.cloneNode(true) as HTMLElement
    flattenImages(clone, live)
    expect((clone.querySelector('div[role="img"]') as HTMLElement).style.width).toBe('300px')
  })

  it('lets an author width win over the intrinsic one', () => {
    const root = docWith('<img src="a.png" style="width:50%">')
    setNatural(root.querySelector('img')!, 300, 150)
    flattenImages(root)
    expect((root.querySelector('div[role="img"]') as HTMLElement).style.width).toBe('50%')
  })
})
