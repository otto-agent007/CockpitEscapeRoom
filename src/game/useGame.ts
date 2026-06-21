import { useEffect, useReducer } from 'react'
import { gameReducer } from './state'
import { loadGameState, saveGameState } from './storage'

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, undefined, loadGameState)

  useEffect(() => {
    saveGameState(state)
  }, [state])

  return { state, dispatch }
}
