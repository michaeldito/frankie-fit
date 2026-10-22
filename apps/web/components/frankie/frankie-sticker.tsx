import Image from "next/image";
import { FRANKIE_STICKERS, type FrankieSticker as StickerName } from "@/components/frankie/frankie-art";

export function FrankieSticker({
  name,
  size = 20,
  className = ""
}: {
  name: StickerName;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      alt=""
      aria-hidden
      className={`inline-block object-contain ${className}`}
      height={size}
      src={FRANKIE_STICKERS[name]}
      width={size}
    />
  );
}
