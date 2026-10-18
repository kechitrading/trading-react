import { createBrowserRouter } from 'react-router'
import { AppLayout } from '@/app/AppLayout'
import { RequireAuth } from '@/app/RequireAuth'
import { navItems } from '@/app/nav'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { OverviewPage } from '@/pages/OverviewPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { ProposalDetailPage } from '@/pages/ProposalDetailPage'
import { ProposalsPage } from '@/pages/ProposalsPage'

const placeholders = navItems
  .filter((item) => !item.ready)
  .map((item) => ({ path: item.to.slice(1), element: <PlaceholderPage item={item} /> }))

export const routes = [
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <OverviewPage /> },
      { path: 'proposals', element: <ProposalsPage /> },
      { path: 'proposals/:id', element: <ProposalDetailPage /> },
      ...placeholders,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

export const router = createBrowserRouter(routes)
