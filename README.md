<div align="center">

# md-blockkit

块状文档编辑器。标题、列表、图片、表格按块来写。

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![React](https://img.shields.io/badge/react-%3E%3D18-61DAFB?logo=react&logoColor=222)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/typescript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

</div>

## 项目简介

`md-blockkit` 是一个可以嵌进 React 页面的文档编辑器。屏幕上按块来写：标题、列表、图片、表格等。

## 展示

<p align="center">
  <img src="./img/preview.png" alt="md-blockkit 编辑界面" width="100%" />
</p>

块工具条、文字格式、表格和图片裁剪都在编辑区内完成。

## 核心能力

| 模块          | 说明                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| 块类型        | 段落、标题、引用、有序/无序/任务列表、代码、图片、表格、分割线。                                       |
| 工具条        | 移动、删除、转换块；给文字加格式；改表格和图片。                                                       |
| 导入 Markdown | 选择`.md` 文件写入当前文档。已有正文时会确认覆盖。图片、Wiki 图和 callout 图按导入规则去掉或转成文字。 |
| 图片          | 选文件、裁剪、再裁、更换、对齐、宽度、说明文字。GIF 保留动画，不裁剪。                                 |
| 外观          | CSS 变量，可改颜色和圆角。                                                                             |

当前不支持粘贴或拖入图片。

## 快速开始

包尚未发布到 npm，可从本地目录安装：

```bash
npm install file:../md-blockkit
```

需要 `react` 与 `react-dom` `>= 18`。

```tsx
import { useState } from 'react'
import { DocumentEditor } from 'md-blockkit'
import 'md-blockkit/style.css'

export function App() {
  const [doc, setDoc] = useState('# Hello\n\n开始写正文。')

  return <DocumentEditor value={doc} onChange={setDoc} placeholder="输入正文" />
}
```

不传图片参数也可以写文字。这时插进去的图只是浏览器临时地址（`blob:`），刷新页面会丢失。

本地调试：

```bash
npm install
npm run dev
```

## 图片

编辑器负责选图、裁剪，以及在页面里预览。它不会去传文件，也不会在保存文档时顺手处理图片。

插图之后会拿到一份 `ImageDraft`：里面有原文件、裁完的数据，还有写进文档里的预览地址。要不要上传、什么时候上传、传到哪里，都和保存文档分开做。

支持 JPG、JPEG、PNG、WebP、GIF。

```tsx
import { useCallback, useState } from 'react'
import { DocumentEditor, releaseImageDraft, type ImageDraft } from 'md-blockkit'
import 'md-blockkit/style.css'

export function App() {
  const [doc, setDoc] = useState('')
  const [drafts, setDrafts] = useState(() => new Map<string, ImageDraft>())

  const onImageDraftCreate = useCallback((draft: ImageDraft) => {
    setDrafts((current) => new Map(current).set(draft.previewUrl, draft))
    // 若要把文件存到自己的服务，在这里处理 draft.uploadBlob。
    // 不要和保存整篇文档捆在一起。
  }, [])

  const onImageDraftRelease = useCallback((previewUrl: string) => {
    setDrafts((current) => {
      const draft = current.get(previewUrl)
      if (draft) releaseImageDraft(draft)
      const next = new Map(current)
      next.delete(previewUrl)
      return next
    })
  }, [])

  return (
    <DocumentEditor
      value={doc}
      onChange={setDoc}
      imageDrafts={drafts}
      onImageDraftCreate={onImageDraftCreate}
      onImageDraftRelease={onImageDraftRelease}
    />
  )
}
```

`imageDrafts` 用来记住本地图，方便重新裁剪。图片被换掉、删掉，或页面关掉时调用 `releaseImageDraft`，否则预览用的 object URL 不会被释放。

如果上传完成后希望文档里写成线上地址，再单独改对应的 `previewUrl`。这不是保存文档的一部分。

`ImageDraft`：

| 字段           | 说明                        |
| -------------- | --------------------------- |
| `id`           | 草稿 id                     |
| `originalFile` | 选中的原文件                |
| `uploadBlob`   | 裁完的静态图，或 GIF 原文件 |
| `previewUrl`   | 写进文档的本地预览地址      |
| `type`         | `'static'` 或 `'gif'`       |
| `alt`          | 可选                        |

## 组件怎么用

编辑器不发网络请求。

### `<DocumentEditor />`

| Prop                  | Type                              | Default      | Description                       |
| --------------------- | --------------------------------- | ------------ | --------------------------------- |
| `readOnly`            | `boolean`                         | `false`      | 只读                              |
| `disabled`            | `boolean`                         | `false`      | 禁用编辑和图片操作                |
| `placeholder`         | `string`                          | `'输入正文'` | 空文档时的提示                    |
| `className`           | `string`                          |              | 根节点 class                      |
| `onSaveShortcut`      | `() => void`                      |              | 按下`Ctrl+S` / `Cmd+S`            |
| `imageDrafts`         | `ReadonlyMap<string, ImageDraft>` | `new Map()`  | 本地图片表，用`previewUrl` 当 key |
| `onImageDraftCreate`  | `(draft: ImageDraft) => void`     |              | 裁完图或确认 GIF 之后             |
| `onImageDraftRelease` | `(previewUrl: string) => void`    |              | 图片被替换或删除时                |

`onSaveShortcut` 只表示按下了保存快捷键，不会上传图片，也不会替页面写文件。

### Helpers

```ts
createImageDraft(file: File, uploadBlob?: Blob, alt?: string): ImageDraft
getImageDraftUrl(draft: ImageDraft): string
releaseImageDraft(draft: ImageDraft): void
releaseAllImageDrafts(drafts: ImageDraft[]): void
```

表格支持 GFM。图片的对齐和宽度会写成 HTML：

```html
<p style="text-align:center"><img src="..." alt="..." style="width:80%" /></p>
```

行内支持加粗、斜体、下划线、删除线、链接，以及白名单内的文字色 / 背景色。

## 主题

引入 `md-blockkit/style.css` 后覆盖 CSS 变量：

```css
:root {
  --color-primary: #292826;
  --color-accent: #a7543a;
  --color-text: #2b2a28;
  --color-text-muted: #706d68;
  --color-surface: #ffffff;
  --color-border: #dfded9;
  --color-danger: #b63b3b;
  --radius-md: 4px;
}
```

完整变量见 [`src/styles/variables.css`](./src/styles/variables.css)。

## 快捷键

| Keys                                 | Action               |
| ------------------------------------ | -------------------- |
| `Ctrl+S`                             | `onSaveShortcut`     |
| `Ctrl+Z` / `Ctrl+Shift+Z` / `Ctrl+Y` | 撤销 / 重做          |
| `Ctrl+B` / `I` / `U`                 | 加粗 / 斜体 / 下划线 |
| `Ctrl+Shift+X`                       | 删除线               |
| `Ctrl+K`                             | 链接                 |
| `Alt+↑` / `Alt+↓`                    | 移动当前块           |
| `Delete`                             | 删除已选中的块       |
| `Enter`                              | 按光标拆分块         |
| `Shift+Enter`                        | 块内换行             |
| `Tab` / `Shift+Tab`                  | 列表缩进或表格单元格 |
| `Esc`                                | 关闭浮层             |

编辑器内可打开快捷键抽屉查看完整列表。

## 开发

```bash
npm install
npm run dev        # playground
npm run test:run
npm run typecheck
npm run lint
npm run build
```

### 目录约定

`src/` 按领域分层，依赖只能向下：

| 目录           | 职责                                            |
| -------------- | ----------------------------------------------- |
| `src/model`    | 块类型、工厂、命令、历史。无 React。            |
| `src/markdown` | Markdown ↔ 块。无 React 组件。                  |
| `src/html`     | HTML 净化、纯文本、行内 md↔html。               |
| `src/images`   | 图片草稿与裁剪弹层。                            |
| `src/editor`   | React 编辑器：会话、输入、画布、块 UI、工具条。 |
| `src/ui`       | 无业务的按钮 / 弹层 / Toast。                   |
| `src/styles`   | CSS 变量与代码高亮。                            |

公开 API 只从 `src/index.ts` 导出。测试在 `tests/`，按 `src` 领域分子目录，不与源码混放。

## 依赖

运行时用到的第三方库：

| 库                                                                                                                                                                                                                                                                                       | 用途                           |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| [React](https://react.dev/)                                                                                                                                                                                                                                                              | 界面。接入时需要自己安装 React |
| [unified](https://github.com/unifiedjs/unified) / [remark-parse](https://github.com/remarkjs/remark/tree/main/packages/remark-parse) / [remark-stringify](https://github.com/remarkjs/remark/tree/main/packages/remark-stringify) / [remark-gfm](https://github.com/remarkjs/remark-gfm) | Markdown 解析与序列化          |
| [DOMPurify](https://github.com/cure53/DOMPurify)                                                                                                                                                                                                                                         | 行内 HTML 净化                 |
| [react-easy-crop](https://github.com/ValentinH/react-easy-crop)                                                                                                                                                                                                                          | 图片裁剪                       |
| [@floating-ui/react-dom](https://github.com/floating-ui/floating-ui)                                                                                                                                                                                                                     | 工具条定位                     |
| [lucide-react](https://lucide.dev/)                                                                                                                                                                                                                                                      | 图标                           |
| [Prism](https://github.com/PrismJS/prism)                                                                                                                                                                                                                                                | 代码块高亮                     |
| [react-simple-code-editor](https://github.com/react-simple-code-editor/react-simple-code-editor)                                                                                                                                                                                         | 代码块编辑                     |
| [GSAP](https://github.com/greensock/GSAP) / [@gsap/react](https://github.com/greensock/react)                                                                                                                                                                                            | 弹层与提示动画                 |

开发构建另用 Vite、TypeScript、Vitest、ESLint、Prettier。

## 许可证

[MIT](./LICENSE)
