import Image from "next/image";
import { FRANKIE_MOOD_LABELS, type FrankieMood } from "@frankie-fit/brand-core";
import { FRANKIE_MOOD_ART } from "@/components/frankie/frankie-art";

type FrankieAvatarProps = {
  mood?: FrankieMood;
  size?: number;
  ring?: boolean;
  className?: string;
};

export function FrankieAvatar({ mood = "happy", size = 40, ring = true, className = "" }: FrankieAvatarProps) {
  return (
    <span
      className={`relative inline-flex flex-none items-center justify-center overflow-hidden rounded-full bg-frankie-soft ${
        ring ? "ring-2 ring-frankie/70" : ""
      } ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Keyed on mood so a mood change remounts the image and replays the pop. */}
      <Image
        alt={`Frankie (${FRANKIE_MOOD_LABELS[mood].toLowerCase()})`}
        className="ff-pop h-full w-full object-contain p-[6%]"
        height={size}
        key={mood}
        src={FRANKIE_MOOD_ART[mood]}
        width={size}
      />
    </span>
  );
}
