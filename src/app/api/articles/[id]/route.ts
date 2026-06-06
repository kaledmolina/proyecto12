import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/articles/[id] — get single article by id (public, increment views)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const article = await db.article.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, avatar: true, bio: true } },
        category: { select: { id: true, name: true, slug: true, color: true } },
        tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
      },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Increment views
    await db.article.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    const session = await getServerSession(authOptions);
    const isAdminOrWriter = !!(session && ["ADMIN", "WRITER"].includes(session.user.role));

    const { author, ...rest } = article;

    return NextResponse.json({
      ...rest,
      views: article.views + 1,
      tags: article.tags.map((at) => at.tag),
      author: isAdminOrWriter ? author : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch article" },
      { status: 500 }
    );
  }
}

// PUT /api/articles/[id] — update article (owner WRITER or ADMIN)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["ADMIN", "WRITER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await db.article.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Only owner or admin can edit
    if (session.user.role !== "ADMIN" && existing.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, excerpt, coverImage, categoryId, tags, status, isFeatured } = body;

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length === 0) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
      }
      updateData.title = title.trim();
      // Regenerate slug only if title changed
      const slug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .substring(0, 200);
      if (slug !== existing.slug) {
        updateData.slug = slug;
      }
    }

    if (content !== undefined) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;

    if (categoryId !== undefined) {
      if (categoryId !== null) {
        const cat = await db.category.findUnique({ where: { id: categoryId } });
        if (!cat) {
          return NextResponse.json({ error: "Category not found" }, { status: 400 });
        }
      }
      updateData.categoryId = categoryId;
    }

    if (status !== undefined) {
      updateData.status = status;
      if (status === "PUBLISHED" && !existing.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    // Handle tags update
    if (Array.isArray(tags)) {
      // Delete existing tags
      await db.articleTag.deleteMany({ where: { articleId: id } });

      // Create new tag records
      const tagRecords: { id: string }[] = [];
      for (const tagName of tags) {
        if (typeof tagName !== "string" || tagName.trim().length === 0) continue;
        const tagSlug = tagName
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_]+/g, "-")
          .replace(/^-+|-+$/g, "");
        const tag = await db.tag.upsert({
          where: { slug: tagSlug },
          update: {},
          create: { name: tagName.trim(), slug: tagSlug },
        });
        tagRecords.push({ id: tag.id });
      }
      updateData.tags = {
        create: tagRecords.map((t) => ({ tagId: t.id })),
      };
    }

    const article = await db.article.update({
      where: { id },
      data: updateData,
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true, color: true } },
        tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
      },
    });

    return NextResponse.json({
      ...article,
      tags: article.tags.map((at) => at.tag),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update article" },
      { status: 500 }
    );
  }
}

// DELETE /api/articles/[id] — delete article (owner WRITER or ADMIN)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["ADMIN", "WRITER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await db.article.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Only owner or admin can delete
    if (session.user.role !== "ADMIN" && existing.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete related ArticleTags first
    await db.articleTag.deleteMany({ where: { articleId: id } });

    // Delete the article
    await db.article.delete({ where: { id } });

    return NextResponse.json({ message: "Article deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete article" },
      { status: 500 }
    );
  }
}
