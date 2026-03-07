const images = document.querySelectorAll(".masonry-gallery img");

const lightbox = document.getElementById("lightbox");
const lightboxImg = document.querySelector(".lightbox-img");

const prev = document.querySelector(".lightbox-prev");
const next = document.querySelector(".lightbox-next");
const close = document.querySelector(".lightbox-close");

let current = 0;

function showImage(index) {

    current = index;

    lightboxImg.src = images[current].src;

    lightbox.classList.add("active");
}

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