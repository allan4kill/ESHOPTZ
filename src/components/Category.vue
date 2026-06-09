<script setup>
import { useRoute } from 'vue-router'
import { computed, ref, onMounted, watch, reactive } from 'vue'
import { useProductsStore } from '../stores/products.js'
import { formatPrice } from '/src/utils/priceFormatter.js'

const route = useRoute()
const productsStore = useProductsStore()
const selectedProduct = ref(null)
const showContact = ref(false)
const categoryProducts = ref([])
const zoomLevel = ref(1)
const productImageIndex = reactive({})
const selectedProductImageIndex = ref(0)

const categoryName = computed(() => (route.params.categoryName || 'all').toString().toLowerCase())
const loading = computed(() => productsStore.loading)
const categories = computed(() => productsStore.categories)

const displayCategoryName = computed(() => {
  const name = categoryName.value
  if (name === 'all') return 'All Categories'
  
  const category = categories.value.find(cat => cat.slug === name)
  return category ? category.name : name.charAt(0).toUpperCase() + name.slice(1)
})

// Rest of your computed properties and methods remain the same
const getWhatsAppLink = computed(() => {
  if (selectedProduct.value) {
    const message = `Hello, I'm interested in buying ${selectedProduct.value.name} (ID: ${selectedProduct.value.id}) for Tsh ${selectedProduct.value.price}`;
    return `https://wa.me/+255710629596?text=${encodeURIComponent(message)}`;
  }
  return 'https://wa.me/+255710629596';
})

const getEmailLink = computed(() => {
  if (selectedProduct.value) {
    const subject = `Interest in ${selectedProduct.value.name} (ID: ${selectedProduct.value.id})`;
    const body = `Hello, I'm interested in buying ${selectedProduct.value.name} (ID: ${selectedProduct.value.id}) for Tsh ${selectedProduct.value.price}`;
    return `mailto:fantastchacker@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
  return 'mailto:fantastchacker@gmail.com';
})

function showDetails(product) {
  selectedProduct.value = product;
  selectedProductImageIndex.value = 0;
  showContact.value = false;
  zoomLevel.value = 1;
}

function showContactModal(product) {
  selectedProduct.value = product;
  selectedProductImageIndex.value = 0;
  showContact.value = true;
}

function closeContactModal() {
  showContact.value = false;
  selectedProduct.value = null;
  zoomLevel.value = 1;
  selectedProductImageIndex.value = 0;
}

function getProductImages(product) {
  return product?.image_urls?.length ? product.image_urls : product?.image_url ? [product.image_url] : []
}

function nextSelectedProductImage() {
  const images = getProductImages(selectedProduct.value)
  if (!images.length) return
  selectedProductImageIndex.value = (selectedProductImageIndex.value + 1) % images.length
}

function prevSelectedProductImage() {
  const images = getProductImages(selectedProduct.value)
  if (!images.length) return
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

function nextProductImage(product) {
  const images = getProductImages(product)
  if (!images.length) return
  const currentIndex = productImageIndex[product.id] || 0
  productImageIndex[product.id] = (currentIndex + 1) % images.length
}

function prevProductImage(product) {
  const images = getProductImages(product)
  if (!images.length) return
  const currentIndex = productImageIndex[product.id] || 0
  productImageIndex[product.id] = (currentIndex - 1 + images.length) % images.length
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
  zoomLevel.value = 1
  selectedProductImageIndex.value = 0
}

async function fetchCategoryProducts() {
  await productsStore.fetchCategories()
  
  if (categoryName.value === 'all') {
    await productsStore.fetchProducts()
    categoryProducts.value = productsStore.products
  } else {
    const category = categories.value.find(cat => cat.slug === categoryName.value)
    if (category) {
      categoryProducts.value = await productsStore.fetchProductsByCategory(category.id)
    } else {
      categoryProducts.value = []
    }
  }
}

watch(() => route.params.categoryName, () => {
  fetchCategoryProducts()
})

onMounted(async () => {
  productsStore.initSyncListener()
  await fetchCategoryProducts()
})
</script>

<template>
  <!-- Your existing template with categoryProducts instead of products -->
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-3 sm:px-4 pt-40 md:pt-20 pb-28 md:pb-8">
      <div class="mb-6 md:mb-8">
        <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 text-center px-2 py-4 md:py-0 bg-white md:bg-transparent rounded-lg md:rounded-none shadow-sm md:shadow-none">
          {{ displayCategoryName }}
        </h1>
      </div>

      <!-- Skeleton Loader -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div v-for="n in 8" :key="n" class="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
          <div class="h-48 bg-gray-300"></div>
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
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div 
          v-for="product in categoryProducts"
          :key="product.id"
          class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
        >
                 <div class="h-48 relative overflow-hidden bg-gray-100 flex items-center justify-center p-2">
            <button v-if="getProductImages(product).length > 1" @click="prevProductImage(product)" class="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60">‹</button>
            <img 
              :src="getProductImages(product)[productImageIndex[product.id] || 0] || product.image_url || '/src/components/images/placeholder.png'"
              :alt="product.name"
              class="max-h-full max-w-full object-contain hover:scale-110 transition-transform duration-300"
            />
            <button v-if="getProductImages(product).length > 1" @click="nextProductImage(product)" class="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60">›</button>
            <div class="absolute top-2 right-2 flex gap-1">
              <div class="w-3 h-3 rounded-sm bg-rose-400"></div>
              <div class="w-3 h-3 rounded bg-pink-200"></div>
              <div class="w-3 h-3 rotate-45 bg-rose-400"></div>
            </div>
          </div>
                    
          <div class="p-3">
            <h3 class="text-rose-400 font-semibold text-base mb-1 line-clamp-1">
              {{ product.name }}
            </h3>
            <p class="text-black text-sm mb-2 line-clamp-2">
              {{ product.description }}
            </p>
                        
            <div class="flex justify-between items-center">
              <span class="text-rose-400 font-bold text-sm">
                Tsh {{ formatPrice(product.price) }}
              </span>
              <div class="flex gap-1">
                <button @click="showDetails(product)" class="bg-pink-400 hover:bg-pink-500 text-white px-2 py-1 rounded-md transition duration-300 text-sm">
                  Details
                </button>
                <button @click="showContactModal(product)" class="bg-rose-400 hover:bg-rose-500 text-white px-2 py-1 rounded-md transition duration-300 text-sm">
                  Buy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && categoryProducts.length === 0" class="text-center py-8 sm:py-12">
        <div class="bg-white rounded-lg p-6 shadow-sm">
          <div class="text-gray-400 mb-4">
            <svg class="w-16 h-16 sm:w-20 sm:h-20 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5zM10 12a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
            </svg>
          </div>
          <p class="text-gray-500 text-base sm:text-lg">No products found in this category.</p>
        </div>
      </div>

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
                :src="getProductImages(selectedProduct)[selectedProductImageIndex] || selectedProduct.image_url || '/src/components/images/placeholder.png'" 
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
      <div v-if="showContact" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-4 rounded-lg max-w-sm w-full">
          <h2 class="text-xl font-bold text-rose-400 mb-3">Contact Us to Buy</h2>
          <div class="space-y-4">
            <a :href="getWhatsAppLink" target="_blank" class="flex items-center gap-2 text-green-600 hover:text-green-700">
              <i class="fas fa-whatsapp text-xl"></i>
              WhatsApp: +255 710 629 596
            </a>
            <a :href="getEmailLink" class="flex items-center gap-2 text-blue-600 hover:text-blue-700">
              <i class="fas fa-envelope text-xl"></i>
              Email: fantastchacker@gmail.com
            </a>
            <a href="tel:+255710629596" class="flex items-center gap-2 text-gray-600 hover:text-gray-700">
              <i class="fas fa-phone text-xl"></i>
              Phone: +255 710 629 596
            </a>
          </div>
          <button @click="closeContactModal" class="mt-4 bg-rose-400 hover:bg-rose-500 text-white px-3 py-1.5 rounded-md transition duration-300 text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 375px) {
  .container {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
}

@media (max-width: 768px) {
  .category-container {
    padding-top: 10rem;
  }
}

html {
  scroll-behavior: smooth;
}
</style>
