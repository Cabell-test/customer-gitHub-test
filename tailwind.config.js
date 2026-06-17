/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        paper: '#fbfaf8',
        ink: '#202124',
        muted: '#6b7280',
        line: '#e7e5e4',
        jd: '#e1251b'
      },
      boxShadow: {
        soft: '0 16px 40px rgba(15, 23, 42, 0.08)'
      }
    }
  },
  plugins: []
};
