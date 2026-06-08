import axios from 'axios'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'Vue_upload'
const CLOUDINARY_API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY
const CLOUDINARY_API_SECRET = import.meta.env.VITE_CLOUDINARY_API_SECRET

function ensureCloudinaryConfig() {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.')
  }
}

function ensureCloudinaryAdminConfig() {
  if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary admin credentials are not configured. Set VITE_CLOUDINARY_API_KEY and VITE_CLOUDINARY_API_SECRET.')
  }
}

function getCloudinaryPublicId(imageUrl) {
  try {
    const url = new URL(imageUrl)
    if (!url.hostname.includes('cloudinary.com')) {
      return null
    }

    const pathMatch = url.pathname.match(/\/(?:image|video|raw)\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/)
    if (!pathMatch) {
      return null
    }

    return decodeURIComponent(pathMatch[1])
  } catch (error) {
    return null
  }
}

async function sha1(text) {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-1', data)
  return Array.from(new Uint8Array(hashBuffer)).map(byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function uploadImageToCloudinary(file) {
  ensureCloudinaryConfig()

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)

  const res = await axios.post(endpoint, formData)
  if (!res?.data?.secure_url) {
    throw new Error(res?.data?.error?.message || 'Cloudinary upload failed.')
  }

  return res.data.secure_url
}

export async function deleteImageFromCloudinary(imageUrl) {
  ensureCloudinaryConfig()
  ensureCloudinaryAdminConfig()

  const publicId = getCloudinaryPublicId(imageUrl)
  if (!publicId) {
    throw new Error('Unable to determine the Cloudinary public ID from the image URL.')
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const signature = await sha1(`public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`)
  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`
  const formData = new FormData()
  formData.append('public_id', publicId)
  formData.append('timestamp', String(timestamp))
  formData.append('api_key', CLOUDINARY_API_KEY)
  formData.append('signature', signature)
  formData.append('invalidate', 'true')

  const res = await axios.post(endpoint, formData)
  if (!res?.data || res.data.result !== 'ok') {
    throw new Error(res?.data?.error?.message || 'Cloudinary delete failed.')
  }

  return res.data
}
