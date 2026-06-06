'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Eye, User } from 'lucide-react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Article } from '@/store/public-store'
import { CategoryBadge } from './CategoryBadge'
import { Skeleton } from '@/components/ui/skeleton'

interface ArticleCardProps {
  article: Article
  onClick: () => void
}

export function ArticleCard({ article, onClick }: ArticleCardProps) {
  const publishedDate = article.publishedAt
    ? format(new Date(article.publishedAt), "d 'de' MMM, yyyy", { locale: es })
    : null

  return (
    <motion.article
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="group cursor-pointer flex flex-col gap-3 pb-6 w-full border-b border-border/10 last:border-b-0"
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
      {/* Cover Image */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        {article.coverImage ? (
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-102"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary/50">
            <span className="text-sm font-bold text-muted-foreground/30 font-heading">colombiadebate</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2">
        {article.category && (
          <span 
            className="text-[10px] font-bold uppercase tracking-wider block"
            style={{ color: article.category.color }}
          >
            {article.category.name}
          </span>
        )}

        <h3 className="text-lg font-bold font-heading leading-snug tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-3">
          {article.title}
        </h3>

        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {article.excerpt}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1">
          {publishedDate && <span>{publishedDate}</span>}
          {publishedDate && <span className="text-muted-foreground/40">•</span>}
          <div className="flex items-center gap-0.5">
            <Eye className="h-3 w-3" />
            <span>{article.views}</span>
          </div>
        </div>
      </div>
    </motion.article>
  )
}
