const colors = require('tailwindcss/colors')
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: colors.sky['500'],
          ...colors.sky
        },
        success: {
          DEFAULT: colors.green['600'],
          ...colors.green
        },
        warn: {
          DEFAULT: colors.amber['400'],
          ...colors.amber
        },
        error: {
          DEFAULT: colors.red['600'],
          ...colors.red
        }
      }
    }
  },
  plugins: []
}
