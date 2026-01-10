int potPin1 = A1;
int potPin2 = A2;
int buttonPin = 2;

void setup() {
  Serial.begin(9600);
  pinMode(buttonPin, INPUT);
}

void loop() {
  int potVal1 = analogRead(potPin1);  // 0–1023
  int potVal2 = analogRead(potPin2);  // 0–1023
  int buttonState = digitalRead(buttonPin); // 0 or 1

  // Send everything in ONE line
  Serial.print(potVal1);
  Serial.print(",");
  Serial.print(potVal2);
  Serial.print(",");
  Serial.println(buttonState);

  delay(20); // 50 Hz is plenty
}
