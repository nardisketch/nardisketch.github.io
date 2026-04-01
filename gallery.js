const images = document.querySelectorAll(".masonry-gallery img");

const lightbox = document.getElementById("lightbox");
const lightboxImg = document.querySelector(".lightbox-img");

const prev = document.querySelector(".lightbox-prev");
const next = document.querySelector(".lightbox-next");
const close = document.querySelector(".lightbox-close");

let current = 0;

images.forEach((img, index) => {

    img.addEventListener("click", () => {
        showImage(index);
    });

});

next.addEventListener("click", () => {

    current = (current + 1) % images.length;

    lightboxImg.src = images[current].src;

});

prev.addEventListener("click", () => {

    current = (current - 1 + images.length) % images.length;

    lightboxImg.src = images[current].src;

});

close.addEventListener("click", () => {
    lightbox.classList.remove("active");
});

lightbox.addEventListener("click", (e) => {

    if (e.target === lightbox) {
        lightbox.classList.remove("active");
    }

});

document.addEventListener("keydown", (e) => {

    if (e.key === "Escape") {
        lightbox.classList.remove("active");
    }

    if (e.key === "ArrowRight") {
        next.click();
    }

    if (e.key === "ArrowLeft") {
        prev.click();
    }

});

let scale = 1;
let posX = 0;
let posY = 0;
let isDragging = false;
let startX;
let startY;

function updateTransform() {
    lightboxImg.style.transform =
        `translate(${posX}px, ${posY}px) scale(${scale})`;
}

/* Zoom with mouse wheel */

lightboxImg.addEventListener("wheel", (e) => {

    e.preventDefault();

    if (e.deltaY < 0) {
        scale += 0.15;
    } else {
        scale -= 0.15;
    }

    scale = Math.max(1, Math.min(scale, 5));

    updateTransform();

});


/* Drag image */

lightboxImg.addEventListener("mousedown", (e) => {

    e.preventDefault();

    isDragging = true;

    startX = e.clientX - posX;
    startY = e.clientY - posY;

});

document.addEventListener("mousemove", (e) => {

    if (!isDragging) return;

    posX = e.clientX - startX;
    posY = e.clientY - startY;

    updateTransform();

});

document.addEventListener("mouseup", () => {

    isDragging = false;

});


/* Reset zoom when opening new image */

function showImage(index) {

    current = index;

    lightboxImg.src = images[current].src;

    scale = 1;
    posX = 0;
    posY = 0;

    updateTransform();

    lightbox.classList.add("active");
}