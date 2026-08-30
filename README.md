# block-markdown-editor

可嵌入的 React 块状 Markdown 编辑器。对外是受控 Markdown 字符串，对内是块编辑。正文图片支持选择、裁剪（GIF 不裁）、重裁、替换、对齐和宽度。

从个人博客后台正文编辑器复制并解耦，不包含文章保存、封面、图库或上传接口。

## 安装

```bash
npm install
```

开发预览：

```bash
npm run dev
```

测试：

```bash
npm run test:run
```

## 嵌入

```tsx
import {
  BlockMarkdownEditor,
  releaseImageDraft,
  type ImageDraft,
} from 'block-markdown-editor'
import 'block-markdown-editor/style.css'

<BlockMarkdownEditor
  value={markdown}
  onChange={setMarkdown}
  imageDrafts={drafts}
  onImageDraftCreate={registerDraft}
  onImageDraftRelease={releaseDraft}
/>
```

图片在编辑器里只生成 `ImageDraft`（本地 blob / object URL）。宿主在自己的保存流程里上传 `draft.uploadBlob`，再把 Markdown 里的预览 URL 换成线上地址。

不传图片 props 也可以编辑文字；插入的图片会停在本地预览，刷新后丢失。

## 现有能力

- 段落、标题、引用、列表 / 待办、代码、图片、表格、分割线
- 块工具条、文字工具条、表格工具条、快捷键抽屉
- 正文图片裁剪与 GIF 原文件确认
- Markdown 解析 / 序列化（内部）

## 非目标

- 调用上传接口
- 文件库 / 头像 / 封面裁剪
- 粘贴或拖拽上传图片（当前会拒绝粘贴图片）
