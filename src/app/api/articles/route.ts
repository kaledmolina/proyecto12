import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Helper: generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 200);
}

// GET /api/articles — list published articles (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get("category");
    const search = searchParams.get("search");
    const tagSlug = searchParams.get("tag");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
    const featured = searchParams.get("featured");

    const statusParam = searchParams.get("status") || "PUBLISHED";
    const where: Record<string, unknown> = {};

    const session = await getServerSession(authOptions);
    const isAdminOrWriter = !!(session && ["ADMIN", "WRITER"].includes(session.user.role));

    if (statusParam !== "PUBLISHED") {
      if (!isAdminOrWriter) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (statusParam !== "ALL") {
        where.status = statusParam;
      }
    } else {
      where.status = "PUBLISHED";
    }

    if (categorySlug) {
      const category = await db.category.findUnique({ where: { slug: categorySlug } });
      if (category) {
        (where as Record<string, unknown>).categoryId = category.id;
      }
    }

    if (search) {
      (where as Record<string, unknown>).OR = [
        { title: { contains: search } },
        { excerpt: { contains: search } },
      ];
    }

    if (tagSlug) {
      const tag = await db.tag.findUnique({ where: { slug: tagSlug } });
      if (tag) {
        (where as Record<string, unknown>).tags = {
          some: { tagId: tag.id },
        };
      }
    }

    if (featured === "true") {
      (where as Record<string, unknown>).isFeatured = true;
    }

    const [articles, total] = await Promise.all([
      db.article.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, avatar: true } },
          category: { select: { id: true, name: true, slug: true, color: true } },
          tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
        },
        orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.article.count({ where }),
    ]);

    return NextResponse.json({
      articles: articles.map((a) => {
        const { author, ...rest } = a;
        return {
          ...rest,
          tags: a.tags.map((at) => at.tag),
          author: isAdminOrWriter ? author : undefined,
        };
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

// POST /api/articles — create article (WRITER / ADMIN)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["ADMIN", "WRITER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, excerpt, coverImage, categoryId, tags, status } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    let slug = generateSlug(title.trim());
    // Ensure slug uniqueness
    const existing = await db.article.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    // Validate category if provided
    if (categoryId) {
      const cat = await db.category.findUnique({ where: { id: categoryId } });
      if (!cat) {
        return NextResponse.json({ error: "Category not found" }, { status: 400 });
      }
    }

    // Process tags — create if not exist
    const tagRecords: { id: string }[] = [];
    if (Array.isArray(tags) && tags.length > 0) {
      for (const tagName of tags) {
        if (typeof tagName !== "string" || tagName.trim().length === 0) continue;
        const tagSlug = generateSlug(tagName.trim());
        const tag = await db.tag.upsert({
          where: { slug: tagSlug },
          update: {},
          create: { name: tagName.trim(), slug: tagSlug },
        });
        tagRecords.push({ id: tag.id });
      }
    }

    const articleStatus = status || "DRAFT";

    const article = await db.article.create({
      data: {
        title: title.trim(),
        slug,
        content: content || "",
        excerpt: excerpt || "",
        coverImage: coverImage || null,
        status: articleStatus,
        authorId: session.user.id,
        categoryId: categoryId || null,
        publishedAt: articleStatus === "PUBLISHED" ? new Date() : null,
        tags: {
          create: tagRecords.map((t) => ({ tagId: t.id })),
        },
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true, color: true } },
        tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
      },
    });

    return NextResponse.json(
      {
        ...article,
        tags: article.tags.map((at) => at.tag),
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
}
