import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1B1C1E',
        'ink-soft': '#26272A',
        'ink-line': '#33343A',
        bone: '#FAFAF8',
        'bone-soft': '#F0EEEA',
        'bone-line': '#DBD8D1',
        petrol: '#143F3A',
        'petrol-soft': '#1F524C',
        gold: '#B38E45',
        'gold-light': '#CDB072',
        'gold-deep': '#8A6A2E',
        muted: '#767471',
        'muted-dark': '#9A9793',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        editorial: ['Instrument Serif', 'serif'],
        body: ['Manrope', 'system-ui', 'sans-serif'],
        wordmark: ['Raleway', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
