"use client";

import Link from "next/link";
import { useState } from "react";
import { LANDING_COPY, type LandingVariant } from "@/components/landing/landing-copy";

const VARIANT_ORDER: LandingVariant[] = ["normal", "option1", "option2"];

function SectionIntro({
  kicker,
  title,
  body,
  align = "left"
}: {
  kicker: string;
  title: string;
  body?: string;
  align?: "left" | "center";
}) {
  const alignmentClass = align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl";

  return (
    <div className={alignmentClass}>
      <p className="ff-kicker">{kicker}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl lg:text-4xl">
        {title}
      </h2>
      {body ? (
        <p className="mt-3 text-sm leading-7 text-[var(--muted)] sm:text-base">{body}</p>
      ) : null}
    </div>
  );
}

export function LandingPage() {
  const [variant, setVariant] = useState<LandingVariant>("normal");
  const copy = LANDING_COPY[variant];

  function cycleVariant() {
    setVariant((current) => {
      const nextIndex = (VARIANT_ORDER.indexOf(current) + 1) % VARIANT_ORDER.length;
      return VARIANT_ORDER[nextIndex];
    });
  }

  return (
    <main className="grain relative min-h-screen">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[color:color-mix(in_srgb,var(--background)_76%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3 sm:px-8 lg:px-10">
          <Link className="text-base font-semibold tracking-tight text-[var(--foreground)]" href="/">
            Frankie Fit
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-[var(--muted)] md:flex">
            <a href="#product">Product</a>
            <a href="#how-it-works">How it works</a>
            <a href="#frankie">Frankie</a>
            <a href="#privacy">Privacy</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link className="ff-button-secondary px-4 py-2.5 text-sm" href="/login">
              Log in
            </Link>
            <Link className="ff-button-primary px-4 py-2.5 text-sm" href="/signup">
              Talk to Frankie
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div aria-hidden className="ff-glow -top-24 left-1/4 h-[26rem] w-[26rem]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:px-8 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:px-10 lg:py-20">
          <div className="max-w-3xl">
            <p className="ff-kicker">{copy.heroKicker}</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
              {copy.heroTitle}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
              {copy.heroSubtitle}
            </p>

            <div className="mt-7 flex flex-wrap gap-4">
              <Link className="ff-button-primary px-5 py-3 text-sm" href="/signup">
                Talk to Frankie
              </Link>
              <a className="ff-button-secondary px-5 py-3 text-sm" href="#how-it-works">
                See how it works
              </a>
            </div>
          </div>

          <div className="ff-panel p-4 sm:p-5 lg:p-6">
            <div className="ff-card-soft space-y-2 p-4 sm:p-5">
              <p className="ff-kicker">Frankie says</p>
              <div className="mt-2 space-y-2">
                <div className="ff-chat-row" data-align="end">
                  <p className="ff-chat-bubble" data-speaker="user">
                    {copy.heroChatUser}
                  </p>
                </div>
                <div className="ff-chat-row">
                  <p className="ff-chat-bubble" data-speaker="frankie">
                    {copy.heroChatFrankie}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {copy.heroHighlights.slice(0, 2).map((item) => (
                <article className="ff-card p-4" key={item.label}>
                  <p className="text-xs font-medium text-[var(--muted)]">{item.label}</p>
                  <p className="mt-3 text-xl font-semibold tracking-tight text-[var(--foreground)]">
                    {item.value}
                  </p>
                  <p className="mt-2 text-xs leading-6 text-[var(--muted)]">{item.body}</p>
                </article>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface-strong)_86%,black_14%)] px-4 py-3 text-xs text-[var(--muted-strong)]">
              <span className="font-medium text-[var(--foreground)]">
                {copy.heroHighlights[2].value}
              </span>
              <span>{copy.heroHighlights[2].body}</span>
            </div>
          </div>
        </div>
      </section>

      <section id="product">
        <div className="ff-section grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <SectionIntro kicker={copy.problemKicker} title={copy.problemTitle} />
          <div className="space-y-4 text-sm leading-7 text-[var(--muted)] sm:text-base">
            {copy.problemParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      <hr className="ff-divider mx-auto max-w-7xl" />

      <section id="how-it-works">
        <div className="ff-section">
          <SectionIntro
            kicker="How it works"
            title="One conversation. Three pillars. A lot less friction."
            body="Frankie Fit brings exercise, diet, and wellness into one calm, coach-led experience."
          />

          <div className="relative mt-8 grid gap-5 lg:grid-cols-3">
            <div
              aria-hidden
              className="ff-divider absolute top-[2.1rem] left-0 right-0 hidden lg:block"
            />
            {copy.howItWorks.map((item) => (
              <article className="ff-card relative h-full p-4 sm:p-5" key={item.step}>
                <p className="text-xs font-semibold tracking-[0.22em] text-[var(--accent)]">
                  {item.step}
                </p>
                <h3 className="mt-4 text-base font-semibold tracking-tight text-[var(--foreground)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--border)]">
        <div className="ff-section">
          <SectionIntro
            kicker="The three pillars"
            title={copy.pillarsTitle}
            body={copy.pillarsBody}
          />

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {copy.pillars.map((pillar) => (
              <article className="ff-card h-full p-4 sm:p-5" key={pillar.title}>
                <span className="ff-pill">{pillar.title}</span>
                <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{pillar.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="ff-section grid gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:gap-6">
          <div className="ff-panel-strong p-6 sm:p-7" id="frankie">
            <p className="ff-kicker text-white/70">Meet Frankie</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {copy.meetFrankieTitle}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/80 sm:text-base">
              {copy.meetFrankieBody}
            </p>
          </div>

          <div className="ff-panel p-6 sm:p-7">
            <p className="ff-kicker">Why it feels different</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">
              {copy.differentiatorsTitle}
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {copy.differentiators.map((item) => (
                <div
                  className="ff-card-soft px-4 py-4 text-sm leading-6 text-[var(--muted-strong)]"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <hr className="ff-divider mx-auto max-w-7xl" />

      <section id="privacy">
        <div className="ff-section grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <SectionIntro kicker="Privacy and trust" title="Your health data should be treated with care." />
          <div className="space-y-4 text-sm leading-7 text-[var(--muted)] sm:text-base">
            <p>
              Frankie Fit is designed with privacy in mind. Real-user insights
              should stay protected, and product learning should default to
              aggregate, privacy-conscious views.
            </p>
            <p>
              Frankie Fit is here for wellness support and coaching, not medical
              or clinical care.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="ff-section">
          <div className="relative overflow-hidden ff-panel-strong px-6 py-8 sm:px-8 sm:py-9 lg:px-10 lg:py-11">
            <div aria-hidden className="ff-glow -bottom-16 -right-10 h-72 w-72" />
            <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
              <div className="max-w-3xl">
                <p className="ff-kicker text-white/70">Final call</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
                  {copy.finalTitle}
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/78 sm:text-base">
                  {copy.finalBody}
                </p>
              </div>

              <div className="flex flex-wrap gap-4 lg:justify-end">
                <Link className="ff-button-primary px-5 py-3 text-sm" href="/signup">
                  Talk to Frankie
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <button
        aria-label="You found it"
        className="rounded-full transition-opacity duration-200 hover:opacity-60 focus-visible:opacity-60"
        onClick={cycleVariant}
        style={{
          position: "fixed",
          bottom: "12px",
          right: "12px",
          zIndex: 40,
          height: "12px",
          width: "12px",
          background: "var(--muted)",
          opacity: 0.1
        }}
        type="button"
      />
    </main>
  );
}
