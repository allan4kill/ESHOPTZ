<script setup>
import { ref } from 'vue'
import { useProductsStore } from '/src/stores/products.js'

const productsStore = useProductsStore()

const name = ref('')
const description = ref('')
const price = ref('')
const imageFile = ref(null)
const imagePreview = ref('')
const uploadProgress = ref(0)
const category = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const loginError = ref('')
const passwordInput = ref('')
const uploadAccessGranted = ref(sessionStorage.getItem('uploadAccess') === 'true')
const loading = ref(false)
const maxImageSize = 500 * 1024 // 500 KB
const accessPassword = 'GodobAdminTeam2026'

const validateUploadPassword = () => {
  if (passwordInput.value === accessPassword) {
    uploadAccessGranted.value = true
    loginError.value = ''
    sessionStorage.setItem('uploadAccess', 'true')
  } else {
    loginError.value = 'Incorrect password. Please try again.'
  }
}

function resetForm() {
  name.value = ''
  description.value = ''
  price.value = ''
  imageFile.value = null
  imagePreview.value = ''
  uploadProgress.value = 0
  category.value = ''
}

function handleImageChange(event) {
  const file = event.target.files?.[0]
  if (!file) {
    imageFile.value = null
    imagePreview.value = ''
    return
  }

  if (!file.type.startsWith('image/')) {
    errorMessage.value = 'Please select a valid image file.'
    imageFile.value = null
    imagePreview.value = ''
    return
  }

  if (file.size > maxImageSize) {
    errorMessage.value = 'Please choose an image smaller than 500KB.'
    imageFile.value = null
    imagePreview.value = ''
    return
  }

  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
  errorMessage.value = ''
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function uploadImageFile() {
  if (!imageFile.value) {
    throw new Error('Please select an image to upload.')
  }

  const file = imageFile.value
  uploadProgress.value = 0

  const imageDataUrl = await readFileAsDataUrl(file)
  uploadProgress.value = 100
  return imageDataUrl
}

async function submitProduct() {
  if (!name.value || !description.value || !price.value || !category.value || !imageFile.value) {
    errorMessage.value = 'Please complete all required fields and select an image.'
    return
  }

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  uploadProgress.value = 0

  try {
    const uploadedImageUrl = await uploadImageFile()
    await productsStore.createProduct({
      sellerId: 'guest',
      name: name.value,
      description: description.value,
      price: price.value,
      imageUrl: uploadedImageUrl,
      category: category.value
    })

    successMessage.value = 'Product saved successfully. Customers can now view it on the home page.'
    resetForm()
    await productsStore.fetchCategories()
  } catch (error) {
    console.error('Seller product upload failed:', error)
    errorMessage.value = error.message || 'Unable to save product. Please try again.'
  } finally {
    loading.value = false
    uploadProgress.value = 0
  }
}
</script>

<template>
  <section class="min-h-screen bg-slate-950 py-16 px-4 text-white">
    <div v-if="!uploadAccessGranted" class="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl">
      <div class="mb-10 text-center">
        <div class="flex justify-center mb-6">
          <img src="/1000173935.jpg" alt="Godob logo" class="h-24 w-auto rounded-full border border-white/10 shadow-lg" />
        </div>
        <p class="text-sm uppercase tracking-[0.3em] text-rose-300">Seller Access</p>
        <h1 class="mt-4 text-4xl font-semibold text-white">Please pay to be a seller</h1>
        <p class="mt-3 max-w-2xl mx-auto text-slate-300">Thank you for choosing godob. Enter the password below to continue to the product upload area.</p>
      </div>
      <div class="space-y-6">
        <label class="block space-y-2 text-sm text-slate-200">
          <span>Password</span>
          <input type="password" v-model="passwordInput" placeholder="Enter password" class="w-full rounded-3xl border border-slate-700 bg-slate-950/80 px-5 py-4 text-white outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20" />
        </label>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button @click="validateUploadPassword" type="button" class="inline-flex items-center justify-center rounded-3xl bg-rose-500 px-6 py-4 text-base font-semibold text-white transition hover:bg-rose-600">
            Enter
          </button>
          <p class="text-xs text-slate-400">Password required to enter the upload area.</p>
        </div>
        <p v-if="loginError" class="text-rose-300 text-sm">{{ loginError }}</p>
      </div>
    </div>

    <div v-else class="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl">
      <div class="mb-10 text-center">
        <p class="text-sm uppercase tracking-[0.3em] text-rose-300">Upload Product</p>
        <h1 class="mt-4 text-4xl font-semibold text-white">Add a Product</h1>
        <p class="mt-3 max-w-2xl mx-auto text-slate-300">Upload your product details so customers can see them immediately on the home page.</p>
      </div>

      <div class="space-y-6">
        <div class="grid gap-6 sm:grid-cols-2">
          <label class="block space-y-2 text-sm text-slate-200">
            <span>Name</span>
            <input type="text" v-model="name" placeholder="Product name" class="w-full rounded-3xl border border-slate-700 bg-slate-950/80 px-5 py-4 text-white outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20" />
          </label>

          <label class="block space-y-2 text-sm text-slate-200">
            <span>Category</span>
            <input type="text" v-model="category" placeholder="Example: Electronics" class="w-full rounded-3xl border border-slate-700 bg-slate-950/80 px-5 py-4 text-white outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20" />
          </label>
        </div>

        <label class="block space-y-2 text-sm text-slate-200">
          <span>Description</span>
          <textarea v-model="description" rows="4" placeholder="Describe the product" class="w-full rounded-3xl border border-slate-700 bg-slate-950/80 px-5 py-4 text-white outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20"></textarea>
        </label>

        <div class="grid gap-6 sm:grid-cols-2">
          <label class="block space-y-2 text-sm text-slate-200">
            <span>Price (Tsh)</span>
            <input type="number" min="0" v-model="price" placeholder="15000" class="w-full rounded-3xl border border-slate-700 bg-slate-950/80 px-5 py-4 text-white outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20" />
          </label>

          <label class="block space-y-2 text-sm text-slate-200">
            <span>Product Image</span>
            <input type="file" accept="image/*" @change="handleImageChange" class="w-full text-sm text-slate-200 file:mr-4 file:rounded-full file:border-0 file:bg-rose-500 file:px-4 file:py-2 file:text-white file:transition file:hover:bg-rose-600" />
            <p class="text-xs text-slate-400 mt-1">Maximum file size: 500KB.</p>
          </label>
        </div>

        <div v-if="imagePreview" class="rounded-3xl border border-slate-700 p-3">
          <p class="text-sm text-slate-300">Image preview</p>
          <img :src="imagePreview" alt="Selected product" class="mt-3 h-48 w-full rounded-3xl object-cover" />
        </div>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button @click="submitProduct" type="button" :disabled="loading" class="inline-flex items-center justify-center rounded-3xl bg-rose-500 px-6 py-4 text-base font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60">
            <span v-if="!loading">Upload Product</span>
            <span v-else>Saving{{ uploadProgress ? ` (${uploadProgress}%)` : '' }}...</span>
          </button>
          <div class="text-right text-sm text-slate-400">Your product will appear on the store immediately after upload.</div>
        </div>

        <div v-if="loading && uploadProgress" class="rounded-3xl border border-slate-700 bg-slate-950/90 p-3">
          <div class="mb-2 text-sm text-slate-300">Uploading image: {{ uploadProgress }}%</div>
          <div class="h-3 overflow-hidden rounded-full bg-slate-800">
            <div class="h-full rounded-full bg-rose-500 transition-all" :style="{ width: uploadProgress + '%' }"></div>
          </div>
        </div>

        <div class="text-sm text-slate-400">Large images may take a little longer to upload depending on your connection.</div>

        <div v-if="successMessage" class="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-100">{{ successMessage }}</div>
        <div v-if="errorMessage" class="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-100">{{ errorMessage }}</div>
      </div>
    </div>
  </section>
</template>
