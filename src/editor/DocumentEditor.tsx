import { BlockEditorSurface } from './surface/BlockEditorSurface'
import { EditorImageDialogs } from './surface/EditorImageDialogs'
import { useBlockEditorInteractions } from './input/useBlockEditorInteractions'
import { useEditorImageUpload } from './session/useEditorImageUpload'
import { useBlockEditorModel } from './session/useBlockEditorModel'
import type { DocumentEditorProps } from './types'
import './styles/documentEditor.css'

export const DocumentEditor = ({
  value,
  onChange,
  readOnly = false,
  disabled = false,
  placeholder = '输入正文',
  className,
  onSaveShortcut,
  imageDrafts = new Map(),
  onImageDraftCreate,
  onImageDraftRelease,
}: DocumentEditorProps) => {
  const model = useBlockEditorModel(value, onChange)
  const imageUpload = useEditorImageUpload({
    model,
    imageDrafts,
    onDraftCreate: onImageDraftCreate,
    onDraftRelease: onImageDraftRelease,
  })
  const interactions = useBlockEditorInteractions(
    model,
    readOnly,
    onSaveShortcut,
    () => imageUpload.setError('不支持粘贴图片，请使用“上传图片”按钮'),
  )

  return (
    <>
      <BlockEditorSurface
        className={className}
        disabled={disabled}
        imageUpload={imageUpload}
        interactions={interactions}
        model={model}
        placeholder={placeholder}
        readOnly={readOnly}
      />
      <EditorImageDialogs disabled={disabled} imageUpload={imageUpload} />
    </>
  )
}
