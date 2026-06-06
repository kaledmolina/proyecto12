import { Metadata } from 'next'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import ArticlePageClient from './ArticlePageClient'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const article = await db.article.findUnique({
    where: { id },
    include: {
      category: true,
    }
  })

  if (!article) {
    return {
      title: 'Artículo no encontrado',
    }
  }

  // Prepend domain for openGraph image
  const baseUrl = process.env.NEXTAUTH_URL || 'https://pulso24.tech'
  const imageUrl = article.coverImage 
    ? (article.coverImage.startsWith('http') ? article.coverImage : `${baseUrl}${article.coverImage}`)
    : `${baseUrl}/api/placeholder`

  return {
    title: `${article.title} | Pulso24`,
    description: article.excerpt || 'Lee este interesante artículo en Pulso24.',
    openGraph: {
      title: article.title,
      description: article.excerpt || 'Lee este interesante artículo en Pulso24.',
      type: 'article',
      url: `${baseUrl}/article/${article.id}`,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: article.title,
        }
      ],
      siteName: 'Pulso24',
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt || 'Lee este interesante artículo en Pulso24.',
      images: [imageUrl],
    }
  }
}

export default async function Page({ params }: Props) {
  const { id } = await params
  const article = await db.article.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, avatar: true } },
      category: { select: { id: true, name: true, slug: true, color: true } },
      tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
    }
  })

  if (!article || article.status !== 'PUBLISHED') {
    notFound()
  }

  // Map the tags array to match state type
  const { author, ...articleWithoutAuthor } = article
  const mappedArticle = {
    ...articleWithoutAuthor,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    publishedAt: article.publishedAt ? article.publishedAt.toISOString() : null,
    tags: article.tags.map((at) => at.tag),
    author: undefined,
  }

  return <ArticlePageClient article={mappedArticle as any} />
}
