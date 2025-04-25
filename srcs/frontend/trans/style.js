// Bootstrap CSS
const bootstrapCSS = document.createElement('link');
bootstrapCSS.rel = 'stylesheet';
bootstrapCSS.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css';
document.head.appendChild(bootstrapCSS);

// Google Font (Orbitron)
const orbitronFont = document.createElement('link');
orbitronFont.rel = 'stylesheet';
orbitronFont.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@500&display=swap';
document.head.appendChild(orbitronFont);

// Custom styles
const localCSS = document.createElement('link');
localCSS.rel = 'stylesheet';
localCSS.href = 'style.css';
document.head.appendChild(localCSS);

// Bootstrap JS
const bootstrapJS = document.createElement('script');
bootstrapJS.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js';
bootstrapJS.defer = true;
document.head.appendChild(bootstrapJS);

document.body.classList.add('d-flex', 'flex-column', 'min-vh-100');
document.querySelector('main').classList.add('flex-grow-1');
document.querySelector('footer').classList.add('mt-auto');
