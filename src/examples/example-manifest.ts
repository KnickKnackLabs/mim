export const EXAMPLE_FILES = [
  "animated-cubic-quadratic-residues.mim",
  "animated-hyperbolic-residues.mim",
  "animated-modular-multiplication.mim",
  "animated-radial-residues-31.mim",
  "animated-two-axis-orbit.mim",
  "dyadic-lcm-depth.mim",
  "gcd-lattice.mim",
  "prime-stripped-lcm.mim",
  "radial-residues-31.mim",
  "xor-interference.mim",
] as const;

export type ExampleFile = typeof EXAMPLE_FILES[number];

export function exampleSlug(file: ExampleFile): string {
  return file.slice(0, -".mim".length);
}
