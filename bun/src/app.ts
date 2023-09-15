import path from 'path'
import fs from 'fs'
import { threadId, Worker } from 'worker_threads'

let workerPath = path.join(import.meta.dir, './worker.ts')
const PRINT_COUNT = 100

function main() {
    console.log(`Main thread ${threadId} started`)
    let isMainStarted = true

    if (process.argv.length !== 5) {
        console.log('Usage: <numJobs> <maxValue> <numThreads>')
        console.log(process.argv)
        process.exit(1)
    }

    console.log(process.argv)

    const jobSize = parseInt(process.argv[2])
    const maxValue = parseInt(process.argv[3])
    const numThreads = parseInt(process.argv[4])
    let term = jobSize / PRINT_COUNT

    if (jobSize <= 0) {
        console.log('Invalid job size')
        process.exit(1)
    }

    if (maxValue <= 0) {
        console.log('Invalid max value')
        process.exit(1)
    }

    if (numThreads <= 0) {
        console.log('Invalid number of threads')
        process.exit(1)
    }

    console.log(`jobSize: ${jobSize}, maxValue: ${maxValue}, numThreads: ${numThreads}`)

    let data = {
        startPos: 0,
        endPos: jobSize - 1,
        maxValue,
        numThreads
    }
    let worker = new Worker(workerPath)
    worker.postMessage(data)

    worker.on('message', (msg) => {
        let arr = msg.arr
        let elapsedTime = msg.elapsedTime / 1000

        console.log(`elapsedTime: ${elapsedTime}`)

        for (let i = 0; i < jobSize; i += term) {
            console.log(`arr[${i}]: ${arr[i]}`)
        }

        const filePath = path.join(import.meta.dir, './output.txt')
        fs.appendFileSync(filePath, `${elapsedTime}\n`)
    })

    worker.on('error', (err) => {
        console.log(`Worker error: ${err}`)
    })

    worker.on('exit', (code) => {
        console.log(`Worker exit: ${code}`)
    })

    console.log(`Main thread ${threadId} finished`)
}
main()