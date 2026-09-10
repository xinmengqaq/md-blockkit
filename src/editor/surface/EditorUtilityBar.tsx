import { ImageUp, Keyboard } from 'lucide-react'

import { parseMarkdownToBlocks } from '@/markdown/parseMarkdown'
import { serializeBlocksToMarkdown } from '@/markdown/serializeMarkdown'
import { MarkdownImportControl } from '../chrome/MarkdownImportControl'
import type { BlockEditorInteractions } from '../input/useBlockEditorInteractions'
import type { BlockEditorModel } from '../session/useBlockEditorModel'
import type { EditorImageUpload } from '../session/useEditorImageUpload'

type EditorUtilityBarProps = {
  disabled: boolean
  imageUpload: EditorImageUpload
  interactions: BlockEditorInteractions
  model: BlockEditorModel
}

export const EditorUtilityBar = ({
  disabled,
  imageUpload,
  interactions,
  model,
}: EditorUtilityBarProps) => {
  const openImageAtCaret = () => {
    const active = document.activeElement
    const block =
      active instanceof HTMLElement
        ? active.closest<HTMLElement>('[data-block-id]')
        : null
    imageUpload.openInsert(
      block?.dataset.blockId ??
        model.lastFocusedBlockIdRef.current ??
        undefined,
    )
  }

  const openShortcutDrawer = () => {
    model.setToolbarBlockId(null)
    model.setInsertAfterId(null)
    interactions.dismissTextToolbar()
    model.setShortcutDrawerOpen((current) => !current)
  }

  return (
    <div className="block-editor__utility-bar">
      <MarkdownImportControl
        currentContent={serializeBlocksToMarkdown(model.blocks)}
        disabled={disabled}
        onImport={(content) => model.commit(parseMarkdownToBlocks(content))}
      />
      <button
        aria-label="上传图片"
        disabled={disabled}
        title="上传图片"
        type="button"
        onClick={openImageAtCaret}
      >
        <ImageUp aria-hidden="true" />
      </button>
      <button
        aria-expanded={model.shortcutDrawerOpen}
        aria-label="打开快捷键概览"
        title="快捷键概览"
        type="button"
        onClick={openShortcutDrawer}
      >
        <Keyboard aria-hidden="true" />
      </button>
    </div>
  )
}
