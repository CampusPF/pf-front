import type { Metadata } from "next";

import GeneralForum from "@/components/forum/GeneralForum";

export const metadata: Metadata = {
  title: "Foros generales — Campus",
};

export default function GeneralForumPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <h1 className="text-text text-2xl font-bold md:text-3xl">Foros generales</h1>
      <p className="text-text-muted mt-1 text-sm">Charlas de toda la comunidad del campus</p>
      <div className="mt-6">
        <GeneralForum />
      </div>
    </div>
  );
}
