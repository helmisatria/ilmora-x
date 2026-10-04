import { z } from "zod";
import type { TryoutWorkbookSource } from "./tryout-content-types";

export const workbookSourceSchema = z.object({
  version: z.literal(1),
  tryoutId: z.string().trim().min(1),
  updatedAt: z.iso.datetime(),
});

export function getWorkbookSourceError(
  source: TryoutWorkbookSource | undefined,
  target: { id: string; updatedAt: string },
) {
  if (!source) {
    return "File Excel ini belum memiliki versi sumber. Unduh Excel terbaru dari try-out ini, lalu pindahkan perubahan Anda ke file tersebut.";
  }
  if (source.tryoutId !== target.id) {
    return "File Excel ini berasal dari try-out lain. Unduh Excel dari try-out yang sedang dibuka.";
  }
  if (new Date(source.updatedAt).getTime() !== new Date(target.updatedAt).getTime()) {
    return "File Excel ini sudah tertinggal dari perubahan terbaru. Unduh Excel terbaru, lalu pindahkan perubahan Anda ke file tersebut.";
  }
  return null;
}
