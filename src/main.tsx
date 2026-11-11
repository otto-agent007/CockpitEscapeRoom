import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { preferPlaybackAudioSession } from './game/audioSession'
import './styles.css'
import './components/mobileCockpit.css'

// iPhone: let the game's Web Audio effects play through the Ring/Silent switch, as media does.
preferPlaybackAudioSession()

const root = document.getElementById('root')

if (!root) {
  throw new Error('Missing #root element')
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
