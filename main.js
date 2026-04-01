const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
const navBar = document.getElementById('navBar');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
    navBar.classList.toggle('active');
});

navLinks.querySelectorAll("li").forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navBar.classList.remove('active');
        navLinks.classList.remove('active');
    });
});