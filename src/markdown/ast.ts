import type { TextAlign } from '@/model/types'

export type MarkdownNode = {
  type: string
  value?: string
  depth?: number
  ordered?: boolean
  checked?: boolean | null
  lang?: string | null
  url?: string
  alt?: string | null
  align?: Array<TextAlign | null>
  children?: MarkdownNode[]
}
