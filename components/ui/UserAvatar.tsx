import ImageWithFallback from "@/components/ui/ImageWithFallback";

/* Avatar del usuario: la foto de Cloudinary si tiene, la inicial si no.
   Si la URL existe pero no carga (imagen borrada, sin internet), también
   cae a la inicial en vez de dejar el ícono de imagen rota. */

export default function UserAvatar({
  name,
  avatarUrl,
  className = "size-9 text-sm",
}: {
  name: string;
  avatarUrl?: string | null;
  className?: string;
}) {
  return (
    <ImageWithFallback
      src={avatarUrl}
      alt=""
      className={`shrink-0 rounded-full object-cover ${className}`}
      fallback={
        <span
          aria-hidden
          className={`bg-primary-solid flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${className}`}
        >
          {name.charAt(0).toUpperCase() || "?"}
        </span>
      }
    />
  );
}
