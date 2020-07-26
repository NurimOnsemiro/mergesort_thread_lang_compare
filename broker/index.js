const path = require('path');
const fs = require('fs');
const util = require('util');
const exec = require('child_process').execFile;

let fileInfo = {
    cpp: {
        language: 'cpp',
        filename: 'cpp_mergesort.exe',
        result: 'result_cpp.txt'
    },
    golang: {
        language: 'golang',
        filename: 'go_mergesort.exe',
        result: 'result_go.txt'
    }
}

const testCasePath = path.join(process.cwd(), './test_case.json');
let numTests = 1;

function initTestCase(){
    if(fs.existsSync(testCasePath) === false){
        console.error(`${testCasePath} does not exist`);
        process.exit(0);
    }

    testCaseJson = JSON.parse(fs.readFileSync(testCasePath, 'utf8'));
    testCaseList = testCaseJson.testCaseList;
    numTests = testCaseJson.numTests;
    console.log(`numTests : ${numTests}`);
    console.log('test case list');
    console.log(testCaseList);
}

let testCaseList = null;

async function execSomeFile(filename, jobSize, maxValue, numThreads){
    return new Promise(async (resolve, reject)=>{
        exec(filename, [jobSize, maxValue, numThreads], (err, stdout) => {
            if(err){
                reject(err);
            }
            resolve(stdout);
        })
    });
}

async function startTest(filename, testCase){
    for(let i =0;i<numTests;i++){
        await execSomeFile(filename, testCase.jobSize, testCase.maxValue, testCase.numThreads);
    }
}

function collectResult(filename){
    if(fs.existsSync(filename) === false){
        console.error(`${filename} does not exist`);
        return;
    }

    let result = fs.readFileSync(filename, 'utf8').toString();
    //console.log(result);
    let eachDataList = result.split('\n');
    let average = 0;
    let numData = 0;
    for(let eachData of eachDataList){
        if(eachData.length === 0) continue;
        average += Number(eachData);
        numData++;
    }
    average = average / numData;
    console.log(`average : ${average}`);

    return average;
}

async function startTestLang(langInfo){
    if(langInfo === undefined || langInfo === null){
        console.error(`langInfo does not exist`);
        return;
    }

    console.log(`${langInfo.language} test START`);

    let results = [];
    let cnt = 0;

    for(let testCase of testCaseList){
        console.log(`${langInfo.language} ${cnt++} test case START`);
        //INFO: 기존 실험 파일 제거
        if(fs.existsSync(langInfo.result)){
            fs.unlinkSync(langInfo.result);
        }

        await startTest(langInfo.filename, testCase);
        results.push(collectResult(langInfo.result));
    }

    return results;
}

async function main() {
    initTestCase();

    let langResults = {};

    for(let lang in fileInfo){
        let results = await startTestLang(fileInfo[lang]);
        console.log(results);
        langResults[lang] = results;
    }

    console.log(langResults);
}

main();