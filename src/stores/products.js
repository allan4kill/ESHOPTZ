import { defineStore } from 'pinia'
import * as productService from '/src/services/productService.js'

export const useProductsStore = defineStore('products', {
  state: () => ({
    products: [],
    categories: [],
    loading: false,
    error: null
  }),

  getters: {
    getProductsByCategory: (state) => (categoryId) => {
      if (!categoryId) return state.products
      return state.products.filter(product => product.category_id === categoryId)
    },
    
    getProductById: (state) => (id) => {
      return state.products.find(product => product.id === id)
    },
    
    getCategoryBySlug: (state) => (slug) => {
      return state.categories.find(category => category.slug === slug)
    }
  },

  actions: {
    async fetchProducts() {
      this.loading = true
      this.error = null
      try {
        this.products = await productService.fetchProducts()
      } catch (error) {
        this.error = 'Failed to fetch products'
        console.error('Error fetching products:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchCategories() {
      this.loading = true
      this.error = null
      try {
        this.categories = await productService.fetchCategories()
      } catch (error) {
        this.error = 'Failed to fetch categories'
        console.error('Error fetching categories:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchProductsByCategory(categoryId) {
      this.loading = true
      this.error = null
      try {
        const products = await productService.fetchProductsByCategory(categoryId)
        return products
      } catch (error) {
        this.error = 'Failed to fetch category products'
        console.error('Error fetching category products:', error)
        return []
      } finally {
        this.loading = false
      }
    },

    async createProduct(productData) {
      this.loading = true
      this.error = null
      try {
        await productService.addProduct(productData)
        await this.refreshData()
      } catch (error) {
        this.error = 'Failed to create product'
        console.error('Error creating product:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async refreshData() {
      await Promise.all([
        this.fetchProducts(),
        this.fetchCategories()
      ])
    }
  }
})
