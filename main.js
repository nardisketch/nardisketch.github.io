const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
const navBar = document.getElementById('navBar');

hamburger.addEventListener('click', () => {
    console.log('Hamburger clicked');
    navLinks.classList.toggle('active');
    navBar.classList.toggle('active');
});