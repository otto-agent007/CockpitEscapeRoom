export type Dc9MemphisLoadState =
  | { status: 'idle' }
  | { status: 'loading'; loadedBytes: number; totalBytes?: number; percentage?: number }
  | { status: 'ready'; loadedBytes: number; totalBytes?: number; percentage: 100 }
  | { status: 'error'; loadedBytes: number; totalBytes?: number; message: string }

export type Dc9MemphisEnvironmentState = Dc9MemphisLoadState & { retry?: () => void }

export type Dc9LoadState = {
  status: 'idle' | 'loading' | 'ready' | 'error' | 'accessible-fallback'
  message?: string
  loadedBytes?: number
  totalBytes?: number
  percentage?: number
  memphisEnvironment?: Dc9MemphisEnvironmentState
}

/** Keep cockpit recovery authoritative while Memphis reports its own sibling asset state. */
export function attachDc9MemphisEnvironmentState(
  cockpit: Dc9LoadState,
  environment: Dc9MemphisLoadState,
  retryEnvironment: () => void,
): Dc9LoadState {
  return {
    ...cockpit,
    memphisEnvironment: environment.status === 'error'
      ? { ...environment, retry: retryEnvironment }
      : { ...environment },
  }
}
