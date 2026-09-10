import {
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  memo,
  useMemo,
  useRef,
} from 'react'
import { Plus } from 'lucide-react'

import {
  getTableCellAreas,
  getTableDimensions,
  insertTableColumn,
  insertTableRow,
  setTableCellsAlignment,
} from '@/model/commands'
import type { TableBlock as TableBlockType, TextAlign } from '@/model/types'
import { TableToolbar } from '../../chrome/TableToolbar'
import { preserveEditorCaretAfterUpdate } from '../../input/dom'
import { useTableColumnResize } from './useTableColumnResize'
import { useTableMenu } from './useTableMenu'
import { useTableSelection } from './useTableSelection'

type TableBlockProps = {
  block: TableBlockType
  readOnly: boolean
  onChange: (block: TableBlockType) => void
  onDelete: () => void
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void
}

const TableBlockComponent = ({
  block,
  readOnly,
  onChange,
  onDelete,
  onKeyDown,
}: TableBlockProps) => {
  const wrapRef = useRef<HTMLDivElement>(null)
  const composingCellRef = useRef<string | null>(null)
  const selection = useTableSelection(block)
  const { setColumnDrag } = useTableColumnResize(block, onChange)
  const areas = useMemo(() => getTableCellAreas(block), [block])
  const dimensions = useMemo(() => getTableDimensions(block), [block])
  const activeArea =
    areas.find((area) => area.cell.id === selection.activeId) ?? areas[0]
  const activeCell = activeArea?.cell
  const menu = useTableMenu({
    block,
    activeRow: activeArea?.row,
    activeColumn: activeArea?.column,
    activeCellId: activeArea?.cell.id,
    selectedIds: selection.selectedIds,
    setSelectedIds: selection.setSelectedIds,
    setActiveId: selection.setActiveId,
    onChange,
    onDelete,
  })

  const commitCell = (cellId: string, editable: HTMLElement) =>
    preserveEditorCaretAfterUpdate(editable, () =>
      onChange({
        ...block,
        rows: block.rows.map((currentRow) =>
          currentRow.map((currentCell) =>
            currentCell.id === cellId
              ? { ...currentCell, html: editable.innerHTML }
              : currentCell,
          ),
        ),
      }),
    )

  const handleCellKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.nativeEvent.isComposing) {
      onKeyDown(event)
      return
    }
    if (
      (event.ctrlKey || event.metaKey) &&
      event.key === 'Enter' &&
      activeArea
    ) {
      event.preventDefault()
      onChange(
        insertTableRow(
          block,
          activeArea.row,
          event.shiftKey ? 'before' : 'after',
        ),
      )
      return
    }
    if (event.key === 'Tab') {
      const inputs = Array.from(
        wrapRef.current?.querySelectorAll<HTMLElement>(
          '[data-table-cell-input]',
        ) ?? [],
      )
      const index = inputs.indexOf(event.currentTarget)
      const nextIndex = event.shiftKey ? index - 1 : index + 1
      if (inputs[nextIndex]) {
        event.preventDefault()
        inputs[nextIndex].focus()
      }
    }
    onKeyDown(event)
  }

  const handleContextMenu = (event: ReactMouseEvent, cellId: string) => {
    event.preventDefault()
    if (selection.selectedIds.includes(cellId)) {
      selection.setActiveId(cellId)
      menu.setMenuOpen(true)
      return
    }
    selection.selectCell(cellId, event.shiftKey, true)
    menu.setMenuOpen(true)
  }

  return (
    <div ref={wrapRef} className="block-editor__table-wrap">
      <div className="block-editor__table-scroll">
        <table className="block-editor__table">
          {block.columnWidths.some(Boolean) ? (
            <colgroup>
              {Array.from({ length: dimensions.columns }, (_, index) => {
                const width = block.columnWidths[index]
                return <col key={index} style={width ? { width } : undefined} />
              })}
            </colgroup>
          ) : null}
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell) => {
                  const Cell = block.hasHeader && rowIndex === 0 ? 'th' : 'td'
                  return (
                    <Cell
                      key={cell.id}
                      className={
                        selection.selectedIds.includes(cell.id)
                          ? 'is-selected'
                          : undefined
                      }
                      colSpan={cell.colspan}
                      rowSpan={cell.rowspan}
                      style={{ textAlign: cell.align }}
                      onClick={(event) =>
                        !readOnly &&
                        selection.selectCell(cell.id, event.shiftKey)
                      }
                      onContextMenu={(event) =>
                        !readOnly && handleContextMenu(event, cell.id)
                      }
                    >
                      <span
                        className="block-editor__editable"
                        contentEditable={!readOnly}
                        data-editor-input
                        data-table-cell-input
                        onInput={(event) => {
                          if (composingCellRef.current !== cell.id) {
                            commitCell(cell.id, event.currentTarget)
                          }
                        }}
                        onCompositionStart={() => {
                          composingCellRef.current = cell.id
                        }}
                        onCompositionEnd={(event) => {
                          composingCellRef.current = null
                          commitCell(cell.id, event.currentTarget)
                        }}
                        onKeyDown={handleCellKeyDown}
                        suppressContentEditableWarning
                        dangerouslySetInnerHTML={{ __html: cell.html }}
                      />
                    </Cell>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!readOnly ? (
        <>
          <div className="block-editor__table-row-controls" aria-hidden="false">
            {Array.from({ length: dimensions.rows + 1 }, (_, index) => (
              <button
                key={index}
                aria-label={
                  index === 0 ? '在第 1 行上方插入' : `在第 ${index} 行下方插入`
                }
                className="block-editor__table-edge-button"
                style={{ top: `${(index / dimensions.rows) * 100}%` }}
                title="插入行"
                type="button"
                onClick={() =>
                  onChange(
                    insertTableRow(
                      block,
                      Math.max(0, index - 1),
                      index === 0 ? 'before' : 'after',
                    ),
                  )
                }
              >
                <Plus aria-hidden="true" />
              </button>
            ))}
          </div>
          <div className="block-editor__table-column-controls">
            {Array.from({ length: dimensions.columns }, (_, index) => (
              <button
                key={index}
                aria-label={`在第 ${index + 1} 列右侧插入`}
                className="block-editor__table-edge-button"
                style={{ left: `${((index + 1) / dimensions.columns) * 100}%` }}
                title="插入列"
                type="button"
                onClick={() =>
                  onChange(insertTableColumn(block, index, 'after'))
                }
              >
                <Plus aria-hidden="true" />
              </button>
            ))}
          </div>
          <div className="block-editor__table-resize-controls">
            {Array.from({ length: dimensions.columns }, (_, index) => (
              <div
                key={index}
                aria-label={`调整第 ${index + 1} 列宽度`}
                aria-orientation="vertical"
                className="block-editor__table-resize-handle"
                role="separator"
                style={{ left: `${((index + 1) / dimensions.columns) * 100}%` }}
                tabIndex={0}
                onMouseDown={(event) => {
                  event.preventDefault()
                  setColumnDrag({
                    column: index,
                    startX: event.clientX,
                    startWidth:
                      Number.parseInt(block.columnWidths[index] ?? '', 10) ||
                      160,
                  })
                }}
              />
            ))}
          </div>
          {menu.menuOpen && activeCell ? (
            <TableToolbar
              alignment={activeCell.align}
              canMerge={selection.selectedIds.length > 1}
              canSplit={activeCell.rowspan > 1 || activeCell.colspan > 1}
              hasHeader={block.hasHeader}
              onAction={menu.runAction}
              onAlignment={(alignment: TextAlign) => {
                onChange(
                  setTableCellsAlignment(
                    block,
                    selection.selectedIds,
                    alignment,
                  ),
                )
                menu.closeMenu()
              }}
              onToggleHeader={() => {
                onChange({ ...block, hasHeader: !block.hasHeader })
                menu.closeMenu()
              }}
            />
          ) : null}
        </>
      ) : null}
    </div>
  )
}

export const TableBlock = memo(
  TableBlockComponent,
  (previous, next) =>
    previous.block === next.block && previous.readOnly === next.readOnly,
)
