import { useState } from 'react'

import { getRectangularTableSelection } from '@/model/commands'
import type { TableBlock } from '@/model/types'

export const useTableSelection = (block: TableBlock) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [anchorId, setAnchorId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  const selectCell = (cellId: string, extend: boolean, openMenu = false) => {
    const next =
      extend && anchorId
        ? getRectangularTableSelection(block, anchorId, cellId)
        : [cellId]
    setSelectedIds(next)
    setAnchorId((current) => (extend && current ? current : cellId))
    setActiveId(cellId)
    return openMenu
  }

  return {
    selectedIds,
    setSelectedIds,
    anchorId,
    activeId,
    setActiveId,
    selectCell,
  }
}
