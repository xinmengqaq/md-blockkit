import { useEffect, useState } from 'react'

import {
  clearTableCells,
  deleteTableColumn,
  deleteTableRow,
  insertTableColumn,
  insertTableRow,
  mergeTableCells,
  splitTableCell,
} from '@/model/commands'
import type { TableBlock } from '@/model/types'

type TableAction =
  | 'insert-row-before'
  | 'insert-row-after'
  | 'insert-column-before'
  | 'insert-column-after'
  | 'delete-row'
  | 'delete-column'
  | 'merge'
  | 'split'
  | 'clear'
  | 'delete-table'

type TableMenuOptions = {
  block: TableBlock
  activeRow?: number
  activeColumn?: number
  activeCellId?: string
  selectedIds: string[]
  setSelectedIds: (ids: string[]) => void
  setActiveId: (id: string | null) => void
  onChange: (block: TableBlock) => void
  onDelete: () => void
}

export const useTableMenu = ({
  block,
  activeRow,
  activeColumn,
  activeCellId,
  selectedIds,
  setSelectedIds,
  setActiveId,
  onChange,
  onDelete,
}: TableMenuOptions) => {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return

    const closeMenuOnOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest('.block-editor__table-menu')) return
      setMenuOpen(false)
    }
    const closeMenuOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      setMenuOpen(false)
    }
    document.addEventListener(
      'pointerdown',
      closeMenuOnOutsidePointerDown,
      true,
    )
    document.addEventListener('keydown', closeMenuOnEscape, true)
    return () => {
      document.removeEventListener(
        'pointerdown',
        closeMenuOnOutsidePointerDown,
        true,
      )
      document.removeEventListener('keydown', closeMenuOnEscape, true)
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)
  const updateAndClose = (next: TableBlock) => {
    onChange(next)
    closeMenu()
  }

  const runAction = (action: TableAction) => {
    if (activeRow === undefined || activeColumn === undefined || !activeCellId)
      return
    switch (action) {
      case 'insert-row-before':
        updateAndClose(insertTableRow(block, activeRow, 'before'))
        break
      case 'insert-row-after':
        updateAndClose(insertTableRow(block, activeRow, 'after'))
        break
      case 'insert-column-before':
        updateAndClose(insertTableColumn(block, activeColumn, 'before'))
        break
      case 'insert-column-after':
        updateAndClose(insertTableColumn(block, activeColumn, 'after'))
        break
      case 'delete-row':
        updateAndClose(deleteTableRow(block, activeRow))
        break
      case 'delete-column':
        updateAndClose(deleteTableColumn(block, activeColumn))
        break
      case 'merge': {
        const next = mergeTableCells(block, selectedIds)
        const firstId = selectedIds[0]
        setSelectedIds(firstId ? [firstId] : [])
        setActiveId(firstId ?? null)
        updateAndClose(next)
        break
      }
      case 'split':
        updateAndClose(splitTableCell(block, activeCellId))
        break
      case 'clear':
        updateAndClose(clearTableCells(block, selectedIds))
        break
      case 'delete-table':
        closeMenu()
        onDelete()
        break
    }
  }

  return { menuOpen, setMenuOpen, closeMenu, runAction }
}
