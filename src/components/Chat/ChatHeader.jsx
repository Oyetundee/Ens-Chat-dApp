import React from 'react'
import { motion } from 'framer-motion'
import { useChatStore } from '../../stores/chatStore'
import { useUserStore } from '../../stores/userStore'
import { Hash, User, Users, Circle } from 'lucide-react'

const ChatHeader = () => {
  const { activeChat, getCurrentTypingUsers } = useChatStore()
  const { getUserByAddress, isUserOnline, getTotalOnline, currentUser } = useUserStore()

  const typingUsers = getCurrentTypingUsers()
  const isGroupChat = activeChat === 'group'

  // Get current chat info
  const getChatInfo = () => {
    if (isGroupChat) {
      return {
        title: 'Group Chat',
        subtitle: `${getTotalOnline()} online • Public conversation`,
        avatar: <Hash className="w-6 h-6" />,
        isOnline: true,
        bgGradient: 'from-purple-500 to-cyan-500'
      }
    } else {
      const user = getUserByAddress(activeChat)
      const online = isUserOnline(activeChat)
      
      return {
        title: user?.crazyName?.replace('.crazy', '') || 'Unknown User',
        subtitle: online ? 'Online' : 'Offline',
        avatar: user?.crazyName?.charAt(0).toUpperCase() || '?',
        isOnline: online,
        bgGradient: 'from-purple-400 to-cyan-400',
        address: activeChat
      }
    }
  }

  const chatInfo = getChatInfo()

  // Format typing indicators
  const getTypingText = () => {
    if (typingUsers.length === 0) return null
    
    const typingUserNames = typingUsers
      .map(addr => {
        const user = getUserByAddress(addr)
        return user?.crazyName?.replace('.crazy', '') || 'Someone'
      })
      .slice(0, 3) // Show max 3 users

    if (typingUserNames.length === 1) {
      return `${typingUserNames[0]} is typing...`
    } else if (typingUserNames.length === 2) {
      return `${typingUserNames[0]} and ${typingUserNames[1]} are typing...`
    } else if (typingUserNames.length === 3) {
      return `${typingUserNames[0]}, ${typingUserNames[1]} and ${typingUserNames[2]} are typing...`
    } else {
      return `${typingUserNames[0]} and ${typingUsers.length - 1} others are typing...`
    }
  }

  const typingText = getTypingText()

  return (
    <div className="flex items-center gap-3">
      {/* Avatar */}
      <div className="relative">
        <div className={`w-10 h-10 bg-gradient-to-r ${chatInfo.bgGradient} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}>
          {typeof chatInfo.avatar === 'string' ? (
            chatInfo.avatar
          ) : (
            chatInfo.avatar
          )}
        </div>
        
        {/* Online Status */}
        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-800 flex items-center justify-center ${
          chatInfo.isOnline ? 'bg-green-500' : 'bg-gray-500'
        }`}>
          {isGroupChat && (
            <Users className="w-2 h-2 text-white" />
          )}
        </div>
      </div>

      {/* Chat Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-white truncate">
            {chatInfo.title}
          </h2>
          
          {/* Online Indicator */}
          {chatInfo.isOnline && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1"
            >
              <Circle className="w-2 h-2 fill-green-400 text-green-400" />
            </motion.div>
          )}
        </div>

        {/* Subtitle with typing indicator */}
        <div className="text-sm text-gray-400">
          {typingText ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-cyan-400"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1 h-1 bg-cyan-400 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                className="w-1 h-1 bg-cyan-400 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                className="w-1 h-1 bg-cyan-400 rounded-full"
              />
              <span className="ml-2 text-xs">{typingText}</span>
            </motion.div>
          ) : (
            <div className="flex items-center gap-2">
              <span>{chatInfo.subtitle}</span>
              {chatInfo.address && (
                <span className="font-mono text-xs text-gray-500">
                  {chatInfo.address.slice(0, 6)}...{chatInfo.address.slice(-4)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chat Actions */}
      <div className="flex items-center gap-2">
        {/* Message Count Badge */}
        {!isGroupChat && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full font-medium"
          >
            DM
          </motion.div>
        )}

        {isGroupChat && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full font-medium flex items-center gap-1"
          >
            <Hash className="w-3 h-3" />
            Public
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default ChatHeader