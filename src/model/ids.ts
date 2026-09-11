let fallbackId = 0
let blockIdFactory: () => string = () =>
  globalThis.crypto?.randomUUID?.() ?? `block-${++fallbackId}`

export const setBlockIdFactory = (factory?: () => string) => {
  blockIdFactory =
    factory ??
    (() => globalThis.crypto?.randomUUID?.() ?? `block-${++fallbackId}`)
}

export const createBlockId = () => blockIdFactory()
