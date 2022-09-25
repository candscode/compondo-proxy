process.env.NODE_ENV = 'development'

import vite, { ViteDevServer } from 'vite'
import childProcess, { ChildProcess } from 'child_process'
import path from 'path'
import chalk from 'chalk'
import chokidar from 'chokidar'
import electron from 'electron'
import compileTs from './private/tsc'
import fs from 'fs'

let viteServer: ViteDevServer
let electronProcess: ChildProcess | null
let electronProcessLocker: boolean
let rendererPort: number | undefined

async function startRenderer() {
  viteServer = await vite.createServer({
    configFile: path.join(__dirname, '..', 'vite.config.ts'),
    mode: 'development'
  })

  return viteServer.listen()
}

async function startElectron() {
  if (electronProcess) {
    // single instance lock
    return
  }

  try {
    await compileTs(path.join(__dirname, '..', 'src', 'main'))
  } catch {
    console.log(
      chalk.redBright(
        'Could not start Electron because of the above typescript error(s).'
      )
    )
    electronProcessLocker = false
    return
  }

  const args = [
    path.join(__dirname, '..', 'build', 'main', 'main.js'),
    rendererPort
  ]

  // @ts-ignore
  electronProcess = childProcess.spawn(electron, args)
  electronProcessLocker = false

  if (
    electronProcess &&
    electronProcess &&
    electronProcess.stdout &&
    electronProcess.stderr
  ) {
    electronProcess.stdout.on('data', data =>
      process.stdout.write(
        chalk.blueBright(`[electron] `) + chalk.white(data.toString())
      )
    )

    electronProcess.stderr.on('data', data =>
      process.stderr.write(
        chalk.blueBright(`[electron] `) + chalk.white(data.toString())
      )
    )

    electronProcess.on('exit', () => stop())
  }
}

function restartElectron() {
  if (electronProcess) {
    electronProcess.removeAllListeners('exit')
    electronProcess.kill()
    electronProcess = null
  }

  if (!electronProcessLocker) {
    electronProcessLocker = true
    startElectron()
  }
}

function copyStaticFiles() {
  copy('static')
}

/*
The working dir of Electron is build/main instead of src/main because of TS.
tsc does not copy static files, so copy them over manually for dev server.
*/
function copy(copyPath: string) {
  fs.cpSync(
    path.join(__dirname, '..', 'src', 'main', copyPath),
    path.join(__dirname, '..', 'build', 'main', copyPath),
    { recursive: true }
  )
}

function stop() {
  viteServer.close()
  process.exit()
}

async function start() {
  console.log(`${chalk.greenBright('=======================================')}`)
  console.log(`${chalk.greenBright('Starting Electron + Vite Dev Server...')}`)
  console.log(`${chalk.greenBright('=======================================')}`)

  const devServer = await startRenderer()
  rendererPort = devServer.config.server.port

  copyStaticFiles()
  startElectron()

  const cwd = path.join(__dirname, '..', 'src', 'main')

  chokidar
    .watch(cwd, {
      cwd: cwd
    })
    .on('change', changedPath => {
      console.log(
        chalk.blueBright(`[electron] `) +
          `Change in ${changedPath}. reloading... 🚀`
      )

      if (changedPath.startsWith(path.join('static', '/'))) {
        copy(changedPath)
      }

      restartElectron()
    })
}

start()
