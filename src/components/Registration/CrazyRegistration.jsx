import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useWriteContract, useAccount } from 'wagmi'
import { useUserStore } from '../../stores/userStore'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../../constants/contract'
import { uploadToIPFS, compressImage } from '../../utils/ipfs'
import { User, Check, Loader2, Upload, Sparkles, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const CrazyRegistration = ({ onRegistrationSuccess }) => {
  const { address } = useAccount()
  const [username, setUsername] = useState('')
  const [profileImage, setProfileImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [ipfsHash, setIpfsHash] = useState('')
  const [error, setError] = useState('')
  const [isRegistrationComplete, setIsRegistrationComplete] = useState(false)

  const { setCurrentUser } = useUserStore()

  // Register user
  const { writeContract, isPending: isRegistering, isSuccess } = useWriteContract({
    mutation: {
      onSuccess: (hash) => {
        toast.success(`Welcome to ENS Chat! Your domain ${username}.ens is registered!`, {
          duration: 5000,
          style: {
            background: 'linear-gradient(90deg, #8B5CF6 0%, #06B6D4 100%)',
          }
        })
        
        // Update user store immediately with current wallet address
        const userData = {
          address: address, // Make sure we have the current wallet address
          ensName: `${username}.ens`,
          isRegistered: true,
          registrationTime: Date.now(),
          ipfsImageHash: ipfsHash
        }
        
        console.log('Setting current user with:', userData)
        setCurrentUser(userData)
        
        // Debug: Check if the store was actually updated
        setTimeout(() => {
          const storeState = useUserStore.getState()
          console.log('Store state after setCurrentUser:', {
            currentUser: storeState.currentUser,
            isRegistered: storeState.isRegistered,
            isConnected: storeState.isConnected
          })
        }, 100)

        // Mark registration as complete immediately
        setIsRegistrationComplete(true)

        console.log('Registration success - calling parent callback')

        // Call the callback to trigger immediate navigation in parent
        if (onRegistrationSuccess) {
          console.log('Callback exists, calling it now')
          // Call immediately, no delay
          onRegistrationSuccess()
        } else {
          console.log('No callback provided - this is the problem!')
        }
      },
      onError: (error) => {
        setError(error.message)
        toast.error('Registration failed. Please try again.')
      }
    }
  })

  // Handle image upload
  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      // Validate file
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image must be smaller than 10MB')
        return
      }

      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload JPG, PNG, GIF, or WebP images only')
        return
      }

      setProfileImage(file)
      setIsUploadingImage(true)
      setError('')
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)

      // Compress and upload to IPFS
      const compressedFile = await compressImage(file, 400, 0.8)
      const result = await uploadToIPFS(compressedFile)
      
      setIpfsHash(result.hash)
      toast.success('Profile image uploaded successfully!')
      
    } catch (err) {
      console.error('Image upload error:', err)
      setError(err.message)
      toast.error(err.message)
      setProfileImage(null)
      setImagePreview(null)
      setIpfsHash('')
    } finally {
      setIsUploadingImage(false)
    }
  }

  // Handle registration
  const handleRegister = async () => {
    console.log('Register button clicked!')
    console.log('Username:', username)
    console.log('Profile Image:', profileImage)
    console.log('IPFS Hash:', ipfsHash)
    
    if (!username) {
      toast.error('Please enter a username')
      return
    }

    if (!profileImage || !ipfsHash) {
      toast.error('Profile image is required!')
      return
    }

    setError('')
    
    try {
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'register',
        args: [username]
      })
    } catch (err) {
      console.error('Registration error:', err)
      setError(err.message)
      toast.error(`Registration failed: ${err.message}`)
    }
  }

  // Validation  
  const isValidUsername = username.length >= 3 && username.length <= 20 && /^[a-z0-9]+$/.test(username)
  const hasRequiredImage = profileImage && ipfsHash && !isUploadingImage
  const canRegister = isValidUsername && hasRequiredImage && !isRegistering

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mb-12"
        >
          <div className="relative inline-block mb-6">
            <Sparkles className="w-16 h-16 text-purple-400 mx-auto animate-pulse" />
            <div className="absolute -inset-2 bg-purple-400/20 rounded-full blur-lg animate-pulse"></div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            Get Your .ens Name
          </h1>
          
          <p className="text-lg text-gray-300 leading-relaxed">
            Create your unique identity in the ENS Chat universe.
            <br />
            <span className="text-purple-400 font-semibold">Username + Profile Picture Required</span>
          </p>
        </motion.div>

        {/* Registration Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/50 to-cyan-600/50 rounded-2xl blur opacity-30"></div>
          <div className="relative bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
            
            {/* Profile Image Upload */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-300 mb-4">
                Profile Image <span className="text-red-400">*Required</span>
              </label>
              
              <div className="flex items-center gap-6">
                {/* Image Preview */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-600 to-cyan-600 flex items-center justify-center overflow-hidden border-4 border-purple-400/30">
                    {imagePreview ? (
                      <img 
                        src={imagePreview} 
                        alt="Profile preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 text-white" />
                    )}
                  </div>
                  
                  {/* Upload status indicator */}
                  {isUploadingImage && (
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                  
                  {ipfsHash && (
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  {imagePreview && !isUploadingImage && (
                    <button
                      onClick={() => {
                        setImagePreview(null)
                        setProfileImage(null)
                        setIpfsHash('')
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Upload Button */}
                <div className="flex-1">
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={isUploadingImage}
                    />
                    <div className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 border-dashed transition-all duration-200 ${
                      ipfsHash 
                        ? 'border-green-400 bg-green-400/10 text-green-400' 
                        : 'border-gray-600 hover:border-purple-400 bg-gray-700/50 hover:bg-gray-700 text-gray-300'
                    }`}>
                      {isUploadingImage ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : ipfsHash ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Upload className="w-5 h-5" />
                      )}
                      <div>
                        <div className="font-medium">
                          {isUploadingImage ? 'Uploading to IPFS...' : ipfsHash ? 'Image uploaded!' : 'Upload Profile Image'}
                        </div>
                        <div className="text-xs opacity-75">
                          {ipfsHash ? `IPFS: ${ipfsHash.slice(0, 10)}...` : 'Max 10MB. JPG, PNG, GIF, WebP'}
                        </div>
                      </div>
                    </div>
                  </label>
                  
                  {!ipfsHash && (
                    <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>Profile image is required to register</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Username Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Choose Your .ens Name <span className="text-red-400">*Required</span>
              </label>
              
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                  placeholder="yourname"
                  className="w-full px-4 py-4 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-200 pr-20"
                  maxLength="20"
                  disabled={isRegistering || isRegistrationComplete}
                />
                
                <div className="absolute right-4 top-4 flex items-center gap-2">
                  <span className="text-purple-300 font-medium">.ens</span>
                </div>
              </div>

              {/* Preview */}
              {username && ipfsHash && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 p-4 bg-green-900/20 border border-green-600/30 rounded-lg"
                >
                  <p className="text-green-300 text-sm mb-2">Ready to register:</p>
                  <div className="flex items-center gap-3">
                    <img 
                      src={imagePreview} 
                      alt="Profile" 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <p className="text-xl font-bold text-white font-mono">
                      {username}.ens
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Validation Rules */}
              <div className="mt-4 text-xs text-gray-500 space-y-1">
                <p>• 3-20 characters long</p>
                <p>• Only lowercase letters and numbers</p>
                <p>• Profile image required (stored on IPFS)</p>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-6 p-4 bg-red-900/50 border border-red-600/50 rounded-lg text-red-300 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Success Message */}
            {(isSuccess || isRegistrationComplete) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 bg-green-900/50 border border-green-600/50 rounded-lg text-green-300 text-sm flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <div>
                  <p className="font-semibold">Registration successful! Welcome to ENS Chat!</p>
                  <p className="text-xs mt-1 opacity-75">Taking you to the chat in a moment...</p>
                </div>
              </motion.div>
            )}

            {/* Register Button */}
            <motion.button
              onClick={(e) => {
                e.preventDefault()
                if (canRegister && !isRegistrationComplete) {
                  handleRegister()
                } else {
                  if (!isValidUsername) toast.error('Please enter a valid username (3-20 characters, letters and numbers only)')
                  else if (!hasRequiredImage) toast.error('Please upload a profile image first')
                }
              }}
              disabled={!canRegister || isRegistrationComplete}
              whileHover={canRegister && !isRegistrationComplete ? { scale: 1.02 } : {}}
              whileTap={canRegister && !isRegistrationComplete ? { scale: 0.98 } : {}}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                canRegister && !isRegistrationComplete
                  ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:from-purple-700 hover:to-cyan-700 shadow-lg hover:shadow-purple-500/25 cursor-pointer'
                  : isRegistrationComplete
                  ? 'bg-green-600 text-white cursor-default'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isRegistering ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Registering Your .ens Name...
                </span>
              ) : (isSuccess || isRegistrationComplete) ? (
                <span className="flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" />
                  Registered Successfully! Loading Chat...
                </span>
              ) : !hasRequiredImage ? (
                'Upload Profile Image First'
              ) : (
                `Register ${username || 'yourname'}.ens`
              )}
            </motion.button>

            {/* Info */}
            <div className="mt-6 text-center text-gray-400 text-sm">
              <p>Registration is <span className="text-purple-400 font-semibold">FREE</span> during beta!</p>
              <p className="mt-2">Your .ens name and profile will be permanently linked to your wallet address.</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default CrazyRegistration