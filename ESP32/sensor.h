
// Sensor.cpp
#include "Sensor.h"
#include <Adafruit_BME680.h>

Adafruit_BME680 bme;

void Sensor::calibrateSensors() {
    // Calibration logic
    unsigned long startTime = millis();
    while (millis() - startTime < 10000) {
        if (bme.performReading()) {
            airQualityBase += bme.gas_resistance;
        }
        delay(200);
    }
    airQualityBase /= 50;
    Serial.print("Calibración completa. airQualityBase = ");
    Serial.println(airQualityBase);
}

void Sensor::performReading() {
    if (bme.performReading()) {
        temperature = bme.temperature;
        humidity = bme.humidity;
        airQuality = bme.gas_resistance;
    }
    lpgValue = analogRead(MQ2_PIN) * 0.1;
    coValue = analogRead(MQ2_PIN) * 0.08;
    smokeValue = analogRead(MQ2_PIN) * 0.06;
}

