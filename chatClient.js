(function() {
  const channelInput = document.getElementById('channel-input');
  const connectButton = document.getElementById('connect-btn');
  const statusDiv = document.getElementById('status');
  let client = null;

  connectButton.addEventListener('click', function() {
    if (client && client.readyState() === 'OPEN') {
      disconnectFromChat();
    } else {
      connectToChat();
    }
  });

  channelInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      connectButton.click();
    }
  });

  function connectToChat() {
    const channel = channelInput.value.toLowerCase().trim();
    if (!channel) {
      alert('Please enter a channel name');
      return;
    }
    client = new window.tmi.Client({
      connection: {
        secure: true,
        reconnect: true
      },
      channels: [channel]
    });
    client.connect().catch(console.error);
    client.on('connected', function() {
      statusDiv.className = 'status connected';
      statusDiv.textContent = `Connected to ${channel}'s chat`;
      connectButton.textContent = 'Disconnect';
    });
    client.on('disconnected', function() {
      statusDiv.className = 'status disconnected';
      statusDiv.textContent = 'Disconnected from chat';
      connectButton.textContent = 'Connect';
    });
    client.on('message', function(channel, tags, message, self) {
      const username = tags['display-name'] || 'Anonymous';
      const lowerMessage = message.trim().toLowerCase();
      if (window.getCustomCommand) {
        const customCmd = window.getCustomCommand(lowerMessage);
        if (customCmd) {
          window.chatUI.addChatMessage(username, message, tags);
          if (customCmd.type === "tts") {
            window.ttsManager.queueCustomTTSMessage(customCmd.message, customCmd.voice, username);
          } else if (customCmd.type === "audio") {
            window.ttsManager.playCustomAudio(customCmd.audioData);
          }
          return;
        }
      }
      if (window.gambleManager && window.gambleManager.isGambleTrigger(lowerMessage)) {
        const handled = window.gambleManager.handleGambleCommand(username, message);
        if (handled) return;
      }
      window.chatUI.addChatMessage(username, message, tags);
      window.ttsManager.queueTTSMessage(message, username);
    });
  }

  function disconnectFromChat() {
    if (client) {
      client.disconnect();
      client = null;
    }
  }

  window.chatClient = {
    connectToChat: connectToChat,
    disconnectFromChat: disconnectFromChat
  };
})();