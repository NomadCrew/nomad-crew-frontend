/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Map your existing theme colors to Tailwind
        primary: {
          DEFAULT: '#F46315', // Your orange
          light: '#FF8F5E',
          dark: '#E14F04',
          50: '#FFF7ED',
          100: '#FFE8D7',
          200: '#FFD0B5',
          300: '#FFB088',
          400: '#FF8F5E',
          500: '#F46315',
          600: '#E14F04',
          700: '#BA3A02',
          800: '#942D05',
          900: '#7A2705',
        },
        secondary: {
          DEFAULT: '#4A5568',
          light: '#718096',
          dark: '#2D3748',
        },
        background: {
          DEFAULT: '#FFFFFF',
          dark: '#1A202C',
          paper: '#F7FAFC',
          'paper-dark': '#2D3748',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#2D3748',
        },
        text: {
          primary: '#1A202C',
          'primary-dark': '#F7FAFC',
          secondary: '#4A5568',
          'secondary-dark': '#CBD5E0',
        },
        error: '#E53E3E',
        success: '#38A169',
        warning: '#D69E2E',
        info: '#3182CE',
      },
      fontFamily: {
        // Map to your existing fonts
        body: ['Manrope', 'system-ui'],
        heading: ['Manrope', 'system-ui'],
        mono: ['SpaceMono', 'monospace'],
      },
      spacing: {
        // Your custom spacing scale
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      borderRadius: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}