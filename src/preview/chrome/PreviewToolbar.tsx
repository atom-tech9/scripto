import { memo } from 'react'
import {
  AlignLeft,
  Check,
  Crosshair,
  Eye,
  EyeOff,
  Files,
  Layers,
  Link2,
  Link2Off,
  Minus,
  Palette,
  Plus,
} from 'lucide-react'
import { Menu, MenuItem } from '@/components/ui/Menu'
import { Tooltip } from '@/components/ui/Tooltip'
import { useLanguage } from '@/i18n'
import { cn } from '@/lib/utils'
import type { PreviewMode, StageLevel } from '@/preview/stage/types'

interface PreviewToolbarProps {
  mode: PreviewMode
  onMode: (mode: PreviewMode) => void
  zoom: number
  onZoom: (zoom: number) => void
  onResetZoom: () => void
  stageLevel: StageLevel
  onStageLevel: (level: StageLevel) => void
  /** Skin palette. Omit `onToggleSkins` to hide the entry point entirely. */
  skinsOpen: boolean
  onToggleSkins?: () => void
  skinName: string
  /** Rendered only when the document actually has a cover or contents page. */
  hasFrontMatter: boolean
  showFrontMatter: boolean
  onToggleFrontMatter: () => void
  /** Provided only in split view. */
  syncEnabled?: boolean
  onToggleSync?: () => void
}

const MODES: readonly {
  value: PreviewMode
  icon: typeof AlignLeft
  labelKey: 'preview.mode.flow' | 'preview.mode.pages' | 'preview.mode.focus'
}[] = [
  { value: 'flow', icon: AlignLeft, labelKey: 'preview.mode.flow' },
  { value: 'pages', icon: Files, labelKey: 'preview.mode.pages' },
  { value: 'focus', icon: Crosshair, labelKey: 'preview.mode.focus' },
]

const STAGE_LEVEL_KEYS = {
  full: 'preview.stage.full',
  minimal: 'preview.stage.minimal',
  off: 'preview.stage.off',
} as const

const iconButton =
  'flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export const PreviewToolbar = memo(function PreviewToolbar({
  mode,
  onMode,
  zoom,
  onZoom,
  onResetZoom,
  stageLevel,
  onStageLevel,
  skinsOpen,
  onToggleSkins,
  skinName,
  hasFrontMatter,
  showFrontMatter,
  onToggleFrontMatter,
  syncEnabled,
  onToggleSync,
}: PreviewToolbarProps) {
  const { t } = useLanguage()

  return (
    <div className="relative z-10 flex items-center gap-1.5 border-b border-border/70 bg-surface/70 px-2 py-1.5 backdrop-blur sm:gap-2 sm:px-3">
      <div
        role="radiogroup"
        aria-label={t('preview.mode.label')}
        className="flex items-center gap-0.5 rounded-lg border border-border bg-background p-0.5"
      >
        {MODES.map(({ value, icon: Icon, labelKey }) => {
          const active = mode === value
          return (
            <Tooltip key={value} label={t(labelKey)} side="bottom">
              <button
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onMode(value)}
                className={cn(
                  'flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon size={13} />
                <span className="stage-toolbar__label">{t(labelKey)}</span>
              </button>
            </Tooltip>
          )
        })}
      </div>

      <div className="ms-auto flex items-center gap-1 sm:gap-1.5">
        {onToggleSkins && (
          <Tooltip label={t('preview.rail.title')} side="bottom">
            <button
              type="button"
              onClick={onToggleSkins}
              aria-expanded={skinsOpen}
              className={cn(
                'flex h-8 max-w-[9rem] items-center gap-1.5 rounded-lg border px-2 text-xs font-medium transition-colors',
                skinsOpen
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Palette size={14} className="shrink-0" />
              <span className="stage-toolbar__label truncate">{skinName}</span>
            </button>
          </Tooltip>
        )}
        <div className="stage-toolbar__zoom items-center gap-0.5 rounded-lg border border-border bg-background p-0.5">
          <button
            type="button"
            onClick={() => onZoom(zoom - 0.1)}
            aria-label={t('print.zoomOut')}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Minus size={13} />
          </button>
          <button
            type="button"
            onClick={onResetZoom}
            aria-label={t('print.zoomReset')}
            className="w-10 text-center text-[11px] font-medium tabular-nums text-muted-foreground hover:text-foreground"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={() => onZoom(zoom + 0.1)}
            aria-label={t('print.zoomIn')}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Plus size={13} />
          </button>
        </div>

        {hasFrontMatter && (
          <Tooltip label={t('preview.frontMatter.toggle')} side="bottom">
            <button
              type="button"
              onClick={onToggleFrontMatter}
              aria-pressed={showFrontMatter}
              className={cn(
                iconButton,
                showFrontMatter &&
                  'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary',
              )}
            >
              {showFrontMatter ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
          </Tooltip>
        )}

        {onToggleSync && (
          <Tooltip label={syncEnabled ? t('preview.sync.on') : t('preview.sync.off')} side="bottom">
            <button
              type="button"
              onClick={onToggleSync}
              aria-pressed={syncEnabled}
              className={cn(
                iconButton,
                syncEnabled && 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary',
              )}
            >
              {syncEnabled ? <Link2 size={15} /> : <Link2Off size={15} />}
            </button>
          </Tooltip>
        )}

        <Menu
          trigger={({ toggle }) => (
            <Tooltip label={t('preview.stage.label')} side="bottom">
              <button
                type="button"
                onClick={toggle}
                aria-label={t('preview.stage.label')}
                className={iconButton}
              >
                <Layers size={15} />
              </button>
            </Tooltip>
          )}
        >
          {(close) => (
            <>
              <div className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t('preview.stage.label')}
              </div>
              {(['full', 'minimal', 'off'] as const).map((level) => (
                <MenuItem
                  key={level}
                  icon={
                    <Check
                      size={14}
                      className={stageLevel === level ? 'opacity-100' : 'opacity-0'}
                    />
                  }
                  onClick={() => {
                    onStageLevel(level)
                    close()
                  }}
                >
                  {t(STAGE_LEVEL_KEYS[level])}
                </MenuItem>
              ))}
            </>
          )}
        </Menu>
      </div>
    </div>
  )
})
