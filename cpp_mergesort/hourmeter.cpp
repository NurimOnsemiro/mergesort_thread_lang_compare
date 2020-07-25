#include "HourMeter.h"

HourMeter::HourMeter() :
    isMeasuring(false)
{
}

HourMeter::~HourMeter()
{
}

void HourMeter::startMeasure()
{
    if (isMeasuring == true) {
        printf("FAIL startMeasure; already measuring\n");
        throw std::runtime_error("startMeasure");
    }

    isMeasuring = true;
    begin = std::chrono::system_clock::now();
}

void HourMeter::endMeasure()
{
    if (isMeasuring == false) {
        printf("FAIL endMeasure; not measuring\n");
        throw std::runtime_error("endMeasure");
    }

    end = std::chrono::system_clock::now();
    result_sec = end - begin;
    isMeasuring = false;

    std::cout << "elapsed time:" << result_sec.count() << std::endl;
}

double HourMeter::getLatestDuration()
{
    return result_sec.count();
}
