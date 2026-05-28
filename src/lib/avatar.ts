export const defaultAvatar = "🦉";

export const avatarOptions = [
  "google",
  "🦉",
  "🧑‍⚕️",
  "👩‍⚕️",
  "👨‍⚕️",
  "🧑‍🔬",
  "👩‍🔬",
  "👨‍🔬",
  "🧑‍🎓",
  "👩‍🎓",
  "👨‍🎓",
  "💊",
] as const;

export type AvatarOption = (typeof avatarOptions)[number];

const selectableAvatars = new Set<string>(avatarOptions);

export type AvatarDisplayState = {
  avatar: string;
  photoUrl: string | null;
};

export function isSelectableAvatar(avatar: string | null | undefined): avatar is AvatarOption {
  if (!avatar) return false;

  return selectableAvatars.has(avatar);
}

export function resolveAvatarDisplay({
  avatar,
  photoUrl,
  googlePhotoUrl,
  fallbackName,
}: {
  avatar: string | null | undefined;
  photoUrl?: string | null;
  googlePhotoUrl?: string | null;
  fallbackName?: string | null;
}): AvatarDisplayState {
  if (isSelectableAvatar(avatar)) {
    const selectedAvatar = avatar;

    return {
      avatar: selectedAvatar,
      photoUrl: selectedAvatar === "google" ? photoUrl ?? googlePhotoUrl ?? null : null,
    };
  }

  if (photoUrl || googlePhotoUrl) {
    return {
      avatar: "google",
      photoUrl: photoUrl ?? googlePhotoUrl ?? null,
    };
  }

  return {
    avatar: fallbackName?.trim() || defaultAvatar,
    photoUrl: null,
  };
}
