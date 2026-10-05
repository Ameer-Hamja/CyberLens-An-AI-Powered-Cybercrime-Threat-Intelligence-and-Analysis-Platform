import { Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Sidebar from './components/layout/Sidebar'
import PageWrapper from './components/layout/PageWrapper'
import Dashboard from './pages/Dashboard'
import Trends from './pages/Trends'
import Search from './pages/Search'
import Scan from './pages/Scan'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <PageWrapper>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/scan" element={<Scan />} />
            <Route path="/trends" element={<Trends />} />
            <Route path="/search" element={<Search />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageWrapper>
      </div>
    </div>
  )
}
