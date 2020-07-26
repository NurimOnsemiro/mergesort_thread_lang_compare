const path = require('path');
const {
    Worker
} = require('worker_threads');

let workerPath = path.join(__dirname, './worker.js');
const PRINT_COUNT = 100

async function main() {
    if (process.argv.length !== 5) {
        console.log(`argv : JOB_SIZE MAX_VALUE NUM_THREADS`);
        process.exit(0);
    }

    const jobSize = Number(process.argv[2]);
    const maxValue = Number(process.argv[3]);
    const numThreads = Number(process.argv[4]);
    let term = jobSize / PRINT_COUNT;

    if (jobSize <= 0) {
        console.log(`0 < JOB_SIZE < ${Number.MAX_VALUE}`);
        process.exit(0);
    }

    if (maxValue <= 0) {
        console.log(`0 < MAX_VALUE < ${Number.MAX_VALUE}`);
        process.exit(0);
    }

    if (numThreads <= 0) {
        console.log(`0 < NUM_THREADS`);
        process.exit(0);
    }

    console.log(`jobSize : ${jobSize}, maxValue : ${maxValue}, numThreads : ${numThreads}`);

    console.log('assignMergeSort START');
    //console.time('main');
    let data = {
        startPos: 0,
        endPos: jobSize - 1,
        maxValue,
        numThreads
    };
    let myWorker = new Worker(workerPath);
    myWorker.postMessage(data);

    myWorker.on('message', result => {
        let arr = result.arr;
        let elapsedTime = result.elapsedTime;

        //console.timeEnd('main');
        console.log(`elapsedTime: ${elapsedTime}ms`);
        console.log('assignMergeSort END');

        //console.timeLog('main')

        for (let i = 0; i < jobSize; i += term) {
            console.log(arr[i]);
        }
    })
}

main();