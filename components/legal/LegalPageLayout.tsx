import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalPageLayout({ title, lastUpdated, children }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-prose px-4 py-12 md:py-16">
        <Link
          href="/register"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al registro
        </Link>

        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-text md:text-4xl">
          {title}
        </h1>
        <p className="mb-10 text-sm text-text-muted">Última actualización: {lastUpdated}</p>

        <div className="flex flex-col gap-8 text-text-secondary [&_h2]:mt-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-text [&_li]:ml-4 [&_li]:list-disc [&_p]:leading-relaxed [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
          {children}
        </div>
      </div>
    </div>
  );
}
