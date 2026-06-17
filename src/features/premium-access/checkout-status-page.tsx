import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { getCheckoutStatus } from "./checkout-functions";

type CheckoutStatus = Awaited<ReturnType<typeof getCheckoutStatus>>;

export function CheckoutStatusPage({ checkoutId }: { checkoutId: string }) {
  const [status, setStatus] = useState<CheckoutStatus | null>(null);
  const [pollingEnded, setPollingEnded] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const inFlightRef = useRef(false);
  const pollCountRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (!intervalRef.current) return;

    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const loadStatus = useCallback(async () => {
    if (inFlightRef.current) return null;

    inFlightRef.current = true;
    setRefreshing(true);

    try {
      const nextStatus = await getCheckoutStatus({ data: { checkoutId } });

      setStatus(nextStatus);
      setErrorMessage("");
      pollCountRef.current += 1;

      if (nextStatus.status !== "pending") {
        stopPolling();
      }

      if (pollCountRef.current >= 40) {
        setPollingEnded(true);
        stopPolling();
      }

      return nextStatus;
    } catch {
      setErrorMessage("Status Checkout belum bisa dimuat.");
      pollCountRef.current += 1;

      if (pollCountRef.current >= 40) {
        setPollingEnded(true);
        stopPolling();
      }

      return null;
    } finally {
      inFlightRef.current = false;
      setRefreshing(false);
    }
  }, [checkoutId, stopPolling]);

  useEffect(() => {
    pollCountRef.current = 0;
    setPollingEnded(false);

    void loadStatus();
    intervalRef.current = setInterval(() => {
      void loadStatus();
    }, 3000);

    return () => {
      stopPolling();
      inFlightRef.current = false;
    };
  }, [checkoutId, loadStatus, stopPolling]);

  const state = getDisplayState(status?.status ?? "pending");

  return (
    <main className="premium-shell min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#fff8eb_0%,#fbfaf7_44%,#eef8f6_100%)]">
      <div className="premium-lane flex min-h-screen items-center justify-center py-16">
        <section className="w-full max-w-[520px] rounded-[var(--radius-xl)] border-2 border-stone-100 border-b-4 border-b-stone-200 bg-white p-6 text-center shadow-sm">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2"
            style={{
              color: state.accent,
              background: `${state.accent}16`,
              borderColor: `${state.accent}35`,
            }}
          >
            <StatusIcon />
          </div>
          <div className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            Checkout
          </div>
          <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight text-stone-800">
            {state.title}
          </h1>
          <p className="mx-auto mt-3 max-w-[36ch] text-sm font-semibold leading-relaxed text-stone-500">
            {state.description}
          </p>

          {status && (
            <div className="mt-5 rounded-[var(--radius-lg)] border-2 border-stone-100 bg-stone-50 p-4 text-left">
              <b className="block text-sm text-stone-800">{status.productName}</b>
              <div className="mt-2 flex items-center justify-between text-sm font-semibold text-stone-500">
                <span>Total</span>
                <span>Rp{status.total.toLocaleString("id-ID")}</span>
              </div>
            </div>
          )}

          {pollingEnded && status?.status === "pending" && (
            <p className="mt-4 rounded-[var(--radius-md)] border-2 border-amber-100 bg-amber-50 p-3 text-xs font-bold text-amber-700">
              Pembayaran masih menunggu konfirmasi. Kamu bisa refresh status secara manual.
            </p>
          )}

          {errorMessage && (
            <p className="mt-4 rounded-[var(--radius-md)] border-2 border-rose-100 bg-rose-50 p-3 text-xs font-bold text-coral-dark">
              {errorMessage}
            </p>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {status?.status === "pending" && status.invoiceUrl ? (
              <a className="btn btn-primary" href={status.invoiceUrl}>
                Buka Xendit
              </a>
            ) : (
              <Link className="btn btn-primary no-underline" to="/dashboard">
                Dashboard
              </Link>
            )}
            <button className="btn btn-white" disabled={refreshing} onClick={() => void loadStatus()} type="button">
              {refreshing ? "Mengecek..." : "Refresh Status"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

function getDisplayState(status: string) {
  if (status === "paid") {
    return {
      title: "Pembayaran berhasil",
      description: "Akses sudah aktif. Kamu bisa kembali ke Dashboard dan mulai belajar.",
      accent: "#16a34a",
    };
  }

  if (status === "expired") {
    return {
      title: "Checkout kedaluwarsa",
      description: "Link pembayaran sudah tidak aktif. Buat Checkout baru untuk melanjutkan.",
      accent: "#f59e0b",
    };
  }

  if (status === "review_required") {
    return {
      title: "Perlu dicek Admin",
      description: "Pembayaran diterima dengan data yang perlu diverifikasi sebelum akses dibuka.",
      accent: "#f97316",
    };
  }

  if (status === "cancelled") {
    return {
      title: "Checkout dibatalkan",
      description: "Checkout ini tidak aktif. Buat Checkout baru untuk mencoba lagi.",
      accent: "#ef4444",
    };
  }

  return {
    title: "Menunggu konfirmasi",
    description: "Kami sedang mengecek status pembayaran dari Xendit. Halaman ini akan memperbarui otomatis.",
    accent: "#205072",
  };
}

function StatusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
      <path d="M20 7 10 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
