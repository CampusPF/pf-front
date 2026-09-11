import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, Clock,} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { BLOG_POSTS } from "@/data/blog.mock";

export const metadata: Metadata = {
  title: "Blog — Campus",
  description: "Notas sobre aprendizaje, producto y cómo construimos Campus.",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BlogPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-bg pt-16">
        <div className="mx-auto max-w-content px-4 py-16 md:px-6">
        <div className="mx-auto max-w-prose text-center">
          <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-text md:text-4xl">
            Blog
          </h1>
          <p className="text-lg text-text-secondary">
            Notas sobre cómo aprender mejor y cómo construimos Campus.
          </p>
        </div>

        <div className="mx-auto mt-12 flex max-w-3xl flex-col gap-6">
          {BLOG_POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-2xl border border-border bg-surface p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-primary-subtle px-2.5 py-1 text-xs font-medium text-primary">
                  {post.category}
                </span>
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(post.date)}
                </span>
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <Clock className="h-3.5 w-3.5" />
                  {post.readMinutes} min de lectura
                </span>
              </div>
              <h2 className="mb-2 text-xl font-semibold text-text transition-colors group-hover:text-primary">
                {post.title}
              </h2>
              <p className="text-text-secondary">{post.excerpt}</p>
              <p className="mt-3 text-sm text-text-muted">Por {post.author}</p>
            </Link>
          ))}
        </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
