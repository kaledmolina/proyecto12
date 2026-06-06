'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Eye } from 'lucide-react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Article } from '@/store/public-store'

interface HeroSectionProps {
  articles: Article[]
  onArticleClick: (id: string) => void
}

export function HeroSection({ articles, onArticleClick }: HeroSectionProps) {
  if (!articles || articles.length === 0) return null

  const leadArticle = articles[0]
  const subFeaturedArticles = articles.slice(1, 4) // 3 articles side-by-side
  const interestArticles = articles.slice(4, 8) // 4 text articles for "Le puede interesar"

  const formatPublishDate = (dateStr: string | null) => {
    if (!dateStr) return ''
    return format(new Date(dateStr), "d 'de' MMM, yyyy", { locale: es })
  }

  return (
    <div className="w-full bg-background border-b border-border/20 py-8 font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* ==========================================
            1. TOP LEAD ARTICLE (Semana Style)
           ========================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-8 border-b border-border/30">
          
          {/* Lead Left: Content (5 Columns) */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 flex flex-col gap-3 group cursor-pointer"
            onClick={() => onArticleClick(leadArticle.id)}
          >
            <div className="flex items-center gap-2 text-[10px] sm:text-xs">
              {leadArticle.category && (
                <span className="font-extrabold uppercase tracking-widest text-[#e11b22]">
                  {leadArticle.category.name}
                </span>
              )}
              {leadArticle.publishedAt && (
                <span className="text-muted-foreground font-semibold">
                  Hace {format(new Date(leadArticle.publishedAt), "H 'horas'", { locale: es })}
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4.5xl font-black font-heading leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors">
              {leadArticle.title}
            </h2>

            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-4">
              {leadArticle.excerpt}
            </p>

            <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1">
              <div className="flex items-center gap-0.5">
                <Eye className="h-3 w-3" />
                <span>{leadArticle.views} vistas</span>
              </div>
            </div>
          </motion.div>

          {/* Lead Middle/Right: Image & Caption (7 Columns) */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 flex flex-col gap-2 group cursor-pointer"
            onClick={() => onArticleClick(leadArticle.id)}
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-muted shadow-sm">
              {leadArticle.coverImage ? (
                <Image
                  src={leadArticle.coverImage}
                  alt={leadArticle.title}
                  fill
                  priority
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-101"
                  sizes="(max-width: 1024px) 100vw, 55vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-secondary/50">
                  <span className="text-2xl font-black font-heading text-muted-foreground/30">Semana</span>
                </div>
              )}
            </div>
            {leadArticle.excerpt && (
              <span className="text-[10px] text-muted-foreground leading-normal italic px-1">
                {leadArticle.title}. Foto de archivo.
              </span>
            )}
          </motion.div>

        </div>

        {/* ==========================================
            2. BOTTOM GRID: 3 columns + "Le puede interesar"
           ========================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
          
          {/* Left Column: 3 sub-featured grid (9 Columns) */}
          <div className="lg:col-span-9">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {subFeaturedArticles.map((art, idx) => (
                <motion.div
                  key={art.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  className="flex flex-col gap-3 group cursor-pointer"
                  onClick={() => onArticleClick(art.id)}
                >
                  {/* Thumbnail Image */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md bg-muted">
                    {art.coverImage ? (
                      <Image
                        src={art.coverImage}
                        alt={art.title}
                        fill
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-102"
                        sizes="(max-width: 768px) 100vw, 25vw"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-secondary/30">
                        <span className="text-xs font-bold text-muted-foreground/30 font-heading">noticia</span>
                      </div>
                    )}
                  </div>

                  {/* Title and Category */}
                  <div className="flex flex-col gap-1.5">
                    {art.category && (
                      <span 
                        className="text-[9px] font-extrabold uppercase tracking-widest"
                        style={{ color: '#e11b22' }}
                      >
                        {art.category.name}
                      </span>
                    )}
                    <h4 className="text-sm font-bold font-heading leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-3">
                      {art.title}
                    </h4>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Column: "Le puede interesar" (3 Columns) */}
          <div className="lg:col-span-3">
            <div className="bg-[#fdf2f2] border-t-2 border-[#e11b22] p-4 rounded-r-md">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#e11b22] mb-3">
                Le puede interesar
              </h3>

              <div className="flex flex-col gap-3.5 divide-y divide-[#e11b22]/10">
                {interestArticles.map((art, idx) => (
                  <div
                    key={art.id}
                    className="pt-3.5 first:pt-0 group cursor-pointer"
                    onClick={() => onArticleClick(art.id)}
                  >
                    <h4 className="text-xs font-bold font-heading leading-normal text-foreground group-hover:text-primary transition-colors line-clamp-3">
                      {art.title}
                    </h4>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
