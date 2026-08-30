export interface ImageDraft {
  id: string
  originalFile: File
  uploadBlob: Blob
  previewUrl: string
  type: 'static' | 'gif'
  alt?: string
}
