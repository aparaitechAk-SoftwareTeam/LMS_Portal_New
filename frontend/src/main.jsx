import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { store } from './redux/store'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: 'var(--toast-bg, #1e293b)', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '10px', fontSize: '14px' }
        }}
      />
    </Provider>
  </React.StrictMode>
)
