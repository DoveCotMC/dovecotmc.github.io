const btnMcmods = document.getElementById("btn-mcmods");
const btnPics = document.getElementById("btn-pics");
const btnNetawork = document.getElementById("btn-netawork");
const slides = document.querySelectorAll('.banner');

let currentIndex = 0;

function updateCarousel() {
    const offset = -currentIndex * 100; // 每页100%
    slides.forEach(slide => {
        slide.style.transform = `translateX(${offset}%)`;
    });
}

function showNext() {
    currentIndex = (currentIndex + 1) % slides.length;
    updateCarousel();
}
function showPrev() {
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    updateCarousel();
}

btnMcmods.addEventListener("mouseenter", () => {
    currentIndex = 0;
    updateCarousel();
    resetAutoplay();
});

btnPics.addEventListener("mouseenter", () => {
    currentIndex = 1;
    updateCarousel();
    resetAutoplay();
});

btnNetawork.addEventListener("mouseenter", () => {
    currentIndex = 2;
    updateCarousel();
    resetAutoplay();
});

let timer = null;

function startAutoplay() {
    timer = setInterval(showNext, 10000);
}

function resetAutoplay() {
    clearInterval(timer);
    startAutoplay();
}

startAutoplay();

// Header buttons
btnMcmods.addEventListener("click", () => {
    console.log("114514");
    window.location.href = "./mcmods.html";
});

// Arrows
const nextButton = document.getElementById("next-button");
const previousButton = document.getElementById("previous-button");

nextButton.addEventListener("click", () => {
    showNext();
});

previousButton.addEventListener("click", () => {
    showPrev();
});