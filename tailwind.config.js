/** Tailwind config for JADI.in Hub. Rebuild CSS after changing classes: ./build-css.sh */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './js/**/*.js'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#f0f9ff', 100: '#e0f2fe', 500: '#0284c7', 600: '#0284c7', 700: '#0369a1', 900: '#0c4a6e' }
      }
    }
  }
};
