
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// Helper function to play audio
const playAudio = (base64Audio) => {
  try {
    const audioBytes = atob(base64Audio);
    const arrayBuffer = new ArrayBuffer(audioBytes.length);
    const bufferView = new Uint8Array(arrayBuffer);
    for (let i = 0; i < audioBytes.length; i++) {
      bufferView[i] = audioBytes.charCodeAt(i);
    }
    const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    audio.play().catch(error => console.error("Audio playback error:", error));
  } catch (error) {
    console.error("Error processing audio:", error);
  }
};

// LandingPage Component
const LandingPage = ({ onStartChat }) => (
  <div className="landing-container">
    <h1 className="landing-title">Meet ELIA</h1>
    <p className="landing-subtitle">Your personal AI health coach. Get guidance on nutrition, fitness, and wellness.</p>
    <div className="input-buttons">
      <button className="landing-input" onClick={() => onStartChat('image')}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path></svg>
      </button>
      <button className="landing-input" onClick={() => onStartChat('voice')}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
      </button>
      <button className="landing-input" onClick={() => onStartChat('text')}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
      </button>
    </div>
  </div>
);

// Chat Component
const Chat = ({ onEndChat, initialAction }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const imageInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { user: 'You', text: input, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.get('/text', { text: input });
      const { response: eliaText, audio } = response.data;
      const eliaMessage = { user: 'ELIA', text: eliaText, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) };
      
      setMessages(prev => [...prev, eliaMessage]);
      setIsLoading(false);

      if (audio) {
        playAudio(audio);
      }
    } catch (error) {
      console.error("Text input error:", error);
      const errorMessage = { user: 'ELIA', text: `Error: ${error.message}`, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || isLoading) return;

    const userMessage = { user: 'You', text: `Image sent: ${file.name}`, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.get('/text', formData);
      const { response: eliaText, audio } = response.data;
      const eliaMessage = { user: 'ELIA', text: eliaText, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) };
      
      setMessages(prev => [...prev, eliaMessage]);
      setIsLoading(false);

      if (audio) {
        playAudio(audio);
      }
    } catch (error) {
      console.error("Image upload error:", error);
      const errorMessage = { user: 'ELIA', text: `Error: ${error.message}`, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleVoiceInput = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errorMessage = { user: 'ELIA', text: "Error: Audio recording not supported.", time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    if (isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        chunksRef.current = [];
        mediaRecorderRef.current.ondataavailable = e => chunksRef.current.push(e.data);
        mediaRecorderRef.current.onstop = async () => {
          stream.getTracks().forEach(track => track.stop());
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('audio', blob, 'recording.webm');

          const userMessage = { user: 'You', text: 'Voice message sent.', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) };
          setMessages(prev => [...prev, userMessage]);
          setIsLoading(true);

          try {
            const response = await axios.get('/text', formData);
            const { response: eliaText, audio } = response.data;
            const eliaMessage = { user: 'ELIA', text: eliaText, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) };
            
            setMessages(prev => [...prev, eliaMessage]);
            setIsLoading(false);

            if (audio) {
              playAudio(audio);
            }
          } catch (error) {
            console.error("Voice submission error:", error);
            const errorMessage = { user: 'ELIA', text: `Error: ${error.message}`, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) };
            setMessages(prev => [...prev, errorMessage]);
            setIsLoading(false);
          }
        };
        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Voice recording error:", error);
        const errorMessage = { user: 'ELIA', text: `Error: ${error.message}`, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) };
        setMessages(prev => [...prev, errorMessage]);
        setIsRecording(false);
      }
    }
  };

  useEffect(() => {
    if (initialAction === 'image') imageInputRef.current?.click();
  }, [initialAction]);

  return (
    <div className="chat-container">
      <div className="header">
        <h1>ELIA Health Coach</h1>
        <span className="close" onClick={onEndChat}>✖</span>
      </div>
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message-container ${msg.user === 'ELIA' ? 'elia-container' : 'user-container'}`}>
            <div className={`avatar ${msg.user === 'ELIA' ? 'elia-avatar' : 'user-avatar'}`}>
              {msg.user.charAt(0)}
            </div>
            <div className={`message ${msg.user === 'ELIA' ? 'elia' : 'user'}`}>
              <p>{msg.text}</p>
              <span className="timestamp">{msg.time}</span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <span>Analyzing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form className="input-area" onSubmit={handleTextSubmit}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} ref={imageInputRef} />
        <button type="button" className="icon-button" onClick={() => imageInputRef.current.click()} disabled={isLoading}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path></svg>
        </button>
        <button type="button" className={`icon-button ${isRecording ? 'recording' : ''}`} onClick={handleVoiceInput} disabled={isLoading}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
        </button>
        <button type="submit" className="send-button" disabled={isLoading || !input.trim()}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </form>
    </div>
  );
};

// Main App Component
function EliaApp() {
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [initialAction, setInitialAction] = useState(null);

  const handleStartChat = (action) => {
    setInitialAction(action);
    setIsChatVisible(true);
  };

  const handleEndChat = () => {
    setIsChatVisible(false);
    setInitialAction(null);
  };

  return (
    <div className="app">
      {!isChatVisible ? (
        <LandingPage onStartChat={handleStartChat} />
      ) : (
        <Chat onEndChat={handleEndChat} initialAction={initialAction} />
      )}
    </div>
  );
}

export default EliaApp;
