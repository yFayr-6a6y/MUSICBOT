import { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // 🔥 ДОСТАЕМ НАСТРОЙКИ ПРЯМО ИЗ ПАМЯТИ ТЕЛЕФОНА (или ставим дефолтные) 🔥
  const [mood, setMood] = useState(localStorage.getItem('ai_mood') || 'ambient');
  const [instrument, setInstrument] = useState(localStorage.getItem('ai_inst') || 'pad');
  const [volume, setVolume] = useState(parseFloat(localStorage.getItem('ai_vol')) || 0.5);
  const [bpm, setBpm] = useState(parseInt(localStorage.getItem('ai_bpm')) || 80);

  const [userName, setUserName] = useState('');

  const audioCtxRef = useRef(null);
  const socketRef = useRef(null);
  const masterGainRef = useRef(null);
  const activeNodesRef = useRef([]);

  const instrumentRef = useRef(instrument);
  const bpmRef = useRef(bpm);
  const moodRef = useRef(mood);
  const ignoreUntilRef = useRef(0);

  useEffect(() => { instrumentRef.current = instrument; }, [instrument]);
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { moodRef.current = mood; }, [mood]);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#0b0c10');

      const user = tg.initDataUnsafe?.user;
      if (user) {
        setUserName(user.first_name);
      }
    }
    return () => {
      if (socketRef.current) socketRef.current.close();
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setTargetAtTime(isPlaying ? volume : 0, audioCtxRef.current.currentTime, 0.1);
    }
  }, [volume, isPlaying]);

  const stopAllSounds = () => {
    if (!audioCtxRef.current || !masterGainRef.current) return;
    masterGainRef.current.disconnect();
    activeNodesRef.current.forEach(({ source, gain }) => {
      try { source.stop(); source.disconnect(); gain.disconnect(); } catch (e) {}
    });
    activeNodesRef.current = [];
    const newMaster = audioCtxRef.current.createGain();
    newMaster.gain.value = volume;
    newMaster.connect(audioCtxRef.current.destination);
    masterGainRef.current = newMaster;
  };

  // 🔥 ФУНКЦИИ С МГНОВЕННЫМ СОХРАНЕНИЕМ В ПАМЯТЬ УСТРОЙСТВА 🔥
  const handleBpmChange = (newBpm) => {
    setBpm(newBpm);
    localStorage.setItem('ai_bpm', newBpm); // Сохраняем!
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(`BPM:${newBpm}`);
    }
  };

  const changeMood = (newMood) => {
    stopAllSounds();
    setMood(newMood);
    localStorage.setItem('ai_mood', newMood); // Сохраняем!
    ignoreUntilRef.current = Date.now() + 500;
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(`MOOD:${newMood}`);
    }
  };

  const changeInstrument = (newInst) => {
    stopAllSounds();
    setInstrument(newInst);
    localStorage.setItem('ai_inst', newInst); // Сохраняем!
  };

  const handleVolumeChange = (newVol) => {
    setVolume(newVol);
    localStorage.setItem('ai_vol', newVol); // Сохраняем громкость!
  };

  const togglePlay = () => {
    if (isConnecting) return;
    if (isPlaying) {
      setIsPlaying(false);
      if (socketRef.current) socketRef.current.close();
      if (masterGainRef.current) masterGainRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.3);
    } else {
      setIsConnecting(true);
      if (!audioCtxRef.current) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const master = ctx.createGain();
        master.gain.value = 0;
        master.connect(ctx.destination);
        audioCtxRef.current = ctx;
        masterGainRef.current = master;
      }
      if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      socketRef.current = new WebSocket(`${protocol}//${window.location.host}/music`);

      socketRef.current.onopen = () => {
        setIsConnecting(false);
        setIsPlaying(true);
        masterGainRef.current.gain.setTargetAtTime(volume, audioCtxRef.current.currentTime, 0.5);

        // Как только подключились — скидываем серверу наши сохраненные настройки
        socketRef.current.send(`MOOD:${mood}`);
        socketRef.current.send(`BPM:${bpm}`);
      };

      socketRef.current.onmessage = (event) => {
        if (Date.now() < ignoreUntilRef.current) return;
        const [bass, mid, high, kick, hat, arp] = event.data.split(',').map(Number);

        if (bass > 0 || mid > 0 || high > 0) playSynthesizer(bass, mid, high);
        if (kick === 1) playKick();
        if (hat === 1) playHiHat();
        if (arp > 0) playArp(arp);
      };
      socketRef.current.onclose = () => { setIsPlaying(false); setIsConnecting(false); };
    }
  };

  const registerNode = (source, gain) => {
    activeNodesRef.current.push({ source, gain });
    source.onended = () => {
      activeNodesRef.current = activeNodesRef.current.filter(n => n.source !== source);
    };
  };

  const playKick = () => {
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startFreq = moodRef.current === 'cyberpunk' ? 200 : 150;
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(1.0, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain); gain.connect(masterGainRef.current);
    registerNode(osc, gain);
    osc.start(); osc.stop(ctx.currentTime + 0.3);
  };

  const playHiHat = () => {
    const ctx = audioCtxRef.current;
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource(); noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();

    if (moodRef.current === 'lo-fi') {
        filter.type = 'bandpass'; filter.frequency.value = 3000;
    } else {
        filter.type = 'highpass'; filter.frequency.value = 8000;
    }

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    noise.connect(filter).connect(gain).connect(masterGainRef.current);
    registerNode(noise, gain);
    noise.start();
  };

  const playArp = (midi) => {
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    if (moodRef.current === 'space') osc.type = 'sine';
    else if (moodRef.current === 'cyberpunk') osc.type = 'sawtooth';
    else osc.type = 'square';
    osc.frequency.setValueAtTime(440 * Math.pow(2, (midi - 69) / 12), ctx.currentTime);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain); gain.connect(masterGainRef.current);
    registerNode(osc, gain);
    osc.start(); osc.stop(ctx.currentTime + 0.15);
  };

  const playSynthesizer = (bass, mid, high) => {
    const ctx = audioCtxRef.current;
    let oscType = 'sine'; let attack = 0.1, decay = 1.0;
    switch (instrumentRef.current) {
      case 'piano': oscType = 'triangle'; break;
      case 'pad': oscType = 'sine'; break;
      case 'strings': oscType = 'sawtooth'; break;
      case 'flute': oscType = 'sine'; break;
      default: break;
    }
    if (moodRef.current === 'ambient') { attack = 2.0; decay = 4.0; }
    else if (moodRef.current === 'sleep') { attack = 4.0; decay = 8.0; }
    else if (moodRef.current === 'lo-fi') { attack = 0.05; decay = 0.6; }
    else if (moodRef.current === 'chillout') { attack = 0.02; decay = 0.2; }
    else if (moodRef.current === 'cyberpunk') { attack = 0.01; decay = 0.2; }
    else if (moodRef.current === 'space') { attack = 1.0; decay = 2.0; }
    const timeScale = 80 / bpmRef.current;
    const isLoFi = moodRef.current === 'lo-fi';
    const isCyberpunk = moodRef.current === 'cyberpunk';
    if (bass > 0) createVoice(ctx, bass - 12, oscType, attack * timeScale, decay * timeScale, 0.08, isLoFi, isCyberpunk);
    if (mid > 0) createVoice(ctx, mid, oscType, attack * timeScale, decay * timeScale, 0.05, isLoFi, isCyberpunk);
    if (high > 0) createVoice(ctx, high, 'sine', attack * timeScale, decay * timeScale, 0.04, false, false);
  };

  const createVoice = (ctx, midi, type, attack, decay, vol, isLoFi, isCyberpunk) => {
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    const gain = ctx.createGain();
    const osc1 = ctx.createOscillator();
    osc1.type = type; osc1.frequency.setValueAtTime(freq, ctx.currentTime);
    let osc2 = null;
    if (instrumentRef.current === 'pad' || instrumentRef.current === 'strings') {
        osc2 = ctx.createOscillator();
        osc2.type = type; osc2.frequency.setValueAtTime(freq, ctx.currentTime);
        osc2.detune.value = (instrumentRef.current === 'strings') ? 12 : -8;
    }
    const filter = ctx.createBiquadFilter();
    if (isCyberpunk || isLoFi) {
        filter.type = isCyberpunk ? 'lowpass' : 'bandpass';
        filter.frequency.setValueAtTime(5000, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.3);
    } else {
        filter.type = 'lowpass'; filter.frequency.setValueAtTime(8000, ctx.currentTime);
    }
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + attack + decay);
    osc1.connect(filter);
    if (osc2) osc2.connect(filter);
    filter.connect(gain); gain.connect(masterGainRef.current);
    registerNode(osc1, gain);
    if (osc2) registerNode(osc2, gain);
    osc1.start(); osc1.stop(ctx.currentTime + attack + decay + 0.1);
    if (osc2) { osc2.start(); osc2.stop(ctx.currentTime + attack + decay + 0.1); }
  };

  const moods = ['ambient', 'lo-fi', 'chillout', 'sleep', 'space'];
  const instruments = ['piano', 'pad', 'strings', 'flute'];

  return (
    <div className="app-container">
      <div className="player-card">

        <div className="header">
          <h1>AI <span className="neon-text">Core</span></h1>
          <p style={{ color: '#45A29E', fontSize: '12px', marginTop: '5px' }}>
            {userName ? `Welcome back, ${userName}` : 'Generative Audio Stream'}
          </p>
        </div>

        <div className={`waveform ${isPlaying ? 'active' : ''}`}>
          <div className="bar"></div><div className="bar"></div>
          <div className="bar"></div><div className="bar"></div>
          <div className="bar"></div>
        </div>

        <div className={`main-player-ring ${isPlaying ? 'playing' : ''}`}>
          <button className={`play-btn ${isPlaying ? 'pause' : ''}`} onClick={togglePlay} disabled={isConnecting}>
            {isConnecting ? '...' : (isPlaying ?
              <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
              :
              <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>

        <div className="controls-grid">
          <div className="control-group">
            <label>Atmosphere</label>
            <div className="pill-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {moods.map(m => (
                <div key={m} className={`pill ${mood === m ? 'active' : ''}`} onClick={() => changeMood(m)}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </div>
              ))}
            </div>
          </div>

          <div className="control-group">
            <label>Primary Instrument</label>
            <div className="pill-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {instruments.map(inst => (
                <div key={inst} className={`pill ${instrument === inst ? 'active' : ''}`} onClick={() => changeInstrument(inst)}>
                  {inst.charAt(0).toUpperCase() + inst.slice(1)}
                </div>
              ))}
            </div>
          </div>

          <div className="control-group" style={{ marginTop: '10px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Volume</span> <span className="neon-text">{Math.round(volume * 100)}%</span>
            </label>
            {/* ГРОМКОСТЬ ТЕПЕРЬ ТОЖЕ СОХРАНЯЕТСЯ */}
            <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => handleVolumeChange(parseFloat(e.target.value))} />
          </div>

          <div className="control-group">
            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Tempo (BPM)</span> <span className="neon-text">{bpm}</span>
            </label>
            <input type="range" min="40" max="140" step="1" value={bpm} onChange={(e) => handleBpmChange(parseInt(e.target.value))} />
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;