import ThreadView from "@/components/forum/ThreadView";

export default async function ForumThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <ThreadView key={threadId} threadId={threadId} />
    </div>
  );
}
