import { FileImage, RotateCcw, RotateCw, ZoomIn } from 'lucide-react'

import { Button } from '@/components/ui'

import { MAX_CONTENT_ASPECT, MIN_CONTENT_ASPECT } from './cropConfig'

type CropSidebarProps = {
  aspect: number
  zoom: number
  rotation: number
  contentAspect: number
  previewSource: string | null
  error: string | null
  onZoomChange: (zoom: number) => void
  onRotationChange: (rotation: number) => void
  onContentAspectChange: (aspect: number) => void
  onReset: () => void
}

export const CropSidebar = ({
  aspect,
  zoom,
  rotation,
  contentAspect,
  previewSource,
  error,
  onZoomChange,
  onRotationChange,
  onContentAspectChange,
  onReset,
}: CropSidebarProps) => (
  <aside className="image-crop-dialog__sidebar" aria-label="裁剪设置和预览">
    <div className="image-crop-dialog__controls">
      <label className="image-crop-dialog__control">
        <span>
          <ZoomIn aria-hidden="true" /> 缩放
          <output>{Math.round(zoom * 100)}%</output>
        </span>
        <input
          aria-label="缩放"
          max="3"
          min="1"
          onChange={(event) => onZoomChange(Number(event.target.value))}
          step="0.01"
          type="range"
          value={zoom}
        />
      </label>
      <label className="image-crop-dialog__control">
        <span>
          <RotateCw aria-hidden="true" /> 旋转
          <output>{rotation}°</output>
        </span>
        <input
          aria-label="旋转"
          max="180"
          min="-180"
          onChange={(event) => onRotationChange(Number(event.target.value))}
          step="1"
          type="range"
          value={rotation}
        />
      </label>
      <label className="image-crop-dialog__control">
        <span>
          <FileImage aria-hidden="true" /> 自由比例
          <output>{contentAspect.toFixed(2)}:1</output>
        </span>
        <input
          aria-label="正文图片比例"
          max={MAX_CONTENT_ASPECT}
          min={MIN_CONTENT_ASPECT}
          onChange={(event) =>
            onContentAspectChange(Number(event.target.value))
          }
          step="0.01"
          type="range"
          value={contentAspect}
        />
      </label>
      <Button icon={<RotateCcw />} onClick={onReset} variant="secondary">
        重置
      </Button>
    </div>
    <div className="image-crop-dialog__preview-section">
      <span className="image-crop-dialog__preview-title">裁剪预览</span>
      <div
        className="image-crop-dialog__preview image-crop-dialog__preview--content"
        style={{ aspectRatio: aspect }}
      >
        {previewSource ? (
          <img src={previewSource} alt="裁剪结果预览" />
        ) : null}
      </div>
      {error ? <p className="image-crop-dialog__error">{error}</p> : null}
    </div>
  </aside>
)
