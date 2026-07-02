import yaml from 'js-yaml'
import { logger } from '@/lib/logger'
import { MARGIN_PRESETS } from '@/lib/constants'
import { SKIN_VALUES } from '@/data/skins'
import type {
  CoverStyle,
  DocumentFont,
  DocumentSkin,
  MarginPreset,
  PaperSize,
  PdfConfig,
  TextDirection,
} from '@/types'

export interface ParsedDocument {
  /** Raw front-matter object (empty when none present). */
  data: Record<string, unknown>
  /** Markdown body with the front-matter block removed. */
  body: string
  /** Whether a front-matter block was found. */
  hasFrontmatter: boolean
}

const FRONTMATTER_RE = /^﻿?---\r?\n([\s\S]*?)\r?\n---\r?\n?/

/**
 * Split a YAML front-matter block (`--- … ---`) from the Markdown body.
 * Front-matter is never shown in the preview but drives document metadata.
 */
export function parseFrontmatter(source: string): ParsedDocument {
  const match = FRONTMATTER_RE.exec(source)
  if (!match) return { data: {}, body: source, hasFrontmatter: false }

  try {
    const parsed = yaml.load(match[1])
    const data = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
    return { data, body: source.slice(match[0].length), hasFrontmatter: true }
  } catch (error) {
    logger.warn('Invalid YAML front-matter; ignoring', error)
    return { data: {}, body: source, hasFrontmatter: false }
  }
}

function asString(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.map(String).join(', ')
  return undefined
}

function asBool(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return ['true', 'yes', 'on', '1'].includes(value.toLowerCase())
  return undefined
}

const PAPER_VALUES: PaperSize[] = ['a3', 'a4', 'a5', 'letter', 'legal', 'custom']
const FONT_VALUES: DocumentFont[] = ['serif', 'sans', 'lora', 'system', 'arabic']
const DIRECTION_VALUES: TextDirection[] = ['auto', 'ltr', 'rtl']
const COVER_STYLE_VALUES: CoverStyle[] = ['minimal', 'banner', 'centered']
const MARGIN_VALUES: Array<Exclude<MarginPreset, 'custom'>> = ['narrow', 'normal', 'wide']

const HEX_COLOR_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

function asHexColor(value: unknown): string | undefined {
  const str = asString(value)?.trim()
  return str && HEX_COLOR_RE.test(str) ? str : undefined
}

/**
 * Merge recognised front-matter keys onto an export config. Front-matter wins so
 * a document can carry its own export settings, but unknown keys are ignored.
 */
export function applyFrontmatter(config: PdfConfig, data: Record<string, unknown>): PdfConfig {
  if (Object.keys(data).length === 0) return config

  const meta = {
    title: asString(data.title) ?? config.meta.title,
    author: asString(data.author) ?? config.meta.author,
    subject: asString(data.subject ?? data.description) ?? config.meta.subject,
    keywords: asString(data.keywords ?? data.tags) ?? config.meta.keywords,
    subtitle: asString(data.subtitle) ?? config.meta.subtitle,
    organization: asString(data.organization ?? data.org) ?? config.meta.organization,
    date: asString(data.date) ?? config.meta.date,
    version: asString(data.version) ?? config.meta.version,
    docType: asString(data.docType ?? data.doctype ?? data.type) ?? config.meta.docType,
  }

  const coverStyleRaw = asString(data.coverStyle ?? data.cover_style)?.toLowerCase()
  const coverStyle =
    coverStyleRaw && COVER_STYLE_VALUES.includes(coverStyleRaw as CoverStyle)
      ? (coverStyleRaw as CoverStyle)
      : undefined

  const paper = asString(data.paper ?? data.papersize)?.toLowerCase()
  const font = asString(data.font)?.toLowerCase()
  const skin = asString(data.skin)?.toLowerCase()
  const accent = asHexColor(data.accent ?? data.accentColor ?? data.accent_color)
  const marginName = asString(data.margins ?? data.margin)?.toLowerCase()
  const marginPreset =
    marginName && MARGIN_VALUES.includes(marginName as Exclude<MarginPreset, 'custom'>)
      ? (marginName as Exclude<MarginPreset, 'custom'>)
      : undefined

  // Direction & language. `dir`/`direction`/`rtl` set it explicitly; `lang: ar`
  // implies an RTL Arabic document unless overridden.
  const lang = asString(data.lang ?? data.language)?.toLowerCase()
  const isArabic = lang === 'ar' || (lang?.startsWith('ar-') ?? false)
  const dirRaw = asString(data.dir ?? data.direction)?.toLowerCase()
  let direction = config.direction
  if (dirRaw && DIRECTION_VALUES.includes(dirRaw as TextDirection)) {
    direction = dirRaw as TextDirection
  } else if (asBool(data.rtl) === true || isArabic) {
    direction = 'rtl'
  }

  const validFont =
    font && FONT_VALUES.includes(font as DocumentFont) ? (font as DocumentFont) : undefined
  const resolvedFont = validFont ?? (isArabic ? 'arabic' : config.font)

  return {
    ...config,
    meta,
    paperSize: paper && PAPER_VALUES.includes(paper as PaperSize) ? (paper as PaperSize) : config.paperSize,
    font: resolvedFont,
    direction,
    skin: skin && SKIN_VALUES.includes(skin as DocumentSkin) ? (skin as DocumentSkin) : config.skin,
    accentColor: accent ?? config.accentColor,
    marginPreset: marginPreset ?? config.marginPreset,
    margins: marginPreset ? MARGIN_PRESETS[marginPreset] : config.margins,
    tableOfContents: asBool(data.toc) ?? config.tableOfContents,
    numberedHeadings: asBool(data.numbered ?? data.numbering) ?? config.numberedHeadings,
    coverPage: asBool(data.cover) ?? config.coverPage,
    coverStyle: coverStyle ?? config.coverStyle,
    showPageNumbers: asBool(data.pageNumbers ?? data.page_numbers) ?? config.showPageNumbers,
    watermarkText: asString(data.watermark) ?? config.watermarkText,
  }
}
