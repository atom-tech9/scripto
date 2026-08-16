/**
 * Past a certain width, shrinking type stops helping: a 10+ column table gets
 * columns a couple of characters wide and becomes unreadable. Those tables are
 * turned into one labelled block per row instead, which is longer but legible.
 *
 * The labels have to be baked in as attributes here — CSS alone cannot copy a
 * header cell down into the body rows.
 */

/** Column count at which compaction gives up and rows are stacked. */
const STACK_AT_COLUMNS = 10

export function stackWideTables(root: HTMLElement): void {
  root.querySelectorAll<HTMLTableElement>('table').forEach((table) => {
    const headers = Array.from(table.querySelectorAll('thead th')).map(
      (th) => th.textContent?.trim() ?? '',
    )
    if (headers.length < STACK_AT_COLUMNS) return

    table.classList.add('table--stacked')
    table.querySelectorAll('tbody tr').forEach((row) => {
      Array.from(row.children).forEach((cell, index) => {
        const label = headers[index]
        if (label) (cell as HTMLElement).dataset.label = label
      })
    })
  })
}
