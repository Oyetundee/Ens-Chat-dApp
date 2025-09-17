import React, { useEffect, useRef, useState } from 'react'
import { useAccount } from 'wagmi'
import { useChatStore } from '../../stores/chatStore'
import { useUserStore } from '../../stores/userStore'
import { Send, Hash, User, Clock, CheckCheck } from 'lucide-react'
import toast from 'react-hot-toast'

const ChatArea = () => {
  const { address } = useAccount()
  const messagesEndRef = useRef(null)
  const wsRef = useRef(null)
  const [messageInput, setMessageInput] = useState('')
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [localMessages, setLocalMessages] = useState([])

  const { activeChat } = useChatStore()
  const { currentUser, getUserByAddress } = useUserStore()

  const isGroupChat = activeChat === 'group'

  // WebSocket connection
  useEffect(() => {
    if (!address || !currentUser?.isRegistered) return

    const wsUrl = 'ws://localhost:8080'
    console.log('Connecting to WebSocket:', wsUrl)
    
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setConnectionStatus('connected')
      console.log('Connected to chat server')
      
      ws.send(JSON.stringify({
        type: 'auth',
        address: address,
        ensName: currentUser.ensName || currentUser.crazyName || address,
        timestamp: Date.now()
      }))
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'message') {
          // Only add messages from OTHER users, not yourself
          if (data.from.toLowerCase() !== address.toLowerCase()) {
            setLocalMessages(prev => [...prev, {
              id: data.id,
              from: data.from,
              to: data.to,
              content: data.content,
              timestamp: data.timestamp,
              fromName: data.fromName,
              isDelivered: true
            }])
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    ws.onclose = () => {
      setConnectionStatus('disconnected')
      console.log('Disconnected from chat server')
    }

    ws.onerror = (error) => {
      setConnectionStatus('error')
      console.error('WebSocket error:', error)
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [address, currentUser])

  // Remove auto-scroll entirely to prevent bouncing
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
  }

  // Send message via WebSocket (NO METAMASK!)
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!messageInput.trim() || connectionStatus !== 'connected') return

    const messageContent = messageInput.trim()
    setMessageInput('')

    const message = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      from: address,
      to: isGroupChat ? 'group' : activeChat,
      content: messageContent,
      timestamp: Math.floor(Date.now() / 1000),
      fromName: currentUser?.ensName?.replace('.ens', '') || currentUser?.crazyName?.replace('.crazy', '') || 'You',
      isPending: true
    }

    // Add to local messages immediately
    setLocalMessages(prev => [...prev, message])

    // Scroll to bottom when new message is added
    setTimeout(() => scrollToBottom(), 100)

    // Send via WebSocket
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({
          type: 'send_message',
          ...message
        }))
        
        // Update to delivered after short delay
        setTimeout(() => {
          setLocalMessages(prev => 
            prev.map(msg => 
              msg.id === message.id 
                ? { ...msg, isPending: false, isDelivered: true }
                : msg
            )
          )
        }, 200)
        
        toast.success('Message sent!')
        
      } catch (error) {
        console.error('Failed to send message:', error)
        toast.error('Failed to send message')
      }
    }
  }

  // Message component
  const MessageBubble = ({ message, index }) => {
    const isOwn = message.from.toLowerCase() === address?.toLowerCase()
    
    let senderName = 'Unknown'
    if (message.fromName && message.fromName !== 'You') {
      senderName = message.fromName
    } else if (isOwn) {
      senderName = 'You'
    } else if (message.from) {
      senderName = `${message.from.slice(0, 6)}...${message.from.slice(-4)}`
    }

    const messageDate = new Date(message.timestamp * 1000)
    const timeDisplay = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
        <div className={`max-w-xs lg:max-w-md`}>
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
            } ${message.isPending ? 'opacity-70' : ''}`}
          >
            {/* Message content */}
            <div className="break-words whitespace-pre-wrap mb-2">
              {message.content}
            </div>
            
            {/* Time and status */}
            <div className={`flex items-center justify-end gap-1 text-xs ${
              isOwn ? 'text-purple-100/80' : 'text-gray-400'
            }`}>
              <span>{timeDisplay}</span>
              
              {isOwn && (
                <div className="flex items-center">
                  {message.isPending && <Clock className="w-3 h-3 ml-1" />}
                  {message.isDelivered && <CheckCheck className="w-3 h-3 ml-1 text-purple-200" />}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Connection Status */}
      {connectionStatus !== 'connected' && (
        <div className={`px-4 py-2 text-center text-sm ${
          connectionStatus === 'connecting' ? 'bg-yellow-900/30 text-yellow-300' :
          'bg-red-900/30 text-red-300'
        }`}>
          {connectionStatus === 'connecting' && 'Connecting to chat server...'}
          {connectionStatus === 'error' && 'Connection error - check if server is running'}
          {connectionStatus === 'disconnected' && 'Disconnected from server'}
        </div>
      )}

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-1" 
        id="chat-messages"
        style={{ height: 'calc(100vh - 200px)' }}
      >
        {/* Welcome Message */}
        {localMessages.length === 0 && (
          <div className="text-center py-16">
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
              Real-time messaging with no gas fees!
            </p>
          </div>
        )}

        {/* Messages */}
        {localMessages.map((message, index) => (
          <MessageBubble key={message.id} message={message} index={index} />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 bg-gray-800/60 backdrop-blur-sm border-t border-gray-700/50">
        <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
          <div className="flex-1">
            <textarea
              value={messageInput}
              onChange={(e) => {
                setMessageInput(e.target.value)
              }}
              placeholder="Type your message..."
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 resize-none focus:outline-none focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20 transition-all"
              rows={1}
              disabled={connectionStatus !== 'connected'}
              style={{ minHeight: '48px', maxHeight: '120px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage(e)
                }
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!messageInput.trim() || connectionStatus !== 'connected'}
            className={`p-3 rounded-xl font-medium transition-all flex items-center justify-center ${
              messageInput.trim() && connectionStatus === 'connected'
                ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:from-purple-700 hover:to-cyan-700 shadow-lg'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        {/* Status info */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>
            {connectionStatus === 'connected' ? 'Real-time messaging • No gas fees' : 'Connecting...'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default ChatArea