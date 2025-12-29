// CONSTANTS
// Video settings
const VID_WIDTH = 1920 *0.8;
const VID_HEIGHT = 1080 * 0.8;
const PIXEL_JUMP = 4;
// Audio settings
const MIN_PITCH = 0;
const MAX_PITCH = 1000;
const MOD_FREQ_MIN = 10;
const MOD_FREQ_MAX = 200; // 80
const MOD_DEPTH_MIN = 0; // 0
const MOD_DEPTH_MAX = 150; // 300
// Trigger line
const TRIGGER_LINE_SPEED = 3;
const BRIGHTNESS_THRESHOLD = 100;
const IS_TRIGGERED_BY_BRIGHTER = false;
// Particles
const MAX_PARTICLE_COUNT = 300;

// VARIABLES
// Classes
let appManager;
// Video
let video;
let videoNames = ['trees.mp4', 'stream.mp4' , 'city.mp4'];
let videoSource = 'assets/video/' + videoNames[1];
let videoLoaded = false;
// Audio
let carrier, modulator;
let audioContextOn = false;
let carrierBaseFreq = 220;
// Trigger line
let triggerLineX = 0; // Vertical detection line placement
let particles = []; // To store our hit animations
// Debugging
let debugMode = false;

function preload() {
  video = createVideo(videoSource, videoLoadedCallback);
  video.hide();
}

function videoLoadedCallback() {
  videoLoaded = true;
  video.size(VID_WIDTH, VID_HEIGHT);
  video.loop();
  video.volume(0);
}

function setup() {
  createCanvas(VID_WIDTH, VID_HEIGHT);
  noStroke();
  textAlign(CENTER);

  appManager = new AppManager();

  //user must start audio context
  getAudioContext().suspend();

  // Carrier (audible oscillator)
  carrier = new p5.Oscillator('sine');
  carrier.amp(0);
  carrier.freq(carrierBaseFreq);
  carrier.start();

  // Modulator (FM oscillator)
  modulator = new p5.Oscillator('sine');
  modulator.disconnect(); // IMPORTANT: silence modulator
  carrier.freq(modulator); // FM routing
  modulator.start();
}

function draw() {
  appManager.update();
  background(0);

  if (!videoLoaded) {
    appManager.state = 'loading';
    return;
  }

  image(video, 0, 0, VID_WIDTH, VID_HEIGHT);

  
  if (audioContextOn) {
    drawTriggerLine();
    moveTriggerLine();
    detectVideoFM();
    updateAndDrawParticles();
  } else {
    appManager.state = 'intro';
  }
}

function moveTriggerLine() {
  triggerLineX += TRIGGER_LINE_SPEED;
  if (triggerLineX > width) triggerLineX = 0;
}

function drawTriggerLine() {
  stroke(255, 0, 0);
  strokeWeight(1);
  line(triggerLineX, 0, triggerLineX, height);
  noStroke();
}

function detectVideoFM() {
  video.loadPixels();

  let sumY = 0;
  let sumBrightness = 0;
  let hitCount = 0;
  let hitYs = []; // store all hit positions for random particle selection

  // Map trigger line from canvas -> video pixel coordinates
  const x = Math.floor(map(triggerLineX, 0, width, 0, video.width));

  for (let y = 0; y < video.height; y += PIXEL_JUMP) {
    const index = (y * video.width + x) * 4;
    const r = video.pixels[index];
    const g = video.pixels[index + 1];
    const b = video.pixels[index + 2];
    const brightness = (r + g + b) / 3;

    const hit = IS_TRIGGERED_BY_BRIGHTER
      ? brightness > BRIGHTNESS_THRESHOLD
      : brightness < BRIGHTNESS_THRESHOLD;

    if (hit) {
      sumY += y;
      sumBrightness += brightness;
      hitCount++;
      hitYs.push(y); // save hit position
      if (debugMode) {
        stroke(255);
        strokeWeight(1);
        fill(0,0,0)
        circle(x, y, PIXEL_JUMP * 2); // Visual feedback on hits
      }
    }
  }

  if (hitCount > 0) {
    const avgY = sumY / hitCount;
    const avgBrightness = sumBrightness / hitCount;

    // Update audio based on average brightness/position
    applyFM(avgY, avgBrightness);

    // Randomly select a few hits to generate particles
    const MAX_PARTICLES_PER_FRAME = 5;
    for (let i = 0; i < MAX_PARTICLES_PER_FRAME; i++) {
      if (hitYs.length === 0 || particles.length >= MAX_PARTICLE_COUNT) break;
      const randIndex = Math.floor(random(hitYs.length));
      const yPos = hitYs[randIndex];
      particles.push({
        x: map(x, 0, video.width, 0, width),
        y: map(yPos, 0, video.height, 0, height),
        size: random(4, 8),
        opacity: 255,
      });
      hitYs.splice(randIndex, 1); // remove so we don’t pick it again
    }
  } else {
    // No hit: fade audio out
    carrier.amp(0, 0.2);
    modulator.amp(0);
  }
}

function applyFM(avgY, avgBrightness) {
  // Base pitch (gesture)
  const targetFreq = map(avgY, 0, VID_HEIGHT, MAX_PITCH, MIN_PITCH);
  carrierBaseFreq = lerp(carrierBaseFreq, targetFreq, 0.08);

  // FM speed
  const modFreq = map(avgY, 0, VID_HEIGHT, MOD_FREQ_MIN, MOD_FREQ_MAX);

  // FM depth (energy)
  const modDepth = map(
    avgBrightness,
    BRIGHTNESS_THRESHOLD,
    255,
    MOD_DEPTH_MIN,
    MOD_DEPTH_MAX
  );

  modulator.freq(modFreq);
  modulator.amp(modDepth);
  carrier.amp(0.25, 0.1);
}

function updateAndDrawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    noStroke();
    fill(255, 0, 0, p.opacity);
    circle(p.x, p.y, p.size);

    p.size += 1;
    p.opacity -= 30;

    if (p.opacity <= 0) {
      particles.splice(i, 1);
    }
  }
}



function mousePressed() {
  if (!audioContextOn && videoLoaded) {
    audioContextOn = true;
    userStartAudio();
  }
}
