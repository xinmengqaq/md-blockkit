import type { TableBlock } from '@/model/types'
import { createTableCell } from '@/model/factories'
import {
  cellCovers,
  getTableCellAreas,
  getTableDimensions,
  normalizeColumnWidths,
  rebuildTableRows,
} from './geometry'

export const insertTableRow = (
  table: TableBlock,
  rowIndex: number,
  placement: 'before' | 'after',
): TableBlock => {
  const dimensions = getTableDimensions(table)
  const index = Math.max(
    0,
    Math.min(rowIndex + (placement === 'after' ? 1 : 0), dimensions.rows),
  )
  const areas = getTableCellAreas(table).map((area) => {
    if (area.row < index && area.row + area.cell.rowspan > index) {
      return { ...area, cell: { ...area.cell, rowspan: area.cell.rowspan + 1 } }
    }
    return area.row >= index ? { ...area, row: area.row + 1 } : area
  })
  for (let column = 0; column < dimensions.columns; column += 1) {
    if (!areas.some((area) => cellCovers(area, index, column))) {
      areas.push({
        cell: createTableCell(),
        row: index,
        column,
        sourceRow: index,
        sourceColumn: column,
      })
    }
  }
  return rebuildTableRows(table, areas, dimensions.rows + 1)
}

export const insertTableColumn = (
  table: TableBlock,
  columnIndex: number,
  placement: 'before' | 'after',
): TableBlock => {
  const dimensions = getTableDimensions(table)
  const index = Math.max(
    0,
    Math.min(columnIndex + (placement === 'after' ? 1 : 0), dimensions.columns),
  )
  const areas = getTableCellAreas(table).map((area) => {
    if (area.column < index && area.column + area.cell.colspan > index) {
      return { ...area, cell: { ...area.cell, colspan: area.cell.colspan + 1 } }
    }
    return area.column >= index ? { ...area, column: area.column + 1 } : area
  })
  for (let row = 0; row < dimensions.rows; row += 1) {
    if (!areas.some((area) => cellCovers(area, row, index))) {
      areas.push({
        cell: createTableCell(),
        row,
        column: index,
        sourceRow: row,
        sourceColumn: index,
      })
    }
  }
  const next = rebuildTableRows(table, areas, dimensions.rows)
  next.columnWidths = [
    ...normalizeColumnWidths(table.columnWidths, dimensions.columns).slice(
      0,
      index,
    ),
    '',
    ...normalizeColumnWidths(table.columnWidths, dimensions.columns).slice(
      index,
    ),
  ]
  return next
}

export const deleteTableRow = (
  table: TableBlock,
  rowIndex: number,
): TableBlock => {
  const dimensions = getTableDimensions(table)
  if (dimensions.rows <= 1) {
    return table
  }
  const index = Math.max(0, Math.min(rowIndex, dimensions.rows - 1))
  const areas = getTableCellAreas(table).flatMap((area) => {
    const end = area.row + area.cell.rowspan
    if (area.row === index) {
      return area.cell.rowspan > 1
        ? [{ ...area, cell: { ...area.cell, rowspan: area.cell.rowspan - 1 } }]
        : []
    }
    if (area.row < index && end > index) {
      return [
        { ...area, cell: { ...area.cell, rowspan: area.cell.rowspan - 1 } },
      ]
    }
    return [area.row > index ? { ...area, row: area.row - 1 } : area]
  })
  return rebuildTableRows(table, areas, dimensions.rows - 1)
}

export const deleteTableColumn = (
  table: TableBlock,
  columnIndex: number,
): TableBlock => {
  const dimensions = getTableDimensions(table)
  if (dimensions.columns <= 1) {
    return table
  }
  const index = Math.max(0, Math.min(columnIndex, dimensions.columns - 1))
  const areas = getTableCellAreas(table).flatMap((area) => {
    const end = area.column + area.cell.colspan
    if (area.column === index) {
      return area.cell.colspan > 1
        ? [{ ...area, cell: { ...area.cell, colspan: area.cell.colspan - 1 } }]
        : []
    }
    if (area.column < index && end > index) {
      return [
        { ...area, cell: { ...area.cell, colspan: area.cell.colspan - 1 } },
      ]
    }
    return [area.column > index ? { ...area, column: area.column - 1 } : area]
  })
  const next = rebuildTableRows(table, areas, dimensions.rows)
  next.columnWidths = normalizeColumnWidths(
    table.columnWidths,
    dimensions.columns,
  ).filter((_, widthIndex) => widthIndex !== index)
  return next
}

export const setTableColumnWidth = (
  table: TableBlock,
  columnIndex: number,
  width: number,
): TableBlock => {
  const columns = getTableDimensions(table).columns
  if (columnIndex < 0 || columnIndex >= columns) return table
  const widths = normalizeColumnWidths(table.columnWidths, columns)
  widths[columnIndex] = `${Math.max(80, Math.min(640, Math.round(width)))}px`
  return { ...table, columnWidths: widths }
}
