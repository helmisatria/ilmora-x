import { useBlocker } from "@tanstack/react-router";

export const unsavedChangesMessage = "Ada perubahan yang belum disimpan. Tinggalkan halaman dan buang perubahan?";

// Asks before an in-app route change or a tab close/reload drops unsaved work.
export function useUnsavedChangesGuard(isDirty: boolean) {
  useBlocker({
    shouldBlockFn: () => !window.confirm(unsavedChangesMessage),
    enableBeforeUnload: isDirty,
    disabled: !isDirty,
  });
}
