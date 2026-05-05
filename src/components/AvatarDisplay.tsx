export function AvatarDisplay({
  avatar,
  photoUrl,
  className = "",
  alt = "Foto profil",
}: {
  avatar: string;
  photoUrl?: string | null;
  className?: string;
  alt?: string;
}) {
  if (avatar === "google" && photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={alt}
        className={`object-cover ${className}`}
      />
    );
  }
  return (
    <span className={`flex items-center justify-center ${className}`}>
      {avatar}
    </span>
  );
}
