// System.h
#ifndef SYSTEM_H
#define SYSTEM_H

#include "Sensor.h"
#include "Actuator.h"
#include "AWSClient.h"
#include "WiFiManager.h"

class System {
public:
    bool systemStarted;
    unsigned long lastReportTime;
    unsigned long reportInterval;

    Sensor sensor;
    Actuator actuator;
    AWSClient awsClient;
    WiFiManagerWrapper wifiManager;

    void setup();
    void loop();
};

#endif // SYSTEM_H
