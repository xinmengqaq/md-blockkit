import { BlockSelectionToolbar } from '../chrome/BlockSelectionToolbar'
import { SelectedImageToolbar } from '../chrome/SelectedImageToolbar'
import { ShortcutDrawer } from '../chrome/ShortcutDrawer'
import { TextToolbar } from '../chrome/TextToolbar'
import {
  clearSelectionFormatting,
  removeSelectionLink,
  setSelectionStyle,
  toggleInlineTag,
} from '../input/dom'
import type { BlockEditorInteractions } from '../input/useBlockEditorInteractions'
import type { BlockEditorModel } from '../session/useBlockEditorModel'
import type { EditorImageUpload } from '../session/useEditorImageUpload'

type EditorFloatingLayersProps = {
  disabled: boolean
  imageUpload: EditorImageUpload
  interactions: BlockEditorInteractions
  model: BlockEditorModel
  selectedImage: {
    selection: { anchor: HTMLElement; blockId: string } | null
    clear: () => void
  }
}

export const EditorFloatingLayers = ({
  disabled,
  imageUpload,
  interactions,
  model,
  selectedImage,
}: EditorFloatingLayersProps) => (
  <>
    {model.selectedBlockIds.length ? (
      <BlockSelectionToolbar
        count={model.selectedBlockIds.length}
        disabled={disabled}
        onClose={model.clearBlockSelection}
        onDelete={model.deleteSelectedBlocks}
        onParagraph={model.convertSelectedToParagraph}
        onFormat={model.formatSelected}
      />
    ) : null}
    {interactions.textSelection ? (
      <TextToolbar
        selection={interactions.textSelection}
        onClearFormat={() =>
          interactions.runTextCommand(clearSelectionFormatting)
        }
        onClose={interactions.dismissTextToolbar}
        onRemoveLink={() => interactions.runTextCommand(removeSelectionLink)}
        onSetLink={interactions.setTextLink}
        onSetStyle={(property, color) =>
          interactions.runTextCommand((selection) =>
            setSelectionStyle(selection, property, color),
          )
        }
        onToggleFormat={(format) =>
          interactions.runTextCommand((selection) =>
            toggleInlineTag(selection, format),
          )
        }
      />
    ) : null}
    {model.shortcutDrawerOpen ? (
      <ShortcutDrawer onClose={() => model.setShortcutDrawerOpen(false)} />
    ) : null}
    {selectedImage.selection ? (
      <SelectedImageToolbar
        anchor={selectedImage.selection.anchor}
        blockId={selectedImage.selection.blockId}
        disabled={disabled}
        imageUpload={imageUpload}
        model={model}
        onClose={selectedImage.clear}
      />
    ) : null}
  </>
)
