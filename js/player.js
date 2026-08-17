// ---------------------------------------------------------------------------
// Music Player: Apple-esque glassmorphism YouTube player for Kaavish library.
// Loops the playlist seamlessly using the YouTube IFrame API without API keys.
// ---------------------------------------------------------------------------
'use strict';

const PLAYLIST_TRACKS = [
  {
    id: "9sekgEXGm-E",
    title: "Faasle",
    artist: "Kaavish & Quratulain Balouch",
    duration: "5:24",
    durationSec: 324,
    thumbnail: "https://i.ytimg.com/vi/9sekgEXGm-E/hqdefault.jpg"
  },
  {
    id: "kfKP4o-bXzM",
    title: "Tere Pyaar Main",
    artist: "Kaavish",
    duration: "5:03",
    durationSec: 303,
    thumbnail: "https://i.ytimg.com/vi/kfKP4o-bXzM/hqdefault.jpg"
  },
  {
    id: "rn9aNVsABvc",
    title: "Baat Unkahi",
    artist: "Kaavish feat. Samra Khan",
    duration: "5:12",
    durationSec: 312,
    thumbnail: "https://i.ytimg.com/vi/rn9aNVsABvc/hqdefault.jpg"
  },
  {
    id: "JqLFnz7C_Io",
    title: "Faasle (Studio Version)",
    artist: "Kaavish",
    duration: "5:12",
    durationSec: 312,
    thumbnail: "https://i.ytimg.com/vi/JqLFnz7C_Io/hqdefault.jpg"
  },
  {
    id: "YMz4y8rQ4kU",
    title: "Tairay Naam",
    artist: "Kaavish",
    duration: "5:27",
    durationSec: 327,
    thumbnail: "https://i.ytimg.com/vi/YMz4y8rQ4kU/hqdefault.jpg"
  },
  {
    id: "4DVDFxiZKCg",
    title: "O Yaara",
    artist: "Abdul Hannan x Kaavish",
    duration: "4:51",
    durationSec: 291,
    thumbnail: "https://i.ytimg.com/vi/4DVDFxiZKCg/hqdefault.jpg"
  },
  {
    id: "nAIxCBm3ULk",
    title: "Nindiya Re",
    artist: "Kaavish (Coke Studio)",
    duration: "5:05",
    durationSec: 305,
    thumbnail: "https://i.ytimg.com/vi/nAIxCBm3ULk/hqdefault.jpg"
  },
  {
    id: "0dqleBxqXHI",
    title: "Piya Dekho Na",
    artist: "Kaavish",
    duration: "5:14",
    durationSec: 314,
    thumbnail: "https://i.ytimg.com/vi/0dqleBxqXHI/hqdefault.jpg"
  },
  {
    id: "VsFjP58j5i8",
    title: "Dekho",
    artist: "Kaavish",
    duration: "4:04",
    durationSec: 244,
    thumbnail: "https://i.ytimg.com/vi/VsFjP58j5i8/hqdefault.jpg"
  },
  {
    id: "pU5xSm335pE",
    title: "Sunn Zaraa",
    artist: "Kaavish",
    duration: "4:30",
    durationSec: 270,
    thumbnail: "https://i.ytimg.com/vi/pU5xSm335pE/hqdefault.jpg"
  },
  {
    id: "SGjJn_QNXEs",
    title: "Nindiya Re (Studio Version)",
    artist: "Kaavish",
    duration: "3:40",
    durationSec: 220,
    thumbnail: "https://i.ytimg.com/vi/SGjJn_QNXEs/hqdefault.jpg"
  },
  {
    id: "-Ot2QrjWCzg",
    title: "Bachpan",
    artist: "Kaavish",
    duration: "5:14",
    durationSec: 314,
    thumbnail: "https://i.ytimg.com/vi/-Ot2QrjWCzg/hqdefault.jpg"
  },
  {
    id: "W9jc_7KjO04",
    title: "Koi Hai To Sahee",
    artist: "Kaavish",
    duration: "4:06",
    durationSec: 246,
    thumbnail: "https://i.ytimg.com/vi/W9jc_7KjO04/hqdefault.jpg"
  },
  {
    id: "2fVGYj1dWG8",
    title: "Chaand Taaray",
    artist: "Kaavish",
    duration: "3:42",
    durationSec: 222,
    thumbnail: "https://i.ytimg.com/vi/2fVGYj1dWG8/hqdefault.jpg"
  },
  {
    id: "eo15zjtbZLo",
    title: "Dil Main Meray",
    artist: "Kaavish",
    duration: "4:13",
    durationSec: 253,
    thumbnail: "https://i.ytimg.com/vi/eo15zjtbZLo/hqdefault.jpg"
  },
  {
    id: "sg5Atcpq_UM",
    title: "Mujhay Maaf Karna",
    artist: "Kaavish (OST Dastoor)",
    duration: "2:03",
    durationSec: 123,
    thumbnail: "https://i.ytimg.com/vi/sg5Atcpq_UM/hqdefault.jpg"
  },
  {
    id: "_OSauNc_Gr8",
    title: "Jhoot Hogaa",
    artist: "Kaavish (OST Dastoor)",
    duration: "2:46",
    durationSec: 166,
    thumbnail: "https://i.ytimg.com/vi/_OSauNc_Gr8/hqdefault.jpg"
  }
];

function formatTime(sec) {
  if (isNaN(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ':' + (s < 10 ? '0' : '') + s;
}

class MusicPlayerController {
  constructor(tracks) {
    this.tracks = tracks;
    this.currentIndex = 0;
    this.isPlaying = false;
    this.isSeeking = false;
    this.isShuffle = false;
    this.isRepeatOne = false;
    this.isCollapsed = false;
    this.volume = 80;
    this.prevVolume = 80;
    this.rainVolume = 10;
    this.isMuted = false;
    this.ytPlayer = null;
    this.isYtReady = false;
    this.rainPlayer = null;
    this.isRainReady = false;
    this.isRainActive = false;
    this.pendingPlay = false;
    this.updateTimer = null;
    this.shuffleOrder = [];
    this.shufflePointer = 0;

    // Error & glitch loop protection
    this.consecutiveErrors = 0;
    this.lastErrorTimestamp = 0;
    this.playStartTimestamp = 0;
    this.skipDebounceTimer = null;
    this.noticeTimer = null;

    this.initDOM();
    this.renderPlaylistDrawer();
    this.updateTrackDisplay();
    this.bindEvents();
    this.checkOrigin();
    this.initYouTubeAPI();
  }

  initDOM() {
    this.dom = {
      player: document.getElementById('music-player'),
      cdDisc: document.getElementById('cd-disc'),
      cdThumb: document.getElementById('cd-thumb'),
      trackTitle: document.getElementById('player-track-title'),
      trackArtist: document.getElementById('player-track-artist'),
      trackCount: document.getElementById('player-track-count'),
      currentTime: document.getElementById('player-current-time'),
      totalTime: document.getElementById('player-total-time'),
      seekBar: document.getElementById('player-seek-bar'),
      seekFill: document.getElementById('player-seek-fill'),
      btnPlayPause: document.getElementById('btn-play-pause'),
      iconPlay: document.getElementById('icon-play'),
      iconPause: document.getElementById('icon-pause'),
      btnPrev: document.getElementById('btn-prev'),
      btnNext: document.getElementById('btn-next'),
      btnShuffle: document.getElementById('btn-shuffle'),
      btnRepeat: document.getElementById('btn-repeat'),
      btnVolume: document.getElementById('btn-volume'),
      iconVolHigh: document.getElementById('icon-vol-high'),
      iconVolLow: document.getElementById('icon-vol-low'),
      iconVolMute: document.getElementById('icon-vol-mute'),
      volumeBar: document.getElementById('player-volume-bar'),
      volumeFill: document.getElementById('player-volume-fill'),
      btnPlaylistToggle: document.getElementById('btn-playlist-toggle'),
      btnCollapse: document.getElementById('btn-player-collapse'),
      playlistDrawer: document.getElementById('playlist-drawer'),
      playlistClose: document.getElementById('playlist-close'),
      playlistList: document.getElementById('playlist-list'),
      playlistSearch: document.getElementById('playlist-search'),
      notice: document.getElementById('player-notice'),
      noticeText: document.getElementById('player-notice-text'),
      noticeClose: document.getElementById('player-notice-close'),
    };
  }

  checkOrigin() {
    if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
      this.showNotice(
        '💡 <strong>Tip:</strong> YouTube blocks media playback on <code>file://</code> URLs (Error 153). Run <code>node serve.js</code> in terminal and open <a href="http://localhost:5173" target="_blank">http://localhost:5173</a> for seamless music playback.'
      );
    }
  }

  showNotice(html, autoHideMs = 0) {
    if (!this.dom.notice || !this.dom.noticeText) return;
    this.dom.noticeText.innerHTML = html;
    this.dom.notice.style.display = 'flex';
    if (this.noticeTimer) clearTimeout(this.noticeTimer);
    if (autoHideMs > 0) {
      this.noticeTimer = setTimeout(() => this.hideNotice(), autoHideMs);
    }
  }

  hideNotice() {
    if (this.dom.notice) this.dom.notice.style.display = 'none';
  }

  initYouTubeAPI() {
    const setupYT = () => {
      if (this.ytPlayer || !window.YT || !window.YT.Player) return;
      try {
        const isFileOrigin = window.location.protocol === 'file:';
        const playerVars = {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0
        };

        if (!isFileOrigin && window.location.origin && window.location.origin !== 'null') {
          playerVars.origin = window.location.origin;
          playerVars.widget_referrer = window.location.href;
        }

        this.ytPlayer = new window.YT.Player('yt-player-embed', {
          host: 'https://www.youtube-nocookie.com',
          height: '200',
          width: '200',
          videoId: this.tracks[this.currentIndex].id,
          playerVars: playerVars,
          events: {
            onReady: (e) => this.onPlayerReady(e),
            onStateChange: (e) => this.onPlayerStateChange(e),
            onError: (e) => this.onPlayerError(e)
          }
        });

        // Ambient Rain Audio YouTube Player (plays looped ambient rain sound at 10% volume)
        const rainVideoId = 'Qo4JIT8jMtI';
        const rainVars = Object.assign({}, playerVars, {
          loop: 1,
          playlist: rainVideoId
        });

        this.rainPlayer = new window.YT.Player('yt-rain-embed', {
          host: 'https://www.youtube-nocookie.com',
          height: '200',
          width: '200',
          videoId: rainVideoId,
          playerVars: rainVars,
          events: {
            onReady: (e) => {
              this.isRainReady = true;
              try { this.rainPlayer.setVolume(10); } catch (err) {}
              if (this.isRainActive) {
                try { this.rainPlayer.playVideo(); } catch (err) {}
              }
            }
          }
        });
      } catch (err) {
        console.warn('YT Player init error:', err);
      }
    };

    if (window.YT && window.YT.Player) {
      setupYT();
    } else {
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevCallback === 'function') prevCallback();
        setupYT();
      };
    }
  }

  onPlayerReady(e) {
    this.isYtReady = true;
    try {
      this.ytPlayer.setVolume(this.volume);
    } catch (err) {}
    this.setVolumeUI(this.volume);
    this.startTicker();

    if (this.pendingPlay) {
      this.pendingPlay = false;
      this.play();
    }
  }

  onPlayerStateChange(e) {
    if (!window.YT) return;

    if (e.data === window.YT.PlayerState.PLAYING) {
      this.consecutiveErrors = 0;
      this.playStartTimestamp = Date.now();
      this.setPlayingState(true);
      this.hideNotice();
    } else if (e.data === window.YT.PlayerState.PAUSED) {
      this.setPlayingState(false);
    } else if (e.data === window.YT.PlayerState.ENDED) {
      let cur = 0;
      try {
        cur = this.ytPlayer.getCurrentTime ? this.ytPlayer.getCurrentTime() : 0;
      } catch (err) {}

      const trackDur = this.tracks[this.currentIndex].durationSec || 10;
      const playedMs = Date.now() - (this.playStartTimestamp || 0);

      // Only advance if track genuinely played
      if (cur > 2 || (this.isPlaying && playedMs > 3000) || cur >= trackDur - 3) {
        this.onTrackEnded();
      } else {
        console.log('Ignoring premature ENDED event at', cur, 'seconds');
      }
    }
  }

  onPlayerError(e) {
    console.warn('YouTube Player Error code:', e.data, 'on track:', this.tracks[this.currentIndex].title);
    this.setPlayingState(false);
    this.pendingPlay = false;

    // Error 153 / 150 = Origin / Referrer restriction (happens on file://)
    if (e.data === 153 || e.data === 150 || (typeof window !== 'undefined' && window.location.protocol === 'file:')) {
      this.showNotice(
        '⚠️ <strong>YouTube Error 153:</strong> YouTube requires a web origin to stream audio. Please run <code>node serve.js</code> and open <a href="http://localhost:5173" target="_blank">http://localhost:5173</a>.'
      );
      return; // Do NOT skip through tracks in an infinite error loop!
    }

    const now = Date.now();
    if (now - this.lastErrorTimestamp < 4000) {
      this.consecutiveErrors++;
    } else {
      this.consecutiveErrors = 1;
    }
    this.lastErrorTimestamp = now;

    if (this.consecutiveErrors >= 3) {
      console.warn('Too many consecutive errors. Halting auto-skip.');
      this.showNotice('Playback paused. Click Play to retry.', 4000);
      this.consecutiveErrors = 0;
      return;
    }

    if (this.skipDebounceTimer) clearTimeout(this.skipDebounceTimer);
    this.skipDebounceTimer = setTimeout(() => {
      this.nextTrack(true);
    }, 1500);
  }

  onTrackEnded() {
    if (this.isRepeatOne) {
      this.seekTo(0);
      this.play();
    } else {
      this.nextTrack(true);
    }
  }

  setPlayingState(playing) {
    this.isPlaying = playing;
    if (this.dom.cdDisc) {
      if (playing) {
        this.dom.cdDisc.classList.add('playing');
        this.dom.cdDisc.classList.remove('paused');
      } else {
        this.dom.cdDisc.classList.add('paused');
      }
    }
    if (this.dom.iconPlay && this.dom.iconPause) {
      this.dom.iconPlay.style.display = playing ? 'none' : 'block';
      this.dom.iconPause.style.display = playing ? 'block' : 'none';
    }
    if (this.dom.btnPlayPause) {
      this.dom.btnPlayPause.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    }
    this.updateActivePlaylistItem();
  }

  updateTrackDisplay() {
    const track = this.tracks[this.currentIndex];
    if (!track) return;

    if (this.dom.trackTitle) this.dom.trackTitle.textContent = track.title;
    if (this.dom.trackArtist) this.dom.trackArtist.textContent = track.artist;
    if (this.dom.trackCount) this.dom.trackCount.textContent = `${this.currentIndex + 1} / ${this.tracks.length}`;
    if (this.dom.cdThumb) {
      this.dom.cdThumb.src = track.thumbnail;
      this.dom.cdThumb.alt = track.title + ' artwork';
    }
    if (this.dom.totalTime) this.dom.totalTime.textContent = track.duration || '0:00';
    if (this.dom.currentTime) this.dom.currentTime.textContent = '0:00';
    if (this.dom.seekBar) {
      this.dom.seekBar.value = 0;
      this.dom.seekBar.max = track.durationSec || 100;
    }
    if (this.dom.seekFill) this.dom.seekFill.style.width = '0%';

    this.updateActivePlaylistItem();
  }

  renderPlaylistDrawer(filter = '') {
    if (!this.dom.playlistList) return;
    this.dom.playlistList.innerHTML = '';

    const query = filter.trim().toLowerCase();

    this.tracks.forEach((track, index) => {
      const matchTitle = track.title.toLowerCase().includes(query);
      const matchArtist = track.artist.toLowerCase().includes(query);
      if (query && !matchTitle && !matchArtist) return;

      const item = document.createElement('div');
      item.className = 'playlist-item' + (index === this.currentIndex ? ' active' : '');
      item.dataset.index = index;
      item.innerHTML = `
        <div class="playlist-item-num">${index + 1}</div>
        <div class="playlist-item-thumb-box">
          <img src="${track.thumbnail}" alt="" class="playlist-item-thumb" loading="lazy">
          <div class="playlist-item-eq">
            <span></span><span></span><span></span>
          </div>
        </div>
        <div class="playlist-item-info">
          <div class="playlist-item-title">${escapeHtml(track.title)}</div>
          <div class="playlist-item-artist">${escapeHtml(track.artist)}</div>
        </div>
        <div class="playlist-item-dur">${track.duration}</div>
      `;

      item.addEventListener('click', () => {
        this.selectTrack(index, true);
      });

      this.dom.playlistList.appendChild(item);
    });
  }

  updateActivePlaylistItem() {
    if (!this.dom.playlistList) return;
    const items = this.dom.playlistList.querySelectorAll('.playlist-item');
    items.forEach(item => {
      const idx = parseInt(item.dataset.index, 10);
      if (idx === this.currentIndex) {
        item.classList.add('active');
        if (this.isPlaying) {
          item.classList.add('playing');
        } else {
          item.classList.remove('playing');
        }
      } else {
        item.classList.remove('active', 'playing');
      }
    });
  }

  selectTrack(index, autoPlay = true) {
    if (index < 0 || index >= this.tracks.length) return;
    if (this.skipDebounceTimer) clearTimeout(this.skipDebounceTimer);

    this.currentIndex = index;
    const track = this.tracks[this.currentIndex];
    this.updateTrackDisplay();

    if (typeof window !== 'undefined' && typeof window.va === 'function' && autoPlay) {
      try { window.va('event', { name: 'play_track', track: track.title, artist: track.artist }); } catch (e) {}
    }

    if (this.isYtReady && this.ytPlayer) {
      try {
        if (autoPlay) {
          this.ytPlayer.loadVideoById(track.id);
          this.setPlayingState(true);
        } else {
          this.ytPlayer.cueVideoById(track.id);
          this.setPlayingState(false);
        }
      } catch (err) {
        console.warn('Error changing track:', err);
      }
    } else if (autoPlay) {
      this.pendingPlay = true;
      this.setPlayingState(true);
    }
  }

  play() {
    this.setPlayingState(true);
    if (this.isYtReady && this.ytPlayer) {
      try {
        const state = this.ytPlayer.getPlayerState ? this.ytPlayer.getPlayerState() : -1;
        if (state === window.YT.PlayerState.CUED || state === -1) {
          this.ytPlayer.loadVideoById(this.tracks[this.currentIndex].id);
        }
        this.ytPlayer.playVideo();
      } catch (err) {
        console.warn('Play error:', err);
      }
    } else {
      this.pendingPlay = true;
    }
  }

  pause() {
    this.setPlayingState(false);
    this.pendingPlay = false;
    if (this.isYtReady && this.ytPlayer && this.ytPlayer.pauseVideo) {
      try {
        this.ytPlayer.pauseVideo();
      } catch (err) {}
    }
  }

  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  nextTrack(autoPlay = true) {
    if (this.isShuffle) {
      this.nextShuffleTrack(autoPlay);
      return;
    }
    const nextIdx = (this.currentIndex + 1) % this.tracks.length;
    this.selectTrack(nextIdx, autoPlay);
  }

  prevTrack(autoPlay = true) {
    if (this.isYtReady && this.ytPlayer && this.ytPlayer.getCurrentTime) {
      try {
        const cur = this.ytPlayer.getCurrentTime();
        if (cur > 3) {
          this.seekTo(0);
          return;
        }
      } catch (err) {}
    }
    if (this.isShuffle) {
      this.prevShuffleTrack(autoPlay);
      return;
    }
    const prevIdx = (this.currentIndex - 1 + this.tracks.length) % this.tracks.length;
    this.selectTrack(prevIdx, autoPlay);
  }

  generateShuffleOrder() {
    const indices = this.tracks.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    this.shuffleOrder = indices;
    this.shufflePointer = this.shuffleOrder.indexOf(this.currentIndex);
    if (this.shufflePointer === -1) this.shufflePointer = 0;
  }

  nextShuffleTrack(autoPlay = true) {
    if (!this.shuffleOrder.length) this.generateShuffleOrder();
    this.shufflePointer = (this.shufflePointer + 1) % this.shuffleOrder.length;
    this.selectTrack(this.shuffleOrder[this.shufflePointer], autoPlay);
  }

  prevShuffleTrack(autoPlay = true) {
    if (!this.shuffleOrder.length) this.generateShuffleOrder();
    this.shufflePointer = (this.shufflePointer - 1 + this.shuffleOrder.length) % this.shuffleOrder.length;
    this.selectTrack(this.shuffleOrder[this.shufflePointer], autoPlay);
  }

  toggleShuffle() {
    this.isShuffle = !this.isShuffle;
    if (this.isShuffle) {
      this.generateShuffleOrder();
    }
    if (this.dom.btnShuffle) {
      this.dom.btnShuffle.classList.toggle('active', this.isShuffle);
      this.dom.btnShuffle.setAttribute('aria-pressed', String(this.isShuffle));
    }
  }

  toggleRepeat() {
    this.isRepeatOne = !this.isRepeatOne;
    if (this.dom.btnRepeat) {
      this.dom.btnRepeat.classList.toggle('active', this.isRepeatOne);
      this.dom.btnRepeat.setAttribute('aria-pressed', String(this.isRepeatOne));
      this.dom.btnRepeat.title = this.isRepeatOne ? 'Repeat: Current Track' : 'Repeat: All Tracks';
    }
  }

  seekTo(seconds) {
    if (this.isYtReady && this.ytPlayer && this.ytPlayer.seekTo) {
      try {
        this.ytPlayer.seekTo(seconds, true);
      } catch (err) {}
    }
    if (this.dom.currentTime) this.dom.currentTime.textContent = formatTime(seconds);
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(100, vol));
    if (this.volume > 0) {
      this.isMuted = false;
      this.prevVolume = this.volume;
    }
    if (this.isYtReady && this.ytPlayer && this.ytPlayer.setVolume) {
      try {
        this.ytPlayer.setVolume(this.volume);
        if (this.volume === 0) this.ytPlayer.mute();
        else if (this.ytPlayer.isMuted()) this.ytPlayer.unMute();
      } catch (err) {}
    }
    this.setVolumeUI(this.volume);
  }

  toggleMute() {
    if (this.isMuted || this.volume === 0) {
      this.isMuted = false;
      this.setVolume(this.prevVolume || 80);
    } else {
      this.prevVolume = this.volume;
      this.isMuted = true;
      this.setVolume(0);
    }
  }

  setVolumeUI(vol) {
    if (this.dom.volumeBar) this.dom.volumeBar.value = vol;
    if (this.dom.volumeFill) this.dom.volumeFill.style.width = vol + '%';

    if (this.dom.iconVolHigh && this.dom.iconVolLow && this.dom.iconVolMute) {
      if (vol === 0 || this.isMuted) {
        this.dom.iconVolHigh.style.display = 'none';
        this.dom.iconVolLow.style.display = 'none';
        this.dom.iconVolMute.style.display = 'block';
      } else if (vol < 50) {
        this.dom.iconVolHigh.style.display = 'none';
        this.dom.iconVolLow.style.display = 'block';
        this.dom.iconVolMute.style.display = 'none';
      } else {
        this.dom.iconVolHigh.style.display = 'block';
        this.dom.iconVolLow.style.display = 'none';
        this.dom.iconVolMute.style.display = 'none';
      }
    }
  }

  startTicker() {
    if (this.updateTimer) clearInterval(this.updateTimer);
    this.updateTimer = setInterval(() => {
      if (!this.isYtReady || !this.ytPlayer || !this.isPlaying || this.isSeeking) return;

      try {
        const cur = this.ytPlayer.getCurrentTime ? this.ytPlayer.getCurrentTime() : 0;
        const dur = this.ytPlayer.getDuration ? this.ytPlayer.getDuration() : (this.tracks[this.currentIndex].durationSec || 1);

        if (this.dom.currentTime) this.dom.currentTime.textContent = formatTime(cur);
        if (this.dom.totalTime && dur > 0) this.dom.totalTime.textContent = formatTime(dur);

        if (this.dom.seekBar && dur > 0) {
          this.dom.seekBar.max = dur;
          this.dom.seekBar.value = cur;
          const pct = Math.min(100, Math.max(0, (cur / dur) * 100));
          if (this.dom.seekFill) this.dom.seekFill.style.width = pct + '%';
        }
      } catch (err) {}
    }, 250);
  }

  togglePlaylistDrawer(show) {
    if (!this.dom.playlistDrawer) return;
    const isVisible = this.dom.playlistDrawer.classList.contains('open');
    const target = show !== undefined ? show : !isVisible;

    this.dom.playlistDrawer.classList.toggle('open', target);
    if (this.dom.btnPlaylistToggle) {
      this.dom.btnPlaylistToggle.classList.toggle('active', target);
      this.dom.btnPlaylistToggle.setAttribute('aria-expanded', String(target));
    }

    if (target) {
      const activeEl = this.dom.playlistList.querySelector('.playlist-item.active');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
      if (this.dom.playlistSearch) {
        this.dom.playlistSearch.focus();
      }
    }
  }

  bindEvents() {
    // Play / Pause
    if (this.dom.btnPlayPause) {
      this.dom.btnPlayPause.addEventListener('click', () => this.togglePlayPause());
    }

    // Previous / Next
    if (this.dom.btnPrev) {
      this.dom.btnPrev.addEventListener('click', () => this.prevTrack(true));
    }
    if (this.dom.btnNext) {
      this.dom.btnNext.addEventListener('click', () => this.nextTrack(true));
    }

    // Shuffle / Repeat
    if (this.dom.btnShuffle) {
      this.dom.btnShuffle.addEventListener('click', () => this.toggleShuffle());
    }
    if (this.dom.btnRepeat) {
      this.dom.btnRepeat.addEventListener('click', () => this.toggleRepeat());
    }

    // Seek bar interaction
    if (this.dom.seekBar) {
      const onSeekInput = (e) => {
        this.isSeeking = true;
        const val = parseFloat(e.target.value);
        const max = parseFloat(e.target.max) || 1;
        const pct = (val / max) * 100;
        if (this.dom.seekFill) this.dom.seekFill.style.width = pct + '%';
        if (this.dom.currentTime) this.dom.currentTime.textContent = formatTime(val);
      };

      const onSeekChange = (e) => {
        const val = parseFloat(e.target.value);
        this.seekTo(val);
        this.isSeeking = false;
      };

      this.dom.seekBar.addEventListener('input', onSeekInput);
      this.dom.seekBar.addEventListener('change', onSeekChange);
    }

    // Volume bar interaction
    if (this.dom.volumeBar) {
      this.dom.volumeBar.addEventListener('input', (e) => {
        this.setVolume(parseFloat(e.target.value));
      });
    }

    // Volume icon mute toggle
    if (this.dom.btnVolume) {
      this.dom.btnVolume.addEventListener('click', () => this.toggleMute());
    }

    // Playlist Drawer toggle
    if (this.dom.btnPlaylistToggle) {
      this.dom.btnPlaylistToggle.addEventListener('click', () => this.togglePlaylistDrawer());
    }
    if (this.dom.playlistClose) {
      this.dom.playlistClose.addEventListener('click', () => this.togglePlaylistDrawer(false));
    }

    // Notice close
    if (this.dom.noticeClose) {
      this.dom.noticeClose.addEventListener('click', () => this.hideNotice());
    }

    // Playlist Search
    if (this.dom.playlistSearch) {
      this.dom.playlistSearch.addEventListener('input', (e) => {
        this.renderPlaylistDrawer(e.target.value);
      });
    }

    // Collapse button
    if (this.dom.btnCollapse) {
      this.dom.btnCollapse.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleCollapse(true);
      });
    }

    // Expanding from collapsed squared artwork tile
    if (this.dom.player) {
      this.dom.player.addEventListener('click', (e) => {
        if (this.isCollapsed) {
          this.toggleCollapse(false);
        }
      });
    }

    // CD artwork click = toggle play/pause when open, expand when collapsed
    if (this.dom.cdDisc) {
      this.dom.cdDisc.addEventListener('click', (e) => {
        if (this.isCollapsed) {
          e.stopPropagation();
          this.toggleCollapse(false);
          return;
        }
        this.togglePlayPause();
      });
    }

    // Close drawer when clicking outside
    document.addEventListener('click', (e) => {
      if (this.dom.playlistDrawer && this.dom.playlistDrawer.classList.contains('open')) {
        if (!this.dom.playlistDrawer.contains(e.target) &&
            !this.dom.btnPlaylistToggle.contains(e.target)) {
          this.togglePlaylistDrawer(false);
        }
      }
    });

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePlayPause();
      } else if (e.code === 'ArrowRight' && !e.shiftKey) {
        e.preventDefault();
        if (this.isYtReady && this.ytPlayer && this.ytPlayer.getCurrentTime) {
          this.seekTo(this.ytPlayer.getCurrentTime() + 5);
        }
      } else if (e.code === 'ArrowLeft' && !e.shiftKey) {
        e.preventDefault();
        if (this.isYtReady && this.ytPlayer && this.ytPlayer.getCurrentTime) {
          this.seekTo(Math.max(0, this.ytPlayer.getCurrentTime() - 5));
        }
      } else if (e.code === 'KeyN' || (e.code === 'ArrowRight' && e.shiftKey)) {
        e.preventDefault();
        this.nextTrack(true);
      } else if (e.code === 'KeyP' || (e.code === 'ArrowLeft' && e.shiftKey)) {
        e.preventDefault();
        this.prevTrack(true);
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        this.toggleMute();
      } else if (e.code === 'KeyL') {
        e.preventDefault();
        this.togglePlaylistDrawer();
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        this.setVolume(Math.min(100, this.volume + 5));
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        this.setVolume(Math.max(0, this.volume - 5));
      } else if (e.code === 'Escape') {
        if (this.dom.playlistDrawer && this.dom.playlistDrawer.classList.contains('open')) {
          this.togglePlaylistDrawer(false);
        } else if (!this.isCollapsed) {
          this.toggleCollapse(true);
        }
      }
    });

    const enableAudioOnInteraction = () => {
      document.removeEventListener('pointerdown', enableAudioOnInteraction);
      document.removeEventListener('keydown', enableAudioOnInteraction);
    };
    document.addEventListener('pointerdown', enableAudioOnInteraction, { once: true });
    document.addEventListener('keydown', enableAudioOnInteraction, { once: true });
  }

  toggleCollapse(collapsed) {
    const isCol = typeof collapsed === 'boolean' ? collapsed : !this.isCollapsed;
    this.isCollapsed = isCol;
    if (this.dom.player) {
      this.dom.player.classList.toggle('collapsed', isCol);
    }
    if (isCol && this.dom.playlistDrawer) {
      this.togglePlaylistDrawer(false);
    }
  }

  setRain(active) {
    this.isRainActive = !!active;
    if (this.rainPlayer && this.isRainReady) {
      try {
        if (this.isRainActive) {
          this.rainPlayer.setVolume(this.rainVolume ?? 10);
          this.rainPlayer.playVideo();
        } else {
          this.rainPlayer.pauseVideo();
        }
      } catch (err) {
        console.warn('Rain player toggle error:', err);
      }
    }
  }

  setRainVolume(val) {
    const v = Math.max(0, Math.min(100, parseInt(val, 10) || 0));
    this.rainVolume = v;
    if (this.rainPlayer && this.isRainReady) {
      try {
        this.rainPlayer.setVolume(v);
      } catch (err) {}
    }
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

let musicPlayer = null;
function setRainAudio(active) {
  if (musicPlayer) musicPlayer.setRain(active);
}
function setRainVolume(val) {
  if (musicPlayer) musicPlayer.setRainVolume(val);
}
if (typeof window !== 'undefined') {
  window.setRainAudio = setRainAudio;
  window.setRainVolume = setRainVolume;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      musicPlayer = new MusicPlayerController(PLAYLIST_TRACKS);
      window.musicPlayer = musicPlayer;
    });
  } else {
    musicPlayer = new MusicPlayerController(PLAYLIST_TRACKS);
    window.musicPlayer = musicPlayer;
  }
}
