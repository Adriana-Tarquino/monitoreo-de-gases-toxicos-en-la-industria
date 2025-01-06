
// Actuator.cpp
#include "Actuator.h"
#include <Arduino.h>

void Actuator::activateFan() {
    fanStatus = true;
    digitalWrite(FAN_PIN1, HIGH);
    digitalWrite(FAN_PIN2, HIGH);
    Serial.println("Ventilador activado.");
}

void Actuator::deactivateFan() {
    fanStatus = false;
    digitalWrite(FAN_PIN1, LOW);
    digitalWrite(FAN_PIN2, LOW);
    Serial.println("Ventilador desactivado.");
}

void Actuator::activateAlarm() {
    alarmStatus = true;
    digitalWrite(ALARM_PIN, HIGH);
    Serial.println("Alarma activada.");
}

void Actuator::deactivateAlarm() {
    alarmStatus = false;
    digitalWrite(ALARM_PIN, LOW);
    Serial.println("Alarma desactivada.");
}

void Actuator::activateConveyor() {
    conveyorStatus = true;
    digitalWrite(MOTOR_INA1_PIN, HIGH);
    digitalWrite(MOTOR_INA2_PIN, LOW);
    Serial.println("Banda transportadora activada.");
}

void Actuator::deactivateConveyor() {
    conveyorStatus = false;
    digitalWrite(MOTOR_INA1_PIN, LOW);
    digitalWrite(MOTOR_INA2_PIN, LOW);
    Serial.println("Banda transportadora desactivada.");
}

