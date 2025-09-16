/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./views/**/*.{html,php,ejs}", 
    "./components/**/*.{html,php,js}",
    "./public/**/*.{html,js}" // si sirves estáticos aquí
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
