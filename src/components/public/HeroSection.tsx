'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { User, Clock } from 'lucide-react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Article } from '@/store/public-store'
import { CategoryBadge } from './CategoryBadge'

interface HeroSectionProps {
  article: Article
  onClick: () => void
}

export function HeroSection({ article, onClick }: HeroSectionProps) {
  const publishedDate = article.publishedAt
    ? format(new Date(article.publishedAt), "d 'de' MMMM, yyyy", { locale: es })
    : ''

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-4">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, cubicBezier: [0.16, 1, 0.3, 1] }}
        className="relative cursor-pointer overflow-hidden rounded-3xl group shadow-xl border border-border/50"
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick()
          }
        }}
      >
        <div className="relative aspect-[16/10] w-full sm:aspect-[21/9] md:aspect-[21/8] lg:aspect-[21/7]">
          {article.coverImage ? (
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              priority
              className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
              sizes="100vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/15">
              <span className="text-6xl font-black font-heading text-primary/20">colombiadebate</span>
            </div>
          )}

          {/* Vignette Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-black/30 to-black/10 sm:bg-gradient-to-r sm:from-black/80 sm:via-black/40 sm:to-transparent" />

          {/* Floating Glassmorphism Content Card */}
          <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 md:p-8 lg:p-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="max-w-2xl rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-md text-white shadow-2xl sm:p-8"
            >
              {article.category && (
                <div className="mb-3">
                  <CategoryBadge
                    name={article.category.name}
                    color={article.category.color}
                    size="md"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}

              <h1 className="mb-3 text-xl font-bold leading-tight tracking-tight font-heading sm:text-2xl md:text-3xl lg:text-4xl text-white group-hover:text-primary-foreground/90 transition-colors">
                {article.title}
              </h1>

              <p className="mb-5 line-clamp-2 text-xs leading-relaxed text-white/80 sm:text-sm md:text-base">
                {article.excerpt}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-white/70">
                {article.author && (
                  <div className="flex items-center gap-2">
                    {article.author.avatar ? (
                      <Image
                        src={article.author.avatar}
                        alt={article.author.name}
                        width={28}
                        height={28}
                        className="rounded-full ring-2 ring-white/30"
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/30">
                        <User className="h-3.5 w-3.5 text-white/80" />
                      </div>
                    )}
                    <span className="font-semibold text-white">{article.author.name}</span>
                  </div>
                )}
                {publishedDate && (
                  <div className="flex items-center gap-1.5 text-white/60">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{publishedDate}</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </div>
  )
}
