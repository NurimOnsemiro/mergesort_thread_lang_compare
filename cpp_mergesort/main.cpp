#include <iostream>
#include <array>
#include <vector>
#include <random>
#include <thread>
#include "hourmeter.h"

#define PRINT_COUNT 100

using namespace std;

int* tempArr = nullptr;
int* arr = nullptr;

void mergeSort(int* arr, const int& startPos, const int& endPos){
    if(startPos == endPos){
        return;
    }

    const int boundaryPos = (startPos + endPos) >> 1;
    mergeSort(arr, startPos, boundaryPos);
    mergeSort(arr, boundaryPos + 1, endPos);

    int i = startPos, j = boundaryPos + 1;
    int pos = startPos;
    while(true){
        if(arr[i] < arr[j]){
            tempArr[pos++] = arr[i];
            i++;
        }
        else if(arr[i] > arr[j]){
            tempArr[pos++] = arr[j];
            j++;
        }
        else {
            tempArr[pos++] = arr[i];
            tempArr[pos++] = arr[j];
            i++;
            j++;
        }

        if(i > boundaryPos && j > endPos){
            break;
        }
        //INFO: i가 모두 처리된 경우
        else if(i > boundaryPos){
            //INFO: 남은 j를 모두 넣어주어야 한다
            while(j <= endPos){
                tempArr[pos++] = arr[j++];
            }
            break;
        }
        //INFO: j가 모두 처리된 경우
        else if(j > endPos){
            //INFO: 남은 i를 모두 넣어주어야 한다
            while(i <= boundaryPos){
                tempArr[pos++] = arr[i++];
            }
            break;
        }
    }

    memcpy(&arr[startPos], &tempArr[startPos], sizeof(int) * (endPos - startPos + 1));
}

void assignMergeSort(int* arr, const int& startPos, const int& endPos, const int& numThreads){
    if(numThreads == 1){
        //INFO: 실제 정렬 시작
        mergeSort(arr, startPos, endPos);
        return;
    }

    const int boundaryPos = (startPos + endPos) >> 1;
    const int newNumThreads = numThreads >> 1;

    thread thr[2];

    //INFO: 각 스레드에게 작업을 분배한다
    thr[0] = thread(assignMergeSort, arr, startPos, boundaryPos, newNumThreads);
    thr[1] = thread(assignMergeSort, arr, boundaryPos + 1, endPos, newNumThreads);

    for(int i=0;i<2;i++){
        if(thr[i].joinable()){
            thr[i].join();
        }
    }

    int i = startPos, j = boundaryPos + 1;
    int pos = startPos;
    while(true){
        if(arr[i] < arr[j]){
            tempArr[pos++] = arr[i];
            i++;
        }
        else if(arr[i] > arr[j]){
            tempArr[pos++] = arr[j];
            j++;
        }
        else {
            tempArr[pos++] = arr[i];
            tempArr[pos++] = arr[j];
            i++;
            j++;
        }

        if(i > boundaryPos && j > endPos){
            break;
        }
        //INFO: i가 모두 처리된 경우
        else if(i > boundaryPos){
            //INFO: 남은 j를 모두 넣어주어야 한다
            while(j <= endPos){
                tempArr[pos++] = arr[j++];
            }
            break;
        }
        //INFO: j가 모두 처리된 경우
        else if(j > endPos){
            //INFO: 남은 i를 모두 넣어주어야 한다
            while(i <= boundaryPos){
                tempArr[pos++] = arr[i++];
            }
            break;
        }
    }

    memcpy(&arr[startPos], &tempArr[startPos], sizeof(int) * (endPos - startPos + 1));
}

int main(int argc, char** argv)
{
    if(argc != 4){
        cout << "argv : JOB_SIZE MAX_VALUE NUM_THREADS" << endl;
        exit(0);
    }

    int jobSize = std::stoll(argv[1]);
    int maxValue = std::stoi(argv[2]);
    int numThreads = std::stoi(argv[3]);

    if(jobSize <= 0){
        cout << "0 < JOB_SIZE < " << INT_MAX << endl;
        exit(0);
    }

    if(maxValue <= 0){
        cout << "0 < MAX_VALUE < " << INT_MAX << endl;
        exit(0);
    }

    if(numThreads <= 0){
        cout << "0 < NUM_THREADS" << endl;
        exit(0);
    }

    cout<< "jobSize : " << jobSize << ", maxValue : " << maxValue << ", numThreads : " << numThreads << endl;

    HourMeter hm;

    //INFO: 시드값을 얻기 위한 random_device 생성
    random_device rd;
    //INFO: random_device를 통해 난수 생성엔진을 초기화한다.
    mt19937 gen(rd());
    //INFO: 균등 분포 정의
    uniform_int_distribution<int> dis(0, maxValue);

    arr = new int[jobSize];
    tempArr = new int[jobSize];

    for(int i=0;i<jobSize;i++){
        arr[i] = dis(gen);
    }

    cout << "assignMergeSort START" << endl;
    hm.startMeasure();
    assignMergeSort(arr, 0, jobSize - 1, numThreads);
    hm.endMeasure();
    cout << "assignMergeSort END" << endl;

    int term = jobSize / PRINT_COUNT;
    for(int i = 0;i<jobSize;i += term){
        cout << arr[i] << endl;
    }

    delete[] arr;
    delete[] tempArr;

    return 0;
}
