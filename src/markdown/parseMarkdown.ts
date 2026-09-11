import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'

import {
  createParagraphBlock,
  ensureNonEmptyDocument,
} from '@/model/blockModel'
import type { EditorBlock } from '@/model/types'
import type { MarkdownNode } from './ast'
import { nodeToBlocks } from './astToBlocks'
import { escapeMarkdownHtml } from './inlineToHtml'

export const parseMarkdownToBlocks = (markdown: string): EditorBlock[] => {
  try {
    const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown)
    const root = tree as unknown as MarkdownNode
    return ensureNonEmptyDocument(
      (root.children ?? []).flatMap((node) => nodeToBlocks(node)),
    )
  } catch {
    return [createParagraphBlock(escapeMarkdownHtml(markdown))]
  }
}
