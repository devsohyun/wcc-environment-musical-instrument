////////// CONSTANTS //////////
const VID_WIDTH = 1920 * 0.8;
const VID_HEIGHT = 1080 * 0.8;
const PIXEL_JUMP = 4; // defines how many pixels to skip
const VIDEO_STATES = ['trees', 'stream', 'city'];

const TRIGGER_LINE_SPEED = 3;
const MAX_PARTICLE_COUNT = 300;

////////// VARIABLES //////////
// Video
let currentVideoIndex = 0;
// Audio
let carrier; // oscillator we will hear
let modulator; // oscillator will modulate the frequency of the carrier
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

  //user must start audio context
  getAudioContext().suspend();

  // Carrier (audible oscillator)
  carrier = new p5.Oscillator('sine'); // Options: 'sine', 'triangle', 'sawtooth', 'square'
  carrier.amp(0);
  carrier.freq(carrierBaseFreq);

  // Modulator (FM oscillator)
  modulator = new p5.Oscillator('sawtooth'); // Options: 'sine', 'triangle', 'sawtooth', 'square'
  modulator.disconnect();
  carrier.freq(modulator);
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
    appManager.uiState = 'play';
    modulator.start();
    carrier.start();
    appManager.videoState = VIDEO_STATES[currentVideoIndex];
    audioContextOn = true;
    userStartAudio();
  }
}

function keyPressed() {
  console.log(appManager.uiState);

  if (key === 'd' || key === 'D') {
    appManager.debugMode = !appManager.debugMode;
  }
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
