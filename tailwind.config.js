/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Personalizações para text-base
      fontSize: {
        'base': ['1rem', {
          lineHeight: '1.5rem',
          letterSpacing: '0.025em',
          fontWeight: '400'
        }],
      },
      // Outras personalizações podem ser adicionadas aqui
    },
  },
}
