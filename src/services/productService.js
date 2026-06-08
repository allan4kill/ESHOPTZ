import { getAllProducts, saveProduct, deleteProductById, deleteProductsByCategory, subscribeToProducts } from './firebaseService.js'
import { deleteImageFromCloudinary } from './cloudinaryService.js'

const ENABLE_DEMO_PRODUCTS = import.meta.env.VITE_ENABLE_DEMO_PRODUCTS === 'true'

function normalizeSlug(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

const initialProducts = [
  {
    id: 'p1',
    sellerId: 'admin',
    name: 'Classic Fashion Dress',
    description: 'A timeless dress crafted for style and comfort.',
    price: 42000,
    image_url: 'https://images.unsplash.com/photo-1524253482453-3fed8d2fe12b?auto=format&fit=crop&w=800&q=80',
    category: 'Fashion',
    category_id: 'fashion',
    category_slug: 'fashion',
    createdAt: '2025-12-01T08:00:00.000Z',
    status: 'active'
  },
  {
    id: 'p2',
    sellerId: 'admin',
    name: 'Smartphone Accessories Kit',
    description: 'Essential accessories to keep your mobile setup complete.',
    price: 8500,
    image_url: 'https://images.unsplash.com/photo-1510557880182-3bb2dd6e1221?auto=format&fit=crop&w=800&q=80',
    category: 'Electronics',
    category_id: 'electronics',
    category_slug: 'electronics',
    createdAt: '2025-11-20T10:00:00.000Z',
    status: 'active'
  },
  {
    id: 'p3',
    sellerId: 'admin',
    name: 'Modern Home Decor Lamp',
    description: 'Enhance any room with this contemporary lighting piece.',
    price: 21000,
    image_url: 'https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=800&q=80',
    category: 'Home',
    category_id: 'home',
    category_slug: 'home',
    createdAt: '2025-12-10T14:00:00.000Z',
    status: 'active'
  }
]

let remoteInitializationPromise = null

async function ensureRemoteProducts() {
  if (remoteInitializationPromise) {
    return remoteInitializationPromise
  }

  if (!ENABLE_DEMO_PRODUCTS) {
    return
  }

  remoteInitializationPromise = (async () => {
    const products = await getAllProducts()
    if (products && products.length > 0) {
      return
    }

    await Promise.all(initialProducts.map(product => saveProduct(product)))
  })()

  return remoteInitializationPromise
}

export async function addProduct(productData) {
  await ensureRemoteProducts()

  const imageUrl = String(productData.imageUrl || '').trim()
  if (!imageUrl) {
    throw new Error('Product image URL is required.')
  }

  if (!/^https:\/\/.*cloudinary\.com\//.test(imageUrl)) {
    throw new Error('Product image must be uploaded to Cloudinary.')
  }

  const newProduct = {
    id: `p_${Date.now()}`,
    sellerId: productData.sellerId,
    name: productData.name.trim(),
    description: productData.description.trim(),
    price: Number(productData.price) || 0,
    image_url: imageUrl,
    category: productData.category.trim(),
    category_id: normalizeSlug(productData.category),
    category_slug: normalizeSlug(productData.category),
    createdAt: new Date().toISOString(),
    status: 'active'
  }

  await saveProduct(newProduct)
  return newProduct
}

export async function fetchProducts() {
  await ensureRemoteProducts()
  const products = await getAllProducts()
  return products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function fetchProductsByCategory(categoryId) {
  await ensureRemoteProducts()
  const normalized = normalizeSlug(categoryId)
  const products = await getAllProducts()
  return products.filter(product => product.category_id === normalized || product.category_slug === normalized)
}

export async function deleteProduct(productId) {
  const products = await getAllProducts()
  const product = products.find(item => item.id === productId)

  if (product?.image_url) {
    try {
      await deleteImageFromCloudinary(product.image_url)
    } catch (error) {
      console.warn('Cloudinary cleanup failed for product:', productId, error)
    }
  }

  await deleteProductById(productId)
}

export async function deleteCategory(categoryId) {
  const products = await getAllProducts()
  const normalized = normalizeSlug(categoryId)
  const toDelete = products.filter(product => product.category_id === normalized || product.category_slug === normalized)

  await Promise.all(toDelete.map(async product => {
    if (product?.image_url) {
      try {
        await deleteImageFromCloudinary(product.image_url)
      } catch (error) {
        console.warn('Cloudinary cleanup failed for category product:', product.id, error)
      }
    }
    return deleteProductById(product.id)
  }))
}

export async function fetchCategories() {
  await ensureRemoteProducts()
  const products = await getAllProducts()
  const categories = []
  const seen = new Set()

  products.forEach(product => {
    const categoryName = String(product.category || 'Uncategorized').trim()
    const categoryId = normalizeSlug(categoryName)
    if (!seen.has(categoryId)) {
      seen.add(categoryId)
      categories.push({
        id: categoryId,
        name: categoryName,
        slug: categoryId
      })
    }
  })

  return categories.sort((a, b) => a.name.localeCompare(b.name))
}

export { subscribeToProducts }
