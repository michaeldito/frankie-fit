import type { StaticImageData } from "next/image";
import type { FrankieMood } from "@frankie-fit/brand-core";
import bikeRide from "@frankie-fit/brand-core/assets/frankie/bike-ride.png";
import focused from "@frankie-fit/brand-core/assets/frankie/focused.png";
import happy from "@frankie-fit/brand-core/assets/frankie/happy.png";
import hungry from "@frankie-fit/brand-core/assets/frankie/hungry.png";
import portrait from "@frankie-fit/brand-core/assets/frankie/portrait.png";
import running from "@frankie-fit/brand-core/assets/frankie/running.png";
import snuggle from "@frankie-fit/brand-core/assets/frankie/snuggle.png";
import stretching from "@frankie-fit/brand-core/assets/frankie/stretching.png";
import waiting from "@frankie-fit/brand-core/assets/frankie/waiting.png";
import ball from "@frankie-fit/brand-core/assets/frankie/stickers/ball.png";
import biscuit from "@frankie-fit/brand-core/assets/frankie/stickers/biscuit.png";
import bowl from "@frankie-fit/brand-core/assets/frankie/stickers/bowl.png";
import crown from "@frankie-fit/brand-core/assets/frankie/stickers/crown.png";
import heart from "@frankie-fit/brand-core/assets/frankie/stickers/heart.png";
import paw from "@frankie-fit/brand-core/assets/frankie/stickers/paw.png";
import water from "@frankie-fit/brand-core/assets/frankie/stickers/water.png";
import zzz from "@frankie-fit/brand-core/assets/frankie/stickers/zzz.png";

export const FRANKIE_MOOD_ART: Record<FrankieMood, StaticImageData> = {
  happy,
  focused,
  stretching,
  waiting,
  hungry,
  running,
  bikeRide,
  snuggle
};

export const FRANKIE_PORTRAIT = portrait;

export const FRANKIE_STICKERS = { ball, biscuit, bowl, crown, heart, paw, water, zzz } as const;

export type FrankieSticker = keyof typeof FRANKIE_STICKERS;
