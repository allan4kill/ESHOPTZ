<script setup>
import { ref, onMounted, computed, reactive } from 'vue'
import { useProductsStore } from '../stores/products.js'
import { formatPrice } from '/src/utils/priceFormatter.js'

const productsStore = useProductsStore()
const selectedProduct = ref(null)
const showContact = ref(false)
const zoomLevel = ref(1)
const productImageIndex = reactive({})
const selectedProductImageIndex = ref(0)

// Use store data
const products = computed(() => productsStore.products)
const loading = computed(() => productsStore.loading)

function getProductImageUrl(product) {
  const images = getProductImages(product)
  return images[0] || product?.image_url || ''
}

function buildWhatsAppLink(product) {
  if (!product) {
    return 'https://wa.me/+255615819837'
  }

  const productImageUrl = getProductImageUrl(product)
  const priceText = product.price != null ? `for Tsh ${formatPrice(product.price)}` : ''
  const message = `Hello, I'm interested in buying ${product.name} (ID: ${product.id}) ${priceText}. Product image: ${productImageUrl}`
  return `https://wa.me/+255615819837?text=${encodeURIComponent(message)}`
}

const getWhatsAppLink = computed(() => buildWhatsAppLink(selectedProduct.value))

const getEmailLink = computed(() => {
  if (selectedProduct.value) {
    const subject = `Interest in ${selectedProduct.value.name} (ID: ${selectedProduct.value.id})`;
    const body = `Hello, I'm interested in buying ${selectedProduct.value.name} (ID: ${selectedProduct.value.id}) for Tsh ${selectedProduct.value.price}`;
    return `mailto:fantastchacker@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
  return 'mailto:fantastchacker@gmail.com';
})

function buyViaWhatsApp(product) {
  const url = buildWhatsAppLink(product)
  window.open(url, '_blank')
}

function getProductImages(product) {
  if (!product) return []
  return product.image_urls?.length ? product.image_urls : product.image_url ? [product.image_url] : []
}

function getProductImage(product) {
  const images = getProductImages(product)
  const index = productImageIndex[product.id] ?? 0
  return images[index] || product.image_url || '/src/components/images/placeholder.png'
}

function showDetails(product) {
  selectedProduct.value = product;
  showContact.value = false;
  selectedProductImageIndex.value = 0;
  productImageIndex[product.id] = 0;
}

function showContactModal(product) {
  selectedProduct.value = product;
  showContact.value = true;
}

function closeContactModal() {
  showContact.value = false;
  selectedProduct.value = null;
}

function nextProductImage(product) {
  const images = getProductImages(product)
  if (images.length <= 1) return
  const current = productImageIndex[product.id] ?? 0
  productImageIndex[product.id] = (current + 1) % images.length
}

function prevProductImage(product) {
  const images = getProductImages(product)
  if (images.length <= 1) return
  const current = productImageIndex[product.id] ?? 0
  productImageIndex[product.id] = (current - 1 + images.length) % images.length
}

function nextSelectedProductImage() {
  const images = getProductImages(selectedProduct.value)
  if (images.length <= 1) return
  selectedProductImageIndex.value = (selectedProductImageIndex.value + 1) % images.length
}

function prevSelectedProductImage() {
  const images = getProductImages(selectedProduct.value)
  if (images.length <= 1) return
  selectedProductImageIndex.value = (selectedProductImageIndex.value - 1 + images.length) % images.length
}

function zoomInImage() {
  zoomLevel.value = Math.min(zoomLevel.value + 0.25, 3)
}

function zoomOutImage() {
  zoomLevel.value = Math.max(zoomLevel.value - 0.25, 1)
}

function resetZoom() {
  zoomLevel.value = 1
}

function handleImageWheel(event) {
  if (event.deltaY < 0) {
    zoomInImage()
  } else {
    zoomOutImage()
  }
}

function closeDetailsModal() {
  selectedProduct.value = null
  selectedProductImageIndex.value = 0
}

onMounted(async () => {
  productsStore.initSyncListener()
  // Fetch data if not already loaded
  if (products.value.length === 0) {
    await productsStore.fetchProducts()
  }
})
</script>

<template>
  <div class="container mx-auto p-4">
    <h1 class="text-5xl font-bold text-black mb-6 text-center">Products</h1>
    
    <!-- Skeleton Loader -->
    <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      <div v-for="n in 8" :key="n" class="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
        <div class="w-full h-48 bg-gray-300"></div>
        <div class="p-3 space-y-3">
          <div class="h-4 bg-gray-300 rounded w-3/4"></div>
          <div class="h-3 bg-gray-300 rounded w-full"></div>
          <div class="h-3 bg-gray-300 rounded w-2/3"></div>
          <div class="flex justify-between items-center">
            <div class="h-4 bg-gray-300 rounded w-1/3"></div>
            <div class="flex gap-1">
              <div class="h-8 bg-gray-300 rounded w-12"></div>
              <div class="h-8 bg-gray-300 rounded w-12"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Products Grid -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      <div v-for="product in products" :key="product.id" class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="w-full h-48 relative overflow-hidden">
          <img 
            :src="getProductImage(product)" 
            :alt="product.name" 
            class="w-full h-full object-contain transition duration-300 hover:scale-110"
          >
          <div class="absolute top-2 right-2 flex gap-1">
            <div class="w-3 h-3 rounded-sm bg-rose-400"></div>
            <div class="w-3 h-3 rounded bg-pink-200"></div>
            <div class="w-3 h-3 rotate-45 bg-rose-400"></div>
          </div>
          <div v-if="product.status === 'soldout'" class="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold uppercase tracking-[0.2em]">
            Sold Out
          </div>
          <div v-if="getProductImages(product).length > 1" class="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2">
            <button @click.stop="prevProductImage(product)" class="rounded-full bg-black/40 p-2 text-white hover:bg-black/60">
              ‹
            </button>
            <button @click.stop="nextProductImage(product)" class="rounded-full bg-black/40 p-2 text-white hover:bg-black/60">
              ›
            </button>
          </div>
        </div>
        <div class="p-3">
          <h3 class="text-rose-400 font-semibold text-base mb-1">{{ product.name }}</h3>
          <p class="text-black text-sm mb-2">{{ product.description }}</p>
          <div class="flex justify-between items-center">
            <span class="text-rose-400 font-bold text-sm">Tsh {{ formatPrice(product.price) }}</span>
            <div class="flex gap-1">
              <button @click="showDetails(product)" class="bg-pink-400 hover:bg-pink-500 text-white px-2 py-1 rounded-md transition duration-300 text-sm">
                Details
              </button>
              <button @click="showContactModal(product)" :disabled="product.status === 'soldout'" class="bg-rose-400 hover:bg-rose-500 text-white px-2 py-1 rounded-md transition duration-300 text-sm disabled:cursor-not-allowed disabled:opacity-50">
                {{ product.status === 'soldout' ? 'Sold Out' : 'Buy' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && products.length === 0" class="text-center py-8">
      <div class="bg-white rounded-lg p-6 shadow-sm">
        <div class="text-gray-400 mb-4">
          <svg class="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5zM10 12a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
          </svg>
        </div>
        <p class="text-gray-500 text-lg">No products available.</p>
      </div>
    </div>

    <!-- Modals remain the same -->
    <!-- Product Details Modal -->
    <div v-if="selectedProduct && !showContact" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3 sm:p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-6">
          <h2 class="text-lg sm:text-xl font-bold text-rose-400">{{ selectedProduct.name }}</h2>
          <button @click="closeDetailsModal" class="text-gray-500 hover:text-rose-500 text-xl leading-none">
            ×
          </button>
        </div>
        <div class="p-4 sm:p-6">
          <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <button @click="zoomOutImage" class="rounded-md border border-gray-300 px-2.5 py-1 text-sm hover:bg-gray-100">−</button>
              <button @click="resetZoom" class="rounded-md border border-gray-300 px-2.5 py-1 text-sm hover:bg-gray-100">Reset</button>
              <button @click="zoomInImage" class="rounded-md border border-gray-300 px-2.5 py-1 text-sm hover:bg-gray-100">+</button>
            </div>
            <span class="text-sm text-gray-500">{{ zoomLevel.toFixed(2) }}x</span>
          </div>
          <div class="mb-4 relative flex items-center justify-center overflow-auto rounded-xl bg-gray-50 p-2 sm:p-3">
            <button v-if="getProductImages(selectedProduct).length > 1" @click="prevSelectedProductImage" class="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60">‹</button>
            <img 
              :src="getProductImages(selectedProduct)[selectedProductImageIndex.value] || selectedProduct.image_url || '/src/components/images/placeholder.png'" 
              :alt="selectedProduct.name" 
              :style="{ transform: `scale(${zoomLevel})` }"
              class="w-full h-[280px] sm:h-[420px] object-contain rounded-lg transition-transform duration-300 cursor-zoom-in"
              @wheel.prevent="handleImageWheel"
              @dblclick="zoomLevel === 1 ? zoomInImage() : resetZoom()"
            >
            <button v-if="getProductImages(selectedProduct).length > 1" @click="nextSelectedProductImage" class="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60">›</button>
          </div>
          <p class="text-black mb-3 text-sm sm:text-base">{{ selectedProduct.description }}</p>
          <p class="text-rose-400 font-bold text-lg mb-4">Tsh {{ formatPrice(selectedProduct.price) }}</p>
          <button @click="closeDetailsModal" class="bg-rose-400 hover:bg-rose-500 text-white px-3 py-1.5 rounded-md transition duration-300 text-sm">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Contact Modal -->
    <div v-if="showContact" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-[28px] shadow-2xl w-full max-w-xl max-h-[65vh] overflow-x-hidden overflow-y-auto border border-rose-100">
          <div class="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-3 p-3 sm:p-4">
            <div class="rounded-3xl overflow-hidden bg-gradient-to-br from-rose-50 via-white to-pink-50 border border-rose-100 shadow-inner">
              <img
                :src="getProductImage(selectedProduct)"
                :alt="selectedProduct.name"
                class="w-full h-[150px] sm:h-[190px] object-contain bg-white p-3"
              />
            </div>
            <div class="flex flex-col justify-between gap-3">
              <div class="space-y-3">
                <div class="flex items-center justify-between gap-2">
                  <div>
                    <p class="text-[10px] uppercase tracking-[0.3em] text-rose-500 font-bold">Ready to order</p>
                    <h2 class="text-xl font-extrabold text-slate-900">{{ selectedProduct.name }}</h2>
                  </div>
                  <span class="inline-flex items-center gap-2 rounded-full bg-rose-100 px-2.5 py-1 text-sm font-semibold text-rose-600">
                    <i class="fas fa-tag"></i>
                    Tsh {{ formatPrice(selectedProduct.price) }}
                  </span>
                </div>
                <p class="text-sm leading-5 text-slate-600">{{ selectedProduct.description || 'A compact product card with premium details for quick ordering.' }}</p>
                <div class="grid grid-cols-2 gap-2">
                  <div class="rounded-3xl border border-slate-100 bg-slate-50 p-3">
                    <p class="text-[10px] uppercase text-slate-500">Condition</p>
                    <p class="mt-1 font-semibold text-slate-900">New</p>
                  </div>
                  <div class="rounded-3xl border border-slate-100 bg-slate-50 p-3">
                    <p class="text-[10px] uppercase text-slate-500">Category</p>
                    <p class="mt-1 font-semibold text-slate-900">{{ selectedProduct.category || 'General' }}</p>
                  </div>
                </div>
              </div>
            <div class="space-y-2">
              <a :href="getWhatsAppLink" target="_blank" class="inline-flex w-full justify-center items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-2 text-white font-semibold shadow-lg shadow-rose-500/20 transition duration-300 hover:scale-[1.01]">
                <i class="fas fa-whatsapp"></i>
                WhatsApp
              </a>
              <a :href="getEmailLink" class="inline-flex w-full justify-center items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 font-semibold transition duration-300 hover:bg-slate-50">
                <i class="fas fa-envelope"></i>
                Email
              </a>
              <button @click="closeContactModal" class="inline-flex w-full justify-center rounded-full bg-slate-100 px-4 py-2 text-slate-700 font-semibold transition duration-300 hover:bg-slate-200">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
