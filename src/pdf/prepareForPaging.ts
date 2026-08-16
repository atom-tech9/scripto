import { chunkCodeBlocks } from './chunkCodeBlocks'
import { stackWideTables } from './stackWideTables'
import type { PdfConfig } from '@/types'

/**
 * Every DOM transform the export applies before handing a document to the
 * paginator. Kept in one place so the visual regression suite can run exactly
 * what the export runs, rather than a re-implementation that can drift.
 */
export function prepareForPaging(root: HTMLElement, config: PdfConfig): void {
  chunkCodeBlocks(root, config)
  stackWideTables(root)
}
