import { useEffect, useState } from 'react'

import { setTableColumnWidth } from '@/model/commands'
import type { TableBlock } from '@/model/types'

type ColumnDrag = {
  column: number
  startX: number
  startWidth: number
}

export const useTableColumnResize = (
  block: TableBlock,
  onChange: (block: TableBlock) => void,
) => {
  const [columnDrag, setColumnDrag] = useState<ColumnDrag | null>(null)

  useEffect(() => {
    if (!columnDrag) return
    const onMouseMove = (event: globalThis.MouseEvent) => {
      onChange(
        setTableColumnWidth(
          block,
          columnDrag.column,
          columnDrag.startWidth + event.clientX - columnDrag.startX,
        ),
      )
    }
    const onMouseUp = () => setColumnDrag(null)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [block, columnDrag, onChange])

  return { setColumnDrag }
}
