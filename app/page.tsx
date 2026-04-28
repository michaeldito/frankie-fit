import Link from "next/link";

const pillars = [
  {
    title: "Exercise",
    body:
      "Log movement in natural language and let Frankie turn it into useful structure, trends, and next-step coaching."
  },
  {
    title: "Diet",
    body:
      "Track meals without turning every day into calorie accounting. Frankie helps you notice patterns without the pain."
  },
  {
    title: "Wellness",
    body:
      "Stay aware of energy, stress, recovery, mood, and motivation so the whole plan stays sustainable."
  }
];

const differentiators = [
  "Conversation-first experience",
  "Less manual logging",
  "Structured insights behind the scenes",
  "One place for exercise, diet, and wellness"
];

const howItWorks = [
  {
    step: "01",
    title: "Tell Frankie what is going on",
    body:
      "Log a workout, mention what you ate, or check in on how you are feeling. Natural language is enough."
  },
  {
    step: "02",
    title: "Frankie organizes the signal",
    body:
      "The system turns conversation into structured records, trends, and context without making you do the tedious part."
  },
  {
    step: "03",
    title: "Get your next best step",
    body:
      "Frankie helps you understand how things are going and what makes sense next."
  }
];

const heroHighlights = [
  {
    label: "This week",
    value: "4 workouts",
    body: "Active, steady, and trending up."
  },
  {
    label: "Next best step",
    value: "Quick recovery check-in",
    body: "Keep guidance grounded in how the week is actually feeling."
  },
  {
    label: "What Frankie sees",
    value: "More signal, less friction",
    body: "Workouts, food, and wellness stay connected in one running thread."
  }
];

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
      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {body ? (
        <p className="mt-5 text-base leading-8 text-[var(--muted)] sm:text-lg">{body}</p>
      ) : null}
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="grain min-h-screen">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[color:color-mix(in_srgb,var(--background)_76%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 sm:px-8 lg:px-10">
          <Link className="text-lg font-semibold tracking-tight text-[var(--foreground)]" href="/">
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
              Get early access
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-[var(--border)]">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 py-18 sm:px-8 sm:py-22 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-10 lg:py-28">
          <div className="max-w-3xl">
            <p className="ff-kicker">AI-native wellness coaching</p>
            <h1 className="mt-6 text-5xl font-semibold tracking-tight text-[var(--foreground)] sm:text-6xl lg:text-7xl">
              Log less. Understand more. Stay consistent.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--muted)] sm:text-xl">
              Frankie Fit is your AI-native wellness coach for exercise, food, and
              overall wellness. Talk to Frankie like you would a real coach, and get
              guidance, logging, and progress insights without turning your life
              into a spreadsheet.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link className="ff-button-primary px-5 py-3 text-sm" href="/signup">
                Get early access
              </Link>
              <a className="ff-button-secondary px-5 py-3 text-sm" href="#how-it-works">
                See how it works
              </a>
            </div>
          </div>

          <div className="ff-panel p-5 sm:p-6 lg:p-7">
            <div className="ff-card-soft p-5 sm:p-6">
              <p className="ff-kicker">Frankie says</p>
              <p className="mt-4 text-lg leading-8 text-[var(--foreground)] sm:text-xl">
                Based on your week so far, I would keep today simple. Log a quick
                check-in, tell me what you ate, or let me help you plan the next
                workout.
              </p>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {heroHighlights.slice(0, 2).map((item) => (
                <article className="ff-card p-5" key={item.label}>
                  <p className="text-sm font-medium text-[var(--muted)]">{item.label}</p>
                  <p className="mt-4 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                    {item.value}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.body}</p>
                </article>
              ))}
            </div>

            <article className="ff-card mt-4 p-5 sm:p-6">
              <p className="text-sm font-medium text-[var(--muted)]">{heroHighlights[2].label}</p>
              <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                    {heroHighlights[2].value}
                  </p>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--muted)]">
                    {heroHighlights[2].body}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface-strong)_86%,black_14%)] px-4 py-4 text-sm text-[var(--muted-strong)]">
                  Exercise, diet, and wellness all stay in the same conversation.
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--border)]" id="product">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <SectionIntro
              kicker="The problem"
              title="Most health apps ask too much and help too little."
            />
            <div className="space-y-5 text-base leading-8 text-[var(--muted)] sm:text-lg">
              <p>
                Frankie Fit exists for the people who want to improve their health
                without spending every day doing manual admin. You talk. Frankie
                organizes the signal.
              </p>
              <p>
                Behind the scenes, the app turns ordinary conversations into
                structure, memory, summaries, and practical next-step guidance.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--border)]" id="how-it-works">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10 lg:py-24">
          <SectionIntro
            kicker="How it works"
            title="One conversation. Three pillars. A lot less friction."
            body="Frankie Fit brings exercise, diet, and wellness into one calm, coach-led experience."
          />

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {howItWorks.map((item) => (
              <article className="ff-card h-full p-6 sm:p-7" key={item.step}>
                <p className="text-sm font-semibold tracking-[0.22em] text-[var(--accent)]">
                  {item.step}
                </p>
                <h3 className="mt-8 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                  {item.title}
                </h3>
                <p className="mt-4 text-base leading-8 text-[var(--muted)]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10 lg:py-24">
          <SectionIntro
            kicker="The three pillars"
            title="Built around the parts of health that actually connect."
            body="Health is not one thing. Frankie Fit brings the most important pieces together so your guidance reflects your real life, not isolated data points."
          />

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {pillars.map((pillar) => (
              <article className="ff-card h-full p-6 sm:p-7" key={pillar.title}>
                <h3 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                  {pillar.title}
                </h3>
                <p className="mt-4 text-base leading-8 text-[var(--muted)]">{pillar.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--border)]">
        <div className="mx-auto grid max-w-7xl gap-5 px-6 py-20 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-6 lg:px-10 lg:py-24">
          <div className="ff-panel-strong p-8 sm:p-9" id="frankie">
            <p className="ff-kicker text-white/70">Meet Frankie</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Calm, thoughtful, grounded.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-white/80 sm:text-lg">
              Frankie is the coach at the center of the experience. Not a guilt
              machine. Not a spreadsheet. Just a steady presence in your corner
              helping you stay honest about where you are and practical about what
              comes next.
            </p>
          </div>

          <div className="ff-panel p-8 sm:p-9">
            <p className="ff-kicker">Why it feels different</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
              Simple on the surface. Smarter underneath.
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {differentiators.map((item) => (
                <div className="ff-card-soft px-5 py-5 text-sm leading-7 text-[var(--muted-strong)]" key={item}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--border)]" id="privacy">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
            <SectionIntro
              kicker="Privacy and trust"
              title="Your health data should be treated with care."
            />
            <div className="space-y-5 text-base leading-8 text-[var(--muted)] sm:text-lg">
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
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10 lg:py-24">
          <div className="ff-panel-strong px-8 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
            <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
              <div className="max-w-3xl">
                <p className="ff-kicker text-white/70">Final call</p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                  Health is hard enough. The app should make it easier.
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-8 text-white/78 sm:text-lg">
                  Frankie Fit helps you log less, understand more, and keep moving
                  forward with a coach that sees the bigger picture.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 lg:justify-end">
                <Link className="ff-button-primary px-5 py-3 text-sm" href="/signup">
                  Get early access
                </Link>
                <Link
                  className="ff-button-secondary border-white/16 bg-white/6 px-5 py-3 text-sm text-white"
                  href="/app/chat"
                >
                  View the app scaffold
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
