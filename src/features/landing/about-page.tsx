import { ArrowRightIcon, CheckCircledIcon } from "@radix-ui/react-icons";
import { Link } from "@tanstack/react-router";
import { businessDetails } from "./landing-content";
import { ArrowUpRightIcon, CrownIcon } from "./landing-icons";
import { PublicNavigation } from "./public-navigation";

const services = [
  "Try-out UKAI dengan timer dan alur seperti ujian",
  "Pembahasan soal dan analisis hasil belajar",
  "Rekomendasi latihan berdasarkan topik yang perlu dikuasai",
  "Paket Premium dengan akses ke seluruh materi dan try-out",
] as const;

export function AboutPage() {
  return (
    <main
      className="min-h-[100dvh] overflow-x-hidden bg-[#f7faf9] text-stone-900"
      style={{
        fontFamily:
          "'Geist', 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <PublicNavigation />

      <section className="relative px-4 pb-20 pt-36 sm:px-6 sm:pt-40 md:pb-28">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-28 top-12 h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(159,216,207,0.28)_0%,_transparent_70%)]" />
          <div className="absolute -right-40 top-20 h-[520px] w-[520px] rounded-full border border-white" />
        </div>

        <div className="relative mx-auto grid w-full max-w-[1240px] gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="pt-2 lg:pt-8">
            <div className="inline-flex items-center rounded-full border border-[#d8e9e4] bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--brand-primary)]">
              Tentang Kami
            </div>
            <h1 className="mt-6 max-w-[13ch] text-[clamp(2.8rem,5vw,4.9rem)] font-[780] leading-[0.95] tracking-[-0.05em] text-[#202124]">
              Belajar UKAI dengan arah yang lebih jelas.
            </h1>
            <p className="mt-6 max-w-[58ch] text-[16px] leading-[1.8] text-stone-600 sm:text-[17px]">
              IlmoraX adalah layanan belajar digital dari Ilmora Academy untuk
              membantu calon apoteker berlatih, memahami hasil, dan menentukan
              materi yang perlu diprioritaskan sebelum UKAI.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/tryout"
                search={{ intent: "home_tryout" }}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[1rem] bg-[var(--brand-primary)] px-5 text-[14px] font-black text-white no-underline shadow-[0_14px_28px_-18px_rgba(32,80,114,0.65)] transition-transform hover:-translate-y-0.5 active:translate-y-px"
              >
                Daftar Gratis <ArrowRightIcon className="size-4" />
              </Link>
              <Link
                to="/premium"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[1rem] border border-[#d5e5e0] bg-white px-5 text-[14px] font-bold text-stone-800 no-underline transition-colors hover:bg-[#edf5f2]"
              >
                <CrownIcon /> Lihat Paket Premium
              </Link>
            </div>
          </div>

          <BusinessInformation />
        </div>
      </section>

      <section className="border-t border-[#dce9e5] bg-white px-4 py-20 sm:px-6 md:py-24">
        <div className="mx-auto grid w-full max-w-[1240px] gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#c58319]">
              Layanan IlmoraX
            </div>
            <h2 className="mt-3 max-w-[15ch] text-[clamp(2rem,3vw,3rem)] font-[740] leading-[1.05] tracking-[-0.04em] text-[#202124]">
              Persiapan yang terukur, bukan sekadar banyak latihan.
            </h2>
          </div>

          <div className="divide-y divide-[#dfe9e6] border-y border-[#dfe9e6]">
            {services.map((service) => (
              <div key={service} className="flex gap-3 py-4 text-[15px] leading-relaxed text-stone-700">
                <CheckCircledIcon className="mt-0.5 size-5 shrink-0 text-[var(--brand-primary)]" />
                <span>{service}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function BusinessInformation() {
  return (
    <section className="rounded-[2rem] border border-[#d6e8e2] bg-white p-5 shadow-[0_24px_54px_-30px_rgba(45,91,78,0.32)] sm:p-7">
      <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#c58319]">
        Informasi Bisnis
      </div>
      <h2 className="mt-2 text-[24px] font-bold tracking-tight text-stone-900">
        {businessDetails.name}
      </h2>
      <p className="mt-1 text-[13px] leading-relaxed text-stone-500">
        Dukungan dan operasional IlmoraX di Denpasar, Bali.
      </p>

      <div className="mt-5 divide-y divide-[#dfe9e6] border-y border-[#dfe9e6]">
        <a
          href={businessDetails.mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="group grid gap-2 py-5 text-stone-800 no-underline sm:grid-cols-[110px_1fr] sm:gap-4"
        >
          <span className="text-[11px] font-black uppercase tracking-[0.08em] text-stone-400">
            Alamat
          </span>
          <span>
            <address className="max-w-[44ch] text-[14px] not-italic leading-[1.7] text-stone-700">
              {businessDetails.address}
            </address>
            <span className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--brand-primary)] transition-transform group-hover:translate-x-0.5">
              Buka di Google Maps <ArrowUpRightIcon />
            </span>
          </span>
        </a>

        <div className="grid gap-3 py-5 sm:grid-cols-[110px_1fr] sm:gap-4">
          <span className="text-[11px] font-black uppercase tracking-[0.08em] text-stone-400">
            Kontak
          </span>
          <div className="grid gap-3">
            {businessDetails.contacts.map((contact) => (
              <a
                key={contact.label}
                href={contact.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="group flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-stone-800 no-underline"
              >
                <span className="text-[12px] font-semibold text-stone-500">
                  {contact.label}
                </span>
                <span className="text-[14px] font-bold tracking-tight transition-colors group-hover:text-[var(--brand-primary)]">
                  {contact.phone}
                </span>
              </a>
            ))}
            <a
              href={`mailto:${businessDetails.email}`}
              className="group flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-stone-800 no-underline"
            >
              <span className="text-[12px] font-semibold text-stone-500">Email</span>
              <span className="text-[14px] font-bold tracking-tight transition-colors group-hover:text-[var(--brand-primary)]">
                {businessDetails.email}
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
