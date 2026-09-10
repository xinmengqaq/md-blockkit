import { Check } from 'lucide-react'
import Cropper from 'react-easy-crop'
import 'react-easy-crop/react-easy-crop.css'

import type { ImageDraft } from '@/images/types'
import { Button, Modal } from '@/ui'
import { CONTENT_CROP, formatFileSize } from './cropConfig'
import { CropCloseConfirm } from './CropCloseConfirm'
import { CropSidebar } from './CropSidebar'
import { useImageCropSession } from './useImageCropSession'
import './imageCropDialog.css'

type ImageCropDialogProps = {
  open: boolean
  file: File | null
  onClose: () => void
  onApply: (draft: ImageDraft) => void
}

export const ImageCropDialog = ({
  open,
  file,
  onClose,
  onApply,
}: ImageCropDialogProps) => {
  const session = useImageCropSession(open, file, onClose, onApply)

  if (!open || !file) return null

  const previewSource = session.previewUrl ?? session.sourceUrl

  if (session.confirmingClose) {
    return (
      <CropCloseConfirm
        onContinue={() => session.setConfirmingClose(false)}
        onDiscard={onClose}
      />
    )
  }

  if (session.isGif) {
    return (
      <Modal
        locked={session.applying}
        open
        title="确认正文 GIF"
        onClose={session.requestClose}
        panelClassName="image-crop-modal"
        footer={
          <>
            <Button onClick={session.requestClose} variant="secondary">
              取消
            </Button>
            <Button icon={<Check />} onClick={session.confirmGif}>
              确认 GIF
            </Button>
          </>
        }
      >
        <div className="image-crop-dialog image-crop-dialog--gif">
          <div className="image-crop-dialog__gif-preview">
            {session.sourceUrl ? (
              <img src={session.sourceUrl} alt="待确认的 GIF 动画" />
            ) : null}
          </div>
          <dl className="image-crop-dialog__file-info">
            <div>
              <dt>文件名</dt>
              <dd title={file.name}>{file.name}</dd>
            </div>
            <div>
              <dt>格式</dt>
              <dd>{file.type || 'image/gif'}</dd>
            </div>
            <div>
              <dt>大小</dt>
              <dd>{formatFileSize(file.size)}</dd>
            </div>
          </dl>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      locked={session.applying}
      open
      title={CONTENT_CROP.title}
      onClose={session.requestClose}
      panelClassName="image-crop-modal"
      footer={
        <>
          <Button
            disabled={session.applying}
            onClick={session.requestClose}
            variant="secondary"
          >
            取消
          </Button>
          <Button
            icon={<Check />}
            loading={session.applying}
            onClick={() => void session.applyStaticCrop()}
          >
            应用裁剪
          </Button>
        </>
      }
    >
      <div className="image-crop-dialog">
        <div className="image-crop-dialog__workspace">
          <div className="image-crop-dialog__canvas" aria-label="图片裁剪区域">
            {session.sourceUrl ? (
              <Cropper
                aspect={session.contentAspect}
                crop={session.crop}
                cropShape={CONTENT_CROP.cropShape}
                disableAutomaticStylesInjection
                image={session.sourceUrl}
                maxZoom={3}
                minZoom={1}
                onCropChange={session.setCrop}
                onCropComplete={(_, pixels) => session.setCroppedArea(pixels)}
                onMediaLoaded={session.handleMediaLoaded}
                onRotationChange={session.setRotation}
                onZoomChange={session.setZoom}
                rotation={session.rotation}
                showGrid={false}
                zoom={session.zoom}
              />
            ) : null}
          </div>
          <CropSidebar
            aspect={session.contentAspect}
            contentAspect={session.contentAspect}
            error={session.error}
            onContentAspectChange={session.setContentAspect}
            onReset={session.resetCrop}
            onRotationChange={session.setRotation}
            onZoomChange={session.setZoom}
            previewSource={previewSource}
            rotation={session.rotation}
            zoom={session.zoom}
          />
        </div>
      </div>
    </Modal>
  )
}
