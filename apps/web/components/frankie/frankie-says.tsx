import Image from "next/image";
import type { ReactNode } from "react";
import type { FrankieMood } from "@frankie-fit/brand-core";
import { FRANKIE_MOOD_ART } from "@/components/frankie/frankie-art";
import { FrankieSticker } from "@/components/frankie/frankie-sticker";

type FrankieSaysProps = {
  line: string;
  mood?: FrankieMood;
  kicker?: string;
  children?: ReactNode;
  className?: string;
};

// Frankie's one-liners are always in his handwriting; longer copy goes in children, in the body font.
export function FrankieSays({ line, mood = "happy", kicker = "Frankie says", children, className = "" }: FrankieSaysProps) {
  return (
    <section
      className={`relative flex items-center gap-4 rounded-[1rem] border border-frankie/25 bg-frankie-soft p-4 sm:p-5 ${className}`}
    >
      <Image
        alt=""
        aria-hidden
        className="ff-pop h-20 w-20 flex-none object-contain sm:h-24 sm:w-24"
        height={96}
        key={mood}
        src={FRANKIE_MOOD_ART[mood]}
        width={96}
      />
      <div className="min-w-0">
        <p className="ff-kicker text-frankie">{kicker}</p>
        <p className="mt-1 font-frankie text-2xl leading-tight text-foreground sm:text-[1.7rem]">
          &ldquo;{line}&rdquo;
        </p>
        {children ? <div className="mt-2 text-sm leading-6 text-muted-strong">{children}</div> : null}
      </div>
      <FrankieSticker className="absolute right-3 top-3 opacity-70" name="paw" size={18} />
    </section>
  );
}
