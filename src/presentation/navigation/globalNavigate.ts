let _navigate: ((path: string, options?: { replace?: boolean }) => void) | null = null

export function setGlobalNavigate(fn: typeof _navigate) {
  _navigate = fn
}

export function navigateTo(path: string, options?: { replace?: boolean }) {
  _navigate?.(path, options)
}
