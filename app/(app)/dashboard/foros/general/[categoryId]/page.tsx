import CategoryThreads from "@/components/forum/CategoryThreads";

export default async function ForumCategoryPage({ params }: { params: Promise<{ categoryId: string }> }) {
  const { categoryId } = await params;
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <CategoryThreads categoryId={categoryId} />
    </div>
  );
}
