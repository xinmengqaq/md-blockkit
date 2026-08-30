import './styles/variables.css'
import './styles/syntax-highlight.css'

export { BlockMarkdownEditor } from './components/editor/block-markdown-editor'
export type { BlockMarkdownEditorProps } from './components/editor/block-markdown-editor'
export type { ImageDraft } from './types/file'
export {
  createImageDraft,
  getImageDraftUrl,
  releaseAllImageDrafts,
  releaseImageDraft,
} from './utils/imageDrafts'
