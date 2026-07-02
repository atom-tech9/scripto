declare module 'pagedjs' {
  export interface PagedFlow {
    total: number
    performance: number
    pages: unknown[]
  }

  export class Previewer {
    constructor(options?: unknown)
    preview(
      content: HTMLElement | string | undefined,
      stylesheets: Array<Record<string, string> | string>,
      renderTo: HTMLElement,
    ): Promise<PagedFlow>
    on(event: string, handler: (...args: unknown[]) => void): void
  }

  export class Handler {}
  export function registerHandlers(...handlers: unknown[]): void
}

declare module 'turndown-plugin-gfm' {
  import type TurndownService from 'turndown'
  export const gfm: TurndownService.Plugin
  export const tables: TurndownService.Plugin
  export const strikethrough: TurndownService.Plugin
  export const taskListItems: TurndownService.Plugin
}
