import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { init } from '@telegram-apps/sdk';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

try {
  init();
} catch (e) {
  console.log("Приложение запущено вне Telegram, игнорируем ошибку SDK.");
}