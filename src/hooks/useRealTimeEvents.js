import { useEffect } from 'react'
import { useWatchContractEvent } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../constants/contract'
import { useChatStore } from '../stores/chatStore'
import { useUserStore } from '../stores/userStore'
import toast from 'react-hot-toast'

export const useRealTimeEvents = () => {
  const { addMessage, updateGroupMessages, updateDirectMessages } = useChatStore()
  const { addUser, updateUserOnlineStatus } = useUserStore()

  // Listen for new messages
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'MessageSent',
    onLogs: (logs) => {
      logs.forEach((log) => {
        const { from, to, message: content, timestamp } = log.args
        
        const messageData = {
          id: `${from}-${to}-${timestamp}`,
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
          toast.success(`New message from ${messageData.fromName || 'Someone'}`)
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

// Custom hook for typing indicators (simulated since contract doesn't have this)
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

// Custom hook for optimistic message updates
export const useOptimisticMessages = () => {
  const { addOptimisticMessage, confirmMessage, failMessage } = useChatStore()

  const sendOptimisticMessage = async (messageData, sendFunction) => {
    // Add optimistic message immediately
    const optimisticId = `optimistic-${Date.now()}`
    addOptimisticMessage({
      ...messageData,
      id: optimisticId,
      isPending: true
    })

    try {
      // Execute the actual send function
      const result = await sendFunction()
      
      // Mark as confirmed when transaction succeeds
      confirmMessage(optimisticId, result.hash)
      
      return result
    } catch (error) {
      // Mark as failed if transaction fails
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
    window.addEventListener('focus', () => {
      const currentUser = useUserStore.getState().currentUser
      if (currentUser) {
        updateUserOnlineStatus(currentUser.address, true)
      }
    })

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [updateUserOnlineStatus])
}