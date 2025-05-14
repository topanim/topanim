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
        // Counter-rotate content to be upright
        const contentCounterRotationDeg = -segmentRotationStartDeg;
        // Then, to align it nicely within the wedge, add half of segment angle back, adjusted by 90deg for text flow
        const contentAlignmentRotationDeg = -(anglePerSegmentDeg / 2) + 90;
        const finalContentRotation = contentCounterRotationDeg + contentAlignmentRotationDeg;

        content.style.transformOrigin = 'center center';
        content.style.transform = `rotate(${finalContentRotation}deg) translateY(-65%) translateX(0%)`;
      }
    });
  };

  const updateSegmentAppearance = (segmentToHighlight, isTrulySelected) => {
    featureSegments.forEach((seg, idx) => {
      const isCurrentlyConsidered = seg === segmentToHighlight;
      seg.classList.toggle('segment-selected', isCurrentlyConsidered && isTrulySelected); // True selection style
      seg.classList.toggle('segment-hovered', isCurrentlyConsidered && !isTrulySelected); // Hover style if not truly selected

      const paths = seg.querySelectorAll('.segment-icon svg path, .segment-icon svg circle');
      const label = seg.querySelector('.segment-label');
      const color =
        isCurrentlyConsidered && isTrulySelected ? 'var(--dark-bg)' : 'var(--text-color)';
      paths.forEach((p) => p.setAttribute('stroke', color));
      if (label) label.style.color = color;

      const segmentRotationStartDeg = idx * anglePerSegmentDeg;
      let scale = defaultScale;
      let radialTranslateY = 0; // For radial extrusion

      if (isCurrentlyConsidered && isTrulySelected) {
        // Full effect for true selection
        scale = selectedScale;
        radialTranslateY = -extrusionAmount; // Negative Y is outwards in local rotated space
      } else if (isCurrentlyConsidered && !isTrulySelected) {
        // Subtle scale for hover
        scale = 1.05; // Slight scale on hover only
        radialTranslateY = -5; // Slight extrusion on hover
      }
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
      updateSegmentAppearance(segment, false); // Apply hover appearance
    });
    segment.addEventListener('click', () => {
      // Click makes it truly selected
      activeSegmentByClickOrKey = segment;
      updateSegmentAppearance(segment, true);
    });
  });

  if (featureWheel) {
    featureWheel.addEventListener('mouseleave', () => {
      // When mouse leaves the wheel, revert to the last clicked/keyed segment or default
      updateSegmentAppearance(activeSegmentByClickOrKey || defaultSegment, true);
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
        audio = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
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
});
