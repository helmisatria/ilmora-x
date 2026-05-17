import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { z } from "zod";
import { useApp } from "../data";
import { PremiumDialog } from "../components/PremiumDialog";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { hasFullTryoutReviewAccess, isPremiumQuestionLocked } from "../lib/domain/premium-access";
import { productAnalyticsEvents } from "../lib/product-analytics";
import { useProductAnalytics } from "../lib/product-analytics-client";
import { getAttemptResult, reportAttemptQuestion } from "../lib/student-functions";

gsap.registerPlugin(ScrollTrigger);

const FREE_WRONG_PREVIEW = 3;

const searchSchema = z.object({
  q: z.string().optional(),
  filter: z.enum(["all", "wrong", "correct", "unanswered"]).optional(),
  returnTo: z.enum(["evaluation", "progress", "result"]).optional(),
});

type ReviewFilter = "all" | "wrong" | "correct" | "unanswered";
type ReviewReturnTo = "evaluation" | "progress" | "result" | undefined;
type ReportReason = "answer_key_wrong" | "explanation_wrong" | "question_unclear" | "typo" | "other";

const reportReasons: Array<{ label: string; value: ReportReason }> = [
  { label: "Answer key salah", value: "answer_key_wrong" },
  { label: "Pembahasan keliru", value: "explanation_wrong" },
  { label: "Soal tidak jelas", value: "question_unclear" },
  { label: "Typo", value: "typo" },
  { label: "Lainnya", value: "other" },
];

export const Route = createFileRoute("/results/$attemptId/review")({
  loader: async ({ params }) => {
    const result = await getAttemptResult({ data: { attemptId: params.attemptId } });

    return { result };
  },
  head: ({ params }) => ({
    meta: [
      { title: "Pembahasan Tryout — IlmoraX" },
      { name: "description", content: "Review dan pelajari pembahasan lengkap soal tryout. Lihat jawaban benar, penjelasan detail, dan video pembelajaran." },
      { property: "og:title", content: "Pembahasan Tryout — IlmoraX" },
      { property: "og:description", content: "Review dan pelajari pembahasan lengkap soal tryout." },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: ReviewComponent,
  validateSearch: searchSchema,
});

function ReviewComponent() {
  const { attemptId } = Route.useParams();
  const { result } = Route.useLoaderData() as { result: Awaited<ReturnType<typeof getAttemptResult>> };
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { hasPremiumMembership } = useApp();
  const analytics = useProductAnalytics();
  const { attempt, tryout, questions } = result;
  const hasFullTryoutAccess = hasFullTryoutReviewAccess({
    accessLevel: tryout.accessLevel,
    hasPremiumMembership,
  });

  const [showPremium, setShowPremium] = useState(false);
  const [openReportSnapshotId, setOpenReportSnapshotId] = useState("");
  const [busyReportSnapshotId, setBusyReportSnapshotId] = useState("");
  const [reportedSnapshotId, setReportedSnapshotId] = useState("");
  const [reportError, setReportError] = useState("");
  const [expandedVideoIds, setExpandedVideoIds] = useState<Set<string>>(() => new Set());
  const filter: ReviewFilter = search.filter ?? "all";

  const openPremiumAccess = () => {
    setShowPremium(true);
  };

  const toggleVideo = (snapshotId: string) => {
    setExpandedVideoIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(snapshotId)) {
        nextIds.delete(snapshotId);
        return nextIds;
      }

      nextIds.add(snapshotId);
      return nextIds;
    });
  };

  const headerRef = useRef<HTMLDivElement>(null);
  const questionsRef = useRef<HTMLDivElement>(null);

  const lockedIds = useMemo(() => {
    if (hasPremiumMembership || hasFullTryoutAccess) return new Set<string>();

    const locked = new Set<string>();
    let wrongIdx = 0;
    for (const q of questions) {
      if (isPremiumQuestionLocked({
        questionAccessLevel: q.accessLevel,
        tryoutAccessLevel: tryout.accessLevel,
        hasPremiumMembership,
      })) {
        locked.add(q.snapshotId);
        continue;
      }

      const isWrongOrEmpty = q.isCorrect !== true;
      if (isWrongOrEmpty) {
        if (wrongIdx >= FREE_WRONG_PREVIEW) locked.add(q.snapshotId);
        wrongIdx++;
      }
    }
    return locked;
  }, [questions, tryout.accessLevel, hasPremiumMembership, hasFullTryoutAccess]);

  const filteredQuestions = questions.filter((q) => {
    if (filter === "wrong") return q.selectedIndex !== null && q.isCorrect === false;
    if (filter === "correct") return q.isCorrect === true;
    if (filter === "unanswered") return q.selectedIndex === null;
    return true;
  });
  const correctCount = questions.filter((q) => q.isCorrect === true).length;
  const wrongCount = questions.filter((q) => q.selectedIndex !== null && q.isCorrect === false).length;
  const unansweredCount = questions.filter((q) => q.selectedIndex === null).length;

  const changeFilter = (nextFilter: ReviewFilter) => {
    const nextSearch = {
      ...(search.returnTo ? { returnTo: search.returnTo } : {}),
      ...(nextFilter === "all" ? {} : { filter: nextFilter }),
    };

    navigate({
      to: "/results/$attemptId/review",
      params: { attemptId },
      search: nextSearch,
    });
  };

  const submitQuestionReport = async (snapshotId: string, reason: ReportReason) => {
    setBusyReportSnapshotId(snapshotId);
    setReportError("");

    try {
      await reportAttemptQuestion({
        data: {
          attemptId: attempt.id,
          snapshotId,
          reason,
        },
      });
      analytics.capture(productAnalyticsEvents.questionReported, {
        attempt_id: attempt.id,
        tryout_id: attempt.tryoutId,
        snapshot_id: snapshotId,
        reason,
      });
      setReportedSnapshotId(snapshotId);
      setOpenReportSnapshotId("");
    } catch {
      setReportError("Laporan belum terkirim. Coba lagi sebentar lagi.");
    } finally {
      setBusyReportSnapshotId("");
    }
  };

  useEffect(() => {
    if (!search.q) return;
    const id = search.q;
    const timer = window.setTimeout(() => {
      const el = document.querySelector<HTMLElement>(`[data-question-id="${id}"]`);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-4", "ring-primary-light", "ring-offset-2");
      window.setTimeout(() => {
        el.classList.remove("ring-4", "ring-primary-light", "ring-offset-2");
      }, 1600);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [search.q, filter]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );

      const cards = questionsRef.current?.querySelectorAll(".question-card");
      if (cards) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.08,
            ease: "power2.out",
            scrollTrigger: {
              trigger: questionsRef.current,
              start: "top 85%",
            },
          }
        );
      }
    });

    return () => ctx.revert();
  }, [filter]);

  return (
    <main className="overflow-x-hidden w-full max-w-full min-h-screen bg-[#fafafa] font-['Cabinet_Grotesk',system-ui,sans-serif]">
      {/* Sticky Header */}
      <header
        ref={headerRef}
        className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-stone-200/80"
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <ReviewBackLink
            attemptId={attemptId}
            returnTo={search.returnTo}
            className="w-10 h-10 rounded-xl bg-stone-100 border-2 border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-200 transition-colors"
          >
            <ArrowLeftIcon />
          </ReviewBackLink>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-stone-900 truncate">Pembahasan Lengkap</h1>
            <p className="text-sm text-stone-500">{tryout.title} · Attempt #{attempt.attemptNumber}</p>
          </div>

          <div className="hidden sm:flex items-center gap-6 text-sm">
            <div className="text-center">
              <div className="text-lg font-black text-primary">{correctCount}</div>
              <div className="text-xs font-medium text-stone-400 uppercase">Benar</div>
            </div>
            <div className="w-px h-8 bg-stone-200" />
            <div className="text-center">
              <div className="text-lg font-black text-red-500">{wrongCount}</div>
              <div className="text-xs font-medium text-stone-400 uppercase">Salah</div>
            </div>
            <div className="w-px h-8 bg-stone-200" />
            <div className="text-center">
              <div className="text-lg font-black text-stone-800">{attempt.score}%</div>
              <div className="text-xs font-medium text-stone-400 uppercase">Skor</div>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="max-w-6xl mx-auto px-6 pb-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {([
              { k: "all", label: `Semua (${questions.length})` },
              { k: "wrong", label: `Salah (${wrongCount})` },
              { k: "correct", label: `Benar (${correctCount})` },
              { k: "unanswered", label: `Kosong (${unansweredCount})` },
            ] as const).map((f) => (
              <button
                key={f.k}
                onClick={() => changeFilter(f.k)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap border-2 transition-all ${
                  filter === f.k
                    ? "bg-primary text-white border-primary-dark"
                    : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Questions List */}
      <section className="py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div ref={questionsRef} className="flex flex-col gap-4">
            {filteredQuestions.map((q, idx) => {
              const userSel = q.selectedIndex;
              const isCorrect = q.isCorrect === true;
              const hasAnswer = q.selectedIndex !== null;
              const premiumLocked = lockedIds.has(q.snapshotId);
              const videoUrl = getVideoEmbedUrl(q.videoUrl);
              const canViewVideo = Boolean(videoUrl)
                && (
                  q.accessLevel === "free"
                  || (!premiumLocked && (hasPremiumMembership || hasFullTryoutAccess))
                );
              const isVideoExpanded = expandedVideoIds.has(q.snapshotId);

              return (
                <div
                  key={q.snapshotId}
                  data-question-id={q.snapshotId}
                  className="question-card group relative overflow-hidden rounded-[24px] border-2 bg-white transition-all duration-500 hover:shadow-xl"
                  style={{
                    borderColor: isCorrect ? "#86efac" : hasAnswer ? "#fca5a5" : "#e5e7eb",
                    borderBottomColor: isCorrect ? "#22c55e" : hasAnswer ? "#ef4444" : "#d1d5db",
                  }}
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                            isCorrect
                              ? "bg-green-100 border-2 border-green-200 text-green-700"
                              : hasAnswer
                              ? "bg-red-100 border-2 border-red-200 text-red-700"
                              : "bg-stone-100 border-2 border-stone-200 text-stone-500"
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <span
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full border-2"
                          style={{
                            color: "#153d5c",
                            borderColor: "#79b7d955",
                            background: "#f1f7fb",
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {getCategoryLabel(q.categoryId)}
                        </span>
                      </div>

                      <span
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                          isCorrect
                            ? "bg-green-100 text-green-700"
                            : hasAnswer
                            ? "bg-red-100 text-red-700"
                            : "bg-stone-100 text-stone-500"
                        }`}
                      >
                          {isCorrect ? "Benar" : hasAnswer ? "Salah" : "Kosong"}
                      </span>
                    </div>

                    {/* Question */}
                    <p className="text-lg font-semibold text-stone-800 leading-relaxed mb-5 max-w-4xl">
                      {q.questionText}
                    </p>

                    {/* Options */}
                    <div className="grid gap-2 mb-6">
                      {q.options.map((opt, i) => {
                        const isUser = userSel === i;
                        const isRight = q.correctIndex === i;
                        const hideRight = premiumLocked && isRight && !isCorrect;
                        let cls = "bg-stone-50 border-stone-200 text-stone-600";
                        let icon = null;

                        if (isRight && !hideRight) {
                          cls = "bg-green-50 border-green-300 text-green-700";
                          icon = <CheckIcon className="w-4 h-4 text-green-600" />;
                        } else if (isUser && !isRight) {
                          cls = "bg-red-50 border-red-300 text-red-700";
                          icon = <XIcon className="w-4 h-4 text-red-500" />;
                        } else if (hideRight) {
                          cls = "bg-amber-50 border-amber-200 text-amber-700";
                          icon = <LockIcon className="w-4 h-4 text-amber-600" />;
                        }

                        return (
                          <div
                            key={i}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 font-medium text-sm ${cls}`}
                          >
                            <span className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs bg-white border border-stone-200 shrink-0">
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className={`flex-1 ${hideRight ? "select-none blur-sm" : ""}`}>{opt}</span>
                            {icon}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    <div className="rounded-[20px] border-2 overflow-hidden" style={{ borderColor: premiumLocked ? "#fcd34d" : "rgba(32,80,114,0.19)" }}>
                      <div className="px-4 py-3 border-b-2 flex items-center gap-2" style={{ borderColor: premiumLocked ? "#fcd34d" : "rgba(32,80,114,0.19)", background: premiumLocked ? "#fffbeb" : "#f1f7fb" }}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${premiumLocked ? "bg-amber-100 text-amber-600" : "bg-primary-soft text-primary"}`}>
                          {premiumLocked ? <LockIcon /> : <FileTextIcon />}
                        </div>
                        <span className="font-bold text-sm" style={{ color: premiumLocked ? "#92400e" : "#0b2135" }}>
                          {premiumLocked ? "Pembahasan Terkunci" : "Pembahasan"}
                        </span>
                      </div>

                      <div className="p-4">
                        {premiumLocked ? (
                          <div className="relative">
                            <p className="m-0 text-sm leading-relaxed text-stone-400 blur-sm select-none">
                              {q.explanation}
                            </p>
                            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm">
                              <button
                                onClick={openPremiumAccess}
                                className="px-6 py-3 rounded-xl bg-amber-600 text-white font-bold text-sm border-b-4 border-amber-800 hover:bg-amber-700 transition-all active:translate-y-[2px] active:border-b-0 shadow-lg"
                              >
                                <LockIcon className="w-4 h-4 inline mr-2" />
                                Unlock Pembahasan
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="m-0 text-sm leading-relaxed text-stone-700">{q.explanation}</p>
                        )}
                      </div>
                    </div>

                    {/* Video */}
                    {canViewVideo && (
                      <div className="mt-4 rounded-[16px] border-2 border-rose-100 bg-rose-50/40">
                        <button
                          type="button"
                          onClick={() => toggleVideo(q.snapshotId)}
                          aria-expanded={isVideoExpanded}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-rose-50"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-rose-200 bg-rose-100 text-rose-600">
                            {isVideoExpanded ? <ChevronUpIcon /> : <PlayIcon />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-sm text-stone-800">Video Pembelajaran</div>
                            <div className="text-xs font-semibold text-stone-400">
                              {isVideoExpanded ? "Sembunyikan video" : "Klik untuk membuka video pembahasan"}
                            </div>
                          </div>
                          <ChevronDownIcon className={`h-5 w-5 shrink-0 text-stone-400 transition-transform ${isVideoExpanded ? "rotate-180" : ""}`} />
                        </button>

                        {isVideoExpanded && (
                          <div className="px-4 pb-4">
                            <div className="relative h-0 overflow-hidden rounded-[16px] border-2 border-stone-200 bg-stone-900 pb-[56.25%]">
                              <iframe
                                src={videoUrl}
                                title={`Pembahasan soal ${idx + 1}`}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="absolute left-0 top-0 h-full w-full"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {q.videoUrl && !canViewVideo && (
                      <div className="mt-4 p-4 rounded-xl bg-amber-50 border-2 border-amber-200 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-100 border-2 border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                          <PlayIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-amber-900">Video Pembelajaran</div>
                          <div className="text-xs font-medium text-amber-700">Tersedia untuk member Premium</div>
                        </div>
                        <button
                          type="button"
                          onClick={openPremiumAccess}
                          className="shrink-0 px-4 py-2 rounded-lg bg-amber-600 text-white font-bold text-xs border-b-4 border-amber-800 hover:bg-amber-700 transition-all active:translate-y-[2px] active:border-b-0"
                        >
                          Unlock
                        </button>
                      </div>
                    )}

                    <div className="mt-4 rounded-xl border-2 border-stone-100 bg-stone-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-stone-700">Laporkan soal</div>
                          <p className="m-0 mt-1 text-xs font-semibold text-stone-400">
                            Tandai soal ini untuk ditinjau Admin.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOpenReportSnapshotId(openReportSnapshotId === q.snapshotId ? "" : q.snapshotId)}
                          disabled={busyReportSnapshotId === q.snapshotId}
                          className="rounded-lg border-2 border-stone-200 bg-white px-4 py-2 text-xs font-bold text-stone-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                        >
                          {reportedSnapshotId === q.snapshotId ? "Terkirim" : "Laporkan"}
                        </button>
                      </div>

                      {openReportSnapshotId === q.snapshotId && (
                        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                          {reportReasons.map((reason) => (
                            <button
                              key={reason.value}
                              type="button"
                              onClick={() => submitQuestionReport(q.snapshotId, reason.value)}
                              disabled={busyReportSnapshotId === q.snapshotId}
                              className="rounded-lg border-2 border-stone-200 bg-white px-3 py-2 text-left text-xs font-bold text-stone-600 transition-colors hover:border-primary-soft hover:bg-primary-tint hover:text-primary-dark"
                            >
                              {reason.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {reportError && openReportSnapshotId === q.snapshotId && (
                        <p className="m-0 mt-3 text-xs font-semibold text-rose-600">{reportError}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Actions */}
          <div className="mt-8 flex gap-4">
            <ReviewBackLink
              attemptId={attemptId}
              returnTo={search.returnTo}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-stone-100 text-stone-700 font-bold border-b-4 border-stone-300 hover:bg-stone-200 transition-all active:translate-y-[2px] active:border-b-0"
            >
              <ArrowLeftIcon />
              Kembali
            </ReviewBackLink>
            <Link
              to="/dashboard"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-primary text-white font-bold border-b-4 border-primary-darker hover:bg-primary-dark transition-all active:translate-y-[2px] active:border-b-0 shadow-lg shadow-primary/20"
            >
              <HomeIcon />
              Dashboard
            </Link>
          </div>
        </div>
      </section>

      <PremiumDialog
        isOpen={showPremium}
        onClose={() => setShowPremium(false)}
        onUpgrade={() => setShowPremium(false)}
        hasPremiumMembership={hasPremiumMembership}
        tryout={null}
      />
    </main>
  );
}

function getCategoryLabel(catId: string): string {
  const labels: Record<string, string> = {
    klinis: "KLINIS",
    farmakologi: "FARMAKOLOGI",
    "farmasi-klinik": "FARMASI KLINIK",
  };
  return labels[catId] || catId.toUpperCase();
}

function ReviewBackLink({
  attemptId,
  returnTo,
  className,
  children,
}: {
  attemptId: string;
  returnTo: ReviewReturnTo;
  className: string;
  children: ReactNode;
}) {
  if (returnTo === "evaluation") {
    return (
      <Link to="/evaluation" className={className}>
        {children}
      </Link>
    );
  }

  if (returnTo === "progress") {
    return (
      <Link to="/progress" className={className}>
        {children}
      </Link>
    );
  }

  return (
    <Link to="/results/$attemptId" params={{ attemptId }} className={className}>
      {children}
    </Link>
  );
}

function getVideoEmbedUrl(value: string | null | undefined) {
  const rawUrl = value?.trim();

  if (!rawUrl) return "";

  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") {
      const videoId = url.pathname.split("/").filter(Boolean)[0];

      if (!videoId) return rawUrl;

      return makeYouTubeEmbedUrl(videoId, url.searchParams.get("t") ?? url.searchParams.get("start"));
    }

    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      if (url.pathname.startsWith("/embed/")) {
        return rawUrl;
      }

      if (url.pathname.startsWith("/shorts/")) {
        const videoId = url.pathname.split("/").filter(Boolean)[1];

        if (!videoId) return rawUrl;

        return makeYouTubeEmbedUrl(videoId, url.searchParams.get("t") ?? url.searchParams.get("start"));
      }

      const videoId = url.searchParams.get("v");

      if (!videoId) return rawUrl;

      return makeYouTubeEmbedUrl(videoId, url.searchParams.get("t") ?? url.searchParams.get("start"));
    }

    return rawUrl;
  } catch {
    return rawUrl;
  }
}

function makeYouTubeEmbedUrl(videoId: string, startTime: string | null) {
  const embedUrl = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
  const startSeconds = toYouTubeStartSeconds(startTime);

  embedUrl.searchParams.set("controls", "0");
  embedUrl.searchParams.set("disablekb", "1");
  embedUrl.searchParams.set("iv_load_policy", "3");
  embedUrl.searchParams.set("modestbranding", "1");
  embedUrl.searchParams.set("rel", "0");
  embedUrl.searchParams.set("playsinline", "1");

  if (startSeconds > 0) {
    embedUrl.searchParams.set("start", String(startSeconds));
  }

  return embedUrl.toString();
}

function toYouTubeStartSeconds(value: string | null) {
  if (!value) return 0;

  const numericValue = Number(value);

  if (Number.isFinite(numericValue)) {
    return Math.max(0, Math.floor(numericValue));
  }

  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/i);

  if (!match) return 0;

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);

  return (hours * 3600) + (minutes * 60) + seconds;
}

// Icons
function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m10 8 6 4-6 4V8z" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? "w-5 h-5"} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ChevronUpIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? "w-5 h-5"} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m18 15-6-6-6 6" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}
