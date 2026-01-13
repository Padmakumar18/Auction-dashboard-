import { create } from "zustand";

// Global state management using Zustand
const useStore = create((set, get) => ({
  // Auth state
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => {
    // Clear user state
    set({ user: null, isAuthenticated: false });

    // Clear localStorage
    localStorage.removeItem("admin_user");
    localStorage.removeItem("saved_email");
    localStorage.removeItem("saved_password");
  },

  // Teams state
  teams: [],
  setTeams: (teams) => set({ teams }),
  addTeam: (team) => set((state) => ({ teams: [...state.teams, team] })),
  updateTeam: (id, updates) =>
    set((state) => ({
      teams: state.teams.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  // Players state
  players: [],
  setPlayers: (players) => set({ players }),
  addPlayer: (player) =>
    set((state) => ({ players: [...state.players, player] })),
  updatePlayer: (id, updates) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),
  removePlayer: (id) =>
    set((state) => ({
      players: state.players.filter((p) => p.id !== id),
    })),

  // Auction state
  currentPlayer: null,
  setCurrentPlayer: (player) => set({ currentPlayer: player }),
  currentBid: null,
  setCurrentBid: (bid) => set({ currentBid: bid }),
  auctionLogs: [],
  setAuctionLogs: (logs) => set({ auctionLogs: logs }),
  addAuctionLog: (log) =>
    set((state) => ({ auctionLogs: [log, ...state.auctionLogs] })),
  isAuctionLocked: false,
  setAuctionLocked: (locked) => set({ isAuctionLocked: locked }),

  // UI state
  loading: false,
  setLoading: (loading) => set({ loading }),
  error: null,
  setError: (error) => set({ error }),

  // Helper functions
  getTeamById: (id) => get().teams.find((t) => t.id === id),
  getPlayerById: (id) => get().players.find((p) => p.id === id),
  getUnsoldPlayers: () => get().players.filter((p) => p.status === "unsold"),
  getSoldPlayers: () => get().players.filter((p) => p.status === "sold"),
  getTeamPlayers: (teamId) => get().players.filter((p) => p.team_id === teamId),
}));

export default useStore;
