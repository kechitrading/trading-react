import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { mockFetch, renderApp } from '@/test/utils'

const okBackend = (mode: 'paper' | 'live' = 'paper', killSwitchActive = false) =>
  mockFetch((url) => {
    if (url.startsWith('/api/v1/mode'))
      return { body: { trading_mode: mode, live_trading_enabled: mode === 'live', algo_tag: 'AQTA' } }
    if (url.startsWith('/api/v1/kill-switch'))
      return { body: { active: killSwitchActive, reason: killSwitchActive ? 'manual test' : null } }
    if (url.startsWith('/api/v1/proposals')) return { body: [] }
    return { status: 404, body: { error: { code: 'not_found', message: 'not found' } } }
  })

describe('app shell', () => {
  it('redirects to login without a token', async () => {
    okBackend()
    renderApp('/proposals')
    expect(await screen.findByLabelText('API token')).toBeInTheDocument()
  })

  it('signs in with a valid token and shows the PAPER badge', async () => {
    okBackend()
    renderApp('/')
    await userEvent.type(await screen.findByLabelText('API token'), 'secret-token')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByRole('heading', { name: 'Overview' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByTestId('mode-badge')[0]).toHaveTextContent('PAPER'))
    expect(sessionStorage.getItem('aqta.apiToken')).toBe('secret-token')
  })

  it('shows a refused token as an error and stays on login', async () => {
    mockFetch(() => ({
      status: 401,
      body: { error: { code: 'unauthorized', message: 'invalid or missing API token' } },
    }))
    renderApp('/')
    await userEvent.type(await screen.findByLabelText('API token'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText('The backend refused this token.')).toBeInTheDocument()
    expect(sessionStorage.getItem('aqta.apiToken')).toBeNull()
  })

  it('shows the kill switch banner when it is active', async () => {
    sessionStorage.setItem('aqta.apiToken', 'secret-token')
    okBackend('live', true)
    renderApp('/')
    expect(await screen.findByText(/Kill switch is ON/)).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByTestId('mode-badge')[0]).toHaveTextContent('LIVE'))
  })
})
