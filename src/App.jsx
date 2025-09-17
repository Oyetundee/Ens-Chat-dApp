import React, { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { Toaster } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

// Components
import WalletConnect from './components/Auth/WalletConnect'
import CrazyRegistration from './components/Registration/CrazyRegistration'
import MainChatInterface from './components/Layout/MainChatInterface'

// Hooks and Stores
import { useUserStore } from './stores/userStore'
import { useChatStore } from './stores/chatStore'
import { useRealTimeEvents, useConnectionStatus } from './hooks/useRealTimeEvents'
import { useReadContract } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './constants/contract'

function App() {
  const { address, isConnected } = useAccount()
  const { currentUser, setCurrentUser } = useUserStore()
  const { clearChatData } = useChatStore()
  const [forceRegistrationCheck, setForceRegistrationCheck] = useState(0)
  
  // Initialize real-time event listeners
  useRealTimeEvents()
  useConnectionStatus()

  // Get current user info from contract
  const { data: userInfo, refetch: refetchUserInfo } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getUserInfo',
    args: [address],
    query: {
      enabled: !!address && isConnected,
    }
  })

  // Determine registration status with stronger local override priority
  const isRegistered = (currentUser?.isRegistered === true) || 
                      (userInfo && userInfo.isRegistered) || 
                      false

  // Debug logging
  console.log('🔍 Registration state check:', {
    'currentUser?.isRegistered': currentUser?.isRegistered,
    'userInfo?.isRegistered': userInfo?.isRegistered,
    'final isRegistered': isRegistered,
    'forceRegistrationCheck': forceRegistrationCheck
  })

  // Update user store when wallet connects/disconnects or user info changes
  useEffect(() => {
    if (isConnected && address && userInfo) {
      // Only update if local state doesn't already show registered
      // This prevents overriding successful registration with stale contract data
      if (!currentUser?.isRegistered) {
        setCurrentUser({
          address,
          crazyName: userInfo.ensName ? `${userInfo.ensName}.crazy` : null,
          isRegistered: userInfo.isRegistered,
          registrationTime: Number(userInfo.registrationTime),
        })
      }
    } else if (!isConnected) {
      setCurrentUser(null)
      clearChatData()
    }
  }, [isConnected, address, userInfo, setCurrentUser, clearChatData, currentUser?.isRegistered])

  // Handle successful registration
  const handleRegistrationSuccess = () => {
    console.log('🎉 Registration success callback triggered in App!')
    console.log('Current user before update:', currentUser)
    console.log('Current isRegistered state:', isRegistered)
    
    // Force immediate state change
    setForceRegistrationCheck(prev => {
      console.log('Forcing registration check update:', prev + 1)
      return prev + 1
    })
    
    // Refetch contract data in background after UI has switched
    setTimeout(async () => {
      try {
        console.log('Refetching user info from contract...')
        await refetchUserInfo()
        console.log('Contract info refetched successfully')
      } catch (error) {
        console.error('Error refetching user info:', error)
      }
    }, 2000)
  }

  // Determine which component to render
  const renderCurrentView = () => {
    if (!isConnected) {
      return <WalletConnect />
    }

    if (!isRegistered) {
      return <CrazyRegistration onRegistrationSuccess={handleRegistrationSuccess} />
    }

    return <MainChatInterface />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Effects */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-cyan-900/10"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      {/* Floating orbs */}
      <div className="fixed top-20 left-20 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-pulse"></div>
      <div className="fixed bottom-20 right-20 w-48 h-48 bg-cyan-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
      <div className="fixed top-1/2 right-1/4 w-24 h-24 bg-pink-500/20 rounded-full blur-xl animate-pulse delay-500"></div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={isConnected ? (isRegistered ? 'chat' : 'register') : 'connect'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="relative z-10"
        >
          {renderCurrentView()}
        </motion.div>
      </AnimatePresence>

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(17, 24, 39, 0.95)',
            color: '#fff',
            border: '1px solid rgba(107, 114, 128, 0.3)',
            backdropFilter: 'blur(10px)',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/50 text-white text-xs p-2 rounded font-mono">
          <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
          <div>Address: {address?.slice(0, 6)}...{address?.slice(-4)}</div>
          <div>Registered: {isRegistered ? 'Yes' : 'No'}</div>
          <div>User: {currentUser?.crazyName || 'None'}</div>
          <div>Contract Registered: {userInfo?.isRegistered ? 'Yes' : 'No'}</div>
          <div>Local Registered: {currentUser?.isRegistered ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  )
}

export default App