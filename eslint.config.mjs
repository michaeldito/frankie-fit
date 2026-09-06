import nextTypeScript from "eslint-config-next/typescript";

const config = [
  {
    ignores: ["apps/**", "coverage/**", ".claude/worktrees/**"]
  },
  ...nextTypeScript
];

export default config;
