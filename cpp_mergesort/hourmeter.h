#pragma once
#include <iostream>
#include <chrono>

class HourMeter
{
public:
    HourMeter();
    ~HourMeter();

    void startMeasure();
    void endMeasure();
    double getLatestDuration();
private:
    std::chrono::system_clock::time_point begin;
    std::chrono::system_clock::time_point end;
    std::chrono::duration<double> result_sec;
    bool isMeasuring;
};
