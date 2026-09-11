import DOMPurify from 'dompurify'

import type { TextAlign } from '@/model/types'

const alignments = new Set<TextAlign>(['left', 'center', 'right'])
const imageHtmlConfig = {
  ALLOWED_TAGS: ['p', 'img'],
  ALLOWED_ATTR: ['style', 'src', 'alt'],
  // 裁剪上传在宿主应用管理期间使用 blob 地址；图片缩放序列化时必须保留该地址，避免持久化后无法渲染。
  ALLOWED_URI_REGEXP:
    /^(?:(?:(?:https?|mailto|ftp|tel|callto|sms|cid|xmpp|blob):|data:image\/|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$)))/i,
}

export type AlignedImageHtml = {
  url: string
  alt: string
  align: TextAlign
  width: number
}

export const parseAlignedImageHtml = (
  html: string,
): AlignedImageHtml | null => {
  const clean = DOMPurify.sanitize(html, imageHtmlConfig)
  const document = new DOMParser().parseFromString(clean, 'text/html')
  const paragraph = document.body.firstElementChild
  if (
    document.body.children.length !== 1 ||
    paragraph?.tagName !== 'P' ||
    paragraph.children.length !== 1
  ) {
    return null
  }
  const image = paragraph.firstElementChild
  if (image?.tagName !== 'IMG') return null
  const alignment = paragraph
    .getAttribute('style')
    ?.match(/(?:^|;)\s*text-align\s*:\s*(left|center|right)\s*(?:;|$)/i)?.[1]
  // 宿主清理器可能移除默认左对齐样式，缺省时按左对齐回读，确保图片仍可渲染。
  const align = (alignment?.toLowerCase() ?? 'left') as TextAlign
  if (!alignments.has(align)) return null
  const widthValue = image
    .getAttribute('style')
    ?.match(/(?:^|;)\s*width\s*:\s*(100|[1-9]?\d)%\s*(?:;|$)/i)?.[1]
  const width = Number(widthValue)
  return {
    url: image.getAttribute('src') ?? '',
    alt: image.getAttribute('alt') ?? '',
    align,
    width: Number.isInteger(width) && width >= 1 && width <= 100 ? width : 100,
  }
}

const escapeAttribute = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')

export const serializeAlignedImageHtml = ({
  url,
  alt,
  align,
  width = 100,
}: AlignedImageHtml) =>
  DOMPurify.sanitize(
    `<p style="text-align:${align}"><img src="${escapeAttribute(url)}" alt="${escapeAttribute(alt)}"${width !== 100 ? ` style="width:${width}%"` : ''}></p>`,
    imageHtmlConfig,
  )
