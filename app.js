// Ensure the DOM is fully loaded before executing scripts
document.addEventListener("DOMContentLoaded", () => {
    
    // Automatically update the copyright year in the footer
    const currentYearSpan = document.getElementById("current-year");
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }
    
    // Initialize Vehicle Fleet Carousel
    initVehicleCarousel();
});

/**
 * Initializes the Vehicle Fleet Carousel with smooth sliding,
 * touch/drag support, autoplay, responsive controls, and indicator dots.
 */
function initVehicleCarousel() {
    const carouselContainer = document.getElementById("vehicle-carousel");
    const track = document.getElementById("carousel-track");
    const prevBtn = document.getElementById("carousel-prev");
    const nextBtn = document.getElementById("carousel-next");
    const dotsContainer = document.getElementById("carousel-dots");

    if (!carouselContainer || !track) return;

    const cards = Array.from(track.querySelectorAll(".vehicle-card"));
    const totalCards = cards.length;
    if (totalCards === 0) return;

    let currentIndex = 0;
    let autoplayTimer = null;
    let isDragging = false;
    let startX = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let animationID = 0;

    // Determine how many cards are visible simultaneously
    function getCardsPerView() {
        const width = window.innerWidth;
        if (width <= 640) return 1;
        if (width <= 992) return 2;
        return 3;
    }

    // Maximum index the carousel can slide to without blank space
    function getMaxIndex() {
        return Math.max(0, totalCards - getCardsPerView());
    }

    // Calculate current slide step in pixels (card width + gap)
    function getStepWidth() {
        if (!cards[0]) return 0;
        const cardWidth = cards[0].offsetWidth;
        const trackStyles = window.getComputedStyle(track);
        const gap = parseFloat(trackStyles.gap || trackStyles.columnGap) || 24;
        return cardWidth + gap;
    }

    // Generate pagination dots
    function renderDots() {
        if (!dotsContainer) return;
        dotsContainer.innerHTML = "";
        const maxIndex = getMaxIndex();
        const totalDots = maxIndex + 1;

        for (let i = 0; i < totalDots; i++) {
            const dot = document.createElement("button");
            dot.className = `carousel-dot ${i === currentIndex ? "active" : ""}`;
            dot.setAttribute("type", "button");
            dot.setAttribute("role", "tab");
            dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
            dot.setAttribute("aria-selected", i === currentIndex ? "true" : "false");

            dot.addEventListener("click", () => {
                goToSlide(i);
                resetAutoplay();
            });

            dotsContainer.appendChild(dot);
        }
    }

    // Update active dot indicator
    function updateDots() {
        if (!dotsContainer) return;
        const dots = dotsContainer.querySelectorAll(".carousel-dot");
        dots.forEach((dot, idx) => {
            const isActive = idx === currentIndex;
            dot.classList.toggle("active", isActive);
            dot.setAttribute("aria-selected", isActive ? "true" : "false");
        });
    }

    // Move to specific slide index
    function goToSlide(index, smooth = true) {
        const maxIndex = getMaxIndex();
        
        // Wrap around seamlessly
        if (index > maxIndex) {
            currentIndex = 0;
        } else if (index < 0) {
            currentIndex = maxIndex;
        } else {
            currentIndex = index;
        }

        const stepWidth = getStepWidth();
        currentTranslate = -currentIndex * stepWidth;
        prevTranslate = currentTranslate;

        track.style.transition = smooth ? "transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)" : "none";
        track.style.transform = `translateX(${currentTranslate}px)`;

        updateDots();
    }

    // Next slide
    function nextSlide() {
        goToSlide(currentIndex + 1);
    }

    // Previous slide
    function prevSlide() {
        goToSlide(currentIndex - 1);
    }

    // Button event listeners
    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            prevSlide();
            resetAutoplay();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            nextSlide();
            resetAutoplay();
        });
    }

    // Autoplay handling
    function startAutoplay() {
        stopAutoplay();
        autoplayTimer = setInterval(() => {
            nextSlide();
        }, 4200);
    }

    function stopAutoplay() {
        if (autoplayTimer) {
            clearInterval(autoplayTimer);
            autoplayTimer = null;
        }
    }

    function resetAutoplay() {
        stopAutoplay();
        startAutoplay();
    }

    // Pause autoplay when hovering or focusing carousel
    carouselContainer.addEventListener("mouseenter", stopAutoplay);
    carouselContainer.addEventListener("mouseleave", startAutoplay);
    carouselContainer.addEventListener("focusin", stopAutoplay);
    carouselContainer.addEventListener("focusout", startAutoplay);

    // Keyboard navigation (Left/Right arrows when carousel is focused)
    carouselContainer.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") {
            e.preventDefault();
            prevSlide();
            resetAutoplay();
        } else if (e.key === "ArrowRight") {
            e.preventDefault();
            nextSlide();
            resetAutoplay();
        }
    });

    // Touch and Mouse Drag Support
    function getPositionX(event) {
        return event.type.includes("mouse") ? event.pageX : event.touches[0].clientX;
    }

    function dragStart(event) {
        // Only trigger on main mouse button or touch
        if (event.type === "mousedown" && event.button !== 0) return;
        
        isDragging = true;
        startX = getPositionX(event);
        stopAutoplay();

        track.style.transition = "none";
        carouselContainer.style.cursor = "grabbing";
        animationID = requestAnimationFrame(animation);
    }

    function dragMove(event) {
        if (!isDragging) return;
        const currentX = getPositionX(event);
        const diffX = currentX - startX;
        currentTranslate = prevTranslate + diffX;
    }

    function dragEnd() {
        if (!isDragging) return;
        isDragging = false;
        cancelAnimationFrame(animationID);
        carouselContainer.style.cursor = "grab";

        const movedBy = currentTranslate - prevTranslate;
        const threshold = 40; // minimum drag distance in px

        if (movedBy < -threshold) {
            nextSlide();
        } else if (movedBy > threshold) {
            prevSlide();
        } else {
            goToSlide(currentIndex);
        }

        startAutoplay();
    }

    function animation() {
        if (isDragging) {
            track.style.transform = `translateX(${currentTranslate}px)`;
            requestAnimationFrame(animation);
        }
    }

    // Touch events
    carouselContainer.addEventListener("touchstart", dragStart, { passive: true });
    carouselContainer.addEventListener("touchmove", dragMove, { passive: true });
    carouselContainer.addEventListener("touchend", dragEnd);

    // Mouse drag events
    carouselContainer.addEventListener("mousedown", dragStart);
    window.addEventListener("mousemove", dragMove);
    window.addEventListener("mouseup", (e) => {
        if (isDragging) dragEnd(e);
    });

    // Prevent dragging images or links triggering default browser behavior
    cards.forEach((card) => {
        card.addEventListener("dragstart", (e) => e.preventDefault());
    });

    // Handle Window Resize with debounce
    let resizeTimer;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            renderDots();
            const maxIdx = getMaxIndex();
            if (currentIndex > maxIdx) {
                currentIndex = maxIdx;
            }
            goToSlide(currentIndex, false);
        }, 150);
    });

    // Initial setup
    renderDots();
    goToSlide(0, false);
    startAutoplay();
}