import axios from 'axios'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'Vue_upload'

function ensureCloudinaryConfig() {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.')
  }
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
