import { createBrowserRouter, Navigate, useParams } from 'react-router-dom'
import { AppLayout } from '@/components/shared/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ManagePage } from '@/pages/ManagePage'
import { ActivityPage } from '@/pages/ActivityPage'
import { HomePage } from '@/pages/HomePage'
import { ExplorePage } from '@/pages/ExplorePage'
import { ProjectDetailPage } from '@/pages/ProjectDetailPage'
import { AddObservationPage } from '@/pages/AddObservationPage'
import { ProjectFormPage } from '@/pages/ProjectFormPage'
import { OrganizationsPage } from '@/pages/OrganizationsPage'
import { OrgDetailPage } from '@/pages/OrgDetailPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { InvitationsPage } from '@/pages/InvitationsPage'
import { DeleteAccountPage } from '@/pages/DeleteAccountPage'
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicyPage'
import { TermsOfUsePage } from '@/pages/TermsOfUsePage'
import { AboutPage } from '@/pages/AboutPage'
import { PublicMapPage } from '@/pages/PublicMapPage'
import { ContributePageLazy } from '@/pages/ContributePageLazy'
import { RouteErrorPage } from '@/pages/RouteErrorPage'
import { ProjectStatsPageLazy, MyStatsPageLazy, PlatformStatsPageLazy } from '@/pages/StatsPagesLazy'
import { useAuthStore } from '@/store/auth'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

/** Old/alternate URLs (emails, mobile app) that point to a detail page: /project/:id → /projects/:id. */
function RedirectWithId({ to }: { to: string }) {
  const { id } = useParams()
  return <Navigate to={`${to}/${id}`} replace />
}

export const router = createBrowserRouter([
  {
    path: '/map/:id',
    element: <PublicMapPage />,
  },
  {
    path: '/contribute/:token',
    element: <ContributePageLazy />,
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      // Public — accessible with or without auth
      { path: 'privacy-policy', element: <PrivacyPolicyPage /> },
      { path: 'terms-of-use', element: <TermsOfUsePage /> },
      // The server's notification and digest emails link to /project/:id and /organization/:id
      { path: 'project/:id', element: <RedirectWithId to="/projects" /> },
      { path: 'organization/:id', element: <RedirectWithId to="/organizations" /> },
      // The mobile app links to /terms
      { path: 'terms', element: <Navigate to="/terms-of-use" replace /> },
      { path: 'delete-account', element: <DeleteAccountPage /> },
      { path: 'about', element: <AboutPage /> },
      // Protected
      { index: true, element: <RequireAuth><HomePage /></RequireAuth> },
      { path: 'explorar', element: <RequireAuth><ExplorePage /></RequireAuth> },
      { path: 'gestionar', element: <RequireAuth><ManagePage /></RequireAuth> },
      { path: 'gestionar/actividad', element: <RequireAuth><ActivityPage /></RequireAuth> },
      { path: 'projects/new', element: <RequireAuth><ProjectFormPage /></RequireAuth> },
      { path: 'projects/:id', element: <RequireAuth><ProjectDetailPage /></RequireAuth> },
      { path: 'projects/:id/edit', element: <RequireAuth><ProjectFormPage /></RequireAuth> },
      { path: 'projects/:id/observations/new', element: <RequireAuth><AddObservationPage /></RequireAuth> },
      { path: 'projects/:id/stats', element: <RequireAuth><ProjectStatsPageLazy /></RequireAuth> },
      { path: 'stats', element: <RequireAuth><MyStatsPageLazy /></RequireAuth> },
      { path: 'admin/stats', element: <RequireAuth><PlatformStatsPageLazy /></RequireAuth> },
      { path: 'organizations', element: <RequireAuth><OrganizationsPage /></RequireAuth> },
      { path: 'organizations/:id', element: <RequireAuth><OrgDetailPage /></RequireAuth> },
      { path: 'profile', element: <RequireAuth><ProfilePage /></RequireAuth> },
      { path: 'invitations', element: <RequireAuth><InvitationsPage /></RequireAuth> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
