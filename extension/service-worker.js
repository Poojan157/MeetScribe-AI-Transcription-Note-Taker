chrome.action.onClicked.addListener(async (tab) => {
    const existingContexts = await chrome.runtime.getContexts({});
    let recording = false;
  
    const offscreenDocument = existingContexts.find(
      (c) => c.contextType === 'OFFSCREEN_DOCUMENT'
    );
  
    // If no offscreen document exists, create one.
    if (!offscreenDocument) {
      await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['USER_MEDIA'],
        justification: 'Recording audio from chrome.tabCapture API'
      });
    } else {
      // Determine recording state from URL hash.
      recording = offscreenDocument.documentUrl.endsWith('#recording');
    }
  
    if (recording) {
      chrome.runtime.sendMessage({
        type: 'stop-recording',
        target: 'offscreen'
      });
      chrome.action.setIcon({ path: 'icons/not-recording.png' });
      return;
    }
  
    // Get a MediaStream for the active tab.
    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: tab.id
    });
  
    // Send the stream ID to the offscreen document to start recording.
    chrome.runtime.sendMessage({
      type: 'start-recording',
      target: 'offscreen',
      data: streamId
    });
  
    chrome.action.setIcon({ path: 'icons/recording.png' });
  });
  