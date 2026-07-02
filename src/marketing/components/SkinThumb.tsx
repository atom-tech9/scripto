import { SKIN_THUMB_STYLES } from '../content/skinStyles'

/**
 * A miniature "document page" impression of a skin, drawn entirely with CSS.
 * `title` is the text printed on the mock page's heading.
 */
export function SkinThumb({ skin, title }: { skin: string; title: string }) {
  return (
    <div className="mk-skin-thumb" style={SKIN_THUMB_STYLES[skin]} aria-hidden="true">
      <div className="st-title">{title}</div>
      <div className="st-accent" />
      <div className="st-lines" />
    </div>
  )
}
