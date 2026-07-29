import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/index.css'

// 注册Service Worker (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('Service Worker registered:', registration)
      },
      (error) => {
        console.error('Service Worker registration failed:', error)
      }
    )
  })
}

// 初始化IndexedDB
import('./lib/indexedDB').then(({ indexedDBManager }) => {
  indexedDBManager.init().then(() => {
    console.log('IndexedDB initialized')
  })
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)