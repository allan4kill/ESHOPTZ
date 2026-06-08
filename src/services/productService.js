const STORAGE_KEY = 'eshop-products'

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

function loadProducts() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialProducts))
    return [...initialProducts]
  }

  try {
    const products = JSON.parse(raw)
    return Array.isArray(products) ? products : [...initialProducts]
  } catch (error) {
    console.error('Invalid products stored in localStorage:', error)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialProducts))
    return [...initialProducts]
  }
}

function saveProducts(products) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
}

export async function addProduct(productData) {
  const products = loadProducts()
  const newProduct = {
    id: `p_${Date.now()}`,
    sellerId: productData.sellerId,
    name: productData.name.trim(),
    description: productData.description.trim(),
    price: Number(productData.price) || 0,
    image_url: productData.imageUrl,
    category: productData.category.trim(),
    category_id: normalizeSlug(productData.category),
    category_slug: normalizeSlug(productData.category),
    createdAt: new Date().toISOString(),
    status: 'active'
  }
  const updatedProducts = [newProduct, ...products]
  saveProducts(updatedProducts)
  return newProduct
}

export async function fetchProducts() {
  return loadProducts().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function fetchProductsByCategory(categoryId) {
  const normalized = normalizeSlug(categoryId)
  const products = loadProducts()
  return products.filter(product => product.category_id === normalized || product.category_slug === normalized)
}

export async function fetchCategories() {
  const products = loadProducts()
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
