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

export default function HomePage() {
  return (
    <main className="grain min-h-screen">
      <div className="mx-auto flex max-w-7xl flex-col px-6 py-6 sm:px-8">
        <header className="sticky top-0 z-10 mb-10 flex items-center justify-between rounded-full border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_92%,transparent)] px-5 py-3 backdrop-blur">
          <Link className="text-lg font-semibold tracking-tight" href="/">
            Frankie Fit
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-[var(--muted)] md:flex">
            <a href="#product">Product</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#frankie">Frankie</a>
            <a href="#privacy">Privacy</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)]"
              href="/login"
            >
              Log in
            </Link>
            <Link
              className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white"
              href="/signup"
            >
              Get early access
            </Link>
          </div>
        </header>

        <section className="mb-20 grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">
              AI-native wellness coaching
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-[var(--foreground)] sm:text-7xl">
              Log less. Understand more. Stay consistent.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[var(--muted)] sm:text-xl">
              Frankie Fit is your AI-native wellness coach for exercise, food, and
              overall wellness. Talk to Frankie like you would a real coach, and get
              guidance, logging, and progress insights without turning your life
              into a spreadsheet.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white"
                href="/signup"
              >
                Get early access
              </Link>
              <a
                className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold"
                href="#how-it-works"
              >
                See how it works
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_24px_80px_rgba(3,6,5,0.35)]">
            <div className="mb-5 rounded-[1.5rem] bg-[var(--surface-strong)] p-4">
              <p className="mb-2 text-sm font-medium text-[var(--muted)]">
                Frankie says
              </p>
              <p className="text-lg leading-7">
                Based on your week so far, I would keep today simple. Log a quick
                check-in, tell me what you ate, or let me help you plan the next
                workout.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-[var(--border)] p-4">
                <p className="text-sm text-[var(--muted)]">This week</p>
                <p className="mt-3 text-3xl font-semibold">4 workouts</p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Active, steady, and trending up.
                </p>
              </div>
              <div className="rounded-3xl border border-[var(--border)] p-4">
                <p className="text-sm text-[var(--muted)]">Next best step</p>
                <p className="mt-3 text-2xl font-semibold">Quick recovery check-in</p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Keep guidance grounded in how the week is actually feeling.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          className="mb-16 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8"
          id="product"
        >
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="mb-3 text-sm uppercase tracking-[0.25em] text-[var(--muted)]">
                The problem
              </p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Most health apps ask too much and help too little.
              </h2>
            </div>
            <div className="space-y-4 text-base leading-8 text-[var(--muted)]">
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
        </section>

        <section className="mb-16" id="how-it-works">
          <div className="mb-8 max-w-2xl">
            <p className="mb-3 text-sm uppercase tracking-[0.25em] text-[var(--muted)]">
              How it works
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              One conversation. Three pillars. A lot less friction.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
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
            ].map((item) => (
              <article
                className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6"
                key={item.step}
              >
                <p className="mb-6 text-sm font-semibold tracking-[0.25em] text-[var(--accent)]">
                  {item.step}
                </p>
                <h3 className="mb-3 text-2xl font-semibold">{item.title}</h3>
                <p className="leading-7 text-[var(--muted)]">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <div className="mb-8 max-w-2xl">
            <p className="mb-3 text-sm uppercase tracking-[0.25em] text-[var(--muted)]">
              The three pillars
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Built around the parts of health that actually connect.
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {pillars.map((pillar) => (
              <article
                className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6"
                key={pillar.title}
              >
                <h3 className="mb-3 text-2xl font-semibold">{pillar.title}</h3>
                <p className="leading-7 text-[var(--muted)]">{pillar.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-16 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div
            className="rounded-[2rem] border border-[var(--border)] bg-[var(--brand)] p-8 text-white"
            id="frankie"
          >
            <p className="mb-3 text-sm uppercase tracking-[0.25em] text-white/70">
              Meet Frankie
            </p>
            <h2 className="mb-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Calm, thoughtful, grounded.
            </h2>
            <p className="max-w-xl leading-8 text-white/80">
              Frankie is the coach at the center of the experience. Not a guilt
              machine. Not a spreadsheet. Just a steady presence in your corner
              helping you stay honest about where you are and practical about what
              comes next.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8">
            <p className="mb-3 text-sm uppercase tracking-[0.25em] text-[var(--muted)]">
              Why it feels different
            </p>
            <h2 className="mb-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Simple on the surface. Smarter underneath.
            </h2>
            <div className="grid gap-3 text-[var(--muted)] sm:grid-cols-2">
              {differentiators.map((item) => (
                <div
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-4"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          className="mb-16 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8"
          id="privacy"
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-sm uppercase tracking-[0.25em] text-[var(--muted)]">
                Privacy and trust
              </p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Your health data should be treated with care.
              </h2>
            </div>
            <div className="space-y-4 text-base leading-8 text-[var(--muted)]">
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

        <section className="mb-10 rounded-[2.5rem] bg-[color:color-mix(in_srgb,var(--brand-strong)_74%,black_26%)] px-8 py-10 text-white">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Health is hard enough. The app should make it easier.
          </h2>
          <p className="mt-4 max-w-2xl leading-8 text-white/75">
            Frankie Fit helps you log less, understand more, and keep moving
            forward with a coach that sees the bigger picture.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white"
              href="/signup"
            >
              Get early access
            </Link>
            <Link
              className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
              href="/app/chat"
            >
              View the app scaffold
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
