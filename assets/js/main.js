document.addEventListener('DOMContentLoaded', () => {
    // Skip to content button on header
    const discoverButton = document.querySelector('#discover-button');
    discoverButton.addEventListener('click', (e) => {
        // Prevent the default action
        e.preventDefault();
        // Scroll to the content section
        const contentSection = document.querySelector('#content');
        contentSection.scrollIntoView({behavior: 'smooth'});
    });

    // Parallax
    const scene = document.getElementById('scene');
    const parallaxInstance = new Parallax(scene);

    // Show bubbles when user clicks on the discover button
    document.querySelector('#discover-button').addEventListener('click', () => {
        bubbles();
    });

    // Show bubbles on scroll when user is at the top of the page and scrolls down
    let bubblesShown = false;
    window.addEventListener('scroll', () => {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        if (scrollTop > 0 && !bubblesShown) {
            bubbles();
            bubblesShown = true;
        } else if (scrollTop === 0) {
            bubblesShown = false;
        }
    });

    // Progress bar
    window.addEventListener('scroll', () => {
        // Calculate the current scroll position as a percentage of total scroll height
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop; // Cross-browser support for scroll top
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrollPercent = (scrollTop / scrollHeight) * 100;

        // Update the width of the progress bar
        const progressBar = document.getElementById('progress-bar');
        progressBar.style.width = scrollPercent + '%';
    });
});

// The bubbles function
function bubbles() {
    const bubbleContainer = document.querySelector('.page-header');
    const numberOfBubbles = 250;

    // Make many bubbles
    for (let i = 0; i < numberOfBubbles; i++) {
        const bubble = document.createElement('div');
        bubble.classList.add('bubble');

        // Randomize the starting position of the bubble
        bubble.style.left = `${Math.random() * 100}%`;

        // Randomize the size of the bubble
        const size = Math.random() * 20;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;

        // Randomize the animation duration of the bubble
        const duration = Math.random() * 1.5;
        bubble.style.animationDuration = `${duration}s`;

        // Randomize the animation delay of the bubble
        const delay = Math.random() * 0.75;
        bubble.style.animationDelay = `${delay}s`;

        // Randomize the starting opacity of the bubble
        const opacity = Math.random();
        bubble.style.opacity = `${opacity}`;

        bubbleContainer.appendChild(bubble);

        // Remove the bubble from DOM after animation completes
        bubble.addEventListener('animationend', () => {
            bubble.remove();
        });
    }
}