import './styles/variables.css'
import './styles/syntax-highlight.css'

export { DocumentEditor } from './editor'
export type { DocumentEditorProps } from './editor'
export type { ImageDraft } from './images/types'
export {
  createImageDraft,
  getImageDraftUrl,
  releaseAllImageDrafts,
  releaseImageDraft,
} from './images/drafts'
