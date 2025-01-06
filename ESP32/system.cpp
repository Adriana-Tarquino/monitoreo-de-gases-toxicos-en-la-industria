
// System.cpp
#include "System.h"
#include <Arduino.h>

void System::setup() {
    Serial.begin(115200);

    sensor.calibrateSensors();
    wifiManager.setupWiFi();
    awsClient.connectAWS();

    systemStarted = false;
    lastReportTime = 0;
    reportInterval = 5000;
}

void System::loop() {
    if (!awsClient.client.connected()) {
        awsClient.connectAWS();
    }
    awsClient.client.loop();

    if (!systemStarted) {
        // Start button logic
        if (digitalRead(START_BUTTON_PIN) == LOW) {
            Serial.println("Botón presionado. Iniciando calibración...");
            sensor.calibrateSensors();
            systemStarted = true;
        }
        return;
    }

    unsigned long currentMillis = millis();
    if (currentMillis - lastReportTime >= reportInterval) {
        lastReportTime = currentMillis;
        sensor.performReading();
        awsClient.scheduleShadowUpdate();
    }
}

