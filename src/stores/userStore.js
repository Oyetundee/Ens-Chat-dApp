import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUserStore = create(
  persist(
    (set, get) => ({
      // Current User State
      currentUser: null,
      isRegistered: false,
      isConnected: false,
      
      // All Users
      allUsers: [], // All registered .crazy users
      onlineUsers: [], // Currently online user addresses
      userProfiles: {}, // { address: { ipfsImageHash, bio, etc } }
      
      // UI State
      showOnlineOnly: false,
      userSearchQuery: '',

      // Actions - Current User
      setCurrentUser: (user) => set({ 
        currentUser: user,
        isConnected: !!user,
        isRegistered: user?.isRegistered || false
      }),

      updateCurrentUser: (updates) => set((state) => ({
        currentUser: state.currentUser ? { ...state.currentUser, ...updates } : null
      })),

      disconnectUser: () => set({
        currentUser: null,
        isConnected: false,
        isRegistered: false
      }),

      // Actions - All Users Management
      setAllUsers: (users) => set({ allUsers: users }),

      addUser: (user) => set((state) => {
        // Check if user already exists
        const existingIndex = state.allUsers.findIndex(u => u.address === user.address)
        
        if (existingIndex >= 0) {
          // Update existing user
          const updatedUsers = [...state.allUsers]
          updatedUsers[existingIndex] = { ...updatedUsers[existingIndex], ...user }
          return { allUsers: updatedUsers }
        } else {
          // Add new user
          return { allUsers: [...state.allUsers, user] }
        }
      }),

      removeUser: (address) => set((state) => ({
        allUsers: state.allUsers.filter(user => user.address !== address)
      })),

      updateUser: (address, updates) => set((state) => ({
        allUsers: state.allUsers.map(user => 
          user.address === address ? { ...user, ...updates } : user
        )
      })),

      // Online Status Management
      updateUserOnlineStatus: (address, isOnline) => set((state) => {
        const onlineUsers = isOnline 
          ? [...state.onlineUsers.filter(addr => addr !== address), address]
          : state.onlineUsers.filter(addr => addr !== address)

        return { onlineUsers }
      }),

      setUsersOnline: (addresses) => set({ onlineUsers: addresses }),

      // Profile Management (IPFS images, etc.)
      updateUserProfile: (address, profile) => set((state) => ({
        userProfiles: {
          ...state.userProfiles,
          [address]: { ...state.userProfiles[address], ...profile }
        }
      })),

      getUserProfile: (address) => {
        const state = get()
        return state.userProfiles[address] || {}
      },

      // Getters
      getOnlineUsers: () => {
        const state = get()
        return state.allUsers.filter(user => state.onlineUsers.includes(user.address))
      },

      getOfflineUsers: () => {
        const state = get()
        return state.allUsers.filter(user => !state.onlineUsers.includes(user.address))
      },

      getUserByAddress: (address) => {
        const state = get()
        return state.allUsers.find(user => user.address === address)
      },

      getUserByCrazyName: (crazyName) => {
        const state = get()
        return state.allUsers.find(user => user.crazyName === crazyName)
      },

      // Search and Filter
      setUserSearchQuery: (query) => set({ userSearchQuery: query }),

      setShowOnlineOnly: (showOnline) => set({ showOnlineOnly: showOnline }),

      getFilteredUsers: () => {
        const state = get()
        let users = state.showOnlineOnly ? state.getOnlineUsers() : state.allUsers

        if (state.userSearchQuery) {
          const query = state.userSearchQuery.toLowerCase()
          users = users.filter(user => 
            user.crazyName?.toLowerCase().includes(query) ||
            user.address.toLowerCase().includes(query)
          )
        }

        return users.sort((a, b) => {
          // Sort by online status first, then by name
          const aOnline = state.onlineUsers.includes(a.address)
          const bOnline = state.onlineUsers.includes(b.address)
          
          if (aOnline && !bOnline) return -1
          if (!aOnline && bOnline) return 1
          
          return (a.crazyName || '').localeCompare(b.crazyName || '')
        })
      },

      // Stats
      getTotalUsers: () => get().allUsers.length,
      getTotalOnline: () => get().onlineUsers.length,

      // Utility functions
      isUserOnline: (address) => get().onlineUsers.includes(address),

      formatUserName: (user) => {
        if (!user) return 'Unknown'
        return user.crazyName || `${user.address.slice(0, 6)}...${user.address.slice(-4)}`
      },

      // Clear all user data (on app reset)
      clearUserData: () => set({
        allUsers: [],
        onlineUsers: [],
        userProfiles: {},
        userSearchQuery: '',
        showOnlineOnly: false
      }),

      // Bulk operations
      bulkUpdateUsers: (updates) => set((state) => ({
        allUsers: state.allUsers.map(user => {
          const update = updates.find(u => u.address === user.address)
          return update ? { ...user, ...update } : user
        })
      }))
    }),
    {
      name: 'crazychat-user-store',
      partialize: (state) => ({
        // Only persist essential data
        currentUser: state.currentUser,
        userProfiles: state.userProfiles,
        // Don't persist online status or all users (fetch fresh)
      })
    }
  )
)