/* Avatar del usuario: la foto de Cloudinary si tiene, la inicial si no. */

export default function UserAvatar({
  name,
  avatarUrl,
  className = "size-9 text-sm",
}: {
  name: string;
  avatarUrl?: string | null;
  className?: string;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        aria-hidden
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`bg-primary-solid flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${className}`}
    >
      {name.charAt(0).toUpperCase() || "?"}
    </span>
  );
}
