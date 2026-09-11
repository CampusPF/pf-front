import Link from "next/link";
import { GraduationCap } from "lucide-react";

const LINK_GROUPS = [
  {
    title: "Plataforma",
    links: [
      { label: "Cursos", href: "#cursos" },
      { label: "Cómo funciona", href: "#como-funciona" },
      { label: "Precios", href: "#precios" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre nosotros", href: "/sobre-nosotros" },
      { label: "Blog", href: "/blog" },
      { label: "Contacto", href: "/contacto" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Términos", href: "/terminos" },
      { label: "Privacidad", href: "/privacidad" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-surface-elevated border-border border-t py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="text-text flex items-center gap-2 font-semibold">
              <GraduationCap className="text-primary size-6" aria-hidden />
              Campus
            </div>
            <p className="text-text-muted mt-3 text-sm">
              Aprendé tecnología con proyectos reales y un tutor de IA que te
              acompaña 24/7.
            </p>
          </div>

          {LINK_GROUPS.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="text-text text-sm font-semibold">{group.title}</h2>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("#") ? (
                      <a
                        href={link.href}
                        className="text-text-muted hover:text-text cursor-pointer text-sm transition-colors duration-150"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-text-muted hover:text-text cursor-pointer text-sm transition-colors duration-150"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="border-border mt-10 border-t pt-6">
          <p className="text-text-muted text-sm">
            © 2025 Campus. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
