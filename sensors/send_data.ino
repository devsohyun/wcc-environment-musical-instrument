int potPin1 = A1;
int potPin2 = A2;
int potPin3 = A3;
int buttonPin1 = 2;
int buttonPin2 = 3;

void setup() {
  Serial.begin(9600);
  pinMode(buttonPin1, INPUT);
  pinMode(buttonPin2, INPUT);
}

void loop() {
  int potVal1 = analogRead(potPin1); // 0–1023
  int potVal2 = analogRead(potPin2); // 0–1023
  int potVal3 = analogRead(potPin3); // 0–1023
  int buttonState1 = digitalRead(buttonPin1); // 0 or 1
  int buttonState2 = digitalRead(buttonPin2); // 0 or 1

  // Send everything in ONE line
  Serial.print(potVal1);
  Serial.print(",");
  Serial.print(potVal2);
  Serial.print(",");
  Serial.print(potVal3);
  Serial.print(",");
  Serial.print(buttonState1);
  Serial.print(",");
  Serial.println(buttonState2);

  delay(20);
}
