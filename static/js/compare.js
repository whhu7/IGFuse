class VideoComparison {
  constructor() {
    this.videoWrapper = document.getElementById("videoWrapper");
    this.videoClip = document.getElementById("videoClip");
    this.compareSlider = document.getElementById("compareSlider");
    this.leftVideo = document.getElementById("leftVideo");
    this.rightVideo = document.getElementById("rightVideo");
    this.leftLabel = document.getElementById("leftLabel");
    this.rightLabel = document.getElementById("rightLabel");

    this.isDragging = false;
    this.currentScene = "labubu";
    this.currentMethod = "Grouping";
    this.sliderPosition = 33; // 初始位置33%

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.synchronizeVideos();
    this.updateLabels();
    this.updateSliderPosition(33); // 初始化滑块位置
    this.enableVideoLoop(); // 启用视频循环播放
    
  }
  

  setupEventListeners() {
    // Mouse events
    this.compareSlider.addEventListener("mousedown", this.startDrag.bind(this));
    this.videoWrapper.addEventListener(
      "mousedown",
      this.startDragFromVideo.bind(this)
    );
    document.addEventListener("mousemove", this.drag.bind(this));
    document.addEventListener("mouseup", this.stopDrag.bind(this));

    // Touch events for mobile
    this.compareSlider.addEventListener(
      "touchstart",
      this.startDrag.bind(this)
    );
    this.videoWrapper.addEventListener(
      "touchstart",
      this.startDragFromVideo.bind(this)
    );
    document.addEventListener("touchmove", this.drag.bind(this));
    document.addEventListener("touchend", this.stopDrag.bind(this));

    // Button events
    document.querySelectorAll(".btn_scene").forEach((btn) => {
      btn.addEventListener("click", this.changeScene.bind(this));
    });

    document.querySelectorAll(".btn_method").forEach((btn) => {
      btn.addEventListener("click", this.changeMethod.bind(this));
    });

    // Video synchronization events
    this.leftVideo.addEventListener("play", () => {
      if (!this.rightVideo.paused) return;
      this.rightVideo.currentTime = this.leftVideo.currentTime;
      this.rightVideo.play().catch(console.error);
    });

    this.leftVideo.addEventListener("pause", () => {
      this.rightVideo.pause();
    });

    this.rightVideo.addEventListener("play", () => {
      if (!this.leftVideo.paused) return;
      this.leftVideo.currentTime = this.rightVideo.currentTime;
      this.leftVideo.play().catch(console.error);
    });

    this.rightVideo.addEventListener("pause", () => {
      this.leftVideo.pause();
    });

    // Sync time when seeking
    this.leftVideo.addEventListener("timeupdate", () => {
      if (
        Math.abs(this.leftVideo.currentTime - this.rightVideo.currentTime) > 0.3
      ) {
        this.rightVideo.currentTime = this.leftVideo.currentTime;
      }
    });

    this.rightVideo.addEventListener("timeupdate", () => {
      if (
        Math.abs(this.rightVideo.currentTime - this.leftVideo.currentTime) > 0.3
      ) {
        this.leftVideo.currentTime = this.rightVideo.currentTime;
      }
    });

    // Handle video ended event for synchronized looping
    this.leftVideo.addEventListener("ended", () => {
      this.restartBothVideos();
    });

    this.rightVideo.addEventListener("ended", () => {
      this.restartBothVideos();
    });
  }

  enableVideoLoop() {
    // 设置视频循环属性
    this.leftVideo.loop = true;
    this.rightVideo.loop = true;
  }

  restartBothVideos() {
    // 同步重启两个视频
    this.leftVideo.currentTime = 0;
    this.rightVideo.currentTime = 0;

    if (!this.leftVideo.paused || !this.rightVideo.paused) {
      Promise.all([this.leftVideo.play(), this.rightVideo.play()]).catch(
        console.error
      );
    }
  }

  startDrag(e) {
    this.isDragging = true;
    document.body.style.cursor = "ew-resize";
    e.preventDefault();
  }

  startDragFromVideo(e) {
    // 如果点击的是视频区域（不是滑块），也可以开始拖拽
    if (e.target === this.videoWrapper || e.target.tagName === "VIDEO") {
      this.isDragging = true;
      document.body.style.cursor = "ew-resize";
      this.drag(e);
      e.preventDefault();
    }
  }

  drag(e) {
    if (!this.isDragging) return;

    e.preventDefault();
    const rect = this.videoWrapper.getBoundingClientRect();
    const clientX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));

    this.updateSliderPosition(percentage);
  }

  stopDrag() {
    this.isDragging = false;
    document.body.style.cursor = "default";
  }

  updateSliderPosition(percentage) {
    this.sliderPosition = percentage;

    // 限制最小和最大值，避免完全遮盖
    const clampedPercentage = Math.max(0.1, Math.min(99.9, percentage));

    // 更新滑块位置（可以到达边缘）
    this.compareSlider.style.left = percentage + "%";

    // 使用限制后的百分比来裁剪右侧视频，确保总是有一点可见
    this.videoClip.style.clipPath = `polygon(${clampedPercentage}% 0%, 100% 0%, 100% 100%, ${clampedPercentage}% 100%)`;
  }

  changeScene(e) {
    this.updateButtonSelection(e.target, ".btn_scene");
    this.currentScene = e.target.dataset.scene;
    this.updateVideos();
  }

  changeMethod(e) {
    this.updateButtonSelection(e.target, ".btn_method");
    this.currentMethod = e.target.dataset.method;
    this.updateVideos();
    this.updateLabels();
  }

  updateButtonSelection(selectedButton, buttonClass) {
    document.querySelectorAll(buttonClass).forEach((btn) => {
      btn.classList.remove("selected");
    });
    selectedButton.classList.add("selected");
  }

  updateVideos() {
    // Video sources configuration
    const videoSources = {
      labubu: {
        our: "./static/videos/labubu/Ours.mp4",
        DG: "./static/videos/labubu/DG.mp4",
        Gcut: "./static/videos/labubu/Gcut.mp4",
        Grouping: "./static/videos/labubu/Grouping.mp4",
      },
      fruit: {
        our: "./static/videos/fruit/Ours.mp4",
        DG: "./static/videos/fruit/DG.mp4",
        Gcut: "./static/videos/fruit/Gcut.mp4",
        Grouping: "./static/videos/fruit/Grouping.mp4",
      },
      table: {
        our: "./static/videos/table/Ours.mp4",
        DG: "./static/videos/table/DG.mp4",
        Gcut: "./static/videos/table/Gcut.mp4",
        Grouping: "./static/videos/table/Grouping.mp4",
      },
      toy: {
        our: "./static/videos/toy/Ours.mp4",
        DG: "./static/videos/toy/DG.mp4",
        Gcut: "./static/videos/toy/Gcut.mp4",
        Grouping: "./static/videos/toy/Grouping.mp4",
      },
      toy: {
        our: "./static/videos/toy/Ours.mp4",
        DG: "./static/videos/toy/DG.mp4",
        Gcut: "./static/videos/toy/Gcut.mp4",
        Grouping: "./static/videos/toy/Grouping.mp4",
      },
      sim_chair: {
        our: "./static/videos/sim_chair/Ours.mp4",
        DG: "./static/videos/sim_chair/DG.mp4",
        Gcut: "./static/videos/sim_chair/Gcut.mp4",
        Grouping: "./static/videos/sim_chair/Grouping.mp4",
      },
      sim_table: {
        our: "./static/videos/sim_table/Ours.mp4",
        DG: "./static/videos/sim_table/DG.mp4",
        Gcut: "./static/videos/sim_table/Gcut.mp4",
        Grouping: "./static/videos/sim_table/Grouping.mp4",
      },
      sim_car: {
        our: "./static/videos/sim_car/Ours.mp4",
        DG: "./static/videos/sim_car/DG.mp4",
        Gcut: "./static/videos/sim_car/Gcut.mp4",
        Grouping: "./static/videos/sim_car/Grouping.mp4",
      },
    };

    // Fallback to the existing video for demonstration
    const fallbackSrc = "./static/videos/fruit/Ours.mp4";

    console.log(
      `Loading videos for scene: ${this.currentScene}, method: ${this.currentMethod}`
    );

    const sources = videoSources[this.currentScene];

    if (sources) {
      // Left video shows 3DGS for comparison
      const leftSrc = sources["our"] || fallbackSrc;
      const rightSrc = sources[this.currentMethod] || fallbackSrc;

      this.updateVideoSource(this.leftVideo, leftSrc);
      this.updateVideoSource(this.rightVideo, rightSrc);
    } else {
      // Use fallback videos
      this.updateVideoSource(this.leftVideo, fallbackSrc);
      this.updateVideoSource(this.rightVideo, fallbackSrc);
    }
  }

  updateVideoSource(video, src) {
    if (video.src !== src) {
      const wasPlaying = !video.paused;
      const currentTime = video.currentTime;

      video.src = src;
      video.loop = true; // 确保新视频也设置循环
      video.load();

      // Restore playback state after loading
      video.addEventListener(
        "loadeddata",
        () => {
          video.currentTime = currentTime;
          if (wasPlaying) {
            video.play().catch(console.error);
          }
        },
        { once: true }
      );
    }
  }

  updateLabels() {
    this.leftLabel.textContent = "Ours";
    this.rightLabel.textContent = this.getMethodDisplayName(this.currentMethod);
  }

  getMethodDisplayName(method) {
    const displayNames = {
      DG: "DecoupledGaussian",
      Gcut: "GaussianCut",
      Grouping: "GaussianGrouping",
    };
    return displayNames[method] || method;
  }

  synchronizeVideos() {
    // Handle loading states
    this.leftVideo.addEventListener("loadstart", () => {
      console.log("Loading left video...");
    });

    this.rightVideo.addEventListener("loadstart", () => {
      console.log("Loading right video...");
    });

    this.leftVideo.addEventListener("canplay", () => {
      console.log("Left video ready to play");
    });

    this.rightVideo.addEventListener("canplay", () => {
      console.log("Right video ready to play");
    });

    // Ensure both videos are ready before allowing playback
    Promise.all([
      new Promise((resolve) => {
        if (this.leftVideo.readyState >= 3) resolve();
        else
          this.leftVideo.addEventListener("canplay", resolve, { once: true });
      }),
      new Promise((resolve) => {
        if (this.rightVideo.readyState >= 3) resolve();
        else
          this.rightVideo.addEventListener("canplay", resolve, { once: true });
      }),
    ]).then(() => {
      console.log("Both videos are ready for synchronization");
    });
  }

  togglePlayPause() {
    if (this.leftVideo.paused) {
      Promise.all([this.leftVideo.play(), this.rightVideo.play()]).catch(
        console.error
      );
    } else {
      this.leftVideo.pause();
      this.rightVideo.pause();
    }
  }

  toggleMute() {
    this.leftVideo.muted = !this.leftVideo.muted;
    this.rightVideo.muted = !this.rightVideo.muted;
  }

  resetSlider() {
    this.updateSliderPosition(33);
  }
}

// Global functions for backward compatibility
function togglePlayPause() {
  if (window.videoComparison) {
    window.videoComparison.togglePlayPause();
  }
}

function toggleMute() {
  if (window.videoComparison) {
    window.videoComparison.toggleMute();
  }
}

function resetSlider() {
  if (window.videoComparison) {
    window.videoComparison.resetSlider();
  }
}

// Legacy functions to match your original code
function changeSceneFLIP(button) {
  if (window.videoComparison) {
    window.videoComparison.changeScene({ target: button });
  }
}

function changeMethodFLIP(button) {
  if (window.videoComparison) {
    window.videoComparison.changeMethod({ target: button });
  }
}

function changeButton(button, type) {
  let buttons;
  if (type == "scene") {
    buttons = document.querySelectorAll(".btn_scene");
  } else {
    buttons = document.querySelectorAll(".btn_method");
  }

  buttons.forEach((btn) => {
    btn.classList.remove("selected");
  });
  button.classList.add("selected");
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.videoComparison = new VideoComparison();
});

// Handle page visibility to pause videos when tab is hidden
document.addEventListener("visibilitychange", () => {
  if (window.videoComparison && document.hidden) {
    window.videoComparison.leftVideo.pause();
    window.videoComparison.rightVideo.pause();
  }
});
