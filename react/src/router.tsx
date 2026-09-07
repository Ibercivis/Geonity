import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/shared/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ProjectsPage } from '@/pages/ProjectsPage'
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
import { useAuthStore } from '@/store/auth'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
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
    children: [
      // Public — accessible with or without auth
      { path: 'privacy-policy', element: <PrivacyPolicyPage /> },
      { path: 'terms-of-use', element: <TermsOfUsePage /> },
      { path: 'delete-account', element: <DeleteAccountPage /> },
      { path: 'about', element: <AboutPage /> },
      // Protected
      { index: true, element: <RequireAuth><ProjectsPage /></RequireAuth> },
      { path: 'projects/new', element: <RequireAuth><ProjectFormPage /></RequireAuth> },
      { path: 'projects/:id', element: <RequireAuth><ProjectDetailPage /></RequireAuth> },
      { path: 'projects/:id/edit', element: <RequireAuth><ProjectFormPage /></RequireAuth> },
      { path: 'projects/:id/observations/new', element: <RequireAuth><AddObservationPage /></RequireAuth> },
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
