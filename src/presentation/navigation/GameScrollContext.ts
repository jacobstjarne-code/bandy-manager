import { createContext, useContext, type RefObject } from 'react'

export const GameScrollContext = createContext<RefObject<HTMLDivElement | null> | null>(null)

export function useGameScrollContainer() {
  return useContext(GameScrollContext)
}
