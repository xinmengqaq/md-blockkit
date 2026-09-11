import { Plus } from 'lucide-react'

import type { EditorBlock } from '@/model/types'
import { BlockInsertMenu } from '../chrome/BlockInsertMenu'
import { BlockToolbar } from '../chrome/BlockToolbar'
import type { BlockEditorInteractions } from '../input/useBlockEditorInteractions'
import {
  isEmptyEditorBlock,
  type BlockEditorModel,
} from '../session/useBlockEditorModel'
import type { EditorImageUpload } from '../session/useEditorImageUpload'
import { EditorBlockContent } from './EditorBlockContent'

type EditorBlockRowProps = {
  block: EditorBlock
  disabled: boolean
  imageUpload: EditorImageUpload
  index: number
  interactions: BlockEditorInteractions
  model: BlockEditorModel
  placeholder?: string
  readOnly: boolean
  selectedImageBlockId?: string
  onClearSelectedImage: () => void
  onSelectImage: (blockId: string, anchor: HTMLElement) => void
}

export const EditorBlockRow = ({
  block,
  disabled,
  imageUpload,
  index,
  interactions,
  model,
  placeholder,
  readOnly,
  selectedImageBlockId,
  onClearSelectedImage,
  onSelectImage,
}: EditorBlockRowProps) => {
  const deleteBlock = () => {
    if (block.type === 'image') {
      imageUpload.setRemoveBlock(block)
      return
    }
    model.deleteToolbarBlock(block.id)
  }

  return (
    <div
      className={`block-editor__block${model.selectedBlockIds.includes(block.id) ? ' is-multi-selected' : ''}`}
      data-selected={model.selectedBlockIds.includes(block.id) || undefined}
      data-block-id={block.id}
    >
      {!readOnly ? (
        <>
          <BlockToolbar
            block={block}
            disabled={disabled}
            disableDelete={
              model.blocks.length === 1 && isEmptyEditorBlock(block)
            }
            disableMoveDown={index === model.blocks.length - 1}
            disableMoveUp={index === 0}
            open={model.toolbarBlockId === block.id}
            selected={model.selectedBlockIds.includes(block.id)}
            onClose={() => model.setToolbarBlockId(null)}
            onConvert={(choice) => {
              if (choice.type === 'image') {
                model.setToolbarBlockId(null)
                imageUpload.openInsert(block.id)
                return
              }
              model.convertToolbarBlock(block.id, choice)
            }}
            onDelete={deleteBlock}
            onDuplicate={() => model.duplicateToolbarBlock(block.id)}
            onInsert={(type) => model.insertToolbarBlock(block.id, type)}
            onMove={(direction) => model.moveToolbarBlock(block.id, direction)}
            onToggle={(modifiers) => {
              if (
                modifiers.ctrlKey ||
                modifiers.metaKey ||
                modifiers.shiftKey
              ) {
                model.setToolbarBlockId(null)
                model.setInsertAfterId(null)
                interactions.dismissTextToolbar()
                model.setShortcutDrawerOpen(false)
                model.selectBlock(
                  block.id,
                  modifiers.shiftKey ? 'range' : 'toggle',
                )
                return
              }
              model.clearBlockSelection()
              onClearSelectedImage()
              model.setInsertAfterId(null)
              interactions.dismissTextToolbar()
              model.setShortcutDrawerOpen(false)
              model.setToolbarBlockId((current) =>
                current === block.id ? null : block.id,
              )
            }}
          />
          <button
            aria-expanded={model.insertAfterId === block.id}
            aria-label="在此块后插入"
            className="block-editor__insert-button"
            disabled={disabled}
            title="插入内容块"
            type="button"
            onClick={() => {
              model.setToolbarBlockId(null)
              interactions.dismissTextToolbar()
              model.setShortcutDrawerOpen(false)
              model.setInsertAfterId((current) =>
                current === block.id ? null : block.id,
              )
            }}
          >
            <Plus aria-hidden="true" />
          </button>
        </>
      ) : null}
      <div className="block-editor__block-content">
        <EditorBlockContent
          block={block}
          interactions={interactions}
          model={model}
          placeholder={placeholder}
          readOnly={readOnly}
          selectedImageBlockId={selectedImageBlockId}
          onSelectImage={(blockId, anchor) => {
            model.setInsertAfterId(null)
            model.setToolbarBlockId(null)
            interactions.dismissTextToolbar()
            onSelectImage(blockId, anchor)
          }}
        />
      </div>
      {model.insertAfterId === block.id ? (
        <BlockInsertMenu
          disabled={disabled}
          onClose={() => {
            model.setInsertAfterId(null)
            model.focusBlock(block.id)
          }}
          onSelect={(choice) => {
            if (choice.type === 'image') {
              model.setInsertAfterId(null)
              imageUpload.openInsert(block.id)
              return
            }
            model.insertBlock(choice)
          }}
        />
      ) : null}
    </div>
  )
}
