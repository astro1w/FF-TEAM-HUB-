import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'mz.ffteamhub.app',
  appName: 'FF TEAM HUB',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    backgroundColor: '#0B0F14'
  }
}

export default config
