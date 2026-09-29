import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Splash from '@/pages/Splash'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import Onboarding from '@/pages/onboarding/Onboarding'
import Home from '@/pages/home/Home'
import PlaceholderPage from '@/pages/PlaceholderPage'
import Settings from '@/pages/settings/Settings'
import BlockedPlayers from '@/pages/settings/BlockedPlayers'
import Profile from '@/pages/players/Profile'
import Teams from '@/pages/teams/Teams'
import CreateTeam from '@/pages/teams/CreateTeam'
import TeamDetail from '@/pages/teams/TeamDetail'
import Tryouts from '@/pages/tryouts/Tryouts'
import TryoutDetail from '@/pages/tryouts/TryoutDetail'
import CreateTryout from '@/pages/tryouts/CreateTryout'
import Scrims from '@/pages/scrims/Scrims'
import CreateScrim from '@/pages/scrims/CreateScrim'
import ScrimDetail from '@/pages/scrims/ScrimDetail'
import Tournaments from '@/pages/tournaments/Tournaments'
import CreateTournament from '@/pages/tournaments/CreateTournament'
import TournamentDetail from '@/pages/tournaments/TournamentDetail'
import Thread from '@/pages/feed/Thread'
import PlayerProfile from '@/pages/players/PlayerProfile'
import Players from '@/pages/players/Players'
import Feed from '@/pages/feed/Feed'
import Messages from '@/pages/messages/Messages'
import Chat from '@/pages/messages/Chat'
import Notifications from '@/pages/notifications/Notifications'
import Rankings from '@/pages/rankings/Rankings'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminUsers from '@/pages/admin/AdminUsers'
import AdminReports from '@/pages/admin/AdminReports'
import AdminPlaceholder from '@/pages/admin/AdminPlaceholder'
import AppLayout from '@/app/router/AppLayout'
import { GuestOnlyRoute, OnboardingGate, ProtectedRoute } from '@/app/router/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />

      <Route element={<GuestOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<Onboarding />} />

        <Route element={<OnboardingGate />}>
          <Route element={<AppLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/explore" element={<Tryouts />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/feed/:id" element={<Thread />} />
            <Route path="/players" element={<Players />} />
            <Route path="/players/:id" element={<PlayerProfile />} />

            <Route path="/teams" element={<Teams />} />
            <Route path="/teams/create" element={<CreateTeam />} />
            <Route path="/teams/:id" element={<TeamDetail />} />

            <Route path="/tryouts" element={<Tryouts />} />
            <Route path="/tryouts/create" element={<CreateTryout />} />
            <Route path="/tryouts/:id" element={<TryoutDetail />} />

            <Route path="/scrims" element={<Scrims />} />
            <Route path="/scrims/create" element={<CreateScrim />} />
            <Route path="/scrims/:id" element={<ScrimDetail />} />

            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/tournaments/create" element={<CreateTournament />} />
            <Route path="/tournaments/:id" element={<TournamentDetail />} />

            <Route path="/rankings" element={<Rankings />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:id" element={<Chat />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/blocked" element={<BlockedPlayers />} />

            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/:section" element={<AdminPlaceholder />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Splash />} />
    </Routes>
  )
}
