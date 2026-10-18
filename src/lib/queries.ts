import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ProposalStatus } from '@/lib/api'
import { useApi } from '@/lib/auth-context'

export const queryKeys = {
  mode: ['mode'] as const,
  killSwitch: ['kill-switch'] as const,
  proposals: (status?: ProposalStatus) => ['proposals', status ?? 'all'] as const,
  proposal: (id: string) => ['proposal', id] as const,
}

export function useMode() {
  const api = useApi()
  return useQuery({
    queryKey: queryKeys.mode,
    queryFn: ({ signal }) => api.mode(signal),
    staleTime: 60_000,
  })
}

/** Polled every 5 s so a trigger from Telegram or an automatic trigger (FR-035) shows quickly. */
export function useKillSwitch() {
  const api = useApi()
  return useQuery({
    queryKey: queryKeys.killSwitch,
    queryFn: ({ signal }) => api.killSwitch(signal),
    refetchInterval: 5_000,
  })
}

export function useProposals(status?: ProposalStatus) {
  const api = useApi()
  return useQuery({
    queryKey: queryKeys.proposals(status),
    queryFn: ({ signal }) => api.proposals(status, signal),
    refetchInterval: 10_000,
  })
}

export function useProposal(id: string) {
  const api = useApi()
  return useQuery({
    queryKey: queryKeys.proposal(id),
    queryFn: ({ signal }) => api.proposal(id, signal),
    refetchInterval: 10_000,
  })
}

function useInvalidateTrading() {
  const qc = useQueryClient()
  return () => {
    void qc.invalidateQueries({ queryKey: ['proposals'] })
    void qc.invalidateQueries({ queryKey: ['proposal'] })
    void qc.invalidateQueries({ queryKey: queryKeys.killSwitch })
  }
}

export function useKillSwitchMutation() {
  const api = useApi()
  const invalidate = useInvalidateTrading()
  return useMutation({
    mutationFn: (v: { action: 'trigger'; reason: string } | { action: 'release'; reason: string; totp: string }) =>
      v.action === 'trigger' ? api.triggerKillSwitch(v.reason) : api.releaseKillSwitch(v.reason, v.totp),
    onSettled: invalidate,
  })
}

export function useApproveProposal() {
  const api = useApi()
  const invalidate = useInvalidateTrading()
  return useMutation({
    mutationFn: (v: { id: string; totp: string }) => api.approveProposal(v.id, v.totp),
    onSettled: invalidate,
  })
}

export function useRejectProposal() {
  const api = useApi()
  const invalidate = useInvalidateTrading()
  return useMutation({
    mutationFn: (v: { id: string; reason: string }) => api.rejectProposal(v.id, v.reason),
    onSettled: invalidate,
  })
}

export function useModifyProposal() {
  const api = useApi()
  const invalidate = useInvalidateTrading()
  return useMutation({
    mutationFn: (v: { id: string; sets: number }) => api.modifyProposal(v.id, v.sets),
    onSettled: invalidate,
  })
}
