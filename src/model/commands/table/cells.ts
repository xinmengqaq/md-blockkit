import type { TableBlock, TextAlign } from '@/model/types'
import { createTableCell } from '@/model/factories'
import {
  getTableCellAreas,
  getTableDimensions,
  rebuildTableRows,
} from './geometry'

export const setTableAlignment = (
  table: TableBlock,
  cellId: string,
  align: TextAlign,
): TableBlock => ({
  ...table,
  rows: table.rows.map((row) =>
    row.map((cell) => (cell.id === cellId ? { ...cell, align } : cell)),
  ),
})

export const getRectangularTableSelection = (
  table: TableBlock,
  anchorId: string,
  focusId: string,
) => {
  const areas = getTableCellAreas(table)
  const anchor = areas.find((area) => area.cell.id === anchorId)
  const focus = areas.find((area) => area.cell.id === focusId)
  if (!anchor || !focus) return [focusId]
  const top = Math.min(anchor.row, focus.row)
  const left = Math.min(anchor.column, focus.column)
  const bottom = Math.max(
    anchor.row + anchor.cell.rowspan,
    focus.row + focus.cell.rowspan,
  )
  const right = Math.max(
    anchor.column + anchor.cell.colspan,
    focus.column + focus.cell.colspan,
  )
  return areas
    .filter(
      (area) =>
        area.row < bottom &&
        area.row + area.cell.rowspan > top &&
        area.column < right &&
        area.column + area.cell.colspan > left,
    )
    .map((area) => area.cell.id)
}

export const mergeTableCells = (
  table: TableBlock,
  selectedIds: string[],
): TableBlock => {
  if (selectedIds.length < 2) return table
  const selected = getTableCellAreas(table).filter((area) =>
    selectedIds.includes(area.cell.id),
  )
  if (selected.length < 2) return table
  const top = Math.min(...selected.map((area) => area.row))
  const left = Math.min(...selected.map((area) => area.column))
  const bottom = Math.max(
    ...selected.map((area) => area.row + area.cell.rowspan),
  )
  const right = Math.max(
    ...selected.map((area) => area.column + area.cell.colspan),
  )
  const selectedArea = selected.reduce(
    (sum, area) => sum + area.cell.rowspan * area.cell.colspan,
    0,
  )
  if (selectedArea !== (bottom - top) * (right - left)) return table
  const anchor = selected.find(
    (area) => area.row === top && area.column === left,
  )
  if (!anchor) return table
  const ids = new Set(selectedIds)
  const areas = getTableCellAreas(table).flatMap((area) => {
    if (area.cell.id === anchor.cell.id) {
      return [
        {
          ...area,
          cell: {
            ...area.cell,
            rowspan: bottom - top,
            colspan: right - left,
          },
        },
      ]
    }
    return ids.has(area.cell.id) ? [] : [area]
  })
  return rebuildTableRows(table, areas, getTableDimensions(table).rows)
}

export const splitTableCell = (
  table: TableBlock,
  cellId: string,
): TableBlock => {
  const dimensions = getTableDimensions(table)
  const target = getTableCellAreas(table).find(
    (area) => area.cell.id === cellId,
  )
  if (!target || (target.cell.rowspan === 1 && target.cell.colspan === 1)) {
    return table
  }
  const areas = getTableCellAreas(table).map((area) =>
    area.cell.id === cellId
      ? { ...area, cell: { ...area.cell, rowspan: 1, colspan: 1 } }
      : area,
  )
  for (let row = target.row; row < target.row + target.cell.rowspan; row += 1) {
    for (
      let column = target.column;
      column < target.column + target.cell.colspan;
      column += 1
    ) {
      if (row === target.row && column === target.column) continue
      areas.push({
        cell: createTableCell(),
        row,
        column,
        sourceRow: row,
        sourceColumn: column,
      })
    }
  }
  return rebuildTableRows(table, areas, dimensions.rows)
}

export const setTableCellsAlignment = (
  table: TableBlock,
  cellIds: string[],
  align: TextAlign,
): TableBlock => ({
  ...table,
  rows: table.rows.map((row) =>
    row.map((cell) => (cellIds.includes(cell.id) ? { ...cell, align } : cell)),
  ),
})

export const clearTableCells = (
  table: TableBlock,
  cellIds: string[],
): TableBlock => ({
  ...table,
  rows: table.rows.map((row) =>
    row.map((cell) =>
      cellIds.includes(cell.id) ? { ...cell, html: '' } : cell,
    ),
  ),
})
