export type { EditorSelection } from './selectionRange'
export {
  commitEditorSelection,
  createRangeReference,
  getEditorSelection,
  resolveEditorSelection,
  splitEditorAtCaret,
} from './selectionRange'
export {
  preserveEditorCaretAfterUpdate,
  selectEditorWordAtPoint,
} from './caret'
export {
  clearSelectionFormatting,
  normalizeEditorLink,
  removeSelectionLink,
  setSelectionLink,
  setSelectionStyle,
  toggleInlineTag,
} from './inlineFormat'
