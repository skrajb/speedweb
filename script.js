let words = "";
const urlParams = new URLSearchParams(window.location.search);
const exercise = urlParams.get('exercise');

if (exercise) {
    document.getElementById("test_text").innerText = decodeURIComponent(exercise);
    words = decodeURIComponent(exercise).split(/\s+/); // Split the exercise into words for typing
} else {
    document.getElementById("test_text").innerText = "Loading...";
    words = []; // Initialize words as an empty array if no exercise is provided
}

let currentChunkIndex = 0; // Index of the current chunk being displayed
let currentIndex = 0; // Index of the current word being typed
let correctWordsTyped = 0;
let wrongWords = 0;
let totalTypedWords = 0; // New variable to count all typed words
let timer = null;
let timeRemaining = 0; // Will be set based on the timer selection
let testCompleted = false;
let correctCharsTyped = 0; // New variable to count characters of correct words
let wrongCharsTyped = 0; // New variable to count characters of wrong words
let originalWords = []; // Store the original words for comparison
let allTypedWords = []; // Array to store all sets of typed words
let startTime = null; // New variable to track the start time
let lastDisplayedWords = ""; // Store the last displayed words
let backspaceCount = 0; // New variable to count backspaces
let typedChunks = []; // Array to store typed chunks
let timeTaken = 0;
let skipWords=0;
let extraWords=0;

// Calculate chunk size based on total words
const totalWords = words.length;
const chunkSize = Math.ceil(totalWords / 10); // Size of each chunk

const updateDisplayTime = () => {
    const minutes = Math.floor(timeRemaining / 60).toString().padStart(2, "0");
    const seconds = (timeRemaining % 60).toString().padStart(2, "0");
    document.getElementById("time_remaining").textContent = `Time Remaining: ${minutes}:${seconds}`;
};

// Disable right-click and specific keyboard shortcuts
document.addEventListener('contextmenu', function(event) {
    event.preventDefault();
});

// Disable specific keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Disable Ctrl key
    if (event.ctrlKey) {
        event.preventDefault();
    }

    // Disable Ctrl + U
    if (event.ctrlKey && event.key === 'u') {
        event.preventDefault();
    }
    // Disable Ctrl + P
    if (event.ctrlKey && event.key === 'p') {
        event.preventDefault();
    }
    // Disable Ctrl + C
    if (event.ctrlKey && event.key === 'c') {
        event.preventDefault();
    }

    // Disable F12
    if (event.key === 'F12') {
        event.preventDefault();
    }
});

window.onload = function() {
    resetTest(); // Call resetTest to initialize values
};

const resetTest = () => {
    clearInterval(timer);
    timer = null;
    timeRemaining = parseInt(document.getElementById("timer").value); // Set time based on user selection
    currentIndex = 0; // Reset current index
    correctWordsTyped = 0;
    wrongWords = 0;
    totalTypedWords = 0; // Reset total typed words
    correctCharsTyped = 0; // Reset correct characters count
    wrongCharsTyped = 0; // Reset wrong characters count
    document.getElementById("typed_text").value = ""; // Clear the input on reset
    document.getElementById("results").innerHTML = "";
    document.getElementById("test_text").innerHTML = ""; // Clear previous text
    updateDisplayTime();
    updateLiveResults(); // Reset live results display
    displayNextWords(); // Display the first set of words
};

const displayNextWords = () => {
    const nextWords = words.slice(currentIndex, currentIndex + chunkSize).join(" "); // Use chunkSize instead of 40
    originalWords.push(nextWords); // Store the original words as a chunk
    lastDisplayedWords = nextWords; // Update the last displayed words
    document.getElementById("test_text").innerHTML = `<div class="word-set">${nextWords}</div>`; // Replace previous words
    updateCurrentChunkDisplay(); // Update the chunk display when new words are shown
};

const startTimer = () => {
    if (!timer) {
        startTime = Date.now(); // Record the start time
        timer = setInterval(() => {
            if (timeRemaining > 0) {
                timeRemaining--;
                updateDisplayTime();
            } else {
                clearInterval(timer);
                timer = null;
                testCompleted = true;
                handleTestCompletion(); // Handle test completion
            }
        }, 1000);
    }
};

const handleTestCompletion = () => {
    const typedText = document.getElementById("typed_text").value.trim();
    const typedWords = typedText.split(" ").filter(word => word.length > 0);
    const currentWords = words.slice(currentIndex, currentIndex + chunkSize);

    // Store the typed words for the current chunk
    allTypedWords.push(typedWords.join(" "));

    let correctCount = 0;
    let wrongCount = 0;
    let correctChars = 0;
    let wrongChars = 0;
    let skipCount = 0;
    let extraCount = 0;

    let i = 0; // Index for currentWords
    let j = 0; // Index for typedWords

    while (i < currentWords.length || j < typedWords.length) {
        if (j >= typedWords.length) {
            // If there are no more typed words, count remaining current words as skipped
            skipCount += currentWords.length - i;
            break; // Exit loop
        } else if (i >= currentWords.length) {
            // If there are no more current words, count remaining typed words as extra
            extraCount += typedWords.length - j;
            wrongChars += typedWords.slice(j).join(" ").length; // Count characters of extra words
            break; // Exit loop
        } else if (typedWords[j] === currentWords[i]) {
            // Correct word
            correctCount++;
            correctChars += typedWords[j].length;
            i++;
            j++;
        } else {
            // Check for skip or extra
            if (j + 1 < typedWords.length && typedWords[j + 1] === currentWords[i]) {
                // The next typed word matches the current word, so this one is extra
                extraCount++;
                wrongChars += typedWords[j].length;
                j++;
            } else if (i + 1 < currentWords.length && typedWords[j] === currentWords[i + 1]) {
                // The current typed word matches the next current word, so this one is skipped
                skipCount++;
                i++;
            } else {
                // Incorrect word
                wrongCount++;
                wrongChars += typedWords[j].length;
                j++;
            }
        }
    }

    // Update global counts
    correctWordsTyped += correctCount;
    wrongWords += wrongCount;
    totalTypedWords += typedWords.length;
    correctCharsTyped += correctChars;
    wrongCharsTyped += wrongChars;
    skipWords += skipCount;
    extraWords += extraCount;

    document.getElementById("highlighted_output").innerHTML = highlightTypedText(currentWords, typedWords);
    showResults();
};
const showResults = () => {		
    const totalTypedWords = correctWordsTyped + wrongWords; // Calculate total typed words
    const accuracy = totalTypedWords > 0 ? ((correctWordsTyped / totalTypedWords) * 100).toFixed(2) : 0;

    // Calculate typing speed
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000); // Time in seconds
    const typingSpeed = (((correctCharsTyped / 5) / (elapsedTime / 60))).toFixed(2); // Words per minute

    // Prepare data to send to results page
    const originalWordsString = JSON.stringify(originalWords);
    const typedWordsString = JSON.stringify(allTypedWords); // Include all typed words

    // Construct the URL for the results page
    const resultsUrl = `results.html?exercise=${encodeURIComponent(words.join(" "))}&originalWords=${encodeURIComponent(originalWordsString)}&typedWords=${encodeURIComponent(typedWordsString)}&correctCount=${correctWordsTyped}&wrongCount=${wrongWords}&correctChars=${correctCharsTyped}&wrongChars=${wrongCharsTyped}&typingSpeed=${typingSpeed}&accuracy=${accuracy}&skipWords=${skipWords}&extraWords=${extraWords}&backspaceCount=${backspaceCount}&elapsedTime=${elapsedTime}`;

    // Redirect to results page with parameters
    window.location.href = resultsUrl;
};
const updateLiveResults = () => {
    document.getElementById("live_results").innerHTML = `<br>
       <b> <div style="Color:green"><table width="100%">
       <tr><th>Correct Words:<b style="Color:green;text-align:center"> ${correctWordsTyped}</b></th>
       <th><b>Incorrect Words: <b style="Color:red;text-align:center">${wrongWords}</b></b></th>
       <th><b>Total Typed Words: ${correctWordsTyped + wrongWords}</b></th></tr>
	 </table></div>
    `;
};

// Ensure typedChunks is updated when the user types
// Update the input event listener for typed_text
document.getElementById("typed_text").addEventListener("input", (e) => {
    const typedText = e.target.value.trim();
    const currentWords = words.slice(currentIndex, currentIndex + chunkSize); // Get the current chunk of words

    // Start the timer when the user starts typing
    if (!timer) {
        startTimer();
    }

    // Update live results
    updateLiveResults();

    // Store the entire typed text for this chunk
    if (typedText) {
        const chunkIndex = Math.floor(currentIndex / chunkSize);
        typedChunks[chunkIndex] = typedText;
    }
});

// Modify the keydown event listener to navigate through typed chunks
document.addEventListener('keydown', function(event) {
    if (event.key === 'ArrowUp') {
        if (currentChunkIndex > 0) {
            currentChunkIndex--;
            updateCurrentChunkDisplay(); // Update the display after changing the index
            currentIndex = currentChunkIndex * chunkSize; // Update currentIndex based on chunk index
            displayNextWords(); // Display the original words for the current chunk
            
            // Display the typed text for the current chunk
            document.getElementById("typed_text").value = typedChunks[currentChunkIndex] || ""; // Show typed text for the current chunk
            updateLiveResults();
        }
    } else if (event.key === 'ArrowDown') {
        if (currentChunkIndex < typedChunks.length - 1) {
            currentChunkIndex++;
            updateCurrentChunkDisplay(); // Update the display after changing the index
            currentIndex = currentChunkIndex * chunkSize; // Update currentIndex based on chunk index
            displayNextWords(); // Display the original words for the current chunk
            
            // Display the typed text for the current chunk
            document.getElementById("typed_text").value = typedChunks[currentChunkIndex] || ""; // Show typed text for the current chunk
            updateLiveResults();
        }
    }
});

// Function to update the current chunk display
function updateCurrentChunkDisplay() {
    const totalChunks = Math.ceil(words.length / chunkSize); // Assuming chunkSize words per chunk
    document.getElementById('current_chunk_number').innerText = `Chunk ${currentChunkIndex + 1}`; // Show current chunk number
}

// Event listeners for typing input
document.getElementById("typed_text").addEventListener("input", (e) => {
    const typedText = e.target.value.trim();
    const currentWords = words.slice(currentIndex, currentIndex + chunkSize); // Get the current chunk of words

    // Start the timer when the user starts typing
    if (!timer) {
        startTimer();
    }

    // Update live results
    updateLiveResults();

    // Store the entire typed text for this chunk
    if (typedText) {
        const chunkIndex = Math.floor(currentIndex / chunkSize); // Calculate the chunk index based on the current index
        allTypedWords[chunkIndex] = typedText; // Store typed text for the current chunk
    }
});

// Handle backspace count
document.getElementById("typed_text").addEventListener("keydown", (e) => {
    const allowBackspace = document.getElementById("backspace_toggle").checked; // Check if backspace is allowed
    const typedText = document.getElementById("typed_text").value; // Get the current input value

    if (e.key === "Backspace") {
        if (!allowBackspace) {
            // If backspace is not allowed, check the last character
            if (typedText.length > 0 && typedText[typedText.length - 1] === ' ') {
                e.preventDefault(); // Prevent backspace if the last character is a space
            } else {
                backspaceCount++; // Increment backspace count if allowed
            }
        } else {
            backspaceCount++; // Increment backspace count if allowed
        }
    }
});

// Handle Enter key functionality
document.getElementById("typed_text").addEventListener("keydown", (e) => {
    const typedText = document.getElementById("typed_text").value; // Get the current input value
    const typedWords = typedText.trim().split(" ").filter(word => word.length > 0); // Filter out empty strings
    const currentWords = words.slice(currentIndex, currentIndex + chunkSize); // Get the current chunk of words

    // Allow backspace functionality only if the last character is not a space
    if (e.key === "Backspace") {
        if (typedText.length > 0) {
            if (typedText[typedText.length - 1] !== ' ') {
                return; // Allow backspace
            }
        }
    }

    // Check if the pressed key is the up or down arrow key
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        return; // Exit the function early
    }

    // Handle Enter key functionality
    if (e.key === "Enter") {
        // Check if at least 23 words have been typed
        if (typedWords.length < 23) {
            e.preventDefault(); // Prevent the Enter key action
            alert("Please type at least 23 words before submitting."); // Optional: Alert the user
            return; // Exit the function
        }

        // Compare typed words with current words
        let correctCount = 0;
        let wrongCount = 0;

        // Count correct and wrong words
        for (let i = 0; i < typedWords.length; i++) {
            if (i < currentWords.length && typedWords[i] === currentWords[i]) {
                correctCount++;
                correctCharsTyped += typedWords[i].length; // Count characters of the correct word excluding spaces
            } else {
                wrongCount++;
                wrongCharsTyped += typedWords[i].length; // Count characters of the wrong word excluding spaces
            }
        }

        // Store the typed words for the current chunk
        allTypedWords.push(typedText); // Store all typed words for the current chunk

        currentChunkIndex++;
        updateLiveResults();  

        // Update counts
        correctWordsTyped += correctCount;
        wrongWords += wrongCount;
        totalTypedWords++; // Increment total typed words by 1

        // Move to the next set of words
        currentIndex += chunkSize; // Increment by chunkSize to move to the next set of words
        document.getElementById("typed_text").value = ""; // Clear the input field

        // Display the next set of words or show results if no more words
        if (currentIndex < words.length) {
            displayNextWords(); // Display the next set of words
        } else {
            // If no more words, show results
            showResults();
        }

        // Update live results
        updateLiveResults();
    }
});
// Event listener for the submit button
document.getElementById("submit_button").addEventListener("click", () => {
    if (!testCompleted) { // Check if the test is not already completed
        // Handle the current chunk before showing results
        const typedText = document.getElementById("typed_text").value.trim();
        const typedWords = typedText.split(" ").filter(word => word.length > 0); // Split and filter out empty strings
        const currentWords = words.slice(currentIndex, currentIndex + chunkSize); // Get the current chunk of words

        // Compare typed words with current words
        let correctCount = 0;
        let wrongCount = 0;

        // Count correct and wrong words
        for (let i = 0; i < typedWords.length; i++) {
            if (i < currentWords.length && typedWords[i] === currentWords[i]) {
                correctCount++;
                correctCharsTyped += typedWords[i].replace(/\s/g, '').length; // Count characters of the correct word excluding spaces
            } else {
                wrongCount++;
                wrongCharsTyped += typedWords[i].replace(/\s/g, '').length; // Count characters of the wrong word excluding spaces
            }	
        }

        // Update counts
        correctWordsTyped += correctCount;
        wrongWords += wrongCount;
        totalTypedWords++; // Increment total typed words by 1

        showResults(); // Call the function to show results
    }
});

// Add this code to ensure the restart button works
document.getElementById("restart_button").addEventListener("click", resetTest);
// Reset the test on page load
resetTest();