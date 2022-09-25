import childProcess from 'child_process'
import chalk from 'chalk'

function compile(directory: string) {
  return new Promise((resolve, reject) => {
    const tscProcess = childProcess.exec('tsc', {
      cwd: directory
    })

    if (tscProcess && tscProcess.stdout) {
      tscProcess.stdout.on('data', data =>
        process.stdout.write(
          chalk.yellowBright(`[tsc] `) + chalk.white(data.toString())
        )
      )

      tscProcess.on('exit', exitCode => {
        if (exitCode && exitCode > 0) {
          reject(exitCode)
        } else {
          resolve(true)
        }
      })
    }
  })
}

export default compile
