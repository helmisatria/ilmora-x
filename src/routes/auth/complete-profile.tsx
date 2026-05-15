import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { institutions } from "../../data/institutions";
import { completeProfile, getCurrentViewer, getPostLoginRedirectForViewer } from "../../lib/auth-functions";
import { analyticsSearchSchema, productAnalyticsEvents } from "../../lib/product-analytics";
import { useProductAnalytics } from "../../lib/product-analytics-client";

export const Route = createFileRoute("/auth/complete-profile")({
  loader: async () => {
    const viewer = await getCurrentViewer();

    if (!viewer) {
      throw redirect({ to: "/auth/login" });
    }

    if (viewer.admin || viewer.profile?.completed) {
      throw redirect({ to: getPostLoginRedirectForViewer(viewer) });
    }

    return { viewer };
  },
  head: () => ({
    meta: [
      { title: "Lengkapi Profil — IlmoraX" },
      { name: "description", content: "Lengkapi profil IlmoraX-mu. Masukkan nama lengkap dan pilih institusi untuk personalisasi pengalaman belajar." },
      { property: "og:title", content: "Lengkapi Profil — IlmoraX" },
      { property: "og:description", content: "Lengkapi profil IlmoraX-mu untuk personalisasi pengalaman belajar." },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: CompleteProfileComponent,
  validateSearch: analyticsSearchSchema,
});

function CompleteProfileComponent() {
  const { viewer } = Route.useLoaderData();
  const { intent } = Route.useSearch();
  const navigate = useNavigate();
  const analytics = useProductAnalytics();
  const [step, setStep] = useState(1);
  const [name, setName] = useState(viewer?.profile?.displayName ?? viewer?.name ?? "");
  const [institution, setInstitution] = useState(viewer?.profile?.institution ?? "");
  const [phone, setPhone] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const canProceed = step === 1 ? name.trim().length > 0 : institution.trim().length > 0;

  const handleSubmit = async () => {
    if (!canProceed || saving) return;

    setSaving(true);
    setErrorMessage("");

    try {
      const result = await completeProfile({
        data: {
          displayName: name,
          institution,
          phone,
          photoUrl,
          analyticsIntent: intent,
        },
      });

      navigate({ to: result.redirectTo });
    } catch {
      setErrorMessage("Profil belum tersimpan. Coba lagi sebentar.");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      <div className="bg-white border-b-2 border-stone-200 px-4 py-4">
        <div className="max-w-[480px] mx-auto flex items-center gap-3">
          <div className="text-2xl">🦉</div>
          <span className="font-black text-primary text-lg">IlmoraX</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="max-w-[400px] w-full">
          <div className="flex gap-2 mb-8">
            <div className={`flex-1 h-2 rounded-full ${step >= 1 ? "bg-primary" : "bg-stone-200"}`} />
            <div className={`flex-1 h-2 rounded-full ${step >= 2 ? "bg-primary" : "bg-stone-200"}`} />
          </div>

          {step === 1 && (
            <div className="view">
              <div className="text-5xl mb-4">👋</div>
              <h2 className="text-2xl font-black text-stone-800 mb-2">Siapa namamu?</h2>
              <p className="text-stone-400 font-medium mb-8">Nama ini akan tampil di leaderboard dan profil</p>

              <label className="block mb-2 font-bold text-sm text-stone-600">Nama Lengkap *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama lengkap"
                className="w-full px-4 py-3.5 rounded-[var(--radius-md)] border-2 border-stone-200 font-semibold text-base bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                autoFocus
              />

              <button
                onClick={() => {
                  if (!canProceed) return;
                  analytics.capture(productAnalyticsEvents.profileStepAdvanced, {
                    intent,
                    from_step: 1,
                    to_step: 2,
                  });
                  setStep(2);
                }}
                disabled={!canProceed}
                className="btn btn-primary w-full mt-6"
              >
                Lanjutkan
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="view">
              <div className="text-5xl mb-4">🎓</div>
              <h2 className="text-2xl font-black text-stone-800 mb-2">Dari institusi mana?</h2>
              <p className="text-stone-400 font-medium mb-8">Pilih institusimu untuk personalisasi pengalaman</p>

              <label className="block mb-2 font-bold text-sm text-stone-600">Institusi *</label>
              <select
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full px-4 py-3.5 rounded-[var(--radius-md)] border-2 border-stone-200 font-semibold text-base bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
              >
                <option value="">Pilih institusi...</option>
                {institutions.map((inst) => (
                  <option key={inst} value={inst}>{inst}</option>
                ))}
              </select>

              <label className="block mb-2 font-bold text-sm text-stone-600 mt-5">Nomor Telepon (opsional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+62 812 3456 7890"
                className="w-full px-4 py-3.5 rounded-[var(--radius-md)] border-2 border-stone-200 font-semibold text-base bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />

              <button
                onClick={() => canProceed && handleSubmit()}
                disabled={!canProceed || saving}
                className="btn btn-primary w-full mt-6"
              >
                {saving ? "Menyimpan profil..." : "Mulai Belajar"}
              </button>

              {errorMessage && (
                <p className="mt-4 text-center text-sm font-semibold text-red-500">
                  {errorMessage}
                </p>
              )}

              <button
                onClick={() => setStep(1)}
                className="w-full mt-3 py-2 text-sm text-stone-400 font-semibold hover:text-stone-600 transition-colors bg-transparent border-none cursor-pointer"
              >
                ← Kembali
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
