import { initializeApp, getApps } from 'firebase/app'
import {
  getFirestore,
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore'

const FB_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY
const FB_AUTH_DOMAIN = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
const FB_PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID
const FB_STORAGE_BUCKET = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
const FB_MESSAGING_SENDER_ID = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID
const FB_APP_ID = import.meta.env.VITE_FIREBASE_APP_ID

function ensureFirebaseConfig() {
  if (!FB_API_KEY || !FB_AUTH_DOMAIN || !FB_PROJECT_ID || !FB_STORAGE_BUCKET || !FB_MESSAGING_SENDER_ID || !FB_APP_ID) {
    throw new Error('Firebase is not configured. Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, and VITE_FIREBASE_APP_ID.')
  }
}

function getFirebaseApp() {
  ensureFirebaseConfig()
  if (!getApps().length) {
    initializeApp({
      apiKey: FB_API_KEY,
      authDomain: FB_AUTH_DOMAIN,
      projectId: FB_PROJECT_ID,
      storageBucket: FB_STORAGE_BUCKET,
      messagingSenderId: FB_MESSAGING_SENDER_ID,
      appId: FB_APP_ID
    })
  }
  return getApps()[0]
}

function getDb() {
  getFirebaseApp()
  return getFirestore()
}

function productsQuery() {
  return query(collection(getDb(), 'products'), orderBy('createdAt', 'desc'))
}

export async function getAllProducts() {
  const snapshot = await getDocs(productsQuery())
  return snapshot.docs.map(docSnapshot => ({ id: docSnapshot.id, ...docSnapshot.data() }))
}

export async function saveProduct(product) {
  const productRef = doc(getDb(), 'products', product.id)
  return setDoc(productRef, product)
}

export async function deleteProductById(id) {
  return deleteDoc(doc(getDb(), 'products', id))
}

export async function deleteProductsByCategory(categoryId) {
  const products = await getAllProducts()
  const normalized = String(categoryId).toLowerCase().trim()
  const toDelete = products.filter(product => product.category_id === normalized || product.category_slug === normalized)

  await Promise.all(toDelete.map(product => deleteDoc(doc(getDb(), 'products', product.id))))
}

export function subscribeToProducts(onUpdate) {
  return onSnapshot(productsQuery(), onUpdate, error => {
    console.error('Firestore product subscription failed:', error)
  })
}
