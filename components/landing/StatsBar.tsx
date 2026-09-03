import { Award, BookOpen, Clock, Code2 } from "lucide-react";

const STATS = [
  { icon: BookOpen, value: "+500", label: "Lecciones interactivas" },
  { icon: Code2, value: "+20", label: "Casos prácticos" },
  { icon: Clock, value: "24/7", label: "Tutor IA disponible" },
  { icon: Award, value: "100%", label: "Certificados verificados" },
];

export default function StatsBar() {
  return (
    <section className="border-border bg-surface border-y py-8">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 lg:grid-cols-4">
        {STATS.map(({ icon: Icon, value, label }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
              <Icon className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-text text-2xl font-bold">{value}</p>
              <p className="text-text-muted text-sm">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
