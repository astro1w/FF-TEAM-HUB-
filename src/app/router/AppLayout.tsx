import React from 'react'
import { Outlet } from 'react-router-dom'
import BottomNavigation from '@/components/navigation/BottomNavigation'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-base-900">
      <Outlet />
      <BottomNavigation />
    </div>
  )
}
