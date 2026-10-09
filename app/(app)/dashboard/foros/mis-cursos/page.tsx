import type { Metadata } from "next";

import MyForums from "@/components/forum/MyForums";

export const metadata: Metadata = {
  title: "Foros de mis cursos — Campus",
};

export default function MyCoursesForumPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <h1 className="text-text text-2xl font-bold md:text-3xl">Foros de mis cursos</h1>
      <p className="text-text-muted mt-1 text-sm">Hilos de tus cursos y tus propias participaciones.</p>
      <div className="mt-6">
        <MyForums />
      </div>
    </div>
  );
}
