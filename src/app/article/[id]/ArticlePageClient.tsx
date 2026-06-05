'use client'

import { useEffect } from 'react'
import { SessionProvider } from 'next-auth/react'
import { usePublicStore, Article } from '@/store/public-store'
import { AppContent } from '@/app/page'

export default function ArticlePageClient({ article }: { article: Article }) {
  useEffect(() => {
    usePublicStore.setState({
      selectedArticle: article,
      currentView: 'article',
    })
  }, [article])

  return (
    <SessionProvider>
      <AppContent />
    </SessionProvider>
  )
}
