import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export const useChatStore = create(
  subscribeWithSelector((set, get) => ({
    // Chat State
    activeChat: 'group', // 'group' or user address for direct chat
    groupMessages: [],
    directMessages: {}, // { userAddress: [messages] }
    optimisticMessages: [], // Messages being sent
    typingUsers: {}, // { chatId: [userAddresses] }
    
    // UI State
    isSidebarOpen: true,
    isLoading: false,
    messageInput: '',
    
    // Actions
    setActiveChat: (chatId) => set({ activeChat: chatId }),
    
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    
    setMessageInput: (input) => set({ messageInput: input }),
    
    setLoading: (loading) => set({ isLoading: loading }),

    // Message Management
    addMessage: (message) => {
      const state = get()
      
      // Determine if it's a group message or direct message
      // Group messages: when 'to' is zero address or broadcast
      const isGroupMessage = message.to === '0x0000000000000000000000000000000000000000' || 
                            !message.to || 
                            message.to === message.from

      if (isGroupMessage) {
        // Add to group messages
        set((state) => ({
          groupMessages: [...state.groupMessages, message].sort((a, b) => a.timestamp - b.timestamp)
        }))
      } else {
        // Add to direct messages
        const otherUser = message.from === state.currentUserAddress ? message.to : message.from
        
        set((state) => ({
          directMessages: {
            ...state.directMessages,
            [otherUser]: [...(state.directMessages[otherUser] || []), message]
              .sort((a, b) => a.timestamp - b.timestamp)
          }
        }))
      }
    },

    addOptimisticMessage: (message) => set((state) => ({
      optimisticMessages: [...state.optimisticMessages, message]
    })),

    confirmMessage: (optimisticId, txHash) => set((state) => ({
      optimisticMessages: state.optimisticMessages.map(msg => 
        msg.id === optimisticId 
          ? { ...msg, isPending: false, isConfirmed: true, txHash }
          : msg
      )
    })),

    failMessage: (optimisticId, error) => set((state) => ({
      optimisticMessages: state.optimisticMessages.map(msg => 
        msg.id === optimisticId 
          ? { ...msg, isPending: false, isFailed: true, error }
          : msg
      )
    })),

    // Remove confirmed optimistic messages after a delay
    cleanupOptimisticMessages: () => set((state) => ({
      optimisticMessages: state.optimisticMessages.filter(msg => 
        msg.isPending || (!msg.isConfirmed && !msg.isFailed)
      )
    })),

    // Typing Indicators
    setUserTyping: (userAddress, chatId) => set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [chatId]: [...(state.typingUsers[chatId] || []), userAddress]
          .filter((addr, index, arr) => arr.indexOf(addr) === index) // Remove duplicates
      }
    })),

    removeUserTyping: (userAddress, chatId) => set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [chatId]: (state.typingUsers[chatId] || []).filter(addr => addr !== userAddress)
      }
    })),

    // Get current chat messages
    getCurrentMessages: () => {
      const state = get()
      
      if (state.activeChat === 'group') {
        return [...state.groupMessages, ...state.optimisticMessages.filter(msg => 
          !msg.to || msg.to === '0x0000000000000000000000000000000000000000'
        )]
      } else {
        const directMsgs = state.directMessages[state.activeChat] || []
        const optimisticMsgs = state.optimisticMessages.filter(msg => 
          msg.to === state.activeChat || msg.from === state.activeChat
        )
        
        return [...directMsgs, ...optimisticMsgs].sort((a, b) => a.timestamp - b.timestamp)
      }
    },

    // Get typing users for current chat
    getCurrentTypingUsers: () => {
      const state = get()
      return state.typingUsers[state.activeChat] || []
    },

    // Bulk load messages (from contract calls)
    loadGroupMessages: (messages) => set({ groupMessages: messages }),
    
    loadDirectMessages: (userAddress, messages) => set((state) => ({
      directMessages: {
        ...state.directMessages,
        [userAddress]: messages
      }
    })),

    // Clear chat data (on disconnect)
    clearChatData: () => set({
      groupMessages: [],
      directMessages: {},
      optimisticMessages: [],
      typingUsers: {},
      activeChat: 'group',
      messageInput: ''
    }),

    // Search messages
    searchMessages: (query) => {
      const state = get()
      const allMessages = [
        ...state.groupMessages,
        ...Object.values(state.directMessages).flat()
      ]
      
      return allMessages.filter(msg => 
        msg.content.toLowerCase().includes(query.toLowerCase()) ||
        msg.fromName?.toLowerCase().includes(query.toLowerCase())
      )
    },

    // Get unread message count for a user
    getUnreadCount: (userAddress) => {
      const state = get()
      // This would need to be implemented with read receipts
      // For now, return 0
      return 0
    },

    // Mark messages as read
    markAsRead: (userAddress) => {
      // Implementation would depend on read receipt system
      console.log(`Marking messages as read for ${userAddress}`)
    }
  }))
)

// Subscribe to active chat changes to auto-scroll
useChatStore.subscribe(
  (state) => state.activeChat,
  (activeChat) => {
    // Auto-scroll to bottom when switching chats
    setTimeout(() => {
      const chatContainer = document.getElementById('chat-messages')
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight
      }
    }, 100)
  }
)