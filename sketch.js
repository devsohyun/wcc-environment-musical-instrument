// ----- CONSTANTS ----- //
const VID_WIDTH = 1920 * 0.8;
const VID_HEIGHT = 1080 * 0.8;
const PIXEL_JUMP = 4; // defines how many pixels to skip
const VIDEO_STATES = ['trees', 'stream', 'grass', 'city', 'park_trees'];

const TRIGGER_LINE_SPEED = 3;
const MAX_PARTICLE_COUNT = 300;

const DebugParams = {
  enabled: true,
  basePitch: 180, // Hz
  pitchRange: 700, // Hz
  fmAmount: 0.4, // 0–1
  fmSpeed: 0.3, // 0–1
  smoothness: 0.08, // 0–1
};
// ----- VARIABLES ----- //
// Video
let currentVideoIndex = 0;
// Audio
let carrier; // oscillator we will hear
let modulator; // oscillator will modulate the frequency of the carrier
let fmGain; // proper FM depth control
let filter; //low-pass filter
let carrierBaseFreq = 220;
let audioContextOn = false;
// Manager
let appManager;
// Video
let video;
let videoTypes;
let videoSource;
let videoLoaded = false;
let videoIndex = 0;
// UI
let debugGui;
// Arduino
let serial;
let pot1 = 0;
let pot2 = 0;
let button = 0;

function preload() {
  // Initialize App Manager
  appManager = new AppManager();
  appManager.uiState = 'intro';
  // Define video types based on AppManager config
  videoTypes = [
    appManager.config.trees,
    appManager.config.stream,
    appManager.config.city,
  ];
  videoSource = 'assets/video/' + videoTypes[videoIndex].videoFile;
  // preload any video, initial video is stream.mp4
  video = createVideo(videoSource, () => {
    videoLoaded = true;
    video.hide();
    video.size(VID_WIDTH, VID_HEIGHT);
    video.loop();
    video.volume(0);
  });
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();
  textAlign(CENTER);

  debugGui = new DatGUI(DebugParams);

  //user must start audio context
  getAudioContext().suspend();

  // Carrier
  carrier = new p5.Oscillator(appManager.isSineWave ? 'sine' : 'sawtooth');
  carrier.freq(carrierBaseFreq);
  carrier.amp(0);

  // Modulator (FM)
  modulator = new p5.Oscillator('triangle');
  modulator.disconnect(); // don't output sound
  carrier.freq(modulator); // FM routing

  // Low-pass filter to smooth out the sound
  filter = new p5.LowPass();
  carrier.disconnect();
  carrier.connect(filter);

  filter.freq(2500);
  filter.res(2);

  if (appManager.isArduinoConnected) {
    //instantiate the serial port object
    serial = new p5.SerialPort();

    // Open the serial port
    serial.open('/dev/cu.usbmodem141201'); // change this to the name of your arduino's serial port
    serial.on('connected', serverConnected);
    serial.on('list', gotList);
    serial.on('data', gotData);
    serial.on('error', gotError);
    serial.on('open', gotOpen);
  }
}

function draw() {
  background(0);
  appManager.update(video);
}

function loadVideoByState(_state) {
  // stop and remove existing video
  if (video) {
    video.stop();
    video.remove();
    // load new video based on state
    const file = appManager.config[_state].videoFile;
    video = createVideo('assets/video/' + file, () => {
      video.loop();
      video.volume(0);
    });
    video.hide();
  }
}

// ----- SERIAL CALLBACKS ----- //
// Code copied and adapted from https://github.com/p5-serial/p5.serialport/tree/main
// We are connected and ready to go
function serverConnected() {
  print('We are connected!');
}

// Got the list of ports
function gotList(thelist) {
  // theList is an array of their names
  for (let i = 0; i < thelist.length; i++) {
    // Display in the console
    print(i + ' ' + thelist[i]);
  }
}

// Connected to our serial device
function gotOpen() {
  print('Serial Port is open!');
}

// Ut oh, here is an error, let's log it
function gotError(theerror) {
  print(theerror);
}

// There is data available to work with from the serial port
function gotData() {
  let line = serial.readLine();
  if (!line) return;

  line = trim(line);
  let values = line.split(',');

  if (values.length !== 3) return;

  pot1 = int(values[0]);
  pot2 = int(values[1]);
  button = int(values[2]);

  // ---- BUTTON TOGGLE (edge detection) ----
  if (button === 1 && lastButton === 0) {
    appManager.isSineWave = !appManager.isSineWave;
    // update oscilator type
    let currentFreq = carrierBaseFreq;

    carrier.stop();
    carrier.disconnect();

    carrier = new p5.Oscillator(appManager.isSineWave ? 'sine' : 'sawtooth');

    carrier.freq(currentFreq);
    carrier.amp(0);

    carrier.disconnect();
    carrier.connect(filter);
    carrier.start();
  }

  lastButton = button;

  // Potentiometer mappings
  // Smooth pots (important!)
  DebugParams.pitchRange = lerp(
    DebugParams.pitchRange,
    map(pot1, 0, 1023, 10, 1500),
    0.15
  );

  DebugParams.fmAmount = lerp(
    DebugParams.fmAmount,
    map(pot2, 0, 1023, 0, 10),
    0.15
  );
}

// ----- MOUSE INTERACTIONS ----- //
function mousePressed() {
  if (!audioContextOn && videoLoaded) {
    // change UI state
    appManager.uiState = 'play';
    // start audio
    modulator.start();
    carrier.start();
    // load initial video
    appManager.videoState = VIDEO_STATES[currentVideoIndex];
    // audio on
    audioContextOn = true;
    userStartAudio();
  }
}

// ----- KEYBOARD INTERACTIONS ----- //
function keyPressed() {
  // Toggle for debug pixels
  if (key === 'd' || key === 'D') {
    appManager.debugMode = !appManager.debugMode;
  }

  // Toggle for debug GUI to change audio params
  if (key === 'g' || key === 'G') {
    DebugParams.enabled = !DebugParams.enabled;
    debugGui.toggle();
  }

  // Change to next video
  if (key === 'n' || key === 'N') {
    // only allow video change when not in intro or loading state
    if (appManager.uiState === 'loading' || appManager.uiState === 'intro')
      return;

    // change to next video
    currentVideoIndex = (currentVideoIndex + 1) % VIDEO_STATES.length;

    // update appManager video state and load new video
    appManager.videoState = VIDEO_STATES[currentVideoIndex];
    appManager.loadVideoByState(appManager.videoState);

    // reset trigger line position
    appManager.triggerLineX = 0;

    // clear existing particles
    appManager.particles = [];
  }

  //toggle fullscreen on or off
  if (key == 'f' || key == 'F') {
    //get current full screen state https://p5js.org/reference/#/p5/fullscreen
    appManager.drawVideoCover(video);
    let fs = fullscreen(); //true or false

    //switch it to the opposite of current value
    console.log('Full screen getting set to: ' + !fs);
    fullscreen(!fs);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
