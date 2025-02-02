// Load environment variables from .env
require('dotenv').config();

const express = require('express');
const multer  = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const axios = require('axios');  // For making HTTP requests to Ollama
const { createClient } = require('@deepgram/sdk');

const app = express();
const port = 3000;

app.use(cors()); // This enables CORS for all origins

// Initialize the Deepgram client using your API key
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Ensure the output directory exists for saving transcripts
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Configure multer storage to save each file with a unique name.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Save file with its original extension (e.g., .webm)
    cb(null, 'audio-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Function to transcribe an audio file using Deepgram
async function transcribeAudio(audioFilePath) {
  try {
    // Check if the audio file exists
    if (!fs.existsSync(audioFilePath)) {
      console.error("Audio file not found at:", audioFilePath);
      return null;
    }

    // Create a read stream for the audio file
    const fileStream = fs.createReadStream(audioFilePath);

    // Call the Deepgram API for pre-recorded transcription.
    // The JSON response includes a "results" key containing the transcription details.
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      fileStream,
      {
        model: "nova-2",
        smart_format: true,
        punctuate: true
      }
    );

    // If an error occurred, log it and return null.
    if (error) {
      console.error("Deepgram error:", error);
      return null;
    }

    // Extract only the transcript text.
    // It is located at: result.results.channels[0].alternatives[0].transcript
    let transcript = "";
    if (
      result &&
      result.results &&
      result.results.channels &&
      result.results.channels[0] &&
      result.results.channels[0].alternatives &&
      result.results.channels[0].alternatives[0] &&
      result.results.channels[0].alternatives[0].transcript
    ) {
      transcript = result.results.channels[0].alternatives[0].transcript;
    } else {
      console.error("Transcript not found in the response.");
      transcript = "Transcript not available";
    }

    console.log("Transcript:", transcript);

    // Define an output file path using the same base name as the uploaded file.
    const baseName = path.basename(audioFilePath, path.extname(audioFilePath));
    const outputFilePath = path.join(outputDir, baseName + '.txt');
    fs.writeFileSync(outputFilePath, transcript, "utf8");
    console.log("Transcript saved to:", outputFilePath);

    return transcript;
  } catch (err) {
    console.error("Error transcribing audio:", err);
    return null;
  }
}

// Endpoint to receive audio file uploads.
app.post('/upload', upload.single('audio'), async (req, res) => {
  console.log('Received audio file:', req.file);
  
  // Get the full path of the uploaded file
  const filePath = req.file.path;

  // Transcribe the audio file
  const transcript = await transcribeAudio(filePath);

  // ============================
  // Generate notes from the transcript using the local Ollama API
  // ============================
  // Format the prompt: instruct DeepSeek to summarize and generate bullet-point notes.
  const prompt = `Summarize the following text and make points of notes:\n\n${transcript}`;

  // Define the local Ollama API endpoint. (Ensure Ollama is running using `ollama serve`.)
  const ollamaUrl = 'http://localhost:11434/api/chat';
  const payload = {
    model: 'deepseek-r1:1.5b', // Change to your desired model version if needed.
    messages: [{ role: 'user', content: prompt }],
    stream: false
  };

  let notesSummary;
  try {
    const response = await axios.post(ollamaUrl, payload);
    // Extract the content from the response; adjust the path as needed.
    notesSummary = response.data.message?.content || 'No summary returned';
    // Remove any <think>...</think> section if present
    notesSummary = notesSummary.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  } catch (error) {
    console.error('Error summarizing text:', error);
    notesSummary = 'Error generating notes';
  }

  // Create a "notes" directory if it does not exist.
  const notesDir = path.join(__dirname, 'notes');
  if (!fs.existsSync(notesDir)) {
    fs.mkdirSync(notesDir);
  }

  // Define the filename for the notes file using the base name of the audio file.
  const baseName = path.basename(filePath, path.extname(filePath));
  const notesFilePath = path.join(notesDir, baseName + '_notes.txt');
  fs.writeFileSync(notesFilePath, notesSummary, "utf8");
  console.log("Notes saved to:", notesFilePath);

  // Return the filename, transcript, and generated notes in the response
  res.json({
    success: true,
    message: 'Audio file saved, transcribed, and notes generated successfully!',
    file: req.file.filename,
    transcript: transcript,
    notes: notesSummary
  });
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
