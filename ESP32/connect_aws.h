
// AWSClient.cpp
#include "AWSClient.h"
#include "secrets.h"
#include <ArduinoJson.h>

void AWSClient::connectAWS() {
    net.setCACert(AWS_CERT_CA);
    net.setCertificate(AWS_CERT_CRT);
    net.setPrivateKey(AWS_CERT_PRIVATE);

    client.setServer(AWS_IOT_ENDPOINT, 8883);
    client.setCallback([this](char* topic, byte* payload, unsigned int length) {
        this->callback(topic, payload, length);
    });

    while (!client.connected()) {
        if (client.connect("ESP32")) {
            Serial.println("Conectado a AWS IoT");
            client.subscribe(AWS_IOT_DELTA_TOPIC);
        } else {
            Serial.println("Error al conectar a AWS IoT");
            delay(5000);
        }
    }
}

void AWSClient::callback(char* topic, byte* payload, int length) {
    StaticJsonDocument<1024> jsonDoc;
    if (deserializeJson(jsonDoc, payload)) {
        Serial.println("Error al deserializar JSON.");
        return;
    }
    // Handle received state
}

void AWSClient::scheduleShadowUpdate() {
    StaticJsonDocument<1024> jsonDoc;
    JsonObject reported = jsonDoc.createNestedObject("state").createNestedObject("reported");

    reported["temperature"] = sensor.temperature;
    reported["humidity"] = sensor.humidity;
    reported["airQuality"] = sensor.airQuality;

    String payload;
    serializeJson(jsonDoc, payload);
    client.publish(AWS_IOT_UPDATE_TOPIC, payload.c_str());
}
