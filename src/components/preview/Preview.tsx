import { forwardRef } from 'react'
import { PreviewSurface, type PreviewHandle, type PreviewSurfaceProps } from '@/preview'

export type { PreviewHandle }

/**
 * Adapter kept at the original import path so `App.tsx` and the export engine
 * keep talking to one stable surface. The preview itself lives in `@/preview`.
 */
export const Preview = forwardRef<PreviewHandle, PreviewSurfaceProps>(function Preview(props, ref) {
  return <PreviewSurface ref={ref} {...props} />
})
