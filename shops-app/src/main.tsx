import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import Providers from './Providers.tsx'
import { CacheBuster } from './components/shared/CacheBuster.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Providers>
        <CacheBuster />
        <App />
      </Providers>
    </BrowserRouter>
  </React.StrictMode>,
)
