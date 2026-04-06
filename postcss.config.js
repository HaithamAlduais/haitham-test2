import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

/** Explicit v3 plugin instances so resolution never picks Tailwind v4 from transitive deps. */
export default {
  plugins: [tailwindcss, autoprefixer],
}
