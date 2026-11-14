/**
 * Row count that fills the visible page without making the whole pane scroll.
 * `available`, `head` and `row` are pixels; the result is clamped so a bad
 * measurement can never render an empty or runaway table.
 */
export function fillingRowCount(available: number, head: number, row: number, minRows = 3, maxRows = 50) {
  if (![available, head, row].every((value) => Number.isFinite(value)) || row <= 0) return minRows;
  return Math.min(maxRows, Math.max(minRows, Math.floor((available - head) / row)));
}
