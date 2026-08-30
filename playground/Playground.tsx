import { useCallback, useState } from 'react'

import {
  BlockMarkdownEditor,
  releaseImageDraft,
  type ImageDraft,
} from '../src'

const SAMPLE = `# 块编辑器

在这里写正文。选中文字会出现工具条。

- 列表项
- 再一项

> 引用也可以。

\`\`\`ts
const hello = 'world'
\`\`\`
`

export const Playground = () => {
  const [value, setValue] = useState(SAMPLE)
  const [drafts, setDrafts] = useState(() => new Map<string, ImageDraft>())

  const registerDraft = useCallback((draft: ImageDraft) => {
    setDrafts((current) => {
      const next = new Map(current)
      next.set(draft.previewUrl, draft)
      return next
    })
  }, [])

  const releaseDraft = useCallback((previewUrl: string) => {
    setDrafts((current) => {
      const draft = current.get(previewUrl)
      if (draft) releaseImageDraft(draft)
      const next = new Map(current)
      next.delete(previewUrl)
      return next
    })
  }, [])

  return (
    <main className="playground">
      <header className="playground__header">
        <h1>Block Markdown Editor</h1>
        <p>受控 Markdown。图片先变成本地草稿，上传由宿主处理。</p>
      </header>
      <section className="playground__editor">
        <BlockMarkdownEditor
          imageDrafts={drafts}
          onChange={setValue}
          onImageDraftCreate={registerDraft}
          onImageDraftRelease={releaseDraft}
          placeholder="输入正文"
          value={value}
        />
      </section>
      <section className="playground__markdown">
        <h2>当前 Markdown</h2>
        <pre>{value}</pre>
      </section>
    </main>
  )
}
