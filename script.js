// --- DOM Elements ---
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const startScreen = document.getElementById('start-screen');
const monitoringScreen = document.getElementById('monitoring-screen');
const speedDisplay = document.getElementById('speedDisplay');
const lastComment = document.getElementById('lastComment');
const timerDisplay = document.getElementById('timer');

// --- Configuration ---
const checkInterval = 20 * 1000; // 30 seconds in milliseconds
const imageURL = 'https://placehold.co/1000x1000/000000/FFFFFF?text=Test-File'; // A 1MB test file
const imageSizeInBytes = 1000 * 1000; // The size of the file in bytes

// --- CUSTOM AUDIO TIER CONFIGURATION ---
// This is where you map speed ranges to your own audio files.
// Use relative paths to your local audio files (e.g., "sounds/your-file.mp3")
const speedTiers = [
    {
        minSpeed: 0,
        maxSpeed: 1,
        comment: "Are you serious right now?",
        // Replace with your own audio file URL or local path
        audioSrc: "sounds/error.mp3"
    },
    {
        minSpeed: 1,
        maxSpeed: 2,
        comment: "My grandma's dial-up was faster.",
         // Replace with your own audio file URL or local path
        audioSrc: "sounds/pavani.mp3"
    },
    {
        minSpeed: 2,
        maxSpeed: 5,
        comment: "It's... acceptable.",
         // Replace with your own audio file URL or local path
        audioSrc: "https://www.myinstants.com/media/sounds/wow_9.mp3"
    },
    {
        minSpeed: 5,
        maxSpeed: 20,
        comment: "Okay, now we're talking!",
         // Replace with your own audio file URL or local path
        audioSrc: "https://www.myinstants.com/media/sounds/nice-shot.mp3"
    },
    {
        minSpeed: 20,
        maxSpeed: Infinity, // Catches everything above 200
        comment: "UNLIMITED POWER!",
         // Replace with your own audio file URL or local path
        audioSrc: "https://www.myinstants.com/media/sounds/holy-moly-vine-sound-effect.mp3"
    }
];

let speedCheckIntervalId = null;
let countdownIntervalId = null;

// --- Core Functions ---

/**
 * Finds the correct tier configuration for a given speed.
 * @param {number} speedMbps - The measured speed in Mbps.
 * @returns {object|null} The matching tier object or null if not found.
 */
function findTierForSpeed(speedMbps) {
    return speedTiers.find(tier => speedMbps >= tier.minSpeed && speedMbps < tier.maxSpeed);
}

/**
 * Plays the audio and updates the comment for a given speed.
 * @param {number} speedMbps - The measured speed in Mbps.
 */
function playMemeAudio(speedMbps) {
    const tier = findTierForSpeed(speedMbps);
    if (!tier) {
        console.warn(`No audio tier found for speed: ${speedMbps} Mbps`);
        lastComment.textContent = "No comment for this speed.";
        return;
    }

    // Update the on-screen comment
    lastComment.textContent = `"${tier.comment}"`;

    // Play the audio file
    if (tier.audioSrc) {
        const audio = new Audio(tier.audioSrc);
        audio.play().catch(error => {
            console.error("Error playing audio:", error);
            // This can happen if the user hasn't interacted with the page yet.
            lastComment.textContent = "Could not play audio. Please click the page and try again.";
        });
    }
}

/**
 * Measures the download speed by timing how long it takes to fetch a file.
 */
async function measureSpeed() {
    try {
        speedDisplay.textContent = '...';
        const startTime = new Date().getTime();
        const response = await fetch(imageURL + '&t=' + startTime);
        await response.blob();
        const endTime = new Date().getTime();
        
        // Calculate duration *before* using it
        const durationInSeconds = (endTime - startTime) / 1000;

        // Check if the download was too fast to measure accurately
        if (durationInSeconds < 0.1) {
            console.warn("Download was too fast to measure accurately. Assuming very high speed.");
            updateUI(500);
            return;
        }
        
        const speedBps = (imageSizeInBytes * 8) / durationInSeconds;
        const speedMbps = (speedBps / (1024 * 1024)).toFixed(2);
        updateUI(speedMbps);

    } catch (error) {
        console.error("Error measuring speed:", error);
        speedDisplay.textContent = 'Error';
        playMemeAudio(0); // Play the slowest tier audio on error
    }
}

/**
 * Updates the UI elements with the new speed and triggers the audio meme.
 * @param {number} speedMbps - The measured speed in Mbps.
 */
function updateUI(speedMbps) {
    speedDisplay.textContent = speedMbps;
    playMemeAudio(speedMbps);
}

/**
 * Starts the countdown timer for the next check.
 */
function startCountdown() {
    let timeLeft = checkInterval / 1000;
    const updateTimer = () => {
        const minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;
        seconds = seconds < 10 ? '0' + seconds : seconds;
        timerDisplay.textContent = `${minutes}:${seconds}`;
        timeLeft--;
        if (timeLeft < 0) {
            timeLeft = (checkInterval / 1000) - 1; // Reset for the next interval
        }
    };
    updateTimer();
    countdownIntervalId = setInterval(updateTimer, 1000);
}

// --- Event Listeners & Initial Setup ---

startButton.addEventListener('click', () => {
    console.log("Starting monitoring...");
    startScreen.classList.add('hidden');
    monitoringScreen.classList.remove('hidden');
    measureSpeed();
    speedCheckIntervalId = setInterval(measureSpeed, checkInterval);
    startCountdown();
});

stopButton.addEventListener('click', () => {
    console.log("Stopping monitoring.");
    if (speedCheckIntervalId) clearInterval(speedCheckIntervalId);
    if (countdownIntervalId) clearInterval(countdownIntervalId);
    speedCheckIntervalId = null;
    countdownIntervalId = null;
    startScreen.classList.remove('hidden');
    monitoringScreen.classList.add('hidden');
    speedDisplay.textContent = '--';
    lastComment.textContent = '"Monitoring paused."';
});
