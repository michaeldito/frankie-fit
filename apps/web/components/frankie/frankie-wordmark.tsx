import Image from "next/image";
import { FRANKIE_PORTRAIT } from "@/components/frankie/frankie-art";
import { FrankieSticker } from "@/components/frankie/frankie-sticker";

export function FrankieWordmark({ size = "md" }: { size?: "md" | "lg" }) {
  const avatar = size === "lg" ? 48 : 36;
  return (
    <span className="flex items-center gap-2.5">
      <span
        className="flex flex-none items-end justify-center overflow-hidden rounded-full bg-frankie-soft ring-2 ring-frankie/60"
        style={{ width: avatar, height: avatar }}
      >
        <Image alt="" aria-hidden className="h-[115%] w-[115%] max-w-none object-cover object-top" height={avatar} src={FRANKIE_PORTRAIT} width={avatar} />
      </span>
      <span className={`font-frankie leading-none text-foreground ${size === "lg" ? "text-3xl" : "text-2xl"}`}>
        Frankie Fit
      </span>
      <FrankieSticker name="paw" size={size === "lg" ? 20 : 16} />
    </span>
  );
}
