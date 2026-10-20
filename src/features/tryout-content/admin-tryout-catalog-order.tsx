import { MotionConfig, Reorder, useDragControls } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { TryoutIcon } from "../../components/TryoutIcon";
import { AdminPanelHeader } from "../../components/admin/AdminPanelHeader";
import { getSafeErrorMessage } from "../../lib/user-errors";
import { saveTryoutCatalogOrderAdmin, type listTryoutsAdmin } from "./admin-tryout-functions";
import { sortTryoutsForCatalog } from "./tryout-catalog-order";

type TryoutRow = Awaited<ReturnType<typeof listTryoutsAdmin>>[number];
type SaveStatus = "idle" | "saving" | "saved" | "error";

export function AdminTryoutCatalogOrder({ tryouts }: { tryouts: TryoutRow[] }) {
  const published = tryouts.filter((tryout) => tryout.status === "published");
  const serverOrder = sortTryoutsForCatalog(published).map((tryout) => tryout.id);
  const serverOrderKey = serverOrder.join(",");
  const tryoutById = new Map(published.map((tryout) => [tryout.id, tryout]));

  const [order, setOrder] = useState(serverOrder);
  const [isManual, setIsManual] = useState(() => published.some((tryout) => tryout.catalogOrder !== null));
  const [orderedIds, setOrderedIds] = useState(
    () => new Set(published.filter((tryout) => tryout.catalogOrder !== null).map((tryout) => tryout.id)),
  );
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [movedId, setMovedId] = useState("");
  const saveChain = useRef(Promise.resolve());
  const latestOrder = useRef(order);
  const savedOrderKey = useRef(serverOrderKey);
  const currentOrder = useRef(order);
  currentOrder.current = order;

  useEffect(() => {
    setOrder(serverOrder);
    latestOrder.current = serverOrder;
    savedOrderKey.current = serverOrderKey;
  }, [serverOrderKey]);

  useEffect(() => {
    if (!movedId) return;

    const timeout = window.setTimeout(() => setMovedId(""), 1200);
    return () => window.clearTimeout(timeout);
  }, [movedId]);

  // Saves run one at a time and always send the newest order, so quick clicks cannot land out of order.
  const queueSave = (tryoutIds: string[]) => {
    latestOrder.current = tryoutIds;
    setStatus("saving");
    setErrorMessage("");

    saveChain.current = saveChain.current.then(async () => {
      const idsToSave = latestOrder.current;
      const saveKey = `${idsToSave.length > 0 ? "manual" : "auto"}:${idsToSave.join(",")}`;
      if (saveKey === savedOrderKey.current) return;

      try {
        await saveTryoutCatalogOrderAdmin({ data: { tryoutIds: idsToSave } });
        savedOrderKey.current = saveKey;
        if (latestOrder.current !== idsToSave) return;

        setStatus("saved");
        setIsManual(idsToSave.length > 0);
        setOrderedIds(new Set(idsToSave));
      } catch (error) {
        setStatus("error");
        setErrorMessage(getSafeErrorMessage(error, "Urutan belum tersimpan. Muat ulang halaman lalu coba lagi."));
      }
    });
  };

  const moveTo = (tryoutId: string, nextIndex: number) => {
    const currentIndex = order.indexOf(tryoutId);
    if (currentIndex === nextIndex || nextIndex < 0 || nextIndex >= order.length) return;

    const nextOrder = [...order];
    nextOrder.splice(currentIndex, 1);
    nextOrder.splice(nextIndex, 0, tryoutId);

    setOrder(nextOrder);
    setMovedId(tryoutId);
    setAnnouncement(`${tryoutById.get(tryoutId)?.title ?? "Try-out"} dipindah ke posisi ${nextIndex + 1}.`);
    queueSave(nextOrder);
  };

  const resetToAutomatic = () => {
    if (!window.confirm("Kembalikan ke urutan otomatis? Urutan yang kamu atur akan dihapus.")) return;

    const automaticOrder = sortTryoutsForCatalog(published.map((tryout) => ({ ...tryout, catalogOrder: null })))
      .map((tryout) => tryout.id);

    setOrder(automaticOrder);
    setAnnouncement("Urutan dikembalikan ke otomatis.");
    queueSave([]);
  };

  if (published.length === 0) {
    return null;
  }

  return (
    <section id="catalog-order" className="admin-panel mt-6 scroll-mt-6" aria-labelledby="catalog-order-title">
      <AdminPanelHeader
        id="catalog-order-title"
        title="Urutan di katalog peserta"
        badge={
          <span className={`admin-status-pill ${isManual ? "border-primary-soft bg-primary-tint text-primary" : "border-stone-200 bg-stone-100 text-stone-600"}`}>
            {isManual ? "Diatur manual" : "Otomatis"}
          </span>
        }
        description={isManual
          ? "Seret baris atau pakai tombol panah. Urutan langsung berlaku untuk peserta."
          : "Saat ini gratis tampil dulu, lalu yang terbaru. Seret atau pindahkan satu try-out untuk mengatur sendiri."}
        actions={
          <>
            <SaveIndicator status={status} />
            {isManual && (
              <button type="button" onClick={resetToAutomatic} className="admin-button-ghost">
                Kembalikan ke urutan otomatis
              </button>
            )}
          </>
        }
      />

      {errorMessage && <p role="alert" className="admin-alert mx-4">{errorMessage}</p>}
      <p className="sr-only" aria-live="polite">{announcement}</p>

      <MotionConfig reducedMotion="user">
        <Reorder.Group axis="y" values={order} onReorder={setOrder} as="ol" className="m-0 list-none p-0">
          {order.map((tryoutId, index) => {
            const tryout = tryoutById.get(tryoutId);
            if (!tryout) return null;

            return (
              <CatalogOrderRow
                key={tryoutId}
                tryout={tryout}
                position={index + 1}
                isFirst={index === 0}
                isLast={index === order.length - 1}
                isNew={isManual && !orderedIds.has(tryoutId)}
                isHighlighted={movedId === tryoutId}
                onDragEnd={() => {
                  const droppedOrder = currentOrder.current;
                  if (droppedOrder.join(",") === latestOrder.current.join(",")) return;

                  setMovedId(tryoutId);
                  setAnnouncement(`${tryout.title} dipindah ke posisi ${droppedOrder.indexOf(tryoutId) + 1}.`);
                  queueSave(droppedOrder);
                }}
                onMoveTop={() => moveTo(tryoutId, 0)}
                onMoveUp={() => moveTo(tryoutId, index - 1)}
                onMoveDown={() => moveTo(tryoutId, index + 1)}
              />
            );
          })}
        </Reorder.Group>
      </MotionConfig>
    </section>
  );
}

function CatalogOrderRow({
  tryout,
  position,
  isFirst,
  isLast,
  isNew,
  isHighlighted,
  onDragEnd,
  onMoveTop,
  onMoveUp,
  onMoveDown,
}: {
  tryout: TryoutRow;
  position: number;
  isFirst: boolean;
  isLast: boolean;
  isNew: boolean;
  isHighlighted: boolean;
  onDragEnd: () => void;
  onMoveTop: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={tryout.id}
      dragListener={false}
      dragControls={dragControls}
      onDragEnd={onDragEnd}
      whileDrag={{ scale: 1.01, boxShadow: "0 12px 28px rgba(32,80,114,0.16)", zIndex: 10 }}
      className={`group relative flex items-center gap-3 border-t border-stone-100 px-3 py-2.5 transition-colors duration-700 first:border-t-0 last:rounded-b-xl sm:px-4 ${isHighlighted ? "bg-primary-tint" : "bg-white"}`}
    >
      <button
        type="button"
        aria-label={`Seret untuk memindahkan ${tryout.title}`}
        onPointerDown={(event) => dragControls.start(event)}
        className="flex h-9 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-600 active:cursor-grabbing"
      >
        <GripIcon />
      </button>

      <span className="w-6 shrink-0 text-right text-[13px] font-bold tabular-nums text-stone-400">{position}</span>

      <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-stone-100 bg-stone-50 text-stone-500 sm:flex" aria-hidden="true">
        <TryoutIcon icon={tryout.icon} tryoutId={tryout.id} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-bold text-stone-800">{tryout.title}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <span className={`admin-meta-tag ${tryout.accessLevel === "free" ? "text-emerald-700" : "text-amber-700"}`}>
            {tryout.accessLevel === "free" ? "Gratis" : "Premium"}
          </span>
          <span className="admin-meta-tag">{tryout.categoryName}</span>
          {isNew && <span className="admin-meta-tag text-primary">Baru, belum diatur</span>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5 transition-opacity duration-150 [@media(hover:hover)]:opacity-50 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100">
        <button type="button" onClick={onMoveTop} disabled={isFirst} className="admin-button-ghost hidden sm:inline-flex">
          <ArrowTopIcon />
          Ke paling atas
        </button>
        <button type="button" onClick={onMoveTop} disabled={isFirst} className="admin-button-ghost w-8 px-0 sm:hidden" aria-label={`Pindahkan ${tryout.title} ke paling atas`}>
          <ArrowTopIcon />
        </button>
        <button type="button" onClick={onMoveUp} disabled={isFirst} className="admin-button-ghost w-8 px-0" aria-label={`Naikkan ${tryout.title}`}>
          <ArrowIcon direction="up" />
        </button>
        <button type="button" onClick={onMoveDown} disabled={isLast} className="admin-button-ghost w-8 px-0" aria-label={`Turunkan ${tryout.title}`}>
          <ArrowIcon direction="down" />
        </button>
      </div>
    </Reorder.Item>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;

  const config = {
    saving: { label: "Menyimpan…", className: "text-stone-500", dot: "bg-stone-400 animate-pulse" },
    saved: { label: "Tersimpan", className: "text-emerald-700", dot: "bg-emerald-500" },
    error: { label: "Belum tersimpan", className: "text-red-700", dot: "bg-red-500" },
  }[status];

  return (
    <span role="status" className={`inline-flex items-center gap-1.5 text-xs font-semibold ${config.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function GripIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" />
      <circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" />
      <circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" />
    </svg>
  );
}

function ArrowIcon({ direction }: { direction: "up" | "down" }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-4 w-4 ${direction === "down" ? "rotate-180" : ""}`} fill="none" aria-hidden="true">
      <path d="M12 19V5m0 0-6 6m6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowTopIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M5 4h14M12 20V9m0 0-5 5m5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
