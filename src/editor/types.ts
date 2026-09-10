import type { ImageDraft } from '@/images/types'

export type DocumentEditorProps = {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
  onSaveShortcut?: () => void
  imageDrafts?: ReadonlyMap<string, ImageDraft>
  onImageDraftCreate?: (draft: ImageDraft) => void
  onImageDraftRelease?: (previewUrl: string) => void
}
