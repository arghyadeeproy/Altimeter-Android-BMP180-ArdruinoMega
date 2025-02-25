#include <Adafruit_BMP085.h>
#include <Wire.h>
#include <math.h>  // Needed for pow()

Adafruit_BMP085 bmp;

#define KNOWN_ALTITUDE 21.0  // Known altitude in meters at calibration

float baseline_p0;  // Baseline sea-level pressure in millibars (mb)

void setup() {
  Serial.begin(9600);
  if (!bmp.begin()) {
    Serial.println("{\"error\": \"BMP085 sensor not found!\"}");
    while (1) {}
  }
  
  // Calibrate once: Read pressure at the known altitude (21 m)
  float pressurePa = bmp.readPressure();          // Pressure in Pascals
  float pressureMb = pressurePa / 100.0;            // Convert to millibars (mb)
  
  // Compute baseline sea-level pressure (p0) in mb using:
  // p0 = measured_pressure / (1 - (altitude/44330))^5.255
  baseline_p0 = pressureMb / pow(1 - (KNOWN_ALTITUDE / 44330.0), 5.255);
  
  // Optionally, print the baseline for debugging
  Serial.print("{\"baseline_p0\": ");
  Serial.print(baseline_p0, 2);
  Serial.println("}");
  
  delay(1000);  // Allow time for calibration before starting measurements
}

void loop() {
  // Read current pressure in Pascals
  float pressurePa = bmp.readPressure();
  // Convert to millibars (mb)
  float pressureMb = pressurePa / 100.0;
  
  // Compute the current altitude in meters using the stored baseline p0:
  // altitude = 44330 * (1 - (measured_pressure / p0)^0.1903)
  float altitude = 44330.0 * (1 - pow(pressureMb / baseline_p0, 0.1903));
  
  // Output the computed altitude in JSON format
  Serial.print("{\"altitude\": ");
  Serial.print(altitude, 2);
  Serial.println("}");
  
  delay(1000); // Update every 1 second
}
