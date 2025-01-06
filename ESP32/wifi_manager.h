// WiFiManager.cpp
#include "WiFiManager.h"
#include <Arduino.h>

void WiFiManagerWrapper::setupWiFi() {
    WiFiManager wifiManager;
    wifiManager.autoConnect("GasMonitorAP", "password");
    Serial.println("WiFi conectado.");
}
