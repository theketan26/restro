import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f4f6f8', 100: '#e9edf1', 200: '#c8d2de', 300: '#9cb2c6', 400: '#698cab',
          500: '#0A2947', 600: '#092540', 700: '#071f35', 800: '#051627', 900: '#030d18', 950: '#01060b',
        },
        secondary: {
          50: '#fbf9f7', 100: '#f7f2ef', 200: '#ebdcd0', 300: '#debfa9', 400: '#c2906e',
          500: '#8B5E3C', 600: '#7d5536', 700: '#68472d', 800: '#533824', 900: '#442e1d', 950: '#2b1d12',
        },
        tertiary: {
          50: '#fdfbf7', 100: '#FAF3E5', 200: '#F3E4C9', 300: '#ebd3a5', 400: '#e0be7d',
          500: '#cca052', 600: '#bc8a3c', 700: '#9d6d2e', 800: '#7e5525', 900: '#674520', 950: '#422a11',
        },
        quaternary: {
          50: '#fbfbfb', 100: '#f5f5f2', 200: '#e5e6dc', 300: '#D3D4C0', 400: '#b7b99c',
          500: '#989a77', 600: '#7f815e', 700: '#64664a', 800: '#50523b', 900: '#424331', 950: '#27281d',
        },
      },
    },
  },
  plugins: [],
};

export default config;
