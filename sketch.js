////////// CONSTANTS //////////
const VID_WIDTH = 1920 * 0.8;
const VID_HEIGHT = 1080 * 0.8;
const PIXEL_JUMP = 4; // defines how many pixels to skip
const VIDEO_STATES = ['trees', 'stream', 'city'];

const TRIGGER_LINE_SPEED = 3;
const MAX_PARTICLE_COUNT = 300;

const DebugParams = {
  enabled: true,

  basePitch: 180,      // Hz
  pitchRange: 700,     // Hz

  fmAmount: 0.4,       // 0–1
  fmSpeed: 0.3,        // 0–1

  smoothness: 0.08     // 0–1
};         
////////// VARIABLES //////////
// Video
let currentVideoIndex = 0;                                                     
// Audio
let carrier; // oscillator we will hear
let modulator; // oscillator will modulate the frequency of the carrier
let fmGain; // proper FM depth control
let filter; //low-pass filter
let carrierBaseFreq = 220;
let audioContextOn = false;

// Managers
let appManager;

// Video
let video;
let videoTypes;
let videoSource;
let videoLoaded = false;
let videoIndex = 0;

// UI
let debugGui;

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
  createCanvas(VID_WIDTH, VID_HEIGHT);
  noStroke();
  textAlign(CENTER);

  debugGui = new DatGUI(DebugParams);

  //user must start audio context
  getAudioContext().suspend();

  // Carrier (audible oscillator)
  if (appManager.isSineWave) {
    carrier = new p5.Oscillator('sine'); 
  }
  else {
    carrier = new p5.Oscillator('sawtooth');
  }
  modulator = new p5.Oscillator('triangle');
  
  // Carrier
  carrier.amp(0);
  carrier.freq(carrierBaseFreq);

  // Modulator
  modulator = new p5.Oscillator('triangle');
  modulator.disconnect();       
  carrier.freq(modulator);        

  // Low-pass filter to smooth out the sound
  filter = new p5.LowPass();
  carrier.disconnect();
  carrier.connect(filter);

  filter.freq(2500);
  filter.res(2); 
}

function draw() {
  background(0);
  appManager.update(video);
}

function loadVideoByState(_state) {
  if (video) {
    video.stop();
    video.remove();

    const file = appManager.config[_state].videoFile;
    video = createVideo('assets/video/' + file, () => {
      video.loop();
      video.volume(0);
    });
    video.hide();
  }
}

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
}
