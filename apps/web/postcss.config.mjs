// Tailwind v4 PostCSS pipeline. v4 ships its own PostCSS plugin and skips
// the legacy `tailwind.config.ts` / autoprefixer dance — the @tailwindcss/postcss
// plugin handles vendor prefixes + the JIT compiler in one pass.
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
