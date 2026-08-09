import { create } from 'zustand'
import type { Table, Player } from '../types'

interface TableState {
  tables: Table[]
  currentTable: Table | null
  createTable: (name: string, minBuyIn: number) => Table
  joinTable: (tableId: string, userId: string, username: string) => void
  leaveTable: (tableId: string, userId: string) => void
  setCurrentTable: (table: Table | null) => void
}

export const useTableStore = create<TableState>((set) => ({
  tables: [],
  currentTable: null,

  createTable: (name: string, minBuyIn: number) => {
    const newTable: Table = {
      id: crypto.randomUUID(),
      name,
      hostId: 'current-user-id',
      players: [],
      minBuyIn,
      maxPlayers: 4,
      status: 'waiting',
      createdAt: new Date(),
    }

    set((state) => ({
      tables: [...state.tables, newTable],
      currentTable: newTable,
    }))

    return newTable
  },

  joinTable: (tableId: string, userId: string, username: string) => {
    set((state) => ({
      tables: state.tables.map((table) => {
        if (table.id !== tableId) return table

        if (table.players.length >= table.maxPlayers) {
          throw new Error('Mesa llena')
        }

        const newPlayer: Player = {
          userId,
          username,
          chips: table.minBuyIn,
          position: ['north', 'east', 'south', 'west'][table.players.length] as Player['position'],
          isReady: false,
        }

        return {
          ...table,
          players: [...table.players, newPlayer],
        }
      }),
    }))
  },

  leaveTable: (tableId: string, userId: string) => {
    set((state) => ({
      tables: state.tables.map((table) => {
        if (table.id !== tableId) return table
        return {
          ...table,
          players: table.players.filter((p) => p.userId !== userId),
        }
      }),
      currentTable: state.currentTable?.id === tableId ? null : state.currentTable,
    }))
  },

  setCurrentTable: (table: Table | null) => {
    set({ currentTable: table })
  },
}))