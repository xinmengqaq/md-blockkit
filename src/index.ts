import './styles/variables.css'
import './styles/syntax-highlight.css'

export { DocumentEditor } from './components/editor/document-editor'
export type { DocumentEditorProps } from './components/editor/document-editor'
export type { ImageDraft } from './types/file'
export {
  createImageDraft,
  getImageDraftUrl,
  releaseAllImageDrafts,
  releaseImageDraft,
} from './utils/imageDrafts'
