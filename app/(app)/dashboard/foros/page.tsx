import type { Metadata } from "next";

import MyForums from "@/components/forum/MyForums";

export const metadata: Metadata = {
  title: "Foros — Campus",
};

export default function ForumsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <h1 className="text-text text-2xl font-bold md:text-3xl">Mis foros</h1>
      <div className="mt-6">
        <MyForums />
      </div>
    </div>
  );
}
