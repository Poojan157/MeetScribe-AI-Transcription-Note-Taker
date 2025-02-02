chrome.runtime.onMessage.addListener(async (message) => {
    if (message.target === 'offscreen') {
      switch (message.type) {
        case 'start-recording':
          startRecording(message.data);
          break;
        case 'stop-recording':
          stopRecording();
          break;
        default:
          throw new Error('Unrecognized message type: ' + message.type);
      }
    }
  });
  
  let recorder;
  let data = [];
  
  async function startRecording(streamId) {
    if (recorder?.state === 'recording') {
      throw new Error('Recording is already in progress.');
    }
  
    // Request only audio from the tab.
    const media = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId
        }
      }
    });
  
    // (Optional) Play the captured audio so the user can hear it.
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(media);
    source.connect(audioContext.destination);
  
    // Start recording the audio.
    recorder = new MediaRecorder(media, { mimeType: 'audio/webm' });
    recorder.ondataavailable = (event) => data.push(event.data);
    recorder.onstop = () => {
      const blob = new Blob(data, { type: 'audio/webm' });
      // Upload the recorded audio to the backend.
      uploadAudio(blob);
      
      // Reset state.
      recorder = undefined;
      data = [];
    };
    recorder.start();
  
    // Mark the recording state in the URL (to help communicate state to the service worker).
    window.location.hash = 'recording';
  }
  
  async function stopRecording() {
    if (recorder && recorder.state === 'recording') {
      recorder.stop();
      // Stop all media tracks.
      recorder.stream.getTracks().forEach((track) => track.stop());
    }
    window.location.hash = '';
  }
  
  function uploadAudio(blob) {
    const formData = new FormData();
    formData.append('audio', blob, 'recording.webm');
    
    // Replace the URL below with your backend endpoint if different.
    fetch('http://localhost:3000/upload', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      console.log('Audio upload successful:', data);
    })
    .catch(error => {
      console.error('Error uploading audio:', error);
    });
  }
  