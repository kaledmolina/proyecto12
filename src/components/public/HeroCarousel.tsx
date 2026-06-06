'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { User, Clock, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Article } from '@/store/public-store'
import { CategoryBadge } from './CategoryBadge'

interface HeroCarouselProps {
  articles: Article[]
  onArticleClick: (id: string) => void
}

export function HeroCarousel({ articles, onArticleClick }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [direction, setDirection] = useState(0) // -1 for left, 1 for right
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const handleNext = useCallback(() => {
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % articles.length)
  }, [articles.length])

  const handlePrev = useCallback(() => {
    setDirection(-1)
    setCurrentIndex((prev) => (prev - 1 + articles.length) % articles.length)
  }, [articles.length])

  const handleDotClick = useCallback((index: number) => {
    setDirection(index > currentIndex ? 1 : -1)
    setCurrentIndex(index)
  }, [currentIndex])

  // Autoplay
  useEffect(() => {
    if (isPlaying && articles.length > 1) {
      timerRef.current = setInterval(handleNext, 5000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, handleNext, articles.length])

  if (!articles || articles.length === 0) return null

  const activeArticle = articles[currentIndex]
  const publishedDate = activeArticle.publishedAt
    ? format(new Date(activeArticle.publishedAt), "d 'de' MMMM, yyyy", { locale: es })
    : ''

  // Slide Variants for Framer Motion
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 300 : -300,
      opacity: 0,
    }),
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-4">
      <div 
        className="relative overflow-hidden rounded-3xl group shadow-2xl border border-border/40 aspect-[16/10] sm:aspect-[21/9] md:aspect-[21/8] lg:aspect-[21/7] bg-black"
        onMouseEnter={() => setIsPlaying(false)}
        onMouseLeave={() => setIsPlaying(true)}
      >
        {/* Sliders Container */}
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 32 },
              opacity: { duration: 0.4 },
            }}
            className="absolute inset-0 w-full h-full cursor-pointer"
            onClick={() => onArticleClick(activeArticle.id)}
          >
            {activeArticle.coverImage ? (
              <Image
                src={activeArticle.coverImage}
                alt={activeArticle.title}
                fill
                priority
                className="object-cover transition-transform duration-[8000ms] ease-out scale-100 group-hover:scale-105"
                sizes="100vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/25 to-accent/30">
                <span className="text-5xl font-black font-heading text-primary-foreground/30">colombiadebate</span>
              </div>
            )}

            {/* Vignette Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-black/35 to-black/20 sm:bg-gradient-to-r sm:from-black/80 sm:via-black/40 sm:to-transparent" />

            {/* Content Card Overlay */}
            <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 md:p-8 lg:p-12">
              <div className="max-w-2xl rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-md text-white shadow-2xl sm:p-8">
                {activeArticle.category && (
                  <div className="mb-3">
                    <CategoryBadge
                      name={activeArticle.category.name}
                      color={activeArticle.category.color}
                      size="md"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}

                <h2 className="mb-3 text-xl font-bold leading-tight tracking-tight font-heading sm:text-2xl md:text-3xl lg:text-4xl text-white group-hover:text-primary/10 transition-colors">
                  {activeArticle.title}
                </h2>

                <p className="mb-5 line-clamp-2 text-xs leading-relaxed text-white/80 sm:text-sm md:text-base">
                  {activeArticle.excerpt}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-white/70">
                  {publishedDate && (
                    <div className="flex items-center gap-1.5 text-white/60">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{publishedDate}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Controls */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsPlaying((prev) => !prev)
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/80 backdrop-blur-sm transition-all hover:bg-black/60 hover:text-white"
            aria-label={isPlaying ? 'Pause autoplay' : 'Play autoplay'}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            handlePrev()
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden group-hover:flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/80 backdrop-blur-sm transition-all hover:bg-black/65 hover:text-white hover:scale-105"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            handleNext()
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden group-hover:flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/80 backdrop-blur-sm transition-all hover:bg-black/65 hover:text-white hover:scale-105"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Dot Indicators */}
        {articles.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {articles.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation()
                  handleDotClick(idx)
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentIndex === idx ? 'w-6 bg-white shadow-lg' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
