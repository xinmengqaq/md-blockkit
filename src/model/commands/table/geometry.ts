import type { TableBlock, TableCell } from '@/model/types'

export const normalizeColumnWidths = (widths: string[], columns: number) =>
  Array.from({ length: columns }, (_, index) => widths[index] ?? '')

export type TableCellArea = {
  cell: TableCell
  row: number
  column: number
  sourceRow: number
  sourceColumn: number
}

export const getTableCellAreas = (table: TableBlock): TableCellArea[] => {
  const occupied: boolean[][] = []
  const areas: TableCellArea[] = []

  table.rows.forEach((row, rowIndex) => {
    occupied[rowIndex] ??= []
    let column = 0
    row.forEach((cell, sourceColumn) => {
      while (occupied[rowIndex][column]) column += 1
      areas.push({
        cell,
        row: rowIndex,
        column,
        sourceRow: rowIndex,
        sourceColumn,
      })
      for (let rowOffset = 0; rowOffset < cell.rowspan; rowOffset += 1) {
        occupied[rowIndex + rowOffset] ??= []
        for (
          let columnOffset = 0;
          columnOffset < cell.colspan;
          columnOffset += 1
        ) {
          occupied[rowIndex + rowOffset][column + columnOffset] = true
        }
      }
      column += cell.colspan
    })
  })

  return areas
}

export const getTableDimensions = (table: TableBlock) => {
  const areas = getTableCellAreas(table)
  return {
    rows: Math.max(
      table.rows.length,
      ...areas.map((area) => area.row + area.cell.rowspan),
      1,
    ),
    columns: Math.max(
      ...areas.map((area) => area.column + area.cell.colspan),
      1,
    ),
  }
}

export const rebuildTableRows = (
  table: TableBlock,
  areas: TableCellArea[],
  rowCount: number,
): TableBlock => {
  const rows = Array.from(
    { length: Math.max(rowCount, 1) },
    () => [] as TableCell[],
  )
  areas
    .sort((left, right) => left.row - right.row || left.column - right.column)
    .forEach((area) => rows[area.row]?.push(area.cell))
  return { ...table, rows }
}

export const cellCovers = (area: TableCellArea, row: number, column: number) =>
  row >= area.row &&
  row < area.row + area.cell.rowspan &&
  column >= area.column &&
  column < area.column + area.cell.colspan
