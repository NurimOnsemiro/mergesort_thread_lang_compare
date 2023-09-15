import path from 'path'
import {
    parentPort,
    Worker,
    threadId
} from 'worker_threads'
import { nextTick } from 'process'
import _ from 'lodash'

let workerPath = path.join(import.meta.dir, './worker.ts')
let tempArr: number[] = []
let maxValue = 10000

function mergeSort(arr: number[], startPos: number, endPos: number) {
    if (startPos === endPos) return

    const boundaryPos = (startPos + endPos) >> 1
    mergeSort(arr, startPos, boundaryPos)
    mergeSort(arr, boundaryPos + 1, endPos)

    let i = startPos, j = boundaryPos + 1
    let pos = startPos

    while (true) {
        if (arr[i] < arr[j]) {
            tempArr[pos++] = arr[i++]
        } else if (arr[i] > arr[j]) {
            tempArr[pos++] = arr[j++]
        } else {
            tempArr[pos++] = arr[i++]
            tempArr[pos++] = arr[j++]
        }

        if (i > boundaryPos && j > endPos) {
            break
        } else if (i > boundaryPos) {
            while (j <= endPos) tempArr[pos++] = arr[j++]
            break
        } else if (j > endPos) {
            while (i <= boundaryPos) tempArr[pos++] = arr[i++]
            break
        }
    }

    for (let i = startPos; i <= endPos; i++) {
        arr[i] = tempArr[i]
    }
}

function assignMergeSort(startPos: number, endPos: number, numThreads: number) {
    const jobSize = (endPos - startPos + 1)
    if (numThreads === 1) {
        let arr = new Array(jobSize)
        tempArr = new Array(jobSize)
        for (let i = 0; i < jobSize; i++) {
            arr[i] = _.random(0, maxValue)
        }

        let startTime = Date.now()
        mergeSort(arr, 0, jobSize - 1)
        let endTime = Date.now()
        let elapsedTime = endTime - startTime
        console.log(`Thread ${threadId} finished in ${elapsedTime}ms`)

        parentPort?.postMessage({
            arr,
            elapsedTime
        })
        parentPort?.close()
        arr = []
        tempArr = []
        return
    }

    let boundaryPos = (startPos + endPos) >> 1
    const newNumThreads = numThreads >> 1
    let resultArr = new Array(jobSize)
    let workerArr1: number[], workerArr2: number[]

    let worker1: Worker, worker2: Worker
    let worker1ElapsedTime = 0, worker2ElapsedTime = 0
    worker1 = new Worker(workerPath)
    worker1.postMessage({
        startPos,
        endPos: boundaryPos,
        numThreads: newNumThreads,
        maxValue: maxValue
    })

    worker2 = new Worker(workerPath)
    worker2.postMessage({
        startPos: boundaryPos + 1,
        endPos,
        numThreads: newNumThreads,
        maxValue: maxValue
    })

    let threadDone = 0
    let threadDoneFunc = () => {
        let startTime = Date.now()
        endPos -= (boundaryPos + 1)
        boundaryPos -= startPos
        startPos = 0

        let i = startPos, j = startPos
        let pos = startPos

        while (true) {
            if (workerArr1[i] < workerArr2[j]) {
                resultArr[pos++] = workerArr1[i++]
            } else if (workerArr1[i] > workerArr2[j]) {
                resultArr[pos++] = workerArr2[j++]
            } else {
                resultArr[pos++] = workerArr1[i++]
                resultArr[pos++] = workerArr2[j++]
            }

            if (i > boundaryPos && j > endPos) {
                break
            } else if (i > boundaryPos) {
                while (j <= endPos) resultArr[pos++] = workerArr2[j++]
                break
            } else if (j > endPos) {
                while (i <= boundaryPos) resultArr[pos++] = workerArr1[i++]
                break
            }
        }

        let endTime = Date.now()
        let elapsedTime = endTime - startTime
        console.log(`Thread ${threadId} finished in ${elapsedTime}ms`)

        nextTick(() => {
            parentPort?.postMessage({
                arr: resultArr,
                elapsedTime: (worker1ElapsedTime > worker2ElapsedTime ? worker1ElapsedTime : worker2ElapsedTime) + elapsedTime
            })
            parentPort?.close()
            resultArr = []
            workerArr1 = []
            workerArr2 = []
        })
    }

    worker2.on('message', (data) => {
        workerArr2 = data.arr
        worker2ElapsedTime = data.elapsedTime

        nextTick(() => {
            threadDone++
            if (threadDone === 2) threadDoneFunc()
        })
    })

    worker1.on('message', (data) => {
        workerArr1 = data.arr
        worker1ElapsedTime = data.elapsedTime

        nextTick(() => {
            threadDone++
            if (threadDone === 2) threadDoneFunc()
        })
    })
}

function threadMain() {
    console.log(`Thread ${threadId} started`)
    parentPort?.on('message', (data) => {
        maxValue = data.maxValue
        assignMergeSort(data.startPos, data.endPos, data.numThreads)
    })
}
threadMain()