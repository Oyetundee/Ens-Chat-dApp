import axios from 'axios'

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT

// Upload image to IPFS via Pinata
export const uploadToIPFS = async (file) => {
  if (!file) {
    throw new Error('No file provided')
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File size must be less than 10MB')
  }

  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload JPG, PNG, GIF, or WebP images.')
  }

  try {
    const formData = new FormData()
    formData.append('file', file)
    
    // Add metadata
    const metadata = {
      name: `Profile-${Date.now()}`,
      keyvalues: {
        type: 'profile-image',
        uploadedAt: new Date().toISOString()
      }
    }
    formData.append('pinataMetadata', JSON.stringify(metadata))
    
    // Pinata options
    const options = {
      cidVersion: 0,
    }
    formData.append('pinataOptions', JSON.stringify(options))

    // Choose authentication method based on available credentials
    let headers = {
      'Content-Type': 'multipart/form-data',
    }

    if (PINATA_JWT) {
      // Use JWT if available (recommended)
      headers['Authorization'] = `Bearer ${PINATA_JWT}`
    } else if (PINATA_API_KEY && PINATA_SECRET_KEY) {
      // Use API key/secret as fallback
      headers['pinata_api_key'] = PINATA_API_KEY
      headers['pinata_secret_api_key'] = PINATA_SECRET_KEY
    } else {
      throw new Error('Pinata credentials not configured. Please add VITE_PINATA_JWT or VITE_PINATA_API_KEY/VITE_PINATA_SECRET_KEY to your .env file')
    }

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      { headers }
    )

    if (response.data && response.data.IpfsHash) {
      return {
        hash: response.data.IpfsHash,
        url: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`,
        size: response.data.PinSize
      }
    } else {
      throw new Error('Invalid response from Pinata')
    }
  } catch (error) {
    console.error('IPFS upload error:', error)
    
    if (error.response) {
      // Pinata API error
      const errorMessage = error.response.data?.error?.details || error.response.data?.message || 'Upload failed'
      throw new Error(`Pinata error: ${errorMessage}`)
    } else if (error.request) {
      // Network error
      throw new Error('Network error. Please check your internet connection.')
    } else {
      // Other error
      throw new Error(error.message || 'Failed to upload to IPFS')
    }
  }
}

// Get IPFS URL from hash
export const getIPFSUrl = (hash) => {
  if (!hash) return null
  return `https://gateway.pinata.cloud/ipfs/${hash}`
}

// Validate IPFS hash format
export const isValidIPFSHash = (hash) => {
  if (!hash) return false
  // IPFS hash validation (basic check for CID v0 and v1)
  return /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58}|z[1-9A-HJ-NP-Za-km-z]{48})$/.test(hash)
}

// Compress image before upload (optional optimization)
export const compressImage = (file, maxWidth = 800, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      canvas.width = width
      canvas.height = height
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(resolve, file.type, quality)
    }
    
    img.src = URL.createObjectURL(file)
  })
}