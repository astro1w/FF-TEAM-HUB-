export interface UpdateInfo {
  latestVersion: string
  minimumVersion: string
  apkUrl: string
  message: string
  forceUpdate: boolean
}

export const CURRENT_VERSION = '1.0.0'

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)

  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const av = pa[i] || 0
    const bv = pb[i] || 0

    if (av > bv) return 1
    if (av < bv) return -1
  }

  return 0
}

export async function checkForUpdate(
  updateUrl: string
): Promise<{
  available: boolean
  required: boolean
  info: UpdateInfo
}> {
  const response = await fetch(`${updateUrl}?t=${Date.now()}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`UPDATE_CHECK_FAILED_${response.status}`)
  }

  const info = (await response.json()) as UpdateInfo

  const available = compareVersions(info.latestVersion, CURRENT_VERSION) > 0
  const required =
    info.forceUpdate ||
    compareVersions(info.minimumVersion, CURRENT_VERSION) > 0

  return {
    available,
    required,
    info,
  }
}
