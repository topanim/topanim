// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
  // Page Navigation functionality
  const sections = document.querySelectorAll('.section');
  const navLinks = document.querySelectorAll('.page-nav a');
  const scrollButtons = document.querySelectorAll('.scroll-down');

  // Throttle function to limit how often a function can be called
  const throttle = (func, limit) => {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  };

  // Update active nav link and section based on scroll position
  const updateActiveElements = throttle(() => {
    let currentSectionId = '';
    let minDistance = Infinity;

    // Handle orbital system animation based on features section visibility
    const orbitalSystem = document.querySelector('.orbital-system');
    const featuresSection = document.getElementById('features');
    if (orbitalSystem && featuresSection) {
      const featuresRect = featuresSection.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      // Target top for orbital system when features section is centered
      // We want the center of the orbital system to align with where the feature wheel is.
      // Feature wheel is roughly centered in its column, which is centered in features section.
      // Let's aim for the orbital system's center (which is its 50% vh/vw mark) to be at viewport's 50%.
      // The feature wheel is a bit lower due to title, so adjust target accordingly.
      // Initial state is top: -20vh (set in CSS)
      const targetOrbitalTop = '-20vh'; // Adjust this value to perfectly center with wheel
      const initialOrbitalTop = '38vh'; // Must match CSS
      orbitalSystem.style.left = '110vh';

      // Check if features section is significantly in view
      if (featuresRect.top < windowHeight * 0.75 && featuresRect.bottom > windowHeight * 0.25) {
        orbitalSystem.style.top = targetOrbitalTop;
      } else {
        orbitalSystem.style.top = initialOrbitalTop;
      }
    }

    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const distance = Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2);

      if (distance < minDistance) {
        minDistance = distance;
        currentSectionId = section.getAttribute('id');
      }

      const isVisible =
        rect.top < window.innerHeight * 0.8 && rect.bottom > window.innerHeight * 0.2;

      if (isVisible) {
        section.classList.add('active-section');
      } else {
        section.classList.remove('active-section');
      }
    });

    // Update active nav link
    navLinks.forEach((link) => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSectionId}`) {
        link.classList.add('active');
      }
    });
  }, 150);

  // Smooth scroll to section
  const smoothScrollTo = (targetId) => {
    const targetSection = document.querySelector(targetId);
    if (targetSection) {
      const targetPosition = targetSection.offsetTop;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      });

      // Activate the section after scrolling
      setTimeout(() => {
        targetSection.classList.add('active-section');
        updateActiveElements();
      }, 600);
    }
  };

  // Attach click events to scroll buttons
  scrollButtons.forEach((button) => {
    button.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      smoothScrollTo(targetId);
    });
  });

  // Add click events to nav links
  navLinks.forEach((link) => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      smoothScrollTo(targetId);
    });
  });

  // Add scroll event listener with throttling
  window.addEventListener('scroll', updateActiveElements);

  // Initialize sections on page load
  window.addEventListener('load', () => {
    // Update active sections initially
    setTimeout(updateActiveElements, 50);

    // Activate first section immediately
    const firstSection = sections[0];
    if (firstSection) {
      firstSection.classList.add('active-section');
    }
  });

  // Feature wheel segments positioning
  const featureWheel = document.querySelector('.feature-wheel');
  const featureSegments = document.querySelectorAll('.feature-segment');
  let activeSegmentByClickOrKey = null; // To store the segment selected by click/key
  let defaultSegment =
    featureSegments.length > 2
      ? featureSegments[2]
      : featureSegments.length > 0
      ? featureSegments[0]
      : null; // Default: Android or first

  const numSegments = featureSegments.length;
  const anglePerSegmentDeg = numSegments > 0 ? 360 / numSegments : 0;
  const extrusionAmount = 25; // How much the selected segment moves out (in pixels)
  const selectedScale = 1.1; // Scale for selected segment
  const defaultScale = 1.0;

  const positionAndClipSegments = () => {
    if (!numSegments || !featureWheel) return;
    const wheelRadius = featureWheel.offsetWidth / 2;
    const segmentAngleRad = anglePerSegmentDeg * (Math.PI / 180);

    featureSegments.forEach((segment, index) => {
      const segmentRotationStartDeg = index * anglePerSegmentDeg;
      segment.style.transformOrigin = '100% 100%'; // Crucial: center of the wheel for segment box

      // Calculate clip-path for a rounded wedge
      const points = [];
      points.push('100% 100%'); // Center of the wheel (origin for this segment's box)

      const arcPoints = 10; // Number of points to approximate the arc
      for (let i = 0; i <= arcPoints; i++) {
        const angle = (i / arcPoints) * segmentAngleRad;
        // Points are relative to the segment's 50%x50% box, with 100%,100% as the pivot
        const x = 100 - Math.sin(angle) * 100; // Sin for X as we sweep from Y-axis
        const y = 100 - Math.cos(angle) * 100; // Cos for Y
        points.push(`${x}% ${y}%`);
      }
      segment.style.clipPath = `polygon(${points.join(',')})`;

      // Initial transform (rotation only, scale/translation in activateSegment)
      segment.style.transform = `rotate(${segmentRotationStartDeg}deg) translateY(0px) scale(${defaultScale})`;

      // Position content
      const content = segment.querySelector('.segment-content');
      if (content) {
        const finalContentRotation = -segmentRotationStartDeg; // Make it upright

        // Position the content block.
        // 'left: 45%' and 'translateX(-50%)' in transform will center it horizontally.
        // This is shifted left from 50% to better suit the wedge shape.
        content.style.left = '65%';

        // 'top: 35%' will position the content's center 35% down from the top of the segment's square area.
        // This moves it further inward compared to 20%.
        // Adjust this value if needed (e.g., 30% for slightly more outward, 40% for slightly more inward).
        content.style.top = '25%';

        content.style.transformOrigin = 'center center';
        content.style.transform = `translateX(-50%) rotate(${finalContentRotation}deg)`;
      }
    });
  };

  const updateSegmentAppearance = (segmentToHighlight, isTrulySelected) => {
    featureSegments.forEach((seg, idx) => {
      const isCurrentlyConsidered = seg === segmentToHighlight;
      seg.classList.toggle('segment-selected', isCurrentlyConsidered); // Always apply selected style on hover
      seg.classList.toggle('segment-hovered', false); // Don't use separate hover style

      const paths = seg.querySelectorAll('.segment-icon svg path, .segment-icon svg circle');
      const label = seg.querySelector('.segment-label');
      const color = isCurrentlyConsidered ? 'var(--dark-bg)' : 'var(--text-color)';
      paths.forEach((p) => p.setAttribute('stroke', color));
      if (label) label.style.color = color;

      const segmentRotationStartDeg = idx * anglePerSegmentDeg;
      let scale = defaultScale;
      let radialTranslateY = 0; // For radial extrusion

      // Apply transform: rotate first, then translate in its new orientation, then scale from its center
      seg.style.transformOrigin = '100% 100%'; // Keep origin at wheel center for rotation and scale
      seg.style.transform = `rotate(${segmentRotationStartDeg}deg) translateY(${radialTranslateY}px) scale(${scale})`;
    });
  };

  // Keyboard navigation updates the truly selected segment
  document.addEventListener('keydown', (e) => {
    if (!featureWheel || !numSegments) return;
    const featureSection = document.getElementById('features');
    if (
      !featureSection ||
      !(
        featureSection.getBoundingClientRect().top < window.innerHeight &&
        featureSection.getBoundingClientRect().bottom > 0
      )
    )
      return;

    let currentIndex = -1;
    if (activeSegmentByClickOrKey) {
      featureSegments.forEach((s, i) => {
        if (s === activeSegmentByClickOrKey) currentIndex = i;
      });
    }
    if (currentIndex === -1 && defaultSegment) {
      // Fallback to default if nothing selected by key/click yet
      featureSegments.forEach((s, i) => {
        if (s === defaultSegment) currentIndex = i;
      });
    }
    if (currentIndex === -1) currentIndex = 0; // Absolute fallback

    let newIndex = currentIndex;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown')
      newIndex = (currentIndex + 1) % numSegments;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp')
      newIndex = (currentIndex - 1 + numSegments) % numSegments;

    if (newIndex !== currentIndex) {
      e.preventDefault();
      activeSegmentByClickOrKey = featureSegments[newIndex];
      updateSegmentAppearance(activeSegmentByClickOrKey, true);
    }
  });

  // Keyboard Navigation for Sections
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); // Prevent default window scrolling

      const visibleSections = Array.from(sections).filter((s) => {
        const rect = s.getBoundingClientRect();
        return rect.top >= -window.innerHeight / 2 && rect.top < window.innerHeight / 2;
      });

      let currentFocusedSection = visibleSections.length > 0 ? visibleSections[0] : null;
      let currentSectionIndex = -1;

      if (currentFocusedSection) {
        sections.forEach((s, idx) => {
          if (s.id === currentFocusedSection.id) {
            currentSectionIndex = idx;
          }
        });
      }

      let nextSectionIndex = -1;
      if (e.key === 'ArrowDown') {
        if (currentSectionIndex > -1 && currentSectionIndex < sections.length - 1) {
          nextSectionIndex = currentSectionIndex + 1;
        }
      } else if (e.key === 'ArrowUp') {
        if (currentSectionIndex > 0) {
          nextSectionIndex = currentSectionIndex - 1;
        }
      }

      if (nextSectionIndex !== -1) {
        smoothScrollTo(`#${sections[nextSectionIndex].id}`);
      }
    }
  });

  // Initialize feature wheel
  const initializeFeatureWheel = () => {
    if (!featureWheel || !numSegments) return;
    positionAndClipSegments();
    activeSegmentByClickOrKey = defaultSegment; // Set default selected segment
    updateSegmentAppearance(activeSegmentByClickOrKey, true);
  };

  // Add click events to segments
  featureSegments.forEach((segment) => {
    segment.addEventListener('mouseenter', () => {
      updateSegmentAppearance(segment, true); // Apply full selected appearance on hover
    });
    segment.addEventListener('click', () => {
      // We'll keep this for keyboard navigation compatibility
      activeSegmentByClickOrKey = segment;
    });
  });

  if (featureWheel) {
    featureWheel.addEventListener('mouseleave', () => {
      // When mouse leaves the wheel, revert to no selection
      updateSegmentAppearance(null, false);
    });
  }

  if (featureWheel && featureWheel.offsetWidth > 0) {
    initializeFeatureWheel();
  } else {
    window.addEventListener('load', initializeFeatureWheel, { once: true });
  }

  // Audio functionality for music control
  const musicBtn = document.querySelector('.music-btn');
  let audio = null;
  let isPlaying = false;

  if (musicBtn) {
    // Create background music element when needed, not immediately
    let audioCreated = false;

    musicBtn.addEventListener('click', function () {
      if (!audioCreated) {
        audio = new Audio('./music/background.mp3');
        audio.loop = true;
        audio.volume = 0.1;
        audioCreated = true;
      }

      isPlaying = !isPlaying;
      if (isPlaying) {
        audio.play().catch((e) => {
          console.log('Audio playback failed: ', e);
        });
      } else {
        audio.pause();
      }
      musicBtn.classList.toggle('playing', isPlaying);
    });
  }

  // Star Creation
  const createStars = () => {
    const starsContainer = document.querySelector('.stars');
    if (!starsContainer) return;
    const starCount = 100; // Increased star count
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div');
      star.classList.add('star');
      star.style.width = `${Math.random() * 2 + 0.5}px`; // Varied sizes
      star.style.height = star.style.width;
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.opacity = `${Math.random() * 0.5 + 0.2}`; // Varied initial opacity
      star.style.animationDelay = `${Math.random() * 6}s`;
      star.style.animationDuration = `${Math.random() * 3 + 3}s`; // Varied duration
      fragment.appendChild(star);
    }
    starsContainer.appendChild(fragment);
  };
  createStars();

  // Shooting Star Creation
  const createShootingStar = () => {
    const starsContainer = document.querySelector('.stars');
    if (!starsContainer) return;

    const shootingStar = document.createElement('div');
    shootingStar.classList.add('shooting-star');

    const startEdgePadding = 20; // px, how far off-screen top to start
    const endEdgePadding = 50; // px, how far off-screen bottom to ensure it finishes

    // Start X anywhere across the width
    const startX = Math.random() * window.innerWidth;
    // Start Y near the top, slightly off-screen
    const startY = -(Math.random() * 50 + startEdgePadding);

    // End Y near the bottom, ensuring it goes off-screen
    const endY = window.innerHeight + Math.random() * 50 + endEdgePadding;

    // End X: make it travel diagonally, allow some variation
    // The horizontal distance travelled can be up to, say, half the screen width to either side from startX
    // But ensure it generally moves downwards more than sideways for a falling effect.
    // Let horizontal travel be less than vertical travel.
    const verticalTravel = endY - startY;
    const maxHorizontalSpread = window.innerWidth * 0.4; // Max horizontal deviation
    const horizontalShift =
      (Math.random() - 0.5) * 2 * Math.min(maxHorizontalSpread, verticalTravel * 0.5);
    let endX = startX + horizontalShift;

    // Keep endX within screen bounds for more consistent appearance, or let it go off-screen
    // endX = Math.max(-endEdgePadding, Math.min(window.innerWidth + endEdgePadding, endX));

    const deltaX = endX - startX;
    const deltaY = endY - startY;

    const angleRad = Math.atan2(deltaY, deltaX);
    const angleDeg = angleRad * (180 / Math.PI);

    shootingStar.style.left = `${startX}px`;
    shootingStar.style.top = `${startY}px`;
    shootingStar.style.transform = `rotate(${angleDeg}deg)`;

    const travelDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    shootingStar.style.setProperty('--tx', `${travelDistance}px`);
    shootingStar.style.setProperty('--ty', `0px`);

    const duration = Math.random() * 1.5 + 1.0;
    const delay = Math.random() * 4; // Reduced max delay slightly

    shootingStar.style.setProperty('--duration', `${duration}s`);
    shootingStar.style.setProperty('--delay', `${delay}s`);

    starsContainer.appendChild(shootingStar);

    const totalLiveTime = (duration + delay) * 1000;
    setTimeout(() => {
      if (shootingStar.parentNode) {
        shootingStar.parentNode.removeChild(shootingStar);
      }
    }, totalLiveTime + 500); // Remove after animation + buffer
  };

  // Periodically create shooting stars
  if (document.hasFocus()) {
    // Only create if tab is active
    setInterval(createShootingStar, 3000); // Approx every 3 seconds
  } else {
    // Could add a listener for window focus to restart interval
  }

  // Create orbital animation with optimized calculations
  const orbitingSatellite = document.querySelector('.orbiting-satellite');
  if (orbitingSatellite) {
    // Set random starting position
    const randomAngle = Math.random() * 360;
    // Match the translateX to the largest orbit's radius (orbit3: 160vh diameter / 2 = 80vh)
    orbitingSatellite.style.transform = `rotate(${randomAngle}deg) translateX(80vh) rotate(-${randomAngle}deg)`;

    // Use a simple animation for better performance - this is already defined in CSS
    // Ensure the animation name in CSS is 'orbital-movement'
    orbitingSatellite.style.animation = `orbital-movement 60s linear infinite`; // Duration can be adjusted
  }

  // Initial update
  updateActiveElements();

  // Dynamic gradient animation for hero section
  const heroSection = document.getElementById('hero');
  if (heroSection) {
    let startTime = null;
    const animationDuration = 4000; // Duration for one full cycle (4 seconds)
    const minTransparentStop = 50; // Transparent part starts at 50% (minimum transparent area)
    const maxTransparentStop = 70; // Transparent part starts at 70% (maximum transparent area)

    function animateGradient(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = (elapsed % animationDuration) / animationDuration;

      // Use a sine wave for smooth oscillation between min and max
      const currentTransparentStop =
        minTransparentStop +
        ((Math.sin(progress * 2 * Math.PI) + 1) / 2) * (maxTransparentStop - minTransparentStop);

      // Set the CSS variable
      heroSection.style.setProperty('--hero-transparent-stop', `${currentTransparentStop}%`);

      requestAnimationFrame(animateGradient);
    }
    requestAnimationFrame(animateGradient);
  }

  // New Toolkit Terminal Functionality
  function initializeToolkitTerminal() {
    console.log('[Toolkit] Initializing terminal...'); // Log 1
    const toolkitColumn = document.querySelector('.features-row .feature-column:nth-child(1)');
    if (!toolkitColumn) {
      console.error('[Toolkit] Column (.features-row .feature-column:nth-child(1)) not found.');
      return;
    }
    console.log('[Toolkit] Column found:', toolkitColumn); // Log 2

    const toolsBox = toolkitColumn.querySelector('.tools-box');
    if (!toolsBox) {
      console.error('[Toolkit] Box (.tools-box) not found in column.');
      return;
    }
    console.log('[Toolkit] Tools box found:', toolsBox); // Log 3

    toolsBox.innerHTML = ''; // Clear existing content

    const terminalOutput = document.createElement('pre');
    terminalOutput.id = 'toolkit-terminal';
    toolsBox.appendChild(terminalOutput);

    const toolkitData = [
      { type: 'command', text: 'Initializing Development Toolkit v2.1...' },
      { type: 'info', text: '[INFO] Detected OS: win32, Arch: x64' }, // Example, not dynamic
      { type: 'info', text: '[INFO] Verifying component integrity...' },

      {
        type: 'progress',
        toolName: 'Jetpack Compose',
        version: '1.7.2',
        task: 'Configuring Android SDK & Gradle',
        finalProgress: 100,
      },
      {
        type: 'progress',
        toolName: 'Kotlin Multiplatform',
        version: '1.9.23',
        task: 'Setting up KMP environment',
        finalProgress: 100,
      },
      {
        type: 'progress',
        toolName: 'Python Environment',
        version: '3.11.7',
        task: 'Creating virtual environment (venv)',
        finalProgress: 100,
      },
      {
        type: 'progress',
        toolName: 'Node.js Runtimes',
        version: 'v20.11.1',
        task: 'Installing core NPM packages',
        finalProgress: 100,
      },
      {
        type: 'progress',
        toolName: 'Swift Toolchain',
        version: '5.9',
        task: 'Linking Xcode & Swift build tools',
        finalProgress: 100,
      },
      {
        type: 'progress',
        toolName: 'PostgreSQL Database',
        version: '16.2',
        task: 'Initializing data directory',
        finalProgress: 100,
      },
      {
        type: 'progress',
        toolName: 'Container Engine',
        version: 'Docker 25.0.3',
        task: 'Starting Docker daemon',
        finalProgress: 100,
      },

      { type: 'info', text: '[SUCCESS] All components initialized.' },
      { type: 'command', text: 'Toolkit ready. Launching primary interface...' },
    ];

    let lineIndex = 0;
    let charIndex = 0;
    const typingSpeed = 30;
    const lineDelay = 200;
    const textProgressAnimationDurationPerPercent = 20; // ms per percent for total animation time
    const textProgressUpdateInterval = 100; // ms for spinner/dot update

    let currentLineElement = null;
    let currentTextSpan = null;
    let currentProgressAnimatorSpan = null;
    let isBarAnimationActive = false; // True ONLY when the character bar is animating

    function addBlinkingCursor(terminalElement) {
      let cursorSpan = terminalElement.querySelector('.blinking-cursor');
      if (cursorSpan) cursorSpan.remove(); // Remove old one if exists

      cursorSpan = document.createElement('span');
      cursorSpan.classList.add('blinking-cursor');
      cursorSpan.textContent = '▋';

      const lastLineContainer = terminalOutput.querySelector('.line-container:last-child');
      if (lastLineContainer) {
        const lastTextElement =
          lastLineContainer.querySelector('span:not(.prompt):last-of-type') ||
          lastLineContainer.querySelector('.prompt');
        if (lastTextElement) {
          lastTextElement.appendChild(cursorSpan);
        } else {
          lastLineContainer.appendChild(cursorSpan);
        }
      } else {
        const newLineContainer = document.createElement('span');
        newLineContainer.classList.add('line-container');
        terminalElement.appendChild(newLineContainer);
        newLineContainer.appendChild(cursorSpan);
      }
      terminalElement.scrollTop = terminalOutput.scrollHeight;
    }

    function typeNextCharacter() {
      if (!currentLineElement || !currentTextSpan) return;

      const currentLineData = toolkitData[lineIndex];
      let textToType = '';

      if (currentLineData.type === 'command' || currentLineData.type === 'info') {
        textToType = currentLineData.text;
      } else if (currentLineData.type === 'progress') {
        // This is for the descriptive text part. Bar animation is not yet active.
        textToType = `${currentLineData.toolName} (${currentLineData.version}): ${currentLineData.task}... `;
      }

      if (charIndex < textToType.length) {
        currentTextSpan.textContent += textToType.charAt(charIndex);
        charIndex++;
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
        setTimeout(typeNextCharacter, typingSpeed);
      } else {
        // Text typing for the current visual line is complete
        if (currentLineData.type === 'progress' && !isBarAnimationActive) {
          // Just finished typing the descriptive line for a progress item.
          // Now, prepare for and start the bar animation.
          isBarAnimationActive = true; // LOCK for bar animation phase

          let fullTypedText = currentTextSpan.textContent;
          const toolNameAndVersion = `${currentLineData.toolName} (${currentLineData.version})`;
          if (fullTypedText.includes(toolNameAndVersion)) {
            fullTypedText = fullTypedText.replace(
              toolNameAndVersion,
              `<span class="terminal-tool-name">${toolNameAndVersion}</span>`,
            );
          } else if (fullTypedText.includes(currentLineData.toolName)) {
            fullTypedText = fullTypedText.replace(
              currentLineData.toolName,
              `<span class="terminal-tool-name">${currentLineData.toolName}</span>`,
            );
          }
          currentTextSpan.innerHTML = fullTypedText;

          animateTextProgress(); // This will create a new line for the bar and call finishLine when done.
        } else if (currentLineData.type !== 'progress') {
          // This is for command or info types finishing.
          // isBarAnimationActive is false here.
          finishLine();
        }
        // If currentLineData.type === 'progress' AND isBarAnimationActive is true, it means animateTextProgress
        // is currently running. We do nothing here; animateTextProgress will call finishLine upon its completion.
      }
    }

    function animateTextProgress() {
      const currentLineData = toolkitData[lineIndex];

      const progressLineElement = document.createElement('span');
      progressLineElement.classList.add('line-container', 'progress-bar-char-line');

      const indentSpan = document.createElement('span');
      indentSpan.className = 'progress-bar-char-indent';
      indentSpan.textContent = '  ↳ ';
      progressLineElement.appendChild(indentSpan);

      currentProgressAnimatorSpan = document.createElement('span');
      progressLineElement.appendChild(currentProgressAnimatorSpan);

      terminalOutput.appendChild(progressLineElement);
      terminalOutput.appendChild(document.createTextNode('\n'));
      terminalOutput.scrollTop = terminalOutput.scrollHeight;

      const barLength = 25;
      const fillChar = '█';
      const emptyChar = '░';
      let progressTimeElapsed = 0;
      const totalAnimationTime =
        currentLineData.finalProgress * textProgressAnimationDurationPerPercent;

      const intervalId = setInterval(() => {
        progressTimeElapsed += textProgressUpdateInterval;

        // Calculate the percentage of the *task* that should be shown as completed
        let effectiveTaskPercent =
          (progressTimeElapsed / totalAnimationTime) * currentLineData.finalProgress;
        effectiveTaskPercent = Math.min(effectiveTaskPercent, currentLineData.finalProgress); // Cap at finalProgress
        effectiveTaskPercent = Math.max(0, Math.floor(effectiveTaskPercent)); // Ensure it's not negative and is an integer

        let filledCount = Math.round((effectiveTaskPercent / 100) * barLength);

        // When the animation time is complete, ensure the bar and percentage reflect the exact finalProgress
        if (progressTimeElapsed >= totalAnimationTime) {
          effectiveTaskPercent = currentLineData.finalProgress;
          filledCount = Math.round((currentLineData.finalProgress / 100) * barLength);
        }

        const emptyCount = barLength - filledCount;

        currentProgressAnimatorSpan.innerHTML = '';

        const filledSpan = document.createElement('span');
        filledSpan.className = 'progress-bar-char-filled';
        filledSpan.textContent = fillChar.repeat(filledCount);
        currentProgressAnimatorSpan.appendChild(filledSpan);

        const emptySpan = document.createElement('span');
        emptySpan.className = 'progress-bar-char-empty';
        emptySpan.textContent = emptyChar.repeat(emptyCount);
        currentProgressAnimatorSpan.appendChild(emptySpan);

        const percentTextSpan = document.createElement('span');
        percentTextSpan.className = 'progress-bar-char-percent';
        percentTextSpan.textContent = ` ${effectiveTaskPercent}%`; // Display the calculated effective task percent
        currentProgressAnimatorSpan.appendChild(percentTextSpan);

        terminalOutput.scrollTop = terminalOutput.scrollHeight;

        if (progressTimeElapsed >= totalAnimationTime) {
          clearInterval(intervalId);
          const statusOk = document.createElement('span');
          statusOk.className = 'progress-char-status-ok';
          statusOk.textContent = ' [DONE]';
          currentProgressAnimatorSpan.appendChild(statusOk);

          isBarAnimationActive = false;
          finishLine();
        }
      }, textProgressUpdateInterval);
    }

    function finishLine() {
      lineIndex++; // A complete toolkitData item (command, info, or progress with its bar) is done.

      charIndex = 0;
      currentLineElement = null;
      currentTextSpan = null;
      currentProgressAnimatorSpan = null;
      // isBarAnimationActive should be false here, reset by animateTextProgress if it was the caller.

      if (lineIndex < toolkitData.length) {
        setTimeout(typeLine, lineDelay);
      } else {
        addBlinkingCursor(terminalOutput);
      }
    }

    function typeLine() {
      if (lineIndex >= toolkitData.length) {
        addBlinkingCursor(terminalOutput);
        return;
      }

      const existingCursor = terminalOutput.querySelector('.blinking-cursor');
      if (existingCursor) existingCursor.remove();

      currentLineElement = document.createElement('span');
      currentLineElement.classList.add('line-container');

      const currentLineData = toolkitData[lineIndex];
      charIndex = 0;
      // Do NOT set isBarAnimationActive here. It's managed by typeNextCharacter/animateTextProgress.

      if (currentLineData.type === 'command') {
        const promptSpan = document.createElement('span');
        promptSpan.className = 'prompt';
        promptSpan.textContent = '> ';
        currentLineElement.appendChild(promptSpan);
        currentTextSpan = document.createElement('span');
        currentTextSpan.className = 'command-text';
        currentLineElement.appendChild(currentTextSpan);
      } else if (currentLineData.type === 'info') {
        currentTextSpan = document.createElement('span');
        currentTextSpan.className = 'info-line';
        currentLineElement.appendChild(currentTextSpan);
      } else if (currentLineData.type === 'progress') {
        // This visual line is for the descriptive text.
        // isBarAnimationActive is currently false when starting the description.
        currentTextSpan = document.createElement('span');
        currentTextSpan.className = 'output-line';
        currentLineElement.appendChild(currentTextSpan);
      }

      terminalOutput.appendChild(currentLineElement);
      terminalOutput.appendChild(document.createTextNode('\n'));
      terminalOutput.scrollTop = terminalOutput.scrollHeight;

      typeNextCharacter();
    }
    let terminalStarted = false;

    // Observe the toolsBox directly
    if (toolsBox) {
      console.log(
        '[Toolkit] Tools box found. Setting up IntersectionObserver directly on toolsBox.',
      );
      const observer = new IntersectionObserver(
        (entries) => {
          console.log('[Toolkit] IntersectionObserver callback triggered (observing toolsBox).');
          entries.forEach((entry) => {
            console.log(
              '[Toolkit] toolsBox Observer entry: isIntersecting? ',
              entry.isIntersecting,
              'target:',
              entry.target,
            );
            if (entry.isIntersecting && !terminalStarted) {
              console.log('[Toolkit] toolsBox is intersecting, starting typeLine().');
              typeLine();
              terminalStarted = true;
              observer.unobserve(entry.target); // Stop observing once started
            } else if (!entry.isIntersecting && terminalStarted) {
              // Optional: Handle if it scrolls out of view after starting, though unobserve prevents re-trigger
              console.log('[Toolkit] toolsBox scrolled out of view after starting.');
            }
          });
        },
        { threshold: 0.1 },
      ); // Trigger when 10% of toolsBox is visible
      observer.observe(toolsBox);
    } else {
      // This case should have been caught earlier by the toolsBox check, but as a fallback:
      console.warn(
        '[Toolkit] Tools box somehow not found for observer, attempting to start typeLine() immediately.',
      );
      typeLine();
    }
  }

  initializeToolkitTerminal(); // Call the function to set up the toolkit terminal
});
