import { Link } from "@tanstack/react-router";
import {
  Cross2Icon,
  HamburgerMenuIcon,
} from "@radix-ui/react-icons";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { heroNavItems } from "./landing-content";
import { BrandMark } from "./landing-icons";
import { useLandingLinkAnalytics } from "./landing-link-analytics";

const defaultActiveNavHref = heroNavItems[0].href;
type HeroNavHref = (typeof heroNavItems)[number]["href"];
const useSafeLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

type PublicNavigationProps = {
  isHomePage?: boolean;
};

export function PublicNavigation({ isHomePage = false }: PublicNavigationProps) {
  const tryoutAnalytics = useLandingLinkAnalytics("/tryout", "landing_nav_signup");
  const loginAnalytics = useLandingLinkAnalytics("/auth/login", "landing_nav_login");
  const shouldReduceMotion = useReducedMotion();

  return (
    <header className="fixed inset-x-0 top-0 z-30 px-3 pt-4 sm:px-4 sm:pt-5">
      <motion.nav
        animate={{ opacity: 1, y: 0 }}
        className="landing-reveal mx-auto flex w-full max-w-[1240px] items-center justify-between rounded-full border border-[rgba(214,234,228,0.95)] bg-[rgba(255,255,255,0.92)] px-2.5 py-2.5 shadow-[0_16px_42px_rgba(144,181,170,0.18)] backdrop-blur-2xl sm:px-4 sm:py-3"
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <Link to="/" className="flex min-w-0 shrink items-center gap-2.5 no-underline sm:gap-3">
          <BrandMark />
          <span className="whitespace-nowrap text-[16px] font-black tracking-tight text-[#1f2937] sm:text-[17px]">
            Ilmora<span className="text-[var(--brand-primary)]">X</span>
          </span>
        </Link>

        <DesktopNavigation isHomePage={isHomePage} />

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            to="/tryout"
            search={{ intent: tryoutAnalytics.intent }}
            onClick={tryoutAnalytics.trackLandingLinkClick}
            className="inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-full bg-[var(--brand-primary)] px-3.5 text-[12px] font-bold text-white no-underline shadow-[0_12px_24px_rgba(32,80,114,0.2)] transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-px sm:min-h-11 sm:px-5 sm:text-[13px]"
          >
            Daftar Gratis
          </Link>

          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Buka menu navigasi"
                className="inline-flex size-10 items-center justify-center rounded-full border border-[#d7e7e2] bg-white text-[#24475e] shadow-[0_8px_18px_rgba(26,47,60,0.08)] transition-colors duration-200 hover:bg-[#f0f7f5] active:scale-[0.98] sm:size-11"
              >
                <HamburgerMenuIcon className="size-5" />
              </button>
            </SheetTrigger>

            <SheetContent
              side="right"
              showCloseButton={false}
              className="w-[min(92vw,390px)] gap-0 border-l border-[#dce9e5] bg-[#f7faf9] p-0 text-stone-900 shadow-[-24px_0_60px_rgba(25,51,43,0.16)]"
            >
              <SheetHeader className="flex-row items-center justify-between border-b border-[#dfeae6] px-5 py-5">
                <div className="flex items-center gap-3">
                  <BrandMark />
                  <div>
                    <SheetTitle className="text-[18px] font-black tracking-tight text-stone-900">
                      Menu IlmoraX
                    </SheetTitle>
                    <SheetDescription className="text-[12px] text-stone-500">
                      Temukan halaman yang kamu butuhkan.
                    </SheetDescription>
                  </div>
                </div>
                <SheetClose asChild>
                  <button
                    type="button"
                    aria-label="Tutup menu navigasi"
                    className="inline-flex size-10 items-center justify-center rounded-full border border-[#d7e7e2] bg-white text-stone-700 transition-colors hover:bg-[#edf5f2] active:scale-[0.98]"
                  >
                    <Cross2Icon className="size-5" />
                  </button>
                </SheetClose>
              </SheetHeader>

              <nav aria-label="Navigasi utama" className="flex-1 overflow-y-auto px-4 py-5">
                <div className="grid gap-1.5">
                  {heroNavItems.map((item, index) => (
                    <SheetClose asChild key={item.href}>
                      <a
                        href={isHomePage ? item.href : `/${item.href}`}
                        onClick={(event) => handleLandingAnchorClick(event, item.href, isHomePage)}
                        className="group flex items-center justify-between rounded-[1.15rem] px-4 py-3.5 text-[15px] font-bold text-stone-700 no-underline transition-colors hover:bg-white hover:text-[var(--brand-primary)] active:bg-[#eaf4f1]"
                      >
                        <span>{item.label}</span>
                        <span className="text-[11px] font-black tabular-nums text-stone-300 transition-colors group-hover:text-[var(--brand-primary)]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </a>
                    </SheetClose>
                  ))}

                  <SheetClose asChild>
                    <Link
                      to="/tentang-kami"
                      className="group flex items-center justify-between rounded-[1.15rem] px-4 py-3.5 text-[15px] font-bold text-stone-700 no-underline transition-colors hover:bg-white hover:text-[var(--brand-primary)] active:bg-[#eaf4f1]"
                    >
                      <span>Tentang Kami</span>
                      <span className="text-[11px] font-black tabular-nums text-stone-300 transition-colors group-hover:text-[var(--brand-primary)]">
                        05
                      </span>
                    </Link>
                  </SheetClose>
                </div>
              </nav>

              <div className="border-t border-[#dfeae6] bg-white/70 p-4">
                <SheetClose asChild>
                  <Link
                    to="/tryout"
                    search={{ intent: tryoutAnalytics.intent }}
                    onClick={tryoutAnalytics.trackLandingLinkClick}
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-[1rem] bg-[var(--brand-primary)] px-5 text-[14px] font-black text-white no-underline transition-transform active:translate-y-px"
                  >
                    Daftar Gratis
                  </Link>
                </SheetClose>
                <p className="mt-3 text-center text-[12px] text-stone-500">
                  Sudah punya akun?{" "}
                  <SheetClose asChild>
                    <Link
                      to="/auth/login"
                      search={{ intent: loginAnalytics.intent }}
                      onClick={loginAnalytics.trackLandingLinkClick}
                      className="font-bold text-[var(--brand-primary)] no-underline"
                    >
                      Masuk
                    </Link>
                  </SheetClose>
                </p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </motion.nav>
    </header>
  );
}

function DesktopNavigation({ isHomePage }: { isHomePage: boolean }) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeHref, setActiveHref] = useState<HeroNavHref>(defaultActiveNavHref);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, opacity: 0 });

  function updateIndicator(nextHref: string) {
    const menu = menuRef.current;

    if (!menu || !isHomePage) {
      setIndicator((current) => ({ ...current, opacity: 0 }));
      return;
    }

    const activeLink = menu.querySelector<HTMLAnchorElement>(
      `[data-nav-href="${nextHref}"]`,
    );

    if (!activeLink) {
      setIndicator((current) => ({ ...current, opacity: 0 }));
      return;
    }

    const menuBounds = menu.getBoundingClientRect();
    const linkBounds = activeLink.getBoundingClientRect();

    setIndicator({
      left: linkBounds.left - menuBounds.left,
      width: linkBounds.width,
      opacity: 1,
    });
  }

  function getActiveHrefFromScroll() {
    const scanLine = window.innerHeight * 0.36;
    let nextHref: HeroNavHref = defaultActiveNavHref;

    for (const item of heroNavItems) {
      const section = document.getElementById(item.href.replace("#", ""));

      if (!section) continue;

      const bounds = section.getBoundingClientRect();

      if (bounds.top <= scanLine && bounds.bottom > scanLine) return item.href;
      if (bounds.top <= scanLine) nextHref = item.href;
    }

    return nextHref;
  }

  useEffect(() => {
    if (!isHomePage) return;

    function syncFromHash() {
      const nextHref = window.location.hash || defaultActiveNavHref;
      const hasMatch = heroNavItems.some((item) => item.href === nextHref);
      setActiveHref(hasMatch ? (nextHref as HeroNavHref) : defaultActiveNavHref);
    }

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);

    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [isHomePage]);

  useEffect(() => {
    if (!isHomePage) return;

    let animationFrame = 0;

    function requestActiveSync() {
      if (animationFrame) return;

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0;
        setActiveHref(getActiveHrefFromScroll());
      });
    }

    requestActiveSync();
    window.addEventListener("scroll", requestActiveSync, { passive: true });
    window.addEventListener("resize", requestActiveSync);

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", requestActiveSync);
      window.removeEventListener("resize", requestActiveSync);
    };
  }, [isHomePage]);

  useSafeLayoutEffect(() => updateIndicator(activeHref), [activeHref, isHomePage]);

  useEffect(() => {
    function handleResize() {
      updateIndicator(activeHref);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeHref, isHomePage]);

  return (
    <div ref={menuRef} className="relative hidden items-center gap-0.5 lg:flex">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 h-[3px] rounded-full bg-[var(--brand-primary)] transition-[transform,width,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          width: `${indicator.width}px`,
          opacity: indicator.opacity,
          transform: `translateX(${indicator.left}px)`,
        }}
      />

      {heroNavItems.map((item) => (
        <a
          key={item.href}
          data-nav-href={item.href}
          href={isHomePage ? item.href : `/${item.href}`}
          onClick={(event) => {
            setActiveHref(item.href);
            handleLandingAnchorClick(event, item.href, isHomePage);
          }}
          className={`relative rounded-full px-3 py-3 text-[13px] font-semibold no-underline transition-colors duration-300 ${
            isHomePage && item.href === activeHref
              ? "text-[var(--brand-primary)]"
              : "text-stone-600 hover:text-stone-900"
          }`}
        >
          {item.label}
        </a>
      ))}

      <Link
        to="/tentang-kami"
        className="relative rounded-full px-3 py-3 text-[13px] font-semibold text-stone-600 no-underline transition-colors duration-300 hover:text-stone-900"
      >
        Tentang Kami
      </Link>
    </div>
  );
}

function handleLandingAnchorClick(
  event: MouseEvent<HTMLAnchorElement>,
  href: (typeof heroNavItems)[number]["href"],
  isHomePage: boolean,
) {
  if (!isHomePage) return;

  const target = document.getElementById(href.replace("#", ""));
  if (!target) return;

  event.preventDefault();
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", href);
}
