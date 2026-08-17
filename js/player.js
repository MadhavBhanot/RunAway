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
    this.isInfinityMix = true;
    this.inMixMode = false;
    this.mixSourceTrack = null;
    this.isCollapsed = false;
    this.volume = 80;
    this.prevVolume = 80;
    this.rainVolume = 10;
    this.isMuted = false;
    this.ytPlayer = null;
    this.isYtReady = false;
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

    this.rainEngine = new RainAudioEngine();

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
      btnInfinity: document.getElementById('btn-infinity'),
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

      // In mix mode or when playing dynamic mix tracks, read video metadata directly from YouTube
      if (this.ytPlayer && this.ytPlayer.getVideoData) {
        try {
          const data = this.ytPlayer.getVideoData();
          if (data && data.video_id) {
            const knownIndex = this.tracks.findIndex(t => t.id === data.video_id);
            if (knownIndex !== -1 && !this.inMixMode) {
              this.currentIndex = knownIndex;
              this.updateTrackDisplay();
            } else {
              this.inMixMode = true;
              if (this.dom.trackTitle) this.dom.trackTitle.textContent = data.title || 'Radio Mix Track';
              if (this.dom.trackArtist) this.dom.trackArtist.textContent = data.author || 'YouTube Mix';
              if (this.dom.cdThumb) {
                this.dom.cdThumb.src = `https://i.ytimg.com/vi/${data.video_id}/hqdefault.jpg`;
                this.dom.cdThumb.alt = (data.title || 'Mix') + ' artwork';
              }
              if (this.dom.trackCount) this.dom.trackCount.textContent = '∞ Radio Mix';
              this.updateActivePlaylistItem();
            }
          }
        } catch (err) {}
      }
    } else if (e.data === window.YT.PlayerState.PAUSED) {
      this.setPlayingState(false);
    } else if (e.data === window.YT.PlayerState.ENDED) {
      let cur = 0;
      try {
        cur = this.ytPlayer.getCurrentTime ? this.ytPlayer.getCurrentTime() : 0;
      } catch (err) {}

      const trackDur = this.tracks[this.currentIndex] ? (this.tracks[this.currentIndex].durationSec || 10) : 10;
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
    console.warn('YouTube Player Error code:', e.data, 'on track:', this.tracks[this.currentIndex] ? this.tracks[this.currentIndex].title : 'Mix');
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
      return;
    }
    if (this.inMixMode) {
      // In mix mode, let YouTube automatically advance to the next mix song
      return;
    }
    const isLastTrack = this.currentIndex >= this.tracks.length - 1;
    if (isLastTrack) {
      if (this.isInfinityMix) {
        this.startInfinityMix(this.tracks[this.currentIndex]);
        return;
      }
      this.currentIndex = 0;
      this.loadCurrentTrack(true);
      return;
    }
    this.nextTrack(true);
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

    if (this.inMixMode) {
      const banner = document.createElement('div');
      banner.className = 'playlist-mix-banner';
      banner.innerHTML = `
        <div class="mix-banner-info">
          <span class="mix-banner-badge">✨ Infinite Radio Mix</span>
          <span class="mix-banner-seed">Station based on ${escapeHtml(this.mixSourceTrack ? this.mixSourceTrack.title : 'Kaavish')}</span>
        </div>
        <button id="btn-return-album" class="mix-return-btn" type="button">← Back to Album</button>
      `;
      const retBtn = banner.querySelector('#btn-return-album');
      if (retBtn) {
        retBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.returnToAlbum(0);
        });
      }
      this.dom.playlistList.appendChild(banner);
    }

    const query = filter.trim().toLowerCase();

    this.tracks.forEach((track, index) => {
      const matchTitle = track.title.toLowerCase().includes(query);
      const matchArtist = track.artist.toLowerCase().includes(query);
      if (query && !matchTitle && !matchArtist) return;

      const item = document.createElement('div');
      const isCur = (!this.inMixMode && index === this.currentIndex);
      item.className = 'playlist-item' + (isCur ? ' active' : '');
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
        <button class="item-mix-btn" type="button" title="Start Infinite Radio from this song">✦ Mix</button>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('item-mix-btn')) return;
        this.selectTrack(index, true);
      });

      const mixBtn = item.querySelector('.item-mix-btn');
      if (mixBtn) {
        mixBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.startInfinityMix(track);
        });
      }

      this.dom.playlistList.appendChild(item);
    });
  }

  updateActivePlaylistItem() {
    if (!this.dom.playlistList) return;
    const items = this.dom.playlistList.querySelectorAll('.playlist-item');
    items.forEach(item => {
      const idx = parseInt(item.dataset.index, 10);
      if (idx === this.currentIndex && !this.inMixMode) {
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

    if (this.inMixMode) {
      this.inMixMode = false;
      this.mixSourceTrack = null;
      this.renderPlaylistDrawer();
    }

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
    if (this.inMixMode) {
      if (this.isYtReady && this.ytPlayer && this.ytPlayer.nextVideo) {
        try {
          this.ytPlayer.nextVideo();
          return;
        } catch (err) {}
      }
    }
    if (this.isRepeatOne) {
      this.seekTo(0);
      if (autoPlay) this.play();
      return;
    }
    if (this.isShuffle) {
      this.nextShuffleTrack(autoPlay);
      return;
    }
    const isLastTrack = this.currentIndex >= this.tracks.length - 1;
    if (isLastTrack) {
      if (this.isInfinityMix) {
        this.startInfinityMix(this.tracks[this.currentIndex]);
        return;
      }
      this.selectTrack(0, autoPlay);
      return;
    }
    const nextIdx = this.currentIndex + 1;
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
    if (this.inMixMode) {
      if (this.isYtReady && this.ytPlayer && this.ytPlayer.previousVideo) {
        try {
          this.ytPlayer.previousVideo();
          return;
        } catch (err) {}
      }
    }
    if (this.isShuffle) {
      this.prevShuffleTrack(autoPlay);
      return;
    }
    const prevIdx = (this.currentIndex - 1 + this.tracks.length) % this.tracks.length;
    this.selectTrack(prevIdx, autoPlay);
  }

  toggleInfinityMix(forced) {
    this.isInfinityMix = typeof forced === 'boolean' ? forced : !this.isInfinityMix;
    if (this.dom.btnInfinity) {
      this.dom.btnInfinity.classList.toggle('active', this.isInfinityMix);
      this.dom.btnInfinity.setAttribute('aria-pressed', String(this.isInfinityMix));
      this.dom.btnInfinity.title = this.isInfinityMix
        ? 'Infinity Mix: Auto-play endless radio when album ends (Active)'
        : 'Infinity Mix: Disabled';
    }
    this.showNotice(
      this.isInfinityMix
        ? '✨ <strong>Infinity Mix Active:</strong> Endless radio will play automatically when the album ends.'
        : 'Infinity Mix Disabled',
      2500
    );
  }

  startInfinityMix(sourceTrack) {
    this.inMixMode = true;
    this.mixSourceTrack = sourceTrack || this.tracks[this.currentIndex];
    const targetId = this.mixSourceTrack ? this.mixSourceTrack.id : this.tracks[0].id;

    this.showNotice(
      `✨ <strong>Starting Infinite Radio:</strong> Branching into endless mix based on <em>${escapeHtml(this.mixSourceTrack ? this.mixSourceTrack.title : 'Kaavish')}</em>...`,
      3500
    );

    if (this.isYtReady && this.ytPlayer && this.ytPlayer.loadPlaylist) {
      try {
        this.ytPlayer.loadPlaylist({
          list: 'RD' + targetId,
          listType: 'playlist',
          index: 0
        });
        this.setPlayingState(true);
      } catch (err) {
        console.warn('Load RD playlist error:', err);
      }
    }

    if (this.dom.trackCount) {
      this.dom.trackCount.textContent = '∞ Radio Mix';
    }
    this.renderPlaylistDrawer();
  }

  returnToAlbum(trackIndex = 0) {
    this.inMixMode = false;
    this.mixSourceTrack = null;
    this.selectTrack(trackIndex, true);
    this.showNotice('🎵 Returned to Kaavish Collection', 2500);
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

    // Shuffle / Repeat / Infinity Mix
    if (this.dom.btnShuffle) {
      this.dom.btnShuffle.addEventListener('click', () => this.toggleShuffle());
    }
    if (this.dom.btnRepeat) {
      this.dom.btnRepeat.addEventListener('click', () => this.toggleRepeat());
    }
    if (this.dom.btnInfinity) {
      this.dom.btnInfinity.addEventListener('click', () => this.toggleInfinityMix());
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
      if (this.rainEngine) {
        this.rainEngine.init();
        if (this.rainEngine.ctx && this.rainEngine.ctx.state === 'suspended') {
          this.rainEngine.ctx.resume();
        }
      }
    };
    ['touchstart', 'touchend', 'pointerdown', 'click', 'keydown'].forEach(evt => {
      document.addEventListener(evt, enableAudioOnInteraction, { passive: true });
    });
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

    // Web Audio Procedural Rain Sound (guaranteed concurrent simultaneous audio on iOS, mobile & desktop)
    if (this.rainEngine) {
      if (this.isRainActive) {
        this.rainEngine.setVolume(this.rainVolume ?? 10);
        this.rainEngine.play();
      } else {
        this.rainEngine.stop();
      }
    }
  }

  setRainVolume(val) {
    const v = Math.max(0, Math.min(100, parseInt(val, 10) || 0));
    this.rainVolume = v;
    if (this.rainEngine) {
      this.rainEngine.setVolume(v);
    }
  }
}

// ---------------------------------------------------------------------------
// Web Audio Ambient Rain Sound Synthesizer
// Provides soothing, zero-lag, continuous procedural rain and thunder
// that plays seamlessly and concurrently alongside YouTube music on mobile and desktop.
// ---------------------------------------------------------------------------
class RainAudioEngine {
  constructor() {
    this.ctx = null;
    this.gainNode = null;
    this.source = null;
    this.isPlaying = false;
    this.volume = 10;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);

      const bufferSize = this.ctx.sampleRate * 4;
      const noiseBuffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
      const left = noiseBuffer.getChannelData(0);
      const right = noiseBuffer.getChannelData(1);

      let b0L = 0, b1L = 0, b2L = 0, b0R = 0, b1R = 0, b2R = 0;
      for (let i = 0; i < bufferSize; i++) {
        const whiteL = Math.random() * 2 - 1;
        const whiteR = Math.random() * 2 - 1;

        b0L = 0.997 * b0L + whiteL * 0.055;
        b1L = 0.985 * b1L + whiteL * 0.075;
        b2L = 0.950 * b2L + whiteL * 0.153;
        left[i] = (b0L + b1L + b2L + whiteL * 0.1) * 0.45;

        b0R = 0.997 * b0R + whiteR * 0.055;
        b1R = 0.985 * b1R + whiteR * 0.075;
        b2R = 0.950 * b2R + whiteR * 0.153;
        right[i] = (b0R + b1R + b2R + whiteR * 0.1) * 0.45;
      }

      this.noiseBuffer = noiseBuffer;

      this.bandpass = this.ctx.createBiquadFilter();
      this.bandpass.type = 'bandpass';
      this.bandpass.frequency.setValueAtTime(1050, this.ctx.currentTime);
      this.bandpass.Q.setValueAtTime(0.7, this.ctx.currentTime);

      this.lowpass = this.ctx.createBiquadFilter();
      this.lowpass.type = 'lowpass';
      this.lowpass.frequency.setValueAtTime(3600, this.ctx.currentTime);

      this.highpass = this.ctx.createBiquadFilter();
      this.highpass.type = 'highpass';
      this.highpass.frequency.setValueAtTime(240, this.ctx.currentTime);

      this.bandpass.connect(this.lowpass);
      this.lowpass.connect(this.highpass);
      this.highpass.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);
    } catch (e) {
      console.warn('Web Audio Rain init:', e);
    }
  }

  play() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (this.isPlaying) return;

    try {
      this.source = this.ctx.createBufferSource();
      this.source.buffer = this.noiseBuffer;
      this.source.loop = true;
      this.source.connect(this.bandpass);
      this.source.start(0);
      this.isPlaying = true;

      const targetGain = (this.volume / 100) * 0.55;
      this.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value || 0.0001, this.ctx.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.15);
    } catch (e) {
      console.warn('Rain audio play:', e);
    }
  }

  stop() {
    if (!this.isPlaying || !this.ctx) return;
    try {
      this.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, this.ctx.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.15);
      setTimeout(() => {
        if (!this.isPlaying && this.source) {
          try { this.source.stop(); this.source.disconnect(); } catch (e) {}
          this.source = null;
        }
      }, 160);
      this.isPlaying = false;
    } catch (e) {}
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(100, vol));
    if (this.ctx && this.gainNode && this.isPlaying) {
      const targetGain = (this.volume / 100) * 0.55;
      this.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, this.ctx.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.04);
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
