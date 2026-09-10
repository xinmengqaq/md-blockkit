import type { MouseEvent as ReactMouseEvent } from 'react'

import type { BlockEditorInteractions } from '../input/useBlockEditorInteractions'
import { useBlockSelectionDrag } from '../session/useBlockSelectionDrag'
import type { BlockEditorModel } from '../session/useBlockEditorModel'
import type { EditorImageUpload } from '../session/useEditorImageUpload'
import { useSelectedEditorImage } from '../session/useSelectedEditorImage'
import type { DocumentEditorProps } from '../types'
import { EditorBlockRow } from './EditorBlockRow'
import { EditorFloatingLayers } from './EditorFloatingLayers'
import { EditorUtilityBar } from './EditorUtilityBar'

const cx = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(' ')

type BlockEditorSurfaceProps = Pick<
  DocumentEditorProps,
  'readOnly' | 'disabled' | 'placeholder' | 'className'
> & {
  model: BlockEditorModel
  interactions: BlockEditorInteractions
  imageUpload: EditorImageUpload
}

export const BlockEditorSurface = ({
  readOnly = false,
  disabled = false,
  placeholder = '输入正文',
  className,
  model,
  interactions,
  imageUpload,
}: BlockEditorSurfaceProps) => {
  const selectedImage = useSelectedEditorImage(model)
  const selectionDrag = useBlockSelectionDrag(!readOnly && !disabled)

  const applyDraggedSelection = (blockIds: string[] | null | undefined) => {
    if (!blockIds) return
    model.clearBlockSelection()
    blockIds.forEach((blockId) => model.selectBlock(blockId, 'toggle'))
  }

  return (
    <div
      ref={model.editorRef}
      aria-label="块状 Markdown 编辑器"
      className={cx(
        'block-editor',
        readOnly && 'block-editor--readonly',
        className,
      )}
      onBlur={() => {
        requestAnimationFrame(model.handleEditorBlur)
      }}
      onClickCapture={selectionDrag.onClickCapture}
      onFocus={() => {
        model.focusedRef.current = true
      }}
      onFocusCapture={(event) => {
        const target = event.target as HTMLElement
        const block = target.closest<HTMLElement>('[data-block-id]')
        if (block?.dataset.blockId) {
          model.lastFocusedBlockIdRef.current = block.dataset.blockId
        }
      }}
      onContextMenu={(event: ReactMouseEvent<HTMLDivElement>) =>
        interactions.openTextToolbarOnContextMenu(event)
      }
      onKeyDown={(event) => {
        if (event.key === 'Escape' && model.selectedBlockIds.length) {
          event.preventDefault()
          model.clearBlockSelection()
          return
        }
        interactions.editorKeyDown(event)
      }}
      onMouseDown={(event) => {
        const target = event.target as HTMLElement
        if (
          model.selectedBlockIds.length &&
          target.closest('[data-editor-input]') &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.shiftKey
        ) {
          model.clearBlockSelection()
        }
        interactions.openTextToolbarOnRightMouseDown(event)
      }}
      onPointerCancel={selectionDrag.onPointerCancel}
      onPointerDown={(event) => {
        if (selectionDrag.onPointerDown(event)) model.clearBlockSelection()
      }}
      onPointerMove={(event) =>
        applyDraggedSelection(selectionDrag.onPointerMove(event))
      }
      onPointerUp={(event) =>
        applyDraggedSelection(selectionDrag.onPointerUp(event))
      }
      onPaste={interactions.pasteBlocks}
    >
      {selectionDrag.selectionRect ? (
        <div
          aria-hidden="true"
          className="block-editor__selection-rect"
          style={selectionDrag.selectionRect}
        />
      ) : null}
      {!readOnly ? (
        <EditorUtilityBar
          disabled={disabled}
          imageUpload={imageUpload}
          interactions={interactions}
          model={model}
        />
      ) : null}
      <div className="block-editor__document">
        {model.blocks.map((block, index) => (
          <EditorBlockRow
            key={block.id}
            block={block}
            disabled={disabled}
            imageUpload={imageUpload}
            index={index}
            interactions={interactions}
            model={model}
            placeholder={
              model.blocks[0]?.id === block.id ? placeholder : undefined
            }
            readOnly={readOnly}
            selectedImageBlockId={selectedImage.selection?.blockId}
            onClearSelectedImage={selectedImage.clear}
            onSelectImage={selectedImage.select}
          />
        ))}
      </div>
      {!readOnly ? (
        <EditorFloatingLayers
          disabled={disabled}
          imageUpload={imageUpload}
          interactions={interactions}
          model={model}
          selectedImage={selectedImage}
        />
      ) : null}
    </div>
  )
}
