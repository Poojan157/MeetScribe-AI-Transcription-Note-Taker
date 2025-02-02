# MeetScribe: AI Transcription & Note Taker

MeetScribe is a powerful solution that integrates a Chrome extension and a backend server to capture audio from Google Meet sessions, transcribe the audio using the Deepgram API, and generate AI-powered notes using a locally installed Deep-seek Ollama instance.

## Table of Contents

- [Overview](#overview)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
  - [Backend Server Setup](#backend-server-setup)
  - [Chrome Extension Setup](#chrome-extension-setup)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Overview

MeetScribe helps you effortlessly record and transcribe Google Meet sessions. When you click the extension icon:
- **Recording starts:** The extension icon turns red.
- **Recording stops:** Clicking again turns the icon white. The recorded audio is then sent to your backend server.
- **Backend Processing:** The server saves the audio in an `uploads` folder, generates a transcript using the Deepgram API (stored in the `output` folder), and creates AI-powered bullet-point notes using Deep-seek Ollama (saved in the `notes` folder).

## Repository Structure

This repository contains two main directories:
- **backend/**: Contains the Node.js server responsible for receiving audio files, performing transcription, and generating notes.
- **extension/**: Contains the Chrome extension code (including `manifest.json`, `service-worker.js`, `offscreen.html`, `offscreen.js`, and the icons).

## Prerequisites

Before you begin, ensure you have the following:
- [Node.js](https://nodejs.org/) installed.
- A valid [Deepgram API](https://developers.deepgram.com/) key.
- [Deep-seek Ollama](https://ollama.com/) installed locally and running (start it with `ollama serve`).
- Google Chrome version 116 or later.

## Setup Instructions

### Backend Server Setup

1. **Navigate to the backend folder:**
    ```bash
    cd backend
    ```

2. **Install dependencies:**
    ```bash
    npm install
    ```

3. **Configure Environment Variables:**
   - Create a `.env` file in the `backend` folder with the following content:
     ```
     DEEPGRAM_API_KEY=your_deepgram_api_key
     ```
     
4. **Start the Server:**
    ```bash
    node server.js
    ```
   The server will run at [http://localhost:3000](http://localhost:3000).

### Chrome Extension Setup

1. **Open Chrome Extensions Page:**
   - Go to `chrome://extensions` in your Chrome browser.

2. **Enable Developer Mode:**
   - Toggle the "Developer mode" switch at the top right of the page.

3. **Load the Unpacked Extension:**
   - Click on the **Load unpacked** button and select the `extension` folder from your repository.

4. **Using the Extension:**
   - The extension icon will appear in your toolbar.
   - Click the icon to start recording (the icon will change to red).
   - Click again to stop recording (the icon will revert to white). Once stopped, the audio file will be automatically uploaded to your backend server for transcription and note generation.

## Usage

1. **Start the Backend Server:** Ensure your backend is running.
2. **Load the Chrome Extension:** As described above.
3. **Join a Google Meet Session:** The extension is set up to work on `https://meet.google.com/*`.
4. **Record and Process Audio:** Click the extension icon to record and then stop. Check the following folders in the `backend` directory:
   - `uploads/`: For saved audio files.
   - `output/`: For generated transcripts.
   - `notes/`: For AI-generated bullet-point notes.

## Troubleshooting

- **Backend Not Running:** Verify Node.js is installed and that you have configured the `.env` file with the correct Deepgram API key.
- **Extension Not Loading:** Make sure you have enabled Developer Mode in Chrome and selected the correct `extension` folder.
- **Deep-seek Ollama Issues:** Ensure Ollama is running with `ollama serve` before stopping a recording.

## Contributing

Contributions are welcome! If you have suggestions or bug fixes, please open an issue or submit a pull request.
