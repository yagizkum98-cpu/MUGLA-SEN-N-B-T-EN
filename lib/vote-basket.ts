'use client'

import {useCallback, useEffect, useState} from 'react'

export const VOTE_CREDIT_LIMIT = 5

const STORAGE_KEY = 'mugla-vote-baskets-v1'
const CHANGE_EVENT = 'mugla-vote-basket-changed'

type VoteState = {
  basket: string[]
  confirmed: string[]
}

type VoteStore = Record<string, VoteState>

function emptyState(): VoteState {
  return {basket: [], confirmed: []}
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

function readStore(): VoteStore {
  if (typeof window === 'undefined') return {}
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  } catch {
    return {}
  }
}

function writeStore(store: VoteStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function readState(userId?: string | null): VoteState {
  if (!userId) return emptyState()
  const state = readStore()[userId] ?? emptyState()
  return {basket: unique(state.basket), confirmed: unique(state.confirmed)}
}

export function useVoteBasket(userId?: string | null) {
  const [state, setState] = useState<VoteState>(() => readState(userId))

  const sync = useCallback(() => setState(readState(userId)), [userId])

  useEffect(() => {
    sync()
    window.addEventListener('storage', sync)
    window.addEventListener(CHANGE_EVENT, sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(CHANGE_EVENT, sync)
    }
  }, [sync])

  const save = useCallback((next: VoteState) => {
    if (!userId) return
    const normalized = {basket: unique(next.basket), confirmed: unique(next.confirmed)}
    writeStore({...readStore(), [userId]: normalized})
    setState(normalized)
  }, [userId])

  const remaining = Math.max(0, VOTE_CREDIT_LIMIT - state.confirmed.length)
  const availableForBasket = Math.max(0, remaining - state.basket.length)

  const add = useCallback((projectId: string) => {
    if (!userId) return {ok: false, message: 'Giris gerekli.'}
    const current = readState(userId)
    if (current.confirmed.includes(projectId)) return {ok: false, message: 'Bu proje icin oyunuz alinmis.'}
    if (current.basket.includes(projectId)) return {ok: true, message: 'Proje zaten sepette.'}
    const currentRemaining = Math.max(0, VOTE_CREDIT_LIMIT - current.confirmed.length)
    if (current.basket.length >= currentRemaining) return {ok: false, message: 'Kalan oy krediniz dolu.'}
    save({...current, basket: [...current.basket, projectId]})
    return {ok: true, message: 'Proje sepete eklendi.'}
  }, [save, userId])

  const remove = useCallback((projectId: string) => {
    if (!userId) return
    const current = readState(userId)
    save({...current, basket: current.basket.filter(id => id !== projectId)})
  }, [save, userId])

  const confirm = useCallback((validProjectIds: string[]) => {
    if (!userId) return []
    const current = readState(userId)
    const valid = new Set(validProjectIds)
    const currentRemaining = Math.max(0, VOTE_CREDIT_LIMIT - current.confirmed.length)
    const selected = current.basket.filter(id => valid.has(id) && !current.confirmed.includes(id)).slice(0, currentRemaining)
    save({basket: current.basket.filter(id => !selected.includes(id)), confirmed: [...current.confirmed, ...selected]})
    return selected
  }, [save, userId])

  return {basket: state.basket, confirmed: state.confirmed, remaining, availableForBasket, add, remove, confirm}
}
