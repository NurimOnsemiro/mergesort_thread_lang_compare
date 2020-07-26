package main

import (
	"fmt"
	"math/rand"
	"os"
	"strconv"
	"sync"
	"time"
)

var tempArr []int

func mergeSort(arr []int, startPos int, endPos int) {
	//println("mergeSort START;", startPos, endPos)
	if startPos == endPos {
		return
	}

	boundaryPos := (startPos + endPos) >> 1
	mergeSort(arr, startPos, boundaryPos)
	mergeSort(arr, boundaryPos+1, endPos)

	i := startPos
	j := boundaryPos + 1
	pos := startPos

	for {
		if arr[i] < arr[j] {
			tempArr[pos] = arr[i]
			pos++
			i++
		} else if arr[i] > arr[j] {
			tempArr[pos] = arr[j]
			pos++
			j++
		} else {
			tempArr[pos] = arr[i]
			pos++
			i++
			tempArr[pos] = arr[j]
			pos++
			j++
		}

		if i > boundaryPos && j > endPos {
			break
		} else if i > boundaryPos {
			for j <= endPos {
				tempArr[pos] = arr[j]
				pos++
				j++
			}
			break
		} else if j > endPos {
			for i <= boundaryPos {
				tempArr[pos] = arr[i]
				pos++
				i++
			}
			break
		}
	}

	for i := startPos; i <= endPos; i++ {
		arr[i] = tempArr[i]
	}

	//copy(arr[startPos:endPos], tempArr[startPos:endPos])
}

func assignMergeSort(wg *sync.WaitGroup, arr []int, startPos int, endPos int, numThreads int) {
	defer wg.Done()
	if numThreads == 1 {
		mergeSort(arr, startPos, endPos)
		return
	}

	boundaryPos := (startPos + endPos) >> 1
	newNumThreads := numThreads >> 1

	var newWg sync.WaitGroup
	newWg.Add(2)
	go assignMergeSort(&newWg, arr, startPos, boundaryPos, newNumThreads)
	go assignMergeSort(&newWg, arr, boundaryPos+1, endPos, newNumThreads)

	newWg.Wait()

	i := startPos
	j := boundaryPos + 1
	pos := startPos

	for {
		if arr[i] < arr[j] {
			tempArr[pos] = arr[i]
			pos++
			i++
		} else if arr[i] > arr[j] {
			tempArr[pos] = arr[j]
			pos++
			j++
		} else {
			tempArr[pos] = arr[i]
			pos++
			i++
			tempArr[pos] = arr[j]
			pos++
			j++
		}

		if i > boundaryPos && j > endPos {
			break
		} else if i > boundaryPos {
			for j <= endPos {
				tempArr[pos] = arr[j]
				pos++
				j++
			}
			break
		} else if j > endPos {
			for i <= boundaryPos {
				tempArr[pos] = arr[i]
				pos++
				i++
			}
			break
		}
	}

	for i := startPos; i <= endPos; i++ {
		arr[i] = tempArr[i]
	}
}

func main() {
	if len(os.Args) != 4 {
		panic("argv : JOB_SIZE MAX_VALUE NUM_THREADS")
	}

	jobSize, _ := strconv.Atoi(os.Args[1])
	maxValue, _ := strconv.Atoi(os.Args[2])
	numThreads, _ := strconv.Atoi(os.Args[3])
	var kPrintCount int = 100

	arr := make([]int, jobSize)
	tempArr = make([]int, jobSize)

	for i := 0; i < jobSize; i++ {
		arr[i] = rand.Intn(maxValue)
	}

	println("jobSize :", jobSize, ", maxValue :", maxValue, ", numThreads :", numThreads)

	var newWg sync.WaitGroup
	newWg.Add(1)

	println("assignMergeSort START")
	startTime := time.Now()
	assignMergeSort(&newWg, arr, 0, jobSize-1, numThreads)
	newWg.Wait()
	elapsedTime := time.Since(startTime)
	println("assignMergeSort END")
	d2 := elapsedTime / time.Millisecond
	et := float64(d2) / 1000.0

	fmt.Printf("elapsed time : %f sec\n", et)
	//println("elapsed time: ", et, "ms")

	term := jobSize / kPrintCount
	for i := 0; i < jobSize; i += term {
		println(arr[i])
	}

	filePath := "./result_go.txt"
	writeFile, err := os.OpenFile(filePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		panic(filePath + " file open failed")
	}
	defer writeFile.Close()
	var elapsedTimeStr string
	elapsedTimeStr = fmt.Sprintf("%f\n", et)
	if _, err := writeFile.WriteString(elapsedTimeStr); err != nil {
		panic(filePath + " file write failed")
	}
}
