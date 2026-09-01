import type { DocumentSkin } from '@/types'
import type { StageDescriptor } from './types'

/**
 * The 21 stages — one per document skin, as DATA.
 *
 * A stage is "the room the document sits in": ground, texture, lighting and a
 * motion signature. Everything visual is screen-only and lives in `stage.css`
 * keyed by `[data-stage='<skin>']`; this file only names the pieces.
 *
 * Typed as `Record<DocumentSkin, StageDescriptor>` so `tsc` proves all 21
 * exist — adding a skin without a stage is a compile error.
 */
export const STAGES: Record<DocumentSkin, StageDescriptor> = {
  // 1 · Studio — soft neutral gradient, a sheet floating on layered lift.
  modern: { skin: 'modern', nameKey: 'stage.studio', motion: 'rise', tone: 'light', frame: [] },

  // 2 · Library — warm cream and faint grain; the sheet reads as a bound page.
  classic: {
    skin: 'classic',
    nameKey: 'stage.library',
    motion: 'wipe',
    tone: 'light',
    frame: ['spine'],
  },

  // 3 · Spread — accent colour-field with the title set huge behind the sheet.
  editorial: {
    skin: 'editorial',
    nameKey: 'stage.spread',
    motion: 'wipe',
    tone: 'light',
    frame: [],
    mark: 'title',
  },

  // 4 · Spec bench — cool slate, isometric grid, registration ticks and rulers.
  technical: {
    skin: 'technical',
    nameKey: 'stage.specBench',
    motion: 'draw',
    tone: 'light',
    frame: ['ticks'],
  },

  // 5 · Contact sheet — tight, dense, snug frame with minimal air.
  compact: {
    skin: 'compact',
    nameKey: 'stage.contactSheet',
    motion: 'snap',
    tone: 'light',
    frame: [],
  },

  // 6 · Typewriter desk — warm paper-bag ground, fibre texture, platen shadow.
  manuscript: {
    skin: 'manuscript',
    nameKey: 'stage.typewriterDesk',
    motion: 'type',
    tone: 'light',
    frame: ['platen'],
  },

  // 7 · Drafting table — deep cyan blueprint grid, white sheet, title block.
  blueprint: {
    skin: 'blueprint',
    nameKey: 'stage.draftingTable',
    motion: 'draw',
    tone: 'dark',
    frame: ['title-block'],
  },

  // 8 · Boardroom — clean cool ground with an accent band across the stage top.
  corporate: {
    skin: 'corporate',
    nameKey: 'stage.boardroom',
    motion: 'rise',
    tone: 'light',
    frame: ['accent-band'],
  },

  // 9 · Concrete — flat raw ground, hard zero-blur offset shadow, thick border.
  brutalist: {
    skin: 'brutalist',
    nameKey: 'stage.concrete',
    motion: 'snap',
    tone: 'light',
    frame: [],
  },

  // 10 · Desk — ruled lines behind the sheet, spiral edge, red margin rule.
  notebook: {
    skin: 'notebook',
    nameKey: 'stage.desk',
    motion: 'spring',
    tone: 'light',
    frame: ['spiral', 'margin-rule'],
  },

  // 11 · Folder — very clean neutral with a manila tab peeking behind the sheet.
  resume: {
    skin: 'resume',
    nameKey: 'stage.folder',
    motion: 'rise',
    tone: 'light',
    frame: ['tab'],
  },

  // 12 · Grid wall — a visible modular grid with interval markers.
  swiss: { skin: 'swiss', nameKey: 'stage.gridWall', motion: 'cascade', tone: 'light', frame: [] },

  // 13 · CRT — near-black, phosphor vignette, scanlines, glowing panel edge.
  terminal: {
    skin: 'terminal',
    nameKey: 'stage.crt',
    motion: 'type',
    tone: 'dark',
    frame: ['edge-glow'],
  },

  // 14 · Press — warm grey halftone dots, CMYK registration marks at the corners.
  newsprint: {
    skin: 'newsprint',
    nameKey: 'stage.press',
    motion: 'bloom',
    tone: 'light',
    frame: ['registration'],
  },

  // 15 · Gallery — deep ink ground, soft centred spotlight, hairline frame.
  elegant: { skin: 'elegant', nameKey: 'stage.gallery', motion: 'bloom', tone: 'dark', frame: [] },

  // 16 · Sticker board — bright pastel blobs, rounded corners, chunky shadow.
  playful: {
    skin: 'playful',
    nameKey: 'stage.stickerBoard',
    motion: 'spring',
    tone: 'light',
    frame: [],
  },

  // 17 · Night desk — true dark with an ambient accent glow and a luminous border.
  dark: {
    skin: 'dark',
    nameKey: 'stage.nightDesk',
    motion: 'glow',
    tone: 'dark',
    frame: ['edge-glow'],
  },

  // 18 · Accounting desk — muted ledger green, fine ruled columns in the gutter.
  ledger: {
    skin: 'ledger',
    nameKey: 'stage.accountingDesk',
    motion: 'cascade',
    tone: 'light',
    frame: ['gutter-rules'],
  },

  // 19 · Void — almost nothing. Very soft light, no frame, a pure fade.
  zen: { skin: 'zen', nameKey: 'stage.void', motion: 'rise', tone: 'light', frame: [] },

  // 20 · Interoffice — flat institutional ground, header band, ghost "INTERNAL"
  //      mark on the STAGE (never on the paper, which would ship into the PDF).
  memo: {
    skin: 'memo',
    nameKey: 'stage.interoffice',
    motion: 'stamp',
    tone: 'light',
    frame: ['header-band'],
    mark: 'internal',
  },

  // 21 · Gallery wall — dramatic ground with a spotlight cone and a big sheet.
  poster: {
    skin: 'poster',
    nameKey: 'stage.galleryWall',
    motion: 'bloom',
    tone: 'dark',
    frame: [],
  },

  // 22 · Billing desk — ruled ledger paper, figures aligned to the gutter.
  invoice: {
    skin: 'invoice',
    nameKey: 'stage.billingDesk',
    motion: 'cascade',
    tone: 'light',
    frame: ['gutter-rules'],
  },

  // 23 · Chambers — sober panelled ground, nothing to distract from the terms.
  contract: {
    skin: 'contract',
    nameKey: 'stage.chambers',
    motion: 'rise',
    tone: 'light',
    frame: [],
  },

  // 24 · Writing desk — warm paper, a single accent rule across the head.
  letter: {
    skin: 'letter',
    nameKey: 'stage.writingDesk',
    motion: 'wipe',
    tone: 'light',
    frame: ['accent-band'],
  },

  // 25 · Reading room — quiet paper stock under an even library light.
  journal: {
    skin: 'journal',
    nameKey: 'stage.readingRoom',
    motion: 'rise',
    tone: 'light',
    frame: [],
  },

  // 26 · Study — deep calm ground with a soft pool of lamplight.
  thesis: {
    skin: 'thesis',
    nameKey: 'stage.study',
    motion: 'bloom',
    tone: 'light',
    frame: [],
  },

  // 27 · Release board — dark board with faint version rules.
  changelog: {
    skin: 'changelog',
    nameKey: 'stage.releaseBoard',
    motion: 'cascade',
    tone: 'dark',
    frame: [],
  },

  // 28 · Review table — cool working surface with registration ticks.
  rfc: {
    skin: 'rfc',
    nameKey: 'stage.reviewTable',
    motion: 'draw',
    tone: 'light',
    frame: ['ticks'],
  },

  // 29 · Lecture hall — clean board with a bold banner across the top.
  handout: {
    skin: 'handout',
    nameKey: 'stage.lectureHall',
    motion: 'stamp',
    tone: 'light',
    frame: ['header-band'],
  },
}

/** The stage for a skin. Falls back to the default stage for unknown values. */
export function stageFor(skin: DocumentSkin): StageDescriptor {
  return STAGES[skin] ?? STAGES.modern
}
