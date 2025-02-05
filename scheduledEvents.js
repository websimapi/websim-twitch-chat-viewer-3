(function() {
  const localStorageKey = 'scheduledEvents';
  let scheduledEvents = [];

  // Unit multipliers (in milliseconds)
  const unitMultipliers = {
    Minutes: 60000,
    Hours: 3600000,
    Days: 86400000,
    Weeks: 604800000,
    Months: 2592000000, // approximate (30 days)
    Years: 31536000000
  };

  // Variables to track unsaved changes for Scheduled Events modal
  let unsavedScheduledChanges = false;
  let unsavedPromptedScheduled = false;

  // Load scheduled events from localStorage
  function loadScheduledEvents() {
    const stored = localStorage.getItem(localStorageKey);
    if (stored) {
      try {
        scheduledEvents = JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing scheduled events:', e);
        scheduledEvents = [];
      }
    }
  }

  // Save scheduled events to localStorage
  function saveScheduledEvents() {
    localStorage.setItem(localStorageKey, JSON.stringify(scheduledEvents));
    unsavedScheduledChanges = false;
    unsavedPromptedScheduled = false;
  }

  // Helper: Format timestamp (ms) to "YYYY-MM-DDTHH:mm" for input[type="datetime-local"]
  function formatTimestampForInput(ts) {
    const d = new Date(ts);
    const pad = n => n.toString().padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // Helper: Parse datetime-local input value to timestamp (ms)
  function parseInputToTimestamp(val) {
    return new Date(val).getTime();
  }

  // Trigger the scheduled event based on type
  function triggerEvent(event) {
    if (event.type === 'tts' && event.message) {
      window.ttsManager.queueCustomTTSMessage(event.message, event.voice || '', 'Scheduled');
    } else if (event.type === 'sound' && event.audioData) {
      window.ttsManager.playCustomAudio(event.audioData);
    }
  }

  // Create or update the Scheduled Events UI inside the modal
  function populateScheduledEventsUI() {
    const listDiv = document.getElementById('scheduled-events-list');
    listDiv.innerHTML = '';

    if (scheduledEvents.length === 0) {
      listDiv.innerHTML = "<p style='font-size:1em; text-align:center; color:#666; margin:10px 0;'>No scheduled events defined.</p>";
      return;
    }

    scheduledEvents.forEach((event, index) => {
      const container = document.createElement('div');
      container.className = 'scheduled-event-item';

      // Type selection (TTS or Sound)
      const typeSelect = document.createElement('select');
      typeSelect.innerHTML = `
        <option value="tts" ${event.type === 'tts' ? 'selected' : ''}>TTS</option>
        <option value="sound" ${event.type === 'sound' ? 'selected' : ''}>Sound</option>
      `;
      typeSelect.addEventListener('change', (e) => {
        event.type = e.target.value;
        // Toggle visibility of TTS vs Sound specific inputs
        ttsDetails.style.display = event.type === 'tts' ? 'block' : 'none';
        soundDetails.style.display = event.type === 'sound' ? 'block' : 'none';
        unsavedScheduledChanges = true;
      });
      container.appendChild(document.createTextNode('Type: '));
      container.appendChild(typeSelect);
      container.appendChild(document.createElement('br'));

      // Scheduled Time input
      const timeLabel = document.createElement('label');
      timeLabel.textContent = 'Scheduled Time: ';
      const timeInput = document.createElement('input');
      timeInput.type = 'datetime-local';
      timeInput.value = formatTimestampForInput(event.scheduledTime);
      timeInput.addEventListener('change', (e) => {
        event.scheduledTime = parseInputToTimestamp(e.target.value);
        unsavedScheduledChanges = true;
      });
      timeLabel.appendChild(timeInput);
      container.appendChild(timeLabel);
      container.appendChild(document.createElement('br'));

      // Repeat interval: numeric input + unit dropdown.
      const repeatLabel = document.createElement('label');
      repeatLabel.textContent = 'Repeat Interval (leave empty for one-time): ';
      const repeatNumber = document.createElement('input');
      repeatNumber.type = 'number';
      repeatNumber.style.width = '70px';
      repeatNumber.value = event.repeatInterval ? event.repeatValue || '' : '';
      repeatNumber.placeholder = "Value";
      repeatNumber.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val) && unitSelect.value in unitMultipliers) {
          event.repeatInterval = val * unitMultipliers[unitSelect.value];
          event.repeatValue = val;
          event.repeatUnit = unitSelect.value;
        } else {
          event.repeatInterval = 0;
          delete event.repeatValue;
          delete event.repeatUnit;
        }
        unsavedScheduledChanges = true;
      });
      repeatLabel.appendChild(repeatNumber);
      const unitSelect = document.createElement('select');
      unitSelect.innerHTML = Object.keys(unitMultipliers).map(unit => `<option value="${unit}" ${(event.repeatUnit === unit) ? 'selected' : ''}>${unit}</option>`).join('');
      unitSelect.addEventListener('change', (e) => {
        const val = parseInt(repeatNumber.value);
        if (!isNaN(val)) {
          event.repeatInterval = val * unitMultipliers[e.target.value];
          event.repeatValue = val;
          event.repeatUnit = e.target.value;
        }
        unsavedScheduledChanges = true;
      });
      repeatLabel.appendChild(unitSelect);
      container.appendChild(repeatLabel);
      container.appendChild(document.createElement('br'));

      // Container for TTS Details
      const ttsDetails = document.createElement('div');
      ttsDetails.style.display = event.type === 'tts' ? 'block' : 'none';
      // TTS Message Input
      const messageLabel = document.createElement('label');
      messageLabel.textContent = 'TTS Message: ';
      const messageInput = document.createElement('input');
      messageInput.type = 'text';
      messageInput.placeholder = 'Enter TTS message';
      messageInput.value = event.message || '';
      messageInput.addEventListener('input', (e) => {
        event.message = e.target.value;
        unsavedScheduledChanges = true;
      });
      messageLabel.appendChild(messageInput);
      ttsDetails.appendChild(messageLabel);
      ttsDetails.appendChild(document.createElement('br'));
      // Voice selection for TTS
      const voiceLabel = document.createElement('label');
      voiceLabel.textContent = 'Voice: ';
      const voiceSelect = document.createElement('select');
      let voices = window.speechSynthesis.getVoices();
      if (!voices.length) {
        voiceSelect.innerHTML = `<option>Loading voices...</option>`;
      } else {
        voiceSelect.innerHTML = voices.map(voice => `<option value="${voice.name}" ${(event.voice === voice.name) ? 'selected' : ''}>${voice.name} (${voice.lang})</option>`).join('');
      }
      voiceSelect.addEventListener('change', (e) => {
        event.voice = e.target.value;
        unsavedScheduledChanges = true;
      });
      voiceLabel.appendChild(voiceSelect);
      ttsDetails.appendChild(voiceLabel);
      container.appendChild(ttsDetails);

      // Container for Sound Details
      const soundDetails = document.createElement('div');
      soundDetails.style.display = event.type === 'sound' ? 'block' : 'none';
      // Audio file display and input
      const audioLabel = document.createElement('span');
      audioLabel.style.fontSize = '0.9em';
      audioLabel.textContent = event.audioFileName ? event.audioFileName : (event.audioData ? 'File loaded' : 'No file');
      soundDetails.appendChild(audioLabel);
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'audio/*';
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function(ev) {
            const result = ev.target.result;
            event.audioData = result;
            event.audioFileName = file.name;
            audioLabel.textContent = file.name;
            const audio = new Audio(result);
            audio.load();
            event.preloadedAudio = audio;
            unsavedScheduledChanges = true;
          };
          reader.readAsDataURL(file);
        }
      });
      soundDetails.appendChild(fileInput);
      container.appendChild(soundDetails);

      // Delete button for this event
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', () => {
        scheduledEvents.splice(index, 1);
        saveScheduledEvents();
        populateScheduledEventsUI();
      });
      container.appendChild(document.createElement('br'));
      container.appendChild(deleteBtn);

      listDiv.appendChild(container);
    });
  }

  // Function to add a new scheduled event with default values
  function addNewScheduledEvent() {
    const newEvent = {
      id: Date.now() + Math.random(), // Simple unique id
      type: 'tts',
      scheduledTime: Date.now() + 5 * 60000, // Default: 5 minutes from now
      repeatInterval: 0,
      message: '',
      voice: (window.speechSynthesis.getVoices()[0] || {}).name || '',
      audioData: '',
      audioFileName: ''
    };
    scheduledEvents.push(newEvent);
    saveScheduledEvents();
    populateScheduledEventsUI();
    unsavedScheduledChanges = true;
  }

  // Periodically check for due scheduled events (every second)
  function checkAndExecuteScheduledEvents() {
    const now = Date.now();
    let modified = false;
    // Traverse backwards to handle removals safely
    for (let i = scheduledEvents.length - 1; i >= 0; i--) {
      const event = scheduledEvents[i];
      if (now >= event.scheduledTime) {
        // Trigger the event now
        triggerEvent(event);
        if (event.repeatInterval && event.repeatInterval > 0) {
          // Calculate next scheduled time without triggering missed intervals
          let nextTime = event.scheduledTime + event.repeatInterval;
          while (nextTime < now) {
            nextTime += event.repeatInterval;
          }
          event.scheduledTime = nextTime;
          modified = true;
        } else {
          // One-time event; remove it
          scheduledEvents.splice(i, 1);
          modified = true;
        }
      }
    }
    if (modified) {
      saveScheduledEvents();
      populateScheduledEventsUI();
    }
  }
  setInterval(checkAndExecuteScheduledEvents, 1000);

  // Setup Modal Event Listeners for Scheduled Events
  document.getElementById('scheduled-events-btn').addEventListener('click', () => {
    loadScheduledEvents();
    populateScheduledEventsUI();
    unsavedScheduledChanges = false;
    unsavedPromptedScheduled = false;
    document.getElementById('scheduled-events-modal').style.display = 'block';
  });

  document.getElementById('add-scheduled-event-btn').addEventListener('click', () => {
    addNewScheduledEvent();
  });

  document.getElementById('save-scheduled-events').addEventListener('click', () => {
    saveScheduledEvents();
    document.getElementById('scheduled-events-modal').style.display = 'none';
  });

  document.getElementById('close-scheduled-events').addEventListener('click', () => {
    if (unsavedScheduledChanges) {
      if (!unsavedPromptedScheduled) {
        const warningDiv = document.getElementById('scheduled-unsaved-warning');
        warningDiv.textContent = "You have unsaved changes. Click close again to cancel changes.";
        warningDiv.style.display = 'block';
        unsavedPromptedScheduled = true;
      } else {
        // Revert unsaved changes by reloading stored events
        loadScheduledEvents();
        populateScheduledEventsUI();
        unsavedScheduledChanges = false;
        unsavedPromptedScheduled = false;
        document.getElementById('scheduled-unsaved-warning').style.display = 'none';
        document.getElementById('scheduled-events-modal').style.display = 'none';
      }
    } else {
      document.getElementById('scheduled-events-modal').style.display = 'none';
    }
  });

  // Clicking outside the Scheduled Events modal content triggers safe warning
  window.addEventListener('click', (e) => {
    const modal = document.getElementById('scheduled-events-modal');
    if (e.target === modal) {
      if (unsavedScheduledChanges) {
        if (!unsavedPromptedScheduled) {
          const warningDiv = document.getElementById('scheduled-unsaved-warning');
          warningDiv.textContent = "You have unsaved changes. Click outside again to cancel.";
          warningDiv.style.display = 'block';
          unsavedPromptedScheduled = true;
        } else {
          // Revert unsaved changes and then close
          loadScheduledEvents();
          populateScheduledEventsUI();
          unsavedScheduledChanges = false;
          unsavedPromptedScheduled = false;
          document.getElementById('scheduled-unsaved-warning').style.display = 'none';
          modal.style.display = 'none';
        }
      } else {
        modal.style.display = 'none';
      }
    }
  });

  window.scheduledEvents = {
    load: loadScheduledEvents,
    save: saveScheduledEvents,
    populateUI: populateScheduledEventsUI,
    getEvents: () => scheduledEvents
  };

  // Initialize scheduled events on load.
  loadScheduledEvents();
})();