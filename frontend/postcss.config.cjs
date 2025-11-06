// postcss.config.js
function safeRequire(name) {
  try { return require(name) }
  catch { return null }
}

const tailwind = safeRequire('@tailwindcss/postcss')
const autoprefixer = safeRequire('autoprefixer')

module.exports = {
  plugins: [
    tailwind && tailwind(),
    autoprefixer && autoprefixer(),
  ].filter(Boolean),
}
