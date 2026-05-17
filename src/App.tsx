import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navigation } from './components/layout/Navigation'
import { AboutPage } from './pages/AboutPage'
import { CVPage } from './pages/CVPage'
import { MLPage } from './pages/MLPage'
import { LLMPage } from './pages/LLMPage'
import { BackendPage } from './pages/BackendPage'

export default function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/" element={<AboutPage />} />
        <Route path="/cv" element={<CVPage />} />
        <Route path="/ml" element={<MLPage />} />
        <Route path="/llms" element={<LLMPage />} />
        <Route path="/backend" element={<BackendPage />} />
      </Routes>
    </BrowserRouter>
  )
}
