(function() {
  // Default values
  const DEFAULT_ALLOW_SELF_MUTE = true;
  const DEFAULT_ON_COMMANDS = "!tts, !tts-on, !unmute, bonesd3TS";
  const DEFAULT_OFF_COMMANDS = "!tts-off, !mute, bonesd3TO";

  // Keys for localStorage
  const LS_ALLOW_SELF_MUTE = 'allowSelfMute';
  const LS_DEFAULT_ON_COMMANDS = 'defaultOnCommands';
  const LS_DEFAULT_OFF_COMMANDS = 'defaultOffCommands';

  // Cached DOM elements
  const muteSettingsBtn = document.getElementById('mute-settings-btn');
  const muteSettingsModal = document.getElementById('mute-settings-modal');
  const closeMuteSettingsBtn = document.getElementById('close-mute-settings');
  const saveMuteSettingsBtn = document.getElementById('save-mute-settings');
  const allowSelfMuteCheckbox = document.getElementById('allow-self-mute');
  const defaultOnCommandsInput = document.getElementById('default-on-commands');
  const defaultOffCommandsInput = document.getElementById('default-off-commands');
  const unsavedWarning = document.getElementById('mute-unsaved-warning');

  let initialMuteSettings = {};
  let unsavedMuteChanges = false;
  let unsavedMutePrompted = false;

  // Load settings from localStorage or defaults
  function loadMuteSettings() {
    const allowSelfMute = localStorage.getItem(LS_ALLOW_SELF_MUTE);
    const defaultOnCommands = localStorage.getItem(LS_DEFAULT_ON_COMMANDS);
    const defaultOffCommands = localStorage.getItem(LS_DEFAULT_OFF_COMMANDS);

    allowSelfMuteCheckbox.checked = allowSelfMute === null ? DEFAULT_ALLOW_SELF_MUTE : (allowSelfMute === 'true');
    defaultOnCommandsInput.value = defaultOnCommands || DEFAULT_ON_COMMANDS;
    defaultOffCommandsInput.value = defaultOffCommands || DEFAULT_OFF_COMMANDS;

    // Cache the initial state
    initialMuteSettings = {
      allowSelfMute: allowSelfMuteCheckbox.checked,
      defaultOnCommands: defaultOnCommandsInput.value,
      defaultOffCommands: defaultOffCommandsInput.value
    };
    unsavedMuteChanges = false;
    unsavedMutePrompted = false;
    unsavedWarning.style.display = 'none';
  }

  // Check if settings have unsaved changes
  function hasUnsavedMuteChanges() {
    return (
      allowSelfMuteCheckbox.checked !== initialMuteSettings.allowSelfMute ||
      defaultOnCommandsInput.value !== initialMuteSettings.defaultOnCommands ||
      defaultOffCommandsInput.value !== initialMuteSettings.defaultOffCommands
    );
  }

  // Open the Mute Settings modal and load current settings
  muteSettingsBtn.addEventListener('click', function() {
    loadMuteSettings();
    muteSettingsModal.style.display = 'block';
  });

  // Save settings to localStorage on Save button click
  saveMuteSettingsBtn.addEventListener('click', function() {
    localStorage.setItem(LS_ALLOW_SELF_MUTE, allowSelfMuteCheckbox.checked);
    localStorage.setItem(LS_DEFAULT_ON_COMMANDS, defaultOnCommandsInput.value);
    localStorage.setItem(LS_DEFAULT_OFF_COMMANDS, defaultOffCommandsInput.value);
    muteSettingsModal.style.display = 'none';
    unsavedMuteChanges = false;
    unsavedMutePrompted = false;
  });

  // Close modal on Close button click
  closeMuteSettingsBtn.addEventListener('click', function() {
    muteSettingsModal.style.display = 'none';
  });

  // Listen for changes to set unsaved status
  [allowSelfMuteCheckbox, defaultOnCommandsInput, defaultOffCommandsInput].forEach(el => {
    el.addEventListener('input', function() {
      unsavedMuteChanges = hasUnsavedMuteChanges();
    });
  });

  // Enhanced modal close behavior: clicking outside modal to cancel unsaved changes
  window.addEventListener('click', function(e) {
    if (e.target === muteSettingsModal) {
      if (unsavedMuteChanges) {
        if (!unsavedMutePrompted) {
          unsavedWarning.textContent = "You have unsaved changes. Click outside again to cancel changes.";
          unsavedWarning.style.display = 'block';
          unsavedMutePrompted = true;
        } else {
          loadMuteSettings();
          unsavedMuteChanges = false;
          unsavedMutePrompted = false;
          unsavedWarning.style.display = 'none';
          muteSettingsModal.style.display = 'none';
        }
      } else {
        muteSettingsModal.style.display = 'none';
      }
    }
  });

  // Expose settings if needed
  window.muteSettings = {
    allowSelfMute: function() { return allowSelfMuteCheckbox.checked; },
    getDefaultOnCommands: function() { return defaultOnCommandsInput.value.split(',').map(cmd => cmd.trim()).filter(cmd => cmd); },
    getDefaultOffCommands: function() { return defaultOffCommandsInput.value.split(',').map(cmd => cmd.trim()).filter(cmd => cmd); }
  };
})();