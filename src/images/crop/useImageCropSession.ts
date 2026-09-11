import { useCallback, useEffect, useRef, useState } from 'react'
import type { Area, MediaSize, Point } from 'react-easy-crop'

import { createImageDraft } from '@/images/drafts'
import type { ImageDraft } from '@/images/types'
import {
  clamp,
  DEFAULT_CONTENT_ASPECT,
  getOutputType,
  MAX_CONTENT_ASPECT,
  MIN_CONTENT_ASPECT,
} from './cropConfig'
import { createCroppedImageBlob } from './cropImage'

const INITIAL_CROP: Point = { x: 0, y: 0 }

export const useImageCropSession = (
  open: boolean,
  file: File | null,
  onClose: () => void,
  onApply: (draft: ImageDraft) => void,
) => {
  const [sourceUrl, setSourceUrl] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState<Point>(INITIAL_CROP)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [contentAspect, setContentAspect] = useState(DEFAULT_CONTENT_ASPECT)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)
  const [confirmingClose, setConfirmingClose] = useState(false)
  const previewUrlRef = useRef<string | null>(null)
  const hasSetInitialContentAspect = useRef(false)

  const clearPreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    setPreviewUrl(null)
  }, [])

  const requestClose = useCallback(() => {
    if (!applying) setConfirmingClose(true)
  }, [applying])

  const replacePreview = useCallback(
    (blob: Blob) => {
      const nextUrl = URL.createObjectURL(blob)
      clearPreview()
      previewUrlRef.current = nextUrl
      setPreviewUrl(nextUrl)
    },
    [clearPreview],
  )

  useEffect(() => {
    if (!open || !file) {
      setSourceUrl(null)
      return
    }
    const nextUrl = URL.createObjectURL(file)
    setSourceUrl(nextUrl)
    return () => URL.revokeObjectURL(nextUrl)
  }, [file, open])

  useEffect(() => {
    clearPreview()
    hasSetInitialContentAspect.current = false
    setCrop(INITIAL_CROP)
    setZoom(1)
    setRotation(0)
    setContentAspect(DEFAULT_CONTENT_ASPECT)
    setCroppedArea(null)
    setError(null)
    setApplying(false)
    setConfirmingClose(false)
  }, [clearPreview, file, open])

  useEffect(() => clearPreview, [clearPreview])

  const isGif = file?.type === 'image/gif'

  useEffect(() => {
    if (!open || !sourceUrl || isGif || !croppedArea || !file) return
    let cancelled = false
    void createCroppedImageBlob(
      sourceUrl,
      croppedArea,
      rotation,
      getOutputType(file.type),
    )
      .then((blob) => {
        if (!cancelled) {
          replacePreview(blob)
          setError(null)
        }
      })
      .catch(() => {
        if (!cancelled) setError('预览生成失败，请调整后重试')
      })
    return () => {
      cancelled = true
    }
  }, [croppedArea, file, isGif, open, replacePreview, rotation, sourceUrl])

  const resetCrop = () => {
    setCrop(INITIAL_CROP)
    setZoom(1)
    setRotation(0)
    setContentAspect(DEFAULT_CONTENT_ASPECT)
    setError(null)
  }

  const handleMediaLoaded = (mediaSize: MediaSize) => {
    if (hasSetInitialContentAspect.current) return
    hasSetInitialContentAspect.current = true
    setContentAspect(
      clamp(
        mediaSize.naturalWidth / mediaSize.naturalHeight,
        MIN_CONTENT_ASPECT,
        MAX_CONTENT_ASPECT,
      ),
    )
  }

  const applyStaticCrop = async () => {
    if (!file || !sourceUrl || !croppedArea) {
      setError('图片尚未准备完成，请稍后重试')
      return
    }
    setApplying(true)
    setError(null)
    try {
      const croppedBlob = await createCroppedImageBlob(
        sourceUrl,
        croppedArea,
        rotation,
        getOutputType(file.type),
      )
      onApply(createImageDraft(file, croppedBlob))
      onClose()
    } catch {
      setError('裁剪图片生成失败，请调整后重试')
    } finally {
      setApplying(false)
    }
  }

  const confirmGif = () => {
    if (!file) return
    onApply(createImageDraft(file))
    onClose()
  }

  return {
    sourceUrl,
    previewUrl,
    crop,
    setCrop,
    zoom,
    setZoom,
    rotation,
    setRotation,
    contentAspect,
    setContentAspect,
    setCroppedArea,
    error,
    applying,
    confirmingClose,
    setConfirmingClose,
    isGif,
    requestClose,
    resetCrop,
    handleMediaLoaded,
    applyStaticCrop,
    confirmGif,
  }
}
