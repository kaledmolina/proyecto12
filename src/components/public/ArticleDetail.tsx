'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft, Eye, Clock, User, Tag, Share2, Check, Link, MessageCircle } from 'lucide-react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { usePublicStore, Article } from '@/store/public-store'
import { CategoryBadge } from './CategoryBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

interface RelatedArticleProps {
  article: Article
  onClick: () => void
}

function RelatedArticleCard({ article, onClick }: RelatedArticleProps) {
  const publishedDate = article.publishedAt
    ? format(new Date(article.publishedAt), "d 'de' MMM", { locale: es })
    : ''

  return (
    <button
      onClick={onClick}
      className="group flex gap-3 rounded-md p-2 text-left transition-colors hover:bg-muted"
    >
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-muted">
        {article.coverImage ? (
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="64px"
          />
        ) : (
          <Skeleton className="h-full w-full" />
        )}
      </div>
      <div className="flex flex-col justify-center">
        <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-destructive">
          {article.title}
        </h4>
        <span className="mt-1 text-xs text-muted-foreground">{publishedDate}</span>
      </div>
    </button>
  )
}

export function ArticleDetail() {
  const selectedArticle = usePublicStore((s) => s.selectedArticle)
  const articles = usePublicStore((s) => s.articles)
  const isLoading = usePublicStore((s) => s.isLoading)
  const setView = usePublicStore((s) => s.setView)
  const fetchArticles = usePublicStore((s) => s.fetchArticles)
  const fetchArticle = usePublicStore((s) => s.fetchArticle)

  const [scrollProgress, setScrollProgress] = useState(0)
  const [copied, setCopied] = useState(false)

  // Reading progress tracker
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch related articles when viewing an article
  useEffect(() => {
    if (selectedArticle?.categoryId) {
      fetchArticles({ category: selectedArticle.categoryId, limit: 6 })
    }
  }, [selectedArticle?.categoryId, fetchArticles])

  const handleBack = useCallback(() => {
    setView('home')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [setView])

  const handleRelatedClick = useCallback(
    (id: string) => {
      fetchArticle(id)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [fetchArticle]
  )

  const handleCopyLink = useCallback(() => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/article/${selectedArticle?.id}`
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true)
        toast.success('¡Enlace copiado al portapapeles!')
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }, [selectedArticle?.id])

  const handleShareTwitter = useCallback(() => {
    if (typeof window !== 'undefined' && selectedArticle) {
      const text = encodeURIComponent(`Check out this article: ${selectedArticle.title}`)
      const url = encodeURIComponent(`${window.location.origin}/article/${selectedArticle.id}`)
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
    }
  }, [selectedArticle])

  const handleShareWhatsApp = useCallback(() => {
    if (typeof window !== 'undefined' && selectedArticle) {
      const text = encodeURIComponent(`Check out this article: ${selectedArticle.title} - ${window.location.origin}/article/${selectedArticle.id}`)
      window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
    }
  }, [selectedArticle])

  // Loading state
  if (isLoading && !selectedArticle) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="mb-6 h-8 w-32" />
        <Skeleton className="aspect-[21/9] w-full rounded-lg" />
        <div className="mt-6 space-y-3 max-w-3xl">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Separator className="my-4" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (!selectedArticle) return null

  const publishedDate = selectedArticle.publishedAt
    ? format(new Date(selectedArticle.publishedAt), "d 'de' MMMM, yyyy", { locale: es })
    : ''

  // Estimate reading time (average 200 words per minute)
  const words = selectedArticle.content ? selectedArticle.content.split(/\s+/).filter(Boolean).length : 0
  const readingTime = Math.max(1, Math.round(words / 200))

  // Filter out current article from related articles
  const relatedArticles = articles
    .filter((a) => a.id !== selectedArticle.id)
    .slice(0, 4)

  return (
    <motion.article
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
    >
      {/* Scroll Progress Bar */}
      <div 
        className="fixed top-0 left-0 right-0 h-1 bg-destructive z-[999] transition-all duration-75 origin-left"
        style={{ transform: `scaleX(${scrollProgress / 100})` }}
      />

      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={handleBack}
        className="mb-6 -ml-2 gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Artículos
      </Button>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        {/* Main Content */}
        <div className="min-w-0">
          {/* Category & Tags */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {selectedArticle.category && (
              <CategoryBadge
                name={selectedArticle.category.name}
                color={selectedArticle.category.color}
                size="md"
              />
            )}
            {selectedArticle.tags && selectedArticle.tags.length > 0 && (
              <>
                <span className="text-muted-foreground">·</span>
                {selectedArticle.tags.slice(0, 3).map((t: any) => {
                  const tag = t.tag ? t.tag : t
                  return (
                    <span
                      key={tag.id}
                      className="flex items-center gap-1 text-xs text-muted-foreground"
                    >
                      <Tag className="h-3 w-3" />
                      {tag.name}
                    </span>
                  )
                })}
              </>
            )}
          </div>

          {/* Title */}
          <h1 className="mb-4 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {selectedArticle.title}
          </h1>

          {/* Author & Meta */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              {publishedDate && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Clock className="h-4 w-4" />
                  {publishedDate}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-sm">
                <Clock className="h-4 w-4" />
                {readingTime} min de lectura
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Eye className="h-4 w-4" />
                {selectedArticle.views} vistas
              </div>
            </div>

            {/* Social Share Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="h-8 gap-1.5 text-xs"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Link className="h-3.5 w-3.5" />}
                Copiar Enlace
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareTwitter}
                className="h-8 gap-1.5 text-xs hover:text-sky-400"
              >
                <Share2 className="h-3.5 w-3.5" />
                Compartir en X
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareWhatsApp}
                className="h-8 gap-1.5 text-xs hover:text-green-500"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </Button>
            </div>
          </div>

          <Separator className="mb-6" />

          {/* Hero Image */}
          {selectedArticle.coverImage && (
            <div className="relative mb-8 aspect-[16/9] w-full overflow-hidden rounded-lg bg-muted">
              <Image
                src={selectedArticle.coverImage}
                alt={selectedArticle.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 66vw"
              />
            </div>
          )}

          {/* Article Content */}
          <div className="prose-custom">
            <ReactMarkdown>{selectedArticle.content}</ReactMarkdown>
          </div>
        </div>

        {/* Sidebar - Related Articles */}
        {relatedArticles.length > 0 && (
          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Artículos Relacionados
              </h3>
              <Separator className="mb-4" />
              <ScrollArea className="max-h-[calc(100vh-12rem)]">
                <div className="flex flex-col gap-1">
                  {relatedArticles.map((article) => (
                    <RelatedArticleCard
                      key={article.id}
                      article={article}
                      onClick={() => handleRelatedClick(article.id)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </aside>
        )}
      </div>

      {/* Mobile Related Articles */}
      {relatedArticles.length > 0 && (
        <div className="mt-10 lg:hidden">
          <Separator className="mb-6" />
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Artículos Relacionados
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {relatedArticles.slice(0, 2).map((article) => (
              <RelatedArticleCard
                key={article.id}
                article={article}
                onClick={() => handleRelatedClick(article.id)}
              />
            ))}
          </div>
        </div>
      )}
    </motion.article>
  )
}
