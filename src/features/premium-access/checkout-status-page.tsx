import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { getCheckoutStatus } from "./checkout-functions";
import { getCheckoutStatusDisplayState } from "./checkout-status-display";

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

  const state = getCheckoutStatusDisplayState(
    status?.status ?? "pending",
    status?.providerStatus ?? null,
  );

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
            <StatusIcon type={state.icon} />
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
                Buka Midtrans
              </a>
            ) : status?.status === "cancelled" || status?.status === "expired" ? (
              <Link className="btn btn-primary no-underline" to="/premium">
                Coba Lagi
              </Link>
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

function StatusIcon({ type }: { type: "success" | "error" | "warning" | "pending" }) {
  if (type === "error") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
        <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "warning") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
        <path d="M12 8v5m0 3.5v.1M4.7 19h14.6a1.5 1.5 0 0 0 1.3-2.25L13.3 4.2a1.5 1.5 0 0 0-2.6 0L3.4 16.75A1.5 1.5 0 0 0 4.7 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "pending") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2.2" />
        <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
      <path d="M20 7 10 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
