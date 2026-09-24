import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import Header from './components/Header/Header'
import Footer from './components/Footer/Footer'
import { PageTransition } from './components/ui/page-transition'
import { ScrollProgress } from './components/ui/scroll-progress'
import Home from './pages/Home/Home'
import Enroll from './pages/Enroll/Enroll'
import Portal from './pages/Portal/Portal'

const PAGES = [
  { path: '/', Component: Home },
  { path: '/enroll', Component: Enroll },
  { path: '/portal', Component: Portal },
  { path: '*', Component: Home },
]

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {PAGES.map(({ path, Component }) => (
          <Route
            key={path}
            path={path}
            element={
              <PageTransition>
                <Component />
              </PageTransition>
            }
          />
        ))}
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <ScrollProgress />
      <Header />
      <main id="main-content">
        <AnimatedRoutes />
      </main>
      <Footer />
    </>
  )
}
