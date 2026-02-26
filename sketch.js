/*
 * Puppet Show with Hand Pose Detection
 * Uses ml5.js handPose to track hand position and draw characters
 */

let handPose;
let video;
let hands = [];

let girl;
let girlMouthOpen;
let girl2;
let girl2MouthOpen;

// Background images
let fieldNoHole;
let fieldWithHole;
let grassHole;
let hole;
let holelight;
let holeRope;
let holeRopeLight;

// Audio
let fieldBGM;
let caveBGM;
let thudSFX;
let ropeSFX;
let grassStepSFX;
let isMuted = false; // tracks whether audio is currently muted

// site color (read from CSS --site-green in setup)
let SITE_GREEN_RGB = [59, 143, 3];
let SITE_GREEN_STR = 'rgb(0, 113, 157))';

// Scene state
let fieldsNoHoleVisible = true;
let holeVisible = false;
let fieldWithHoleVisible = false;
let holeRopeVisible = false;


function preload() {
  // Load the handPose model
  handPose = ml5.handPose();

  // Load character images
  girl = loadImage('assets/girl.png');
  girlMouthOpen = loadImage('assets/girlMouthOpen.png');
  girl2 = loadImage('assets/help.png');
  girl2MouthOpen = loadImage('assets/helpMouthOpen.png');

  // Load background images
  fieldNoHole = loadImage('assets/fieldNoHole.png');
  hole = loadImage('assets/hole.png');
  holeRope = loadImage('assets/hole.png');
  holelight = loadImage('assets/holeLight.png');
  holeRopeLight = loadImage('assets/holeRopeLight.png');
  grassHole = loadImage('assets/grassHole.png');
  fieldWithHole = loadImage('assets/fieldWithHole.png');

  // Load audio
  fieldBGM = document.getElementById('fieldBGM');
  caveBGM = document.getElementById('caveBGM');
  thudSFX = document.getElementById('thudSFX');
  ropeSFX = document.getElementById('ropeSFX');
  grassStepSFX = document.getElementById('grassStepSFX');

}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('divP5');
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  angleMode(DEGREES);

  // Setup video capture
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();
  video.flipped = true;

  // Start detecting hands from webcam
  handPose.detectStart(video, gotHands);

  // Setup button event listeners
  document.getElementById('fieldsListener').addEventListener('click', onclickFields);
  document.getElementById('fieldWithHoleListener').addEventListener('click', onclickFieldWithHole);
  document.getElementById('holeListener').addEventListener('click', onclickHole);
  document.getElementById('holeRopeListener').addEventListener('click', onclickHoleRope);
  document.getElementById('thudListener').addEventListener('click', onclickThud);
  document.getElementById('ropeListener').addEventListener('click', onclickRope);
  document.getElementById('muteListener').addEventListener('click', toggleMute);
  document.getElementById('grassStepListener').addEventListener('click', onclickGrassStep);


  // read site color from CSS variable so JS and CSS share one source of truth
  const cssSiteGreen = getComputedStyle(document.documentElement).getPropertyValue('--site-green').trim();
  if (cssSiteGreen) {
    SITE_GREEN_STR = cssSiteGreen;
    const nums = cssSiteGreen.match(/\d+/g);
    if (nums && nums.length >= 3) {
      SITE_GREEN_RGB = nums.slice(0,3).map(n => parseInt(n, 10));
    }
  }
}

function draw() {
  // Set canvas background color based on scene
  if (holeVisible || holeRopeVisible) {
    background(40); // Dark for cave
  } else {
    background(...SITE_GREEN_RGB); // Green for field (from CSS var)
  }

  // Draw background based on active scene
  if (fieldsNoHoleVisible) {
    image(fieldNoHole, 0, 0, width, height);
  } else if (fieldWithHoleVisible) {
    image(fieldWithHole, 0, 0, width, height);
  } else if (holeVisible) {
    image(hole, 0, 0, width, height);
  } else if (holeRopeVisible) {
    image(holeRope, 0, 0, width, height);
  }

  // Draw characters on detected hands
  if (hands.length > 0) {
    drawOnWrist();
  }
  if (hands.length > 1) {
    drawOnWrist2();
  }

  // Draw foreground overlays
  if (fieldWithHoleVisible) {
    image(grassHole, 0, 0, width, height);
  } else if (holeVisible) {
    image(holelight, 0, 0, width, height);
  } else if (holeRopeVisible) {
    image(holeRopeLight, 0, 0, width, height);
  }
}

// Callback function for when handPose outputs data
function gotHands(results) {
  hands = results;
}

// draw character on wrist based on hand pose
function drawOnWrist() {
  let tip = hands[0].middle_finger_mcp;
  let mcp = hands[0].wrist;
  let angle = atan2(tip.y - mcp.y, tip.x - mcp.x);

  push();
  translate(width - tip.x, tip.y);
  rotate(-angle - 90);

  if (hands[0].middle_finger_tip.y < hands[0].thumb_tip.y) {
    image(girlMouthOpen, -30, -50, 130, 200);
  } else {
    image(girl, -30, -50, 130, 200);
  }
  pop();
}


// Draw second character on second hand if detected
function drawOnWrist2() {
  let tip1 = hands[1].middle_finger_mcp;
  let mcp1 = hands[1].wrist;
  let angle = atan2(tip1.y - mcp1.y, tip1.x - mcp1.x);

  push();
  translate(width - tip1.x, tip1.y);
  rotate(-angle - 90);

  if (hands[1].middle_finger_tip.y < hands[1].thumb_tip.y) {
    image(girl2MouthOpen, -30, -50, 150, 200);
  } else {
    image(girl2, -30, -50, 150, 200);
  }
  pop();
}

// Scene management
function setBackground(scene) {
  fieldsNoHoleVisible = scene === 'fields';
  holeVisible = scene === 'hole';
  holeRopeVisible = scene === 'holeRope';
  fieldWithHoleVisible = scene === 'fieldWithHole';
  
  // Change page background color based on scene
  if (scene === 'hole' || scene === 'holeRope') {
    document.body.style.backgroundColor = 'rgb(48, 48, 48)'; // Dark color for cave scenes
    document.querySelector('.title').style.backgroundColor = 'rgb(48, 48, 48)';
    document.querySelector('.titleDescription').style.backgroundColor = 'rgb(48, 48, 48)';
    document.querySelector('.bottomBackground').style.backgroundColor = 'rgb(48, 48, 48)';
    // update button hover color variable for cave
    document.documentElement.style.setProperty('--button-hover', 'rgb(55, 55, 55)');

  } else {
    document.body.style.backgroundColor = SITE_GREEN_STR; // Green for field scenes (from CSS var)
    document.querySelector('.title').style.backgroundColor = 'rgb(0, 113, 157)';
    document.querySelector('.titleDescription').style.backgroundColor = 'rgb(0, 113, 157)';
    document.querySelector('.bottomBackground').style.backgroundColor = SITE_GREEN_STR;
    // update button hover color variable for field
    document.documentElement.style.setProperty('--button-hover', 'rgb(1, 87, 121)');
  }
}


// Button click handlers for scene changes, which also manage audio playback
function onclickFields() {
  setBackground('fields');
  playBGM(fieldBGM, caveBGM);
}

function onclickFieldWithHole() {
  setBackground('fieldWithHole');
  playBGM(fieldBGM, caveBGM);
}

function onclickHole() {
  setBackground('hole');
  playBGM(caveBGM, fieldBGM);
}

function onclickHoleRope() {
  setBackground('holeRope');
  playBGM(caveBGM, fieldBGM);
}

// Audio management
function playBGM(toPlaySound, toPauseSound) {
  toPlaySound.play();
  toPauseSound.pause();
}

// Sound effect handlers
function onclickThud() {
  thudSFX.play();
}

function onclickRope() {
  ropeSFX.play();
}

function onclickGrassStep() {
  grassStepSFX.play();
}

// Toggle mute/unmute for all audio elements
function toggleMute() {
  isMuted = !isMuted;
  [fieldBGM, caveBGM, thudSFX, ropeSFX, grassStepSFX].forEach(a => {
    if (a) a.muted = isMuted;
  });
  const btn = document.getElementById('muteListener');
  if (btn) btn.textContent = isMuted ? 'Unmute All [Key M]' : 'Mute All [Key M]';
}

// Keyboard controls
function keyPressed() {
  const key = keyCode;

  // Location controls
  if (key === 81) onclickFields(); // Q
  else if (key === 65) onclickFieldWithHole(); // A
  else if (key === 87) onclickHole(); // W
  else if (key === 83) onclickHoleRope(); // S
  // Sound controls
  else if (key === 90) onclickThud(); // Z
  else if (key === 88) onclickRope(); // X
  else if (key === 77) toggleMute(); // M
  else if (key === 67) onclickGrassStep(); // C
}


