const path = require('path');
const {
    parentPort,
    Worker,
    threadId
} = require('worker_threads');
const {
    nextTick
} = require('process');


let workerPath = path.join(__dirname, './worker.js');
let tempArr;
let maxValue = 10000;

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

function mergeSort(arr, startPos, endPos) {
    if (startPos === endPos) {
        return;
    }

    const boundaryPos = (startPos + endPos) >> 1;
    mergeSort(arr, startPos, boundaryPos);
    mergeSort(arr, boundaryPos + 1, endPos);

    let i = startPos,
        j = boundaryPos + 1;
    let pos = startPos;

    while (true) {
        if (arr[i] < arr[j]) {
            tempArr[pos++] = arr[i];
            i++;
        } else if (arr[i] > arr[j]) {
            tempArr[pos++] = arr[j];
            j++;
        } else {
            tempArr[pos++] = arr[i];
            tempArr[pos++] = arr[j];
            i++;
            j++;
        }

        if (i > boundaryPos && j > endPos) {
            break;
        } else if (i > boundaryPos) {
            while (j <= endPos) {
                tempArr[pos++] = arr[j++];
            }
            break;
        } else if (j > endPos) {
            while (i <= boundaryPos) {
                tempArr[pos++] = arr[i++];
            }
            break;
        }
    }

    for (let k = startPos; k <= endPos; k++) {
        arr[k] = tempArr[k];
    }
}

async function assignMergeSort(startPos, endPos, numThreads) {
    if (numThreads === 1) {
        const jobSize = (endPos - startPos + 1);
        let arr = new Array(jobSize);
        tempArr = new Array(jobSize);
        for (let i = 0; i < jobSize; i++) {
            arr[i] = getRandomInt(0, maxValue);
        }

        //console.time(`${threadId}_sort`);
        let startTime = Date.now();
        mergeSort(arr, 0, jobSize - 1);
        let endTime = Date.now();
        let elapsedTime = endTime - startTime;
        //console.log(`${threadId} mergesort elapsed : ${elapsedTime}ms`);
        //console.timeEnd(`${threadId}_sort`);
        parentPort.postMessage({
            arr,
            elapsedTime
        });
        parentPort.close();
        arr = undefined;
        tempArr = undefined;
        return;
    }

    //console.time(`${threadId}_assign`);
    const jobSize = endPos - startPos + 1;
    let boundaryPos = (startPos + endPos) >> 1;
    const newNumThreads = numThreads >> 1;
    let resultArr = new Array(jobSize);
    let workerArr1, workerArr2;

    let myWorker1, myWorker2;
    let worker1Elapsed, worker2Elapsed;
    myWorker1 = new Worker(workerPath);
    myWorker1.postMessage({
        startPos,
        endPos: boundaryPos,
        numThreads: newNumThreads,
        maxValue
    });

    myWorker2 = new Worker(workerPath);
    myWorker2.postMessage({
        startPos: boundaryPos + 1,
        endPos: endPos,
        numThreads: newNumThreads,
        maxValue
    });

    //console.log(`${threadId} make ${myWorker1.threadId}, ${myWorker2.threadId}`);

    let threadDone = 0;
    let threadDoneFune = () => {
        //console.log(`${threadId} worker all done`);

        //console.time(`${threadId}_merge`);
        let startTime = Date.now();

        endPos -= (boundaryPos + 1);
        boundaryPos -= startPos;
        startPos = 0;

        let i = startPos,
            j = startPos;
        let pos = startPos;

        while (true) {
            if (workerArr1[i] < workerArr2[j]) {
                resultArr[pos++] = workerArr1[i];
                i++;
            } else if (workerArr1[i] > workerArr2[j]) {
                resultArr[pos++] = workerArr2[j];
                j++;
            } else {
                resultArr[pos++] = workerArr1[i];
                resultArr[pos++] = workerArr2[j];
                i++;
                j++;
            }

            if (i > boundaryPos && j > endPos) {
                break;
            } else if (i > boundaryPos) {
                while (j <= endPos) {
                    resultArr[pos++] = workerArr2[j++];
                }
                break;
            } else if (j > endPos) {
                while (i <= boundaryPos) {
                    resultArr[pos++] = workerArr1[i++];
                }
                break;
            }
        }

        //console.timeEnd(`${threadId}_merge`);
        let endTime = Date.now();
        let elapsedTime = endTime - startTime;
        //console.log(`${threadId} merge elapsed : ${elapsedTime}ms`);

        nextTick(() => {
            //console.time(`${threadId}_postMessage`);
            parentPort.postMessage({
                arr: resultArr,
                elapsedTime: (worker1Elapsed > worker2Elapsed ? worker1Elapsed : worker2Elapsed) + elapsedTime
            });
            parentPort.close();
            resultArr = undefined;
            tempArr = undefined;
            //console.timeEnd(`${threadId}_postMessage`);
        });

        //console.timeEnd(`${threadId}_assign`);
    }

    myWorker2.on('message', result2 => {
        workerArr2 = result2.arr;
        worker2Elapsed = result2.elapsedTime;
        //console.log(`${threadId}_worker2 done`);

        nextTick(() => {
            threadDone++;
            if (threadDone === 2) {
                threadDoneFune();
            }
        });
    });

    myWorker1.on('message', result1 => {
        workerArr1 = result1.arr;
        worker1Elapsed = result1.elapsedTime;
        //console.log(`${threadId} worker1 done`);

        nextTick(() => {
            threadDone++;
            if (threadDone === 2) {
                threadDoneFune();
            }
        });
    })
}

async function threadMain() {
    //console.log(`#threadId : ${threadId}`);

    parentPort.on('message', async (data) => {
        maxValue = data.maxValue;
        assignMergeSort(data.startPos, data.endPos, data.numThreads);
    })
}
threadMain();