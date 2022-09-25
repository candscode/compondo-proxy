import path from 'path'
import chalk from 'chalk'
import fs from 'fs'
import vite from 'vite'
import compileTs from './private/tsc'

function buildRenderer() {
  return vite.build({
    configFile: path.join(__dirname, '..', 'vite.config.ts'),
    base: './',
    mode: 'production'
  })
}

function buildMain() {
  const mainPath = path.join(__dirname, '..', 'src', 'main')
  return compileTs(mainPath)
}

fs.rmSync(path.join(__dirname, '..', 'build'), {
  recursive: true,
  force: true
})

console.log(chalk.blueBright('Transpiling renderer & main...'))

Promise.allSettled([buildRenderer(), buildMain()]).then(() => {
  console.log(
    chalk.greenBright(
      'Renderer & main successfully transpiled! (ready to be built with electron-builder)'
    )
  )
})
