export type QuickStartOption = {
  label: string;
  template: string;
};

export type BracketBlank = {
  start: number;
  end: number;
};

export const QUICK_START_OPTIONS: QuickStartOption[] = [
  {
    label: "Exercise",
    template: "Today I did [fill in] for [fill in] minutes at [light/moderate/hard] intensity"
  },
  {
    label: "Food",
    template: "For [breakfast/lunch/dinner/snack], I ate [fill in]"
  },
  {
    label: "Wellness",
    template:
      "Checking in — energy: [1-5], stress: [1-5], soreness: [1-5], mood: [1-5], motivation: [1-5]"
  }
];

export function findBracketBlanks(value: string): BracketBlank[] {
  return Array.from(value.matchAll(/\[[^\]]+\]/g)).map((match) => ({
    start: match.index!,
    end: match.index! + match[0].length
  }));
}

export function findNextBlank(blanks: BracketBlank[], fromIndex: number): BracketBlank | undefined {
  return blanks.find((blank) => blank.start >= fromIndex);
}

export function findPreviousBlank(blanks: BracketBlank[], beforeIndex: number): BracketBlank | undefined {
  return [...blanks].reverse().find((blank) => blank.end <= beforeIndex);
}
