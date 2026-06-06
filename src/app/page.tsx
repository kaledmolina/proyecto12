'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { SessionProvider, useSession, signIn, signOut } from 'next-auth/react'
import { AnimatePresence, motion } from 'framer-motion'
import { usePublicStore } from '@/store/public-store'
import { useAdminStore } from '@/store/admin-store'
import { PublicHeader } from '@/components/public/PublicHeader'
import { HeroSection } from '@/components/public/HeroSection'
import { NewsGrid } from '@/components/public/NewsGrid'
import { ArticleDetail } from '@/components/public/ArticleDetail'
import { PublicFooter } from '@/components/public/PublicFooter'
import AdminPanel from '@/components/admin/AdminPanel'
import SetupScreen from '@/components/admin/SetupScreen'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Globe, Shield, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// ============================================================
// Public Portal View
// ============================================================
function PublicPortal({ onLoginClick }: { onLoginClick: () => void }) {
  const currentView = usePublicStore((s) => s.currentView)
  const articles = usePublicStore((s) => s.articles)
  const fetchCategories = usePublicStore((s) => s.fetchCategories)
  const fetchSettings = usePublicStore((s) => s.fetchSettings)
  const fetchArticles = usePublicStore((s) => s.fetchArticles)
  const fetchArticle = usePublicStore((s) => s.fetchArticle)
  const selectedCategory = usePublicStore((s) => s.selectedCategory)
  const searchQuery = usePublicStore((s) => s.searchQuery)
  
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([
          fetchCategories(),
          fetchSettings(),
          fetchArticles({ limit: 16 }),
        ])
      } catch (err) {
        console.error('Failed to load initial portal data:', err)
      } finally {
        setIsInitialLoading(false)
      }
    }
    init()
  }, [fetchCategories, fetchSettings, fetchArticles])

  // Get articles for HeroSection: featured ones first, or fallback to top 8 latest
  const featured = articles.filter((a) => a.isFeatured)
  const heroArticles = featured.length > 0 ? featured.slice(0, 8) : articles.slice(0, 8)

  // Show Hero Section only when on the homepage cover (no active category filter or search query)
  const showHero = currentView === 'home' && !selectedCategory && !searchQuery && heroArticles.length > 0

  if (isInitialLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-12 w-12 items-center justify-center">
            <div className="absolute h-12 w-12 animate-ping rounded-full bg-destructive/10" />
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-destructive border-t-transparent" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground font-heading animate-pulse">
            Cargando portal...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader onLoginClick={onLoginClick} />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          {currentView === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* BBC Style Hero Section */}
              {showHero && (
                <HeroSection
                  articles={heroArticles}
                  onArticleClick={(id) => {
                    fetchArticle(id)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                />
              )}

              {/* News Grid & Sidebar Layout */}
              <NewsGrid />
            </motion.div>
          ) : (
            <motion.div
              key="article"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ArticleDetail />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <PublicFooter />
    </div>
  )
}

// ============================================================
// Login Modal
// ============================================================
function LoginModal({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Credenciales inválidas. Verifica tu email y contraseña.')
      } else {
        toast.success('Sesión iniciada correctamente')
        onOpenChange(false)
        setEmail('')
        setPassword('')
        setError('')
        onSuccess()
      }
    } catch {
      setError('Error al iniciar sesión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
              <Shield className="h-4 w-4 text-destructive" />
            </div>
            Iniciar Sesión
          </DialogTitle>
          <DialogDescription>
            Ingresa tus credenciales para acceder al panel de administración.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@newsportal.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Main App with Auth
// ============================================================
export function AppContent() {
  const { data: session, status } = useSession()
  const [loginOpen, setLoginOpen] = useState(false)
  const [view, setView] = useState<'public' | 'admin'>('public')
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null)

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const res = await fetch('/api/auth/setup')
        if (res.ok) {
          const data = await res.json()
          setNeedsSetup(data.needsSetup)
        }
      } catch (err) {
        console.error('Failed to check setup status:', err)
      }
    }
    checkSetup()
  }, [])

  const handleLoginClick = useCallback(() => {
    if (session) {
      setView('admin')
    } else {
      setLoginOpen(true)
    }
  }, [session])

  const handleLoginSuccess = useCallback(() => {
    setView('admin')
  }, [])

  const handleLogout = useCallback(() => {
    signOut({ callbackUrl: '/' })
    setView('public')
    useAdminStore.getState().setActiveSection('dashboard')
    toast.info('Sesión cerrada')
  }, [])

  // When session changes, if user logs out, go back to public
  useEffect(() => {
    if (!session && view === 'admin') {
      // Defer the state update to avoid synchronous setState in effect
      requestAnimationFrame(() => setView('public'))
    }
  }, [session, view])

  if (status === 'loading' || needsSetup === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-destructive border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (needsSetup) {
    return <SetupScreen onSetupComplete={() => setNeedsSetup(false)} />
  }

  return (
    <>
      <LoginModal
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSuccess={handleLoginSuccess}
      />

      {view === 'admin' && session ? (
        <motion.div
          key="admin"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Admin top bar with back to public */}
          <div className="fixed top-0 right-0 z-50 p-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView('public')}
              className="gap-1.5 bg-background/95 backdrop-blur shadow-sm"
            >
              <Globe className="h-3.5 w-3.5" />
              Ver Sitio
            </Button>
          </div>
          <AdminPanel session={session} onLogout={handleLogout} />
        </motion.div>
      ) : (
        <motion.div
          key="public"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Admin button if logged in */}
          {session && view === 'public' && (
            <div className="fixed bottom-20 right-4 z-50 sm:bottom-6">
              <Button
                onClick={() => setView('admin')}
                className="gap-2 shadow-lg"
              >
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Panel Admin</span>
              </Button>
            </div>
          )}
          <PublicPortal onLoginClick={handleLoginClick} />
        </motion.div>
      )}
    </>
  )
}

// ============================================================
// Page Root
// ============================================================
export default function Home() {
  return (
    <SessionProvider>
      <AppContent />
    </SessionProvider>
  )
}
