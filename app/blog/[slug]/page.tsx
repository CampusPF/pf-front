import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { BLOG_POSTS } from "@/data/blog.mock";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Pre-generar las rutas de los posts que ya conocemos en build time.
export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  return {
    title: post ? `${post.title} — Campus Blog` : "Post no encontrado — Campus",
    description: post?.excerpt,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-bg pt-16">
        <article className="mx-auto max-w-prose px-4 py-16">
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al blog
        </Link>

        <span className="mb-4 inline-flex w-fit items-center rounded-full bg-primary-subtle px-2.5 py-1 text-xs font-medium text-primary">
          {post.category}
        </span>

        <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-text md:text-4xl">
          {post.title}
        </h1>

        <div className="mb-10 flex flex-wrap items-center gap-4 text-sm text-text-muted">
          <span>Por {post.author}</span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(post.date)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {post.readMinutes} min de lectura
          </span>
        </div>

        <div className="flex flex-col gap-4 text-base leading-relaxed text-text-secondary">
          {post.content.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </article>
      </div>
      <Footer />
    </>
  );
}
