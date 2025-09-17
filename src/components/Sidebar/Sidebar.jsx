import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useDisconnect } from 'wagmi'
import { useUserStore } from '../../stores/userStore'
import { useChatStore } from '../../stores/chatStore'
import { 
  Users, 
  MessageCircle, 
  Search, 
  Settings, 
  Hash,
  User,
  Clock,
  Sparkles,
  LogOut,
  Plus,
  X
} from 'lucide-react'

const Sidebar = () => {
  const { disconnect } = useDisconnect()
  const [showAddContact, setShowAddContact] = useState(false)
  const [contactAddress, setContactAddress] = useState('')
  const [contactName, setContactName] = useState('')
  const { 
    currentUser, 
    getFilteredUsers, 
    userSearchQuery, 
    setUserSearchQuery,
    showOnlineOnly,
    setShowOnlineOnly,
    isUserOnline,
    getTotalUsers,
    getTotalOnline,
    disconnectUser,
    clearUserData,
    addUser
  } = useUserStore()

  const { activeChat, setActiveChat, toggleSidebar, clearChatData } = useChatStore()

  const filteredUsers = getFilteredUsers()

  // Handle adding contact
  const handleAddContact = () => {
    if (!contactAddress.trim()) return
    
    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(contactAddress.trim())) {
      alert('Please enter a valid Ethereum address')
      return
    }

    // Check if user already exists
    const existingUser = filteredUsers.find(user => 
      user.address.toLowerCase() === contactAddress.trim().toLowerCase()
    )
    
    if (existingUser) {
      alert('This user is already in your contacts')
      return
    }

    // Add the user
    const newUser = {
      address: contactAddress.trim(),
      crazyName: contactName.trim() || `${contactAddress.slice(0, 6)}...${contactAddress.slice(-4)}`,
      isRegistered: false, // We don't know if they're registered yet
      lastActivity: Date.now()
    }

    addUser(newUser)
    
    // Clear form and close modal
    setContactAddress('')
    setContactName('')
    setShowAddContact(false)
    
    // Start chat with the new contact
    handleChatSelect(contactAddress.trim())
  }
  const handleSignOut = () => {
    // Clear user store
    disconnectUser()
    clearUserData()
    
    // Clear chat store
    clearChatData()
    
    // Clear persisted data
    localStorage.removeItem('crazychat-user-store')
    
    // Refresh page to reset everything
    window.location.reload()
  }

  // Format last activity time
  const formatLastActivity = (timestamp) => {
    if (!timestamp) return 'Never'
    const date = new Date(timestamp * 1000)
    const now = new Date()
    const diff = now - date

    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
    return date.toLocaleDateString()
  }

  const handleChatSelect = (chatId) => {
    setActiveChat(chatId)
    // Close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
      toggleSidebar()
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-800/90 backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              ENS Chat Dapp
            </h1>
            <p className="text-xs text-gray-400 truncate">
              {currentUser?.ensName?.replace('.ens', '') || currentUser?.crazyName?.replace('.crazy', '') || 'Anonymous'}
            </p>
          </div>
          
          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="p-2 hover:bg-red-600/20 rounded-lg transition-colors group"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-400" />
          </button>
        </div>

        <div className="scale-75 -mt-2 -mb-2">
          <ConnectButton showBalance={false} />
        </div>

        {/* Search Bar */}
        <div className="relative mb-4 mt-4">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/20 transition-all"
          />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span>{getTotalUsers()} users</span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              {getTotalOnline()} online
            </span>
          </div>
          <button
            onClick={() => setShowOnlineOnly(!showOnlineOnly)}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              showOnlineOnly 
                ? 'bg-green-500/20 text-green-400' 
                : 'hover:bg-gray-700/50 text-gray-400'
            }`}
          >
            {showOnlineOnly ? 'Online only' : 'All users'}
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {/* Group Chat Option */}
        <motion.div
          whileHover={{ backgroundColor: 'rgba(107, 114, 128, 0.1)' }}
          onClick={() => handleChatSelect('group')}
          className={`p-4 border-b border-gray-700/30 cursor-pointer transition-colors ${
            activeChat === 'group' ? 'bg-purple-500/20 border-l-4 border-l-purple-400' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center">
                <Hash className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-gray-800 rounded-full animate-pulse"></div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-white truncate">
                  Group Chat
                </h3>
                <Sparkles className="w-4 h-4 text-yellow-400" />
              </div>
              <p className="text-xs text-gray-400 truncate">
                Everyone • Public conversation
              </p>
            </div>
          </div>
        </motion.div>

        {/* Direct Messages Header with Add Button */}
        <div className="px-4 py-2 bg-gray-700/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
            <Users className="w-4 h-4" />
            <span>DIRECT MESSAGES</span>
          </div>
          <button
            onClick={() => setShowAddContact(true)}
            className="p-1 hover:bg-purple-500/20 rounded transition-colors group"
            title="Add Contact"
          >
            <Plus className="w-4 h-4 text-gray-400 group-hover:text-purple-400" />
          </button>
        </div>

        {/* User List */}
        <div className="space-y-1 p-2">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <User className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm mb-2">
                {userSearchQuery ? 'No users found' : 'No contacts yet'}
              </p>
              <p className="text-gray-500 text-xs">
                {userSearchQuery ? 'Try a different search' : 'Users will appear here once they send messages'}
              </p>
            </div>
          ) : (
            filteredUsers.map((user, index) => {
              const isOnline = isUserOnline(user.address)
              const isActive = activeChat === user.address

              return (
                <motion.div
                  key={user.address}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ backgroundColor: 'rgba(107, 114, 128, 0.1)' }}
                  onClick={() => handleChatSelect(user.address)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-purple-500/20 border border-purple-400/30' 
                      : 'hover:bg-gray-700/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {user.crazyName?.charAt(0).toUpperCase() || '?'}
                      </div>
                      
                      {/* Online Status */}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-800 ${
                        isOnline ? 'bg-green-500' : 'bg-gray-500'
                      }`} />
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-white text-sm truncate">
                          {user.crazyName?.replace('.crazy', '') || 'Unknown'}
                        </h4>
                        <span className="text-xs text-gray-500">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {formatLastActivity(user.lastActivity)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400 truncate font-mono">
                          {user.address.slice(0, 6)}...{user.address.slice(-4)}
                        </p>
                        
                        {isOnline && (
                          <span className="text-xs text-green-400 font-medium">
                            Online
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700/50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>ENS Chat Dapp v1.0</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Connected</span>
          </div>
        </div>
      </div>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAddContact && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddContact(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-[25%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4 bg-gray-800/95 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 z-[101] shadow-2xl max-h-[70vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Add Contact</h3>
                <button
                  onClick={() => setShowAddContact(false)}
                  className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400 hover:text-white" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Wallet Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={contactAddress}
                    onChange={(e) => setContactAddress(e.target.value)}
                    placeholder="0x1234567890abcdef1234567890abcdef12345678"
                    className="w-full px-4 py-3 bg-gray-700/70 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Display Name <span className="text-gray-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 bg-gray-700/70 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                  />
                </div>

                <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3">
                  <p className="text-sm text-blue-300">
                    💡 Add any Ethereum wallet address to start chatting. If they have a registered .ens name, it will show automatically.
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddContact(false)}
                  className="flex-1 px-4 py-3 bg-gray-600/80 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddContact}
                  disabled={!contactAddress.trim()}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg hover:from-purple-700 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Add Contact
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Sidebar