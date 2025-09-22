import { useEffect } from 'react'
import { useWatchContractEvent } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../constants/contract'
import { useChatStore } from '../stores/chatStore'
import { useUserStore } from '../stores/userStore'
import toast from 'react-hot-toast'

export const useRealTimeEvents = () => {
  const { addMessage } = useChatStore()
  const { addUser, updateUserOnlineStatus } = useUserStore()

  // Listen for new messages with better conflict resolution
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'MessageSent',
    onLogs: (logs) => {
      logs.forEach((log) => {
        const { from, to, message: content, timestamp } = log.args
        
        // Check if we already have this message (including optimistic messages)
        const currentMessages = useChatStore.getState().getCurrentMessages()
        const messageExists = currentMessages.some(msg => 
          msg.from === from && 
          msg.content === content && 
          Math.abs(msg.timestamp - Number(timestamp)) < 5 // Within 5 seconds
        )

        // Don't add if message already exists (prevents duplicates from optimistic updates)
        if (messageExists) {
          return
        }
        
        const messageData = {
          id: `contract-${from}-${to}-${timestamp}`,
          from,
          to,
          content,
          timestamp: Number(timestamp),
          fromName: '', // Will be filled by store
          toName: '',   // Will be filled by store
        }

        // Add to appropriate message store
        addMessage(messageData)

        // Show toast notification for new messages (not from current user)
        const currentUser = useUserStore.getState().currentUser
        if (from !== currentUser?.address) {
          const sender = useUserStore.getState().getUserByAddress(from)
          const senderName = sender?.crazyName?.replace('.crazy', '') || 
                           `${from.slice(0, 6)}...${from.slice(-4)}`
          toast.success(`New message from ${senderName}`)
        }
      })
    }
  })

  // Listen for new user registrations
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'NameRegistered',
    onLogs: (logs) => {
      logs.forEach((log) => {
        const { owner, name, userAddress } = log.args
        
        const userData = {
          address: userAddress,
          crazyName: `${name}.crazy`,
          isRegistered: true,
          registrationTime: Date.now(),
          isOnline: true, // Assume newly registered users are online
        }

        addUser(userData)
        
        // Show welcome toast
        toast.success(`Welcome ${userData.crazyName}! 🎉`)
      })
    }
  })

  return {
    // Expose any event-related functions if needed
    isListening: true
  }
}

// Custom hook for typing indicators (local only, no real-time sync)
export const useTypingIndicators = () => {
  const { setUserTyping, removeUserTyping } = useChatStore()

  const startTyping = (userAddress, chatId) => {
    setUserTyping(userAddress, chatId)
    
    // Auto-remove typing indicator after 3 seconds
    setTimeout(() => {
      removeUserTyping(userAddress, chatId)
    }, 3000)
  }

  const stopTyping = (userAddress, chatId) => {
    removeUserTyping(userAddress, chatId)
  }

  return { startTyping, stopTyping }
}

// Custom hook for optimistic message updates (improved)
export const useOptimisticMessages = () => {
  const { addOptimisticMessage, confirmMessage, failMessage } = useChatStore()

  const sendOptimisticMessage = async (messageData, sendFunction) => {
    // This is now handled directly in ChatArea for better control
    // Keeping this for compatibility but not actively used
    const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    addOptimisticMessage({
      ...messageData,
      id: optimisticId,
      isPending: true,
      isOptimistic: true
    })

    try {
      const result = await sendFunction()
      confirmMessage(optimisticId, result?.hash || 'confirmed')
      return result
    } catch (error) {
      failMessage(optimisticId, error.message)
      throw error
    }
  }

  return { sendOptimisticMessage }
}

// Hook for managing connection status
export const useConnectionStatus = () => {
  const { updateUserOnlineStatus } = useUserStore()

  useEffect(() => {
    // Simulate online status tracking
    const handleVisibilityChange = () => {
      const isOnline = !document.hidden
      const currentUser = useUserStore.getState().currentUser
      
      if (currentUser) {
        updateUserOnlineStatus(currentUser.address, isOnline)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Set as online when component mounts
    const handleFocus = () => {
      const currentUser = useUserStore.getState().currentUser
      if (currentUser) {
        updateUserOnlineStatus(currentUser.address, true)
      }
    }

    window.addEventListener('focus', handleFocus)

    // Set as online initially
    const currentUser = useUserStore.getState().currentUser
    if (currentUser) {
      updateUserOnlineStatus(currentUser.address, true)
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [updateUserOnlineStatus])

  return {
    isTracking: true
  }
}