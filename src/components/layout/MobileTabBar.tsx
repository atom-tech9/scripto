import { Eye, FileDown, Pencil, SlidersHorizontal } from 'lucide-react'
import { useLanguage } from '@/i18n'
import { cn } from '@/lib/utils'
import type { ViewMode } from '@/types'

interface MobileTabBarProps {
  view: ViewMode
  onView: (view: ViewMode) => void
  settingsOpen: boolean
  onToggleSettings: () => void
  onExport: () => void
}

const tab =
  'flex min-h-[3rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-medium transition-colors'

/**
 * The primary navigation on a phone.
 *
 * A phone has room for one pane, not two, so editor and preview are tabs rather
 * than a split — and they live at the bottom, where a thumb actually reaches.
 * Every target is at least 48px.
 */
export function MobileTabBar({
  view,
  onView,
  settingsOpen,
  onToggleSettings,
  onExport,
}: MobileTabBarProps) {
  const { t } = useLanguage()
  const editing = view === 'editor' && !settingsOpen
  const previewing = view === 'preview' && !settingsOpen

  return (
    <nav
      aria-label={t('mobile.nav')}
      className="flex shrink-0 items-center gap-1 border-t border-border bg-surface px-2 pb-[env(safe-area-inset-bottom)] pt-1 lg:hidden"
    >
      <button
        type="button"
        onClick={() => {
          if (settingsOpen) onToggleSettings()
          onView('editor')
        }}
        aria-current={editing}
        className={cn(
          tab,
          editing ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted',
        )}
      >
        <Pencil size={18} />
        {t('mobile.tab.editor')}
      </button>

      <button
        type="button"
        onClick={() => {
          if (settingsOpen) onToggleSettings()
          onView('preview')
        }}
        aria-current={previewing}
        className={cn(
          tab,
          previewing ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted',
        )}
      >
        <Eye size={18} />
        {t('mobile.tab.preview')}
      </button>

      <button
        type="button"
        onClick={onToggleSettings}
        aria-expanded={settingsOpen}
        className={cn(
          tab,
          settingsOpen ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted',
        )}
      >
        <SlidersHorizontal size={18} />
        {t('mobile.tab.settings')}
      </button>

      <button
        type="button"
        onClick={onExport}
        className={cn(tab, 'bg-primary text-primary-foreground hover:brightness-110')}
      >
        <FileDown size={18} />
        {t('mobile.tab.export')}
      </button>
    </nav>
  )
}
