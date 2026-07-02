import {
  ChevronDown,
  Columns2,
  Command,
  Download,
  Eye,
  FileCode2,
  FileDown,
  FileText,
  FileType2,
  BookOpen,
  FolderOpen,
  Github,
  GraduationCap,
  Import,
  Keyboard,
  Languages,
  ListTree,
  Maximize2,
  Monitor,
  Moon,
  MoreHorizontal,
  Palette,
  PanelRightClose,
  PanelRightOpen,
  Pencil,
  Printer,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Sun,
} from 'lucide-react'
import { useState } from 'react'
import { Field, Segmented, TextInput } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Tooltip } from '@/components/ui/Tooltip'
import { Menu, MenuItem } from '@/components/ui/Menu'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useLanguage } from '@/i18n'
import { useMode } from '@/mode'
import { LANGUAGES } from '@/lib/i18n'
import type { ThemeMode, UiLanguage, ViewMode } from '@/types'

export interface HeaderProps {
  title: string
  onTitleChange: (title: string) => void
  viewMode: ViewMode
  onViewMode: (mode: ViewMode) => void
  outlineOpen: boolean
  onToggleOutline: () => void
  themeMode: ThemeMode
  onCycleTheme: () => void
  saving: boolean
  configOpen: boolean
  onToggleConfig: () => void
  onOpenTemplates: () => void
  onOpenThemes: () => void
  onOpenDocuments: () => void
  onToggleZen: () => void
  onImport: () => void
  onImportGithub: () => void
  onExportPdf: () => void
  onPrintPreview: () => void
  onExportWord: () => void
  onExportHtml: () => void
  onExportMarkdown: () => void
  onShortcuts: () => void
  onOpenFormattingHelp: () => void
  onOpenSecurity: () => void
  onOpenAi: () => void
  onOpenCommand: () => void
  uiLang: UiLanguage
  onToggleLang: () => void
  secured: boolean
  aiActive: boolean
}

const ThemeIcon = { light: Sun, dark: Moon, system: Monitor }

/** Compact, grouped icon-button rail for a clean SaaS toolbar look. */
function IconAction({
  label,
  onClick,
  active,
  children,
  pressed,
}: {
  label: string
  onClick: () => void
  active?: boolean
  pressed?: boolean
  children: React.ReactNode
}) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-pressed={pressed}
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all active:scale-90 motion-reduce:active:scale-100 ${
          active
            ? 'bg-surface text-foreground shadow-sm ring-1 ring-border'
            : 'text-muted-foreground hover:bg-surface/70 hover:text-foreground'
        }`}
      >
        {children}
      </button>
    </Tooltip>
  )
}

export function Header(props: HeaderProps) {
  const TIcon = ThemeIcon[props.themeMode]
  const { t } = useLanguage()
  const { isSimple, toggle: toggleMode } = useMode()
  const brand = LANGUAGES[props.uiLang] ?? LANGUAGES.en
  const [renameOpen, setRenameOpen] = useState(false)
  // Split view only functions on wider screens, so drop it on mobile.
  const canSplit = useMediaQuery('(min-width: 640px)')
  const viewOptions = [
    { value: 'editor' as const, label: <Pencil size={14} />, title: t('view.editor') },
    ...(canSplit
      ? [{ value: 'split' as const, label: <Columns2 size={14} />, title: t('view.split') }]
      : []),
    { value: 'preview' as const, label: <Eye size={14} />, title: t('view.preview') },
  ]

  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface/80 px-3 backdrop-blur-xl sm:px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="hidden lg:inline-flex">
          <IconAction
            label={t('action.outline')}
            onClick={props.onToggleOutline}
            active={props.outlineOpen}
            pressed={props.outlineOpen}
          >
            <ListTree size={17} />
          </IconAction>
        </span>

        <div className="flex items-center gap-2">
          <img
            src="/logo.webp"
            alt={brand.brand}
            width={32}
            height={32}
            className="h-8 w-8 rounded-xl shadow-md shadow-indigo-500/25"
          />
          <div className="hidden leading-none lg:block">
            <div className="text-sm font-bold tracking-tight text-foreground">{brand.brand}</div>
            <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {brand.tagline}
            </div>
          </div>
        </div>

        <div className="mx-1 hidden h-6 w-px bg-border lg:block" />

        <div className="group hidden min-w-0 items-center gap-2 lg:flex">
          <input
            value={props.title}
            onChange={(e) => props.onTitleChange(e.target.value)}
            aria-label={t('header.docTitleAria')}
            placeholder={t('title.untitled')}
            className="min-w-0 max-w-[52vw] truncate rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm font-semibold text-foreground outline-none transition-colors hover:border-border hover:bg-muted/40 focus:border-ring focus:bg-surface sm:max-w-[40vw] lg:max-w-[34vw]"
          />
          <span
            className={`hidden items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium md:inline-flex ${
              props.saving
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                props.saving ? 'animate-pulse bg-amber-500' : 'bg-emerald-500'
              }`}
            />
            {props.saving ? t('status.saving') : t('status.saved')}
          </span>
        </div>
      </div>

      {/* Command search (in-flow so it never overlaps the action icons) */}
      <button
        type="button"
        onClick={props.onOpenCommand}
        className="ms-2 hidden h-9 min-w-0 max-w-md flex-1 items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:border-ring/40 hover:bg-muted lg:flex"
      >
        <Search size={15} className="shrink-0" />
        <span className="flex-1 truncate whitespace-nowrap text-start">{t('action.search')}</span>
        <kbd className="flex shrink-0 items-center gap-0.5 rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium">
          <Command size={10} /> K
        </kbd>
      </button>

      <div className="flex items-center gap-1.5">
        <Segmented<ViewMode>
          value={props.viewMode === 'split' && !canSplit ? 'preview' : props.viewMode}
          onChange={props.onViewMode}
          size="sm"
          className="shrink-0"
          options={viewOptions}
        />

        <div className="hidden items-center rounded-xl bg-muted/40 p-0.5 sm:flex">
          <IconAction label={t('action.documents')} onClick={props.onOpenDocuments}>
            <FolderOpen size={16} />
          </IconAction>
          <IconAction label={t('action.templates')} onClick={props.onOpenTemplates}>
            <FileText size={16} />
          </IconAction>
          <span className="hidden md:inline-flex">
            <IconAction label={t('action.themes')} onClick={props.onOpenThemes}>
              <Palette size={16} />
            </IconAction>
          </span>
          <span className="hidden md:inline-flex">
            <IconAction label={`${t('action.import')}  (⌘O)`} onClick={props.onImport}>
              <Import size={16} />
            </IconAction>
          </span>
          <span className="hidden lg:inline-flex">
            <IconAction label={t('action.importGithub')} onClick={props.onImportGithub}>
              <Github size={16} />
            </IconAction>
          </span>
        </div>

        <div className="flex items-center rounded-lg shadow-sm">
          <button
            type="button"
            onClick={props.onExportPdf}
            className="flex h-8 items-center gap-1.5 rounded-s-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-all hover:brightness-110"
          >
            <FileDown size={15} />
            <span className="hidden lg:inline">{t('action.exportPdf')}</span>
          </button>
          <Menu
            trigger={({ toggle }) => (
              <button
                type="button"
                onClick={toggle}
                aria-label={t('header.moreExports')}
                className="flex h-8 w-7 items-center justify-center rounded-e-lg border-s border-white/20 bg-primary text-primary-foreground transition-all hover:brightness-110"
              >
                <ChevronDown size={14} />
              </button>
            )}
          >
            {(close) => (
              <>
                <MenuItem icon={<Download size={16} />} hint="⌘S" onClick={() => { close(); props.onExportPdf() }}>
                  {t('action.exportPdf')}
                </MenuItem>
                <MenuItem icon={<Printer size={16} />} hint="⌘P" onClick={() => { close(); props.onPrintPreview() }}>
                  {t('action.printPreview')}
                </MenuItem>
                <div className="my-1 h-px bg-border" />
                <MenuItem icon={<FileType2 size={16} />} onClick={() => { close(); props.onExportWord() }}>
                  {t('action.exportWord')}
                </MenuItem>
                <MenuItem icon={<FileCode2 size={16} />} onClick={() => { close(); props.onExportHtml() }}>
                  {t('action.exportHtml')}
                </MenuItem>
                <MenuItem icon={<FileText size={16} />} onClick={() => { close(); props.onExportMarkdown() }}>
                  {t('action.exportMarkdown')}
                </MenuItem>
              </>
            )}
          </Menu>
        </div>

        <div className="mx-0.5 hidden h-6 w-px bg-border sm:block" />

        <div className="flex items-center rounded-xl bg-muted/40 p-0.5">
          <span className="lg:hidden">
            <Menu
              trigger={({ toggle }) => (
                <Tooltip label={t('action.more')}>
                  <button
                    type="button"
                    aria-label={t('action.more')}
                    onClick={toggle}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-surface/70 hover:text-foreground active:scale-90 motion-reduce:active:scale-100"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </Tooltip>
              )}
            >
              {(close) => (
                <>
                  <MenuItem
                    icon={<Search size={16} />}
                    onClick={() => {
                      close()
                      props.onOpenCommand()
                    }}
                  >
                    {t('action.search')}
                  </MenuItem>
                  <div className="my-1 h-px bg-border" />
                  <MenuItem icon={<Pencil size={16} />} onClick={() => { close(); setRenameOpen(true) }}>
                    {t('action.rename')}
                  </MenuItem>
                  <MenuItem icon={<ListTree size={16} />} onClick={() => { close(); props.onToggleOutline() }}>
                    {t('action.outline')}
                  </MenuItem>
                  <div className="sm:hidden">
                    <MenuItem icon={<TIcon size={16} />} onClick={() => { close(); props.onCycleTheme() }}>
                      {t('command.cycleTheme')}
                    </MenuItem>
                  </div>
                  <div className="sm:hidden">
                    <MenuItem icon={<FolderOpen size={16} />} onClick={() => { close(); props.onOpenDocuments() }}>
                      {t('action.documents')}
                    </MenuItem>
                  </div>
                  <div className="sm:hidden">
                    <MenuItem icon={<FileText size={16} />} onClick={() => { close(); props.onOpenTemplates() }}>
                      {t('action.templates')}
                    </MenuItem>
                  </div>
                  <div className="sm:hidden">
                    <MenuItem icon={<ShieldCheck size={16} />} onClick={() => { close(); props.onOpenSecurity() }}>
                      {t('action.security')}
                    </MenuItem>
                  </div>
                  <div className="md:hidden">
                    <MenuItem icon={<Palette size={16} />} onClick={() => { close(); props.onOpenThemes() }}>
                      {t('action.themes')}
                    </MenuItem>
                  </div>
                  <div className="md:hidden">
                    <MenuItem icon={<Import size={16} />} onClick={() => { close(); props.onImport() }}>
                      {t('action.import')}
                    </MenuItem>
                  </div>
                  <div className="md:hidden">
                    <MenuItem icon={<Maximize2 size={16} />} onClick={() => { close(); props.onToggleZen() }}>
                      {t('action.focusMode')}
                    </MenuItem>
                  </div>
                  <div className="md:hidden">
                    <MenuItem
                      icon={<GraduationCap size={16} />}
                      onClick={() => { close(); toggleMode() }}
                    >
                      {isSimple ? t('mode.toStandard') : t('mode.toSimple')}
                    </MenuItem>
                  </div>
                  <div className="lg:hidden">
                    <MenuItem icon={<Github size={16} />} onClick={() => { close(); props.onImportGithub() }}>
                      {t('action.importGithub')}
                    </MenuItem>
                  </div>
                  <div className="lg:hidden">
                    <MenuItem icon={<BookOpen size={16} />} onClick={() => { close(); props.onOpenFormattingHelp() }}>
                      {t('action.formattingHelp')}
                    </MenuItem>
                  </div>
                  <div className="lg:hidden">
                    <MenuItem icon={<Keyboard size={16} />} onClick={() => { close(); props.onShortcuts() }}>
                      {t('action.shortcuts')}
                    </MenuItem>
                  </div>
                </>
              )}
            </Menu>
          </span>
          <IconAction label={t('action.ai')} onClick={props.onOpenAi}>
            <span className="relative">
              <Sparkles size={16} className={props.aiActive ? 'text-primary' : undefined} />
              {props.aiActive && (
                <span className="absolute -end-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-1 ring-surface" />
              )}
            </span>
          </IconAction>
          <span className="hidden sm:inline-flex">
            <IconAction label={t('action.security')} onClick={props.onOpenSecurity}>
              {props.secured ? (
                <ShieldCheck size={16} className="text-emerald-500" />
              ) : (
                <Shield size={16} />
              )}
            </IconAction>
          </span>
          <span className="hidden md:inline-flex">
            <IconAction label={t('action.focusMode')} onClick={props.onToggleZen}>
              <Maximize2 size={16} />
            </IconAction>
          </span>
          <span className="hidden md:inline-flex">
            <IconAction
              label={isSimple ? t('mode.toStandard') : t('mode.toSimple')}
              onClick={toggleMode}
              active={isSimple}
              pressed={isSimple}
            >
              <GraduationCap size={16} />
            </IconAction>
          </span>
          <span className="hidden lg:inline-flex">
            <IconAction label={t('action.formattingHelp')} onClick={props.onOpenFormattingHelp}>
              <BookOpen size={16} />
            </IconAction>
          </span>
          <span className="hidden lg:inline-flex">
            <IconAction label={`${t('action.shortcuts')}  (⌘/)`} onClick={props.onShortcuts}>
              <Keyboard size={16} />
            </IconAction>
          </span>
          <IconAction
            label={props.uiLang === 'ar' ? t('lang.toEnglish') : t('lang.toArabic')}
            onClick={props.onToggleLang}
          >
            <span className="relative">
              <Languages size={16} />
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[7px] font-bold uppercase leading-none">
                {props.uiLang === 'ar' ? 'ع' : 'EN'}
              </span>
            </span>
          </IconAction>
          <span className="hidden sm:inline-flex">
            <IconAction label={`Theme: ${props.themeMode}`} onClick={props.onCycleTheme}>
              <TIcon size={16} />
            </IconAction>
          </span>
          <IconAction
            label={t('action.settings')}
            onClick={props.onToggleConfig}
            active={props.configOpen}
            pressed={props.configOpen}
          >
            {props.configOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </IconAction>
        </div>
      </div>

      <Dialog
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        title={t('action.rename')}
        size="sm"
        footer={
          <Button variant="primary" onClick={() => setRenameOpen(false)}>
            {t('ai.dashboard.done')}
          </Button>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setRenameOpen(false)
          }}
        >
          <Field label={t('header.docTitleAria')}>
            <TextInput
              value={props.title}
              onChange={(e) => props.onTitleChange(e.target.value)}
              placeholder={t('title.untitled')}
              autoFocus
            />
          </Field>
        </form>
      </Dialog>
    </header>
  )
}
