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

    // 添加加载状态跟踪
    this.isLeftVideoLoading = false;
    this.isRightVideoLoading = false;

    this.init();
  }

  init() {
    this.createLoadingIndicator(); // 创建加载指示器
    this.setupEventListeners();
    this.synchronizeVideos();
    this.updateLabels();
    this.updateSliderPosition(33); // 初始化滑块位置
    this.enableVideoLoop(); // 启用视频循环播放
    // 🔑 确保静音，这样浏览器允许自动播放
    this.leftVideo.muted = true;
    this.rightVideo.muted = true;

    // 🔑 初始尝试自动播放两个视频
    Promise.all([this.leftVideo.play(), this.rightVideo.play()]).catch(
      (err) => {
        console.warn("Autoplay prevented:", err);
      }
    );
  }

  // 创建加载指示器
  createLoadingIndicator() {
    // 创建左侧视频加载指示器
    const leftLoadingDiv = document.createElement("div");
    leftLoadingDiv.id = "leftVideoLoading";
    leftLoadingDiv.className = "video-loading-indicator left-loading";
    leftLoadingDiv.innerHTML = `
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading...</div>
      </div>
    `;
    leftLoadingDiv.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: `+this.sliderPosition+`%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 10;
      color: white;
      font-size: 16px;
    `;

    // 创建右侧视频加载指示器
    const rightLoadingDiv = document.createElement("div");
    rightLoadingDiv.id = "rightVideoLoading";
    rightLoadingDiv.className = "video-loading-indicator right-loading";
    rightLoadingDiv.innerHTML = `
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading...</div>
      </div>
    `;
    rightLoadingDiv.style.cssText =
      `
      position: absolute;
      top: 0;
      right: 0;
      width: ` + (100-this.sliderPosition) +
      `%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 10;
      color: white;
      font-size: 16px;
    `;

    // 添加加载动画样式
    const style = document.createElement("style");
    style.textContent = `
      .video-loading-indicator {
        font-family: Arial, sans-serif;
      }
      .loading-content {
        text-align: center;
      }
      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(255, 255, 255, 0.3);
        border-top: 4px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 15px;
      }
      .loading-text {
        font-size: 14px;
        opacity: 0.9;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    this.videoWrapper.appendChild(leftLoadingDiv);
    this.videoWrapper.appendChild(rightLoadingDiv);
    this.leftVideoLoading = leftLoadingDiv;
    this.rightVideoLoading = rightLoadingDiv;
  }

  // 显示加载指示器
  showLoadingIndicator(side) {
    if (side === "left") {
      this.leftVideoLoading.style.width = String(this.sliderPosition)+"%";
     
      
      this.leftVideoLoading.style.display = "flex";
      this.leftVideo.style.opacity = "0";
    } else {
      this.rightVideoLoading.style.width =String(100-this.sliderPosition)+"%";
      this.rightVideoLoading.style.display = "flex";
      this.rightVideo.style.opacity = "0";
    }
  }

  // 隐藏加载指示器
  hideLoadingIndicator(side) {
    if (side === "left") {
      this.leftVideoLoading.style.display = "none";
      this.leftVideo.style.opacity = "1";
    } else {
      this.rightVideoLoading.style.display = "none";
      this.rightVideo.style.opacity = "1";
    }
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

    // // Video synchronization events
    // this.rightVideo.addEventListener("play", () => {
    //   if (!this.rightVideo.paused ) return;
    //   this.rightVideo.currentTime = this.leftVideo.currentTime;
    //   this.rightVideo.play().catch(console.error);
    // });

    // this.leftVideo.addEventListener("pause", () => {
      
    //     this.leftVideo.pause();
     
    // });

    // this.leftVideo.addEventListener("play", () => {
    //   if (!this.leftVideo.paused ) return;
    //   this.leftVideo.currentTime = this.rightVideo.currentTime;
    //   this.leftVideo.play().catch(console.error);
    // });

    // this.rightVideo.addEventListener("pause", () => {
      
    //     this.rightVideo.pause();
      
    // });

    // //Sync time when seeking
    this.leftVideo.addEventListener("timeupdate", () => {
      if (
        !this.isLeftVideoLoading &&
        !this.isRightVideoLoading &&
        Math.abs(this.leftVideo.currentTime - this.rightVideo.currentTime) > 0.1
      ) {
        this.rightVideo.currentTime = this.leftVideo.currentTime;
      }
    });

    this.rightVideo.addEventListener("timeupdate", () => {
      if (
        !this.isRightVideoLoading &&
        !this.isLeftVideoLoading &&
        Math.abs(this.rightVideo.currentTime - this.leftVideo.currentTime) > 0.1
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
    this.updateVideos("scene");
  }

  changeMethod(e) {
    this.updateButtonSelection(e.target, ".btn_method");
    this.currentMethod = e.target.dataset.method;
    this.updateVideos("method");
    this.updateLabels();
  }

  updateButtonSelection(selectedButton, buttonClass) {
    document.querySelectorAll(buttonClass).forEach((btn) => {
      btn.classList.remove("selected");
    });
    selectedButton.classList.add("selected");
  }

  updateVideos(type) {
    // 先暂停当前播放的视频
    const wasPlaying = !this.leftVideo.paused;

    this.leftVideo.pause();
    this.rightVideo.pause();

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
      if (type == "method") {
        // Left video shows ours for comparison
        const rightSrc = sources[this.currentMethod] || fallbackSrc;
        this.leftVideo.pause();
        // this.updateVideoSource(this.leftVideo, leftSrc, "left", wasPlaying);
        this.updateVideoSource(this.rightVideo, rightSrc, "right", wasPlaying);
      } else {
        // Left video shows ours for comparison
        const leftSrc = sources["our"] || fallbackSrc;
        const rightSrc = sources[this.currentMethod] || fallbackSrc;

        this.updateVideoSource(this.leftVideo, leftSrc, "left", wasPlaying);
        this.updateVideoSource(this.rightVideo, rightSrc, "right", wasPlaying);
      }
    } else {
      // Use fallback videos
      this.updateVideoSource(this.leftVideo, fallbackSrc, "left", wasPlaying);
      this.updateVideoSource(this.rightVideo, fallbackSrc, "right", wasPlaying);
    }
  }

  updateVideoSource(video, src, side, wasPlaying = false) {
    if (video.src !== src) {
      const currentTime = video.currentTime;

      // 设置加载状态并显示加载指示器
      if (side === "left") {
        this.isLeftVideoLoading = true;
        this.showLoadingIndicator("left");
      } else {
        this.isRightVideoLoading = true;
        this.showLoadingIndicator("right");
      }
      // this.leftVideo.pause();

      video.src = src;
      video.loop = true; // 确保新视频也设置循环
      video.load();
      video.pause();

      // 添加加载事件监听器
      const onLoadedData = () => {
        video.currentTime = currentTime;
        // 清除加载状态并隐藏加载指示器
        if (side === "left") {
          this.isLeftVideoLoading = false;
        } else {
          this.isRightVideoLoading = false;
        }

        // 检查两个视频是否都加载完成，如果是且之前在播放，则同时开始播放
        this.checkAndStartPlayback(wasPlaying);

        // 清除加载状态并隐藏加载指示器
        if (side === "left") {
          this.hideLoadingIndicator("left");
        } else {
          this.hideLoadingIndicator("right");
        }
        // 移除事件监听器
        video.removeEventListener("loadeddata", onLoadedData);
        video.removeEventListener("error", onError);
      };
      


      const onError = () => {
        console.error(`Failed to load ${side} video:`, src);

        // 清除加载状态并隐藏加载指示器
        if (side === "left") {
          this.isLeftVideoLoading = false;
          this.hideLoadingIndicator("left");
        } else {
          this.isRightVideoLoading = false;
          this.hideLoadingIndicator("right");
        }

        // 移除事件监听器
        video.removeEventListener("loadeddata", onLoadedData);
        video.removeEventListener("error", onError);
      };
      
      // 添加事件监听器
      video.addEventListener("loadeddata", onLoadedData);
      video.addEventListener("error", onError);
    }
  
  }

  // 检查并开始播放（当两个视频都加载完成时）
  checkAndStartPlayback(wasPlaying) {
    if (wasPlaying && !this.isLeftVideoLoading && !this.isRightVideoLoading) {
      // 同步时间后同时播放
      this.leftVideo.currentTime = this.rightVideo.currentTime;
      //console.log(this.leftVideo.currentTime);
      
      Promise.all([this.rightVideo.play(), this.leftVideo.play()]).catch(
        console.error
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

  // togglePlayPause() {
  //   // 如果任一视频正在加载，不执行播放/暂停操作
  //   if (this.isLeftVideoLoading || this.isRightVideoLoading) {
  //     console.log("Videos are loading, please wait...");
  //     return;
  //   }

  //   if (this.leftVideo.paused) {
  //     Promise.all([this.leftVideo.play(), this.rightVideo.play()]).catch(
  //       console.error
  //     );
  //   } else {
  //     this.leftVideo.pause();
  //     this.rightVideo.pause();
  //   }
  // }

  toggleMute() {
    this.leftVideo.muted = !this.leftVideo.muted;
    this.rightVideo.muted = !this.rightVideo.muted;
  }

  resetSlider() {
    this.updateSliderPosition(33);
  }
}

// Global functions for backward compatibility
// function togglePlayPause() {
//   if (window.videoComparison) {
//     window.videoComparison.togglePlayPause();
//   }
// }

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
  else {
    window.videoComparison.leftVideo.play();
    window.videoComparison.rightVideo.play();
  }
});
