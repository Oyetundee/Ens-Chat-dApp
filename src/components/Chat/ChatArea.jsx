import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useReadContract, useWriteContract } from 'wagmi'
import { useChatStore } from '../../stores/chatStore'
import { useUserStore } from '../../stores/userStore'
import { useOptimisticMessages, useTypingIndicators } from '../../hooks/useRealTimeEvents'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../../constants/contract'
import { Send, Loader2, Hash, User, Clock, AlertCircle, Check, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

const ChatArea = () => {
  const { address } = useAccount()
  const messagesEndRef = useRef(null)
  const [messageInput, setMessageInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const { 
    activeChat, 
    getCurrentMessages, 
    getCurrentTypingUsers,
    loadGroupMessages,
    loadDirectMessages 
  } = useChatStore()

  const { currentUser, getUserByAddress } = useUserStore()
  const { sendOptimisticMessage } = useOptimisticMessages()
  const { startTyping, stopTyping } = useTypingIndicators()

  const isGroupChat = activeChat === 'group'

  // Load messages based on active chat
  const { data: groupMessages } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getAllMessages',
    query: { enabled: isGroupChat }
  })

  const { data: directMessages } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getConversation',
    args: [address, activeChat],
    query: { enabled: !isGroupChat && !!address && !!activeChat }
  })

  // Send message functions
  const { writeContract: sendGroupMessage, isPending: isSendingGroup } = useWriteContract({
    mutation: {
      onSuccess: () => {
        toast.success('Message sent!')
        setMessageInput('') // Clear input after successful send
      },
      onError: (error) => {
        toast.error('Failed to send message')
        console.error('Send error:', error)
      }
    }
  })

  const { writeContract: sendDirectMessage, isPending: isSendingDirect } = useWriteContract({
    mutation: {
      onSuccess: () => {
        toast.success('Message sent!')
        setMessageInput('') // Clear input after successful send
      },
      onError: (error) => {
        toast.error('Failed to send message')
        console.error('Send error:', error)
      }
    }
  })

  const isSending = isSendingGroup || isSendingDirect

  // Load messages into store when data changes
  useEffect(() => {
    if (isGroupChat && groupMessages) {
      // Filter for group messages (where to is zero address or same as from)
      const filtered = groupMessages.filter(msg => 
        !msg.to || 
        msg.to === '0x0000000000000000000000000000000000000000' ||
        msg.to === msg.from
      )
      loadGroupMessages(filtered)
    }
  }, [isGroupChat, groupMessages, loadGroupMessages])

  useEffect(() => {
    if (!isGroupChat && directMessages && activeChat) {
      loadDirectMessages(activeChat, directMessages)
    }
  }, [isGroupChat, directMessages, activeChat, loadDirectMessages])

  // Auto-scroll to bottom only when messages actually change - AGGRESSIVE FIX
  const messages = getCurrentMessages()
  
  // Use a ref to track message count and debounce scrolling
  const lastMessageCountRef = useRef(0)
  const scrollTimeoutRef = useRef(null)
  
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current) {
      // Clear any pending scroll
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      
      // Debounced scroll - only scroll after a brief delay
      scrollTimeoutRef.current = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
      }, 100)
      
      lastMessageCountRef.current = messages.length
    }
  }, [messages.length])
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  // Handle typing indicators
  const handleInputChange = (e) => {
    const value = e.target.value
    setMessageInput(value)

    if (value && !isTyping) {
      setIsTyping(true)
      startTyping(address, activeChat)
    } else if (!value && isTyping) {
      setIsTyping(false)
      stopTyping(address, activeChat)
    }
  }

  // Stop typing when user stops typing for 3 seconds
  useEffect(() => {
    if (isTyping) {
      const timer = setTimeout(() => {
        setIsTyping(false)
        stopTyping(address, activeChat)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [messageInput, isTyping, address, activeChat, stopTyping])

  // Send message handler with optimistic updates
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!messageInput.trim() || isSending) return

    const messageContent = messageInput.trim()
    
    // Clear input immediately for better UX
    setMessageInput('')
    
    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false)
      stopTyping(address, activeChat)
    }

    // Create optimistic message that shows immediately
    const optimisticMessage = {
      id: `optimistic-${Date.now()}`,
      from: address,
      to: isGroupChat ? '0x0000000000000000000000000000000000000000' : activeChat,
      content: messageContent,
      timestamp: Math.floor(Date.now() / 1000),
      fromName: currentUser?.ensName?.replace('.ens', '') || currentUser?.crazyName?.replace('.crazy', '') || '',
      toName: isGroupChat ? '' : getUserByAddress(activeChat)?.crazyName?.replace('.crazy', '') || '',
      isPending: true, // Show as pending
      isOptimistic: true
    }

    // Add optimistic message immediately to chat store
    const { addOptimisticMessage } = useChatStore.getState()
    addOptimisticMessage(optimisticMessage)

    try {
      if (isGroupChat) {
        // For group chat, send to zero address (contract will handle as broadcast)
        await sendGroupMessage({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'sendMessageByAddress',
          args: ['0x0000000000000000000000000000000000000000', messageContent]
        })
      } else {
        // For direct messages
        await sendDirectMessage({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'sendMessageByAddress',
          args: [activeChat, messageContent]
        })
      }
      
      // Mark optimistic message as confirmed
      const { confirmMessage } = useChatStore.getState()
      confirmMessage(optimisticMessage.id, 'confirmed')
      
      toast.success('Message sent!')
      
    } catch (error) {
      console.error('Failed to send message:', error)
      
      // Mark optimistic message as failed
      const { failMessage } = useChatStore.getState()
      failMessage(optimisticMessage.id, error.message)
      
      toast.error('Failed to send message')
      setMessageInput(messageContent) // Restore message on failure
    }
  }

  const typingUsers = getCurrentTypingUsers().filter(userAddr => userAddr !== address)

  // Message component with WhatsApp-like styling
  const MessageBubble = ({ message, index }) => {
    const isOwn = message.from.toLowerCase() === address?.toLowerCase()
    const sender = getUserByAddress(message.from)
    
    // Get sender name - prioritize fromName from message, then user store, then address
    let senderName = 'Unknown'
    if (message.fromName) {
      senderName = message.fromName
    } else if (sender?.crazyName) {
      senderName = sender.crazyName.replace('.crazy', '')
    } else if (isOwn && currentUser?.ensName) {
      senderName = currentUser.ensName.replace('.ens', '')
    } else if (message.from) {
      senderName = `${message.from.slice(0, 6)}...${message.from.slice(-4)}`
    }

    // Format timestamp for WhatsApp-like display
    const messageDate = new Date(message.timestamp * 1000)
    const now = new Date()
    const isToday = messageDate.toDateString() === now.toDateString()
    const isYesterday = new Date(now - 24 * 60 * 60 * 1000).toDateString() === messageDate.toDateString()
    
    let timeDisplay = ''
    if (isToday) {
      timeDisplay = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (isYesterday) {
      timeDisplay = `Yesterday ${messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } else {
      timeDisplay = messageDate.toLocaleDateString() + ' ' + messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.02 }}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}
      >
        <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
          {/* Sender name for non-own messages in group chat */}
          {!isOwn && isGroupChat && (
            <div className="flex items-center gap-2 mb-1 ml-2">
              <div className="w-5 h-5 bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {senderName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-purple-400">
                {senderName}
              </span>
            </div>
          )}

          {/* Message bubble */}
          <div
            className={`px-4 py-2 rounded-2xl shadow-lg relative ${
              isOwn
                ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-br-md ml-auto'
                : 'bg-gray-700 text-white rounded-bl-md border border-gray-600/30'
            } ${message.isPending ? 'opacity-70' : ''} ${
              message.isFailed ? 'border-red-500/50 bg-red-900/20' : ''
            }`}
          >
            {/* Message content */}
            <div className="break-words whitespace-pre-wrap mb-2">
              {message.content}
            </div>
            
            {/* Time and status row */}
            <div className={`flex items-center justify-end gap-1 text-xs ${
              isOwn ? 'text-purple-100/80' : 'text-gray-400'
            }`}>
              <span>{timeDisplay}</span>
              
              {/* Message status indicators for own messages */}
              {isOwn && (
                <div className="flex items-center">
                  {message.isPending && (
                    <Clock className="w-3 h-3 ml-1" />
                  )}
                  {message.isFailed && (
                    <AlertCircle className="w-3 h-3 text-red-400 ml-1" />
                  )}
                  {!message.isPending && !message.isFailed && (
                    <CheckCheck className="w-3 h-3 ml-1 text-purple-200" />
                  )}
                </div>
              )}
            </div>

            {/* Message tail */}
            <div className={`absolute bottom-0 w-3 h-3 ${
              isOwn 
                ? 'right-0 transform translate-x-1 bg-purple-500'
                : 'left-0 transform -translate-x-1 bg-gray-700'
            }`} 
            style={{
              clipPath: isOwn 
                ? 'polygon(0 0, 100% 0, 0 100%)' 
                : 'polygon(100% 0, 0 0, 100% 100%)'
            }} />
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1" id="chat-messages">
        {/* Welcome Message */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
              {isGroupChat ? (
                <Hash className="w-8 h-8 text-white" />
              ) : (
                <User className="w-8 h-8 text-white" />
              )}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {isGroupChat ? 'Welcome to Group Chat!' : 'Start the conversation'}
            </h3>
            <p className="text-gray-400 max-w-md mx-auto">
              {isGroupChat 
                ? 'This is the public group chat where everyone can see your messages. Say hello!' 
                : `Send your first message to ${getUserByAddress(activeChat)?.crazyName?.replace('.crazy', '') || 'this user'}`
              }
            </p>
          </motion.div>
        )}

        {/* Messages */}
        <AnimatePresence>
          {messages.map((message, index) => (
            <MessageBubble key={message.id || `${message.from}-${message.timestamp}`} message={message} index={index} />
          ))}
        </AnimatePresence>

        {/* Typing Indicators */}
        {typingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex justify-start mb-4"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 rounded-2xl">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-2 h-2 bg-cyan-400 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                className="w-2 h-2 bg-cyan-400 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                className="w-2 h-2 bg-cyan-400 rounded-full"
              />
              <span className="text-gray-400 text-sm ml-2">
                {typingUsers.length === 1 ? 'Someone is' : 'People are'} typing...
              </span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 bg-gray-800/60 backdrop-blur-sm border-t border-gray-700/50">
        <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
          <div className="flex-1">
            <textarea
              value={messageInput}
              onChange={handleInputChange}
              placeholder={`Message ${isGroupChat ? 'group chat' : getUserByAddress(activeChat)?.crazyName?.replace('.crazy', '') || 'user'}...`}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 resize-none focus:outline-none focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20 transition-all max-h-32"
              rows={1}
              disabled={isSending}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage(e)
                }
              }}
            />
            
            {/* Character count */}
            {messageInput.length > 400 && (
              <div className="text-xs text-gray-500 mt-1 text-right">
                {messageInput.length}/500
              </div>
            )}
          </div>

          <motion.button
            type="submit"
            disabled={!messageInput.trim() || isSending}
            whileHover={messageInput.trim() && !isSending ? { scale: 1.05 } : {}}
            whileTap={messageInput.trim() && !isSending ? { scale: 0.95 } : {}}
            className={`p-3 rounded-xl font-medium transition-all flex items-center justify-center ${
              messageInput.trim() && !isSending
                ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:from-purple-700 hover:to-cyan-700 shadow-lg'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </motion.button>
        </form>

        {/* Quick tips */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <div className="flex items-center gap-4">
            {isGroupChat ? (
              <span className="flex items-center gap-1">
                <Hash className="w-3 h-3" />
                Public chat
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Direct message
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatArea