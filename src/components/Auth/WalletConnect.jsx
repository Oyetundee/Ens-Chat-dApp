import React from 'react'
import { motion } from 'framer-motion'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { MessageSquare, Zap, Users, Shield } from 'lucide-react'

const WalletConnect = () => {
  const features = [
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Real-time Chat",
      description: "Instant messaging with your ENS identity"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: ".ens Domains", 
      description: "Register your unique .ens name for easy identification"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Lightning Fast",
      description: "Real-time messaging with no gas fees per message"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Decentralized Identity",
      description: "Your identity, your keys, your control"
    }
  ]

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-4xl"
      >
        {/* Hero Section */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12"
        >
          <div className="relative inline-block mb-8">
            <motion.h1 
              className="text-6xl md:text-8xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4"
              animate={{ 
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
              }}
              transition={{ duration: 5, repeat: Infinity }}
              style={{ backgroundSize: '200% auto' }}
            >
              ENS Chat Dapp
            </motion.h1>
            <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400/20 via-purple-400/20 to-pink-400/20 rounded-lg blur-xl animate-pulse"></div>
          </div>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            The first real-time chat dapp powered by{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 font-bold">
              ENS domains
            </span>
            <br />
            Connect your wallet and join the conversation!
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="group relative"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/50 to-pink-600/50 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:bg-gray-800/60 transition-all duration-300">
                <div className="text-cyan-400 mb-4 flex justify-center group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Connect Button Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="relative"
        >
          <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/30 to-cyan-600/30 rounded-2xl blur-xl"></div>
          <div className="relative bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to start chatting?</h2>
            <p className="text-gray-300 mb-6">
              Connect your wallet to register your .ens domain and start real-time messaging!
            </p>
            
            {/* Custom Connect Button Wrapper */}
            <div className="flex justify-center">
              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openChainModal,
                  openConnectModal,
                  authenticationStatus,
                  mounted,
                }) => {
                  const ready = mounted && authenticationStatus !== 'loading'
                  const connected =
                    ready &&
                    account &&
                    chain &&
                    (!authenticationStatus ||
                      authenticationStatus === 'authenticated')

                  return (
                    <div
                      {...(!ready && {
                        'aria-hidden': true,
                        'style': {
                          opacity: 0,
                          pointerEvents: 'none',
                          userSelect: 'none',
                        },
                      })}
                    >
                      {(() => {
                        if (!connected) {
                          return (
                            <motion.button
                              onClick={openConnectModal}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="relative px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
                            >
                              <span className="relative z-10">Connect Wallet</span>
                              <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-cyan-700 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                            </motion.button>
                          )
                        }

                        if (chain.unsupported) {
                          return (
                            <motion.button
                              onClick={openChainModal}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-xl transition-all duration-300"
                            >
                              Wrong Network
                            </motion.button>
                          )
                        }

                        return (
                          <div className="flex items-center gap-4">
                            <motion.button
                              onClick={openChainModal}
                              whileHover={{ scale: 1.02 }}
                              className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 text-white rounded-lg transition-all duration-200"
                            >
                              {chain.hasIcon && (
                                <img
                                  alt={chain.name ?? 'Chain icon'}
                                  src={chain.iconUrl}
                                  className="w-5 h-5 rounded-full"
                                />
                              )}
                              <span>{chain.name}</span>
                            </motion.button>

                            <motion.button
                              onClick={openAccountModal}
                              whileHover={{ scale: 1.02 }}
                              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-cyan-700 transition-all duration-200"
                            >
                              {account.displayName}
                              {account.displayBalance && (
                                <span className="ml-2 opacity-75">
                                  ({account.displayBalance})
                                </span>
                              )}
                            </motion.button>
                          </div>
                        )
                      })()}
                    </div>
                  )
                }}
              </ConnectButton.Custom>
            </div>
            
            <p className="text-gray-500 text-sm mt-4">
              New to Web3? Get started with{' '}
              <a
                href="https://metamask.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline transition-colors"
              >
                MetaMask
              </a>
            </p>
          </div>
        </motion.div>

        {/* Stats Preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="mt-16 grid grid-cols-3 gap-8"
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-cyan-400 mb-2">⚡</div>
            <div className="text-sm text-gray-400">Real-time Updates</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">🔒</div>
            <div className="text-sm text-gray-400">ENS Identity</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-pink-400 mb-2">💬</div>
            <div className="text-sm text-gray-400">No Gas Fees</div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default WalletConnect