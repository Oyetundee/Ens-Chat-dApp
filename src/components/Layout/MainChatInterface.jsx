import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useReadContract } from 'wagmi'
import { useUserStore } from '../../stores/userStore'
import { useChatStore } from '../../stores/chatStore'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../../constants/contract'

// Components
import Sidebar from '../Sidebar/Sidebar'
import ChatArea from '../Chat/ChatArea'
import ChatHeader from '../Chat/ChatHeader'
import { Menu, X } from 'lucide-react'

const MainChatInterface = () => {
  const { isSidebarOpen, toggleSidebar, loadGroupMessages } = useChatStore()
  const { setAllUsers, currentUser } = useUserStore()

  // Load all messages to extract users and load into chat store
  const { data: allMessages } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getAllMessages'
  })

  // Extract and set all users from messages
  useEffect(() => {
    if (allMessages) {
      const userMap = new Map()
      
      allMessages.forEach((message) => {
        // Add sender if not current user
        if (message.from !== currentUser?.address && message.fromName) {
          userMap.set(message.from, {
            address: message.from,
            crazyName: `${message.fromName}.crazy`,
            isRegistered: true,
            lastActivity: Number(message.timestamp),
          })
        }
        
        // Add recipient if not current user
        if (message.to !== currentUser?.address && message.toName && message.to !== '0x0000000000000000000000000000000000000000') {
          const existing = userMap.get(message.to)
          if (!existing || Number(message.timestamp) > existing.lastActivity) {
            userMap.set(message.to, {
              address: message.to,
              crazyName: `${message.toName}.crazy`,
              isRegistered: true,
              lastActivity: Number(message.timestamp),
            })
          }
        }
      })

      const users = Array.from(userMap.values()).sort((a, b) => b.lastActivity - a.lastActivity)
      setAllUsers(users)
    }
  }, [allMessages, currentUser?.address, setAllUsers])

  // Load messages into chat store
  useEffect(() => {
    if (allMessages) {
      // Format messages for the chat store
      const formattedMessages = allMessages.map((msg, index) => ({
        id: `msg-${index}-${msg.timestamp}`,
        from: msg.from,
        to: msg.to,
        content: msg.content,
        timestamp: Number(msg.timestamp),
        fromName: msg.fromName,
        toName: msg.toName
      }))
      
      // Filter and load group messages (public messages)
      const groupMessages = formattedMessages.filter(msg => 
        !msg.to || 
        msg.to === '0x0000000000000000000000000000000000000000' ||
        msg.to === msg.from
      )
      
      loadGroupMessages(groupMessages)
      console.log('Loaded messages into chat store:', groupMessages.length)
    }
  }, [allMessages, loadGroupMessages])

  return (
    <div className="h-screen flex bg-gray-900 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          x: isSidebarOpen ? 0 : '-100%'
        }}
        transition={{ type: 'tween', duration: 0.3 }}
        className="fixed lg:relative lg:translate-x-0 w-80 h-full bg-gray-800/90 backdrop-blur-sm border-r border-gray-700/50 z-30 lg:z-0"
      >
        <Sidebar />
      </motion.div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="bg-gray-800/60 backdrop-blur-sm border-b border-gray-700/50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              {isSidebarOpen ? (
                <X className="w-5 h-5 text-gray-300" />
              ) : (
                <Menu className="w-5 h-5 text-gray-300" />
              )}
            </button>
            
            <ChatHeader />
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <ChatArea />
        </div>
      </div>

      {/* Background Effects for Chat */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>
    </div>
  )
}

export default MainChatInterface