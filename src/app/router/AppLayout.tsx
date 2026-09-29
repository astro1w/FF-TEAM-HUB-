import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import BottomNavigation from '@/components/navigation/BottomNavigation'
import UpdateManager from '@/components/UpdateManager'

export default function AppLayout() {
  const location = useLocation()
  const isFeed = location.pathname === '/feed' || location.pathname.startsWith('/feed/')

  return (
    <div className={isFeed ? 'min-h-screen bg-base-900' : 'app-lobby min-h-screen'}>
      {!isFeed && <div className="app-lobby__background" />}
      {!isFeed && <div className="app-lobby__overlay" />}

      <div className={!isFeed ? 'app-lobby__content' : ''}>
        <Outlet />
      </div>

      <BottomNavigation />
      <UpdateManager />
    </div>
  )
}
