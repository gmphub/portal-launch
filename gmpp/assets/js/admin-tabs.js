document.addEventListener('DOMContentLoaded', function() {
    const navContainer = document.querySelector('.admin-nav-tabs-container');
    const leftFade = document.querySelector('.scroll-fade-left');
    const rightFade = document.querySelector('.scroll-fade-right');

    if (navContainer && leftFade && rightFade) {
        function updateFades() {
            const scrollLeft = navContainer.scrollLeft;
            const maxScroll = navContainer.scrollWidth - navContainer.clientWidth;
            leftFade.style.opacity = scrollLeft > 10 ? '1' : '0';
            rightFade.style.opacity = scrollLeft < maxScroll - 10 ? '1' : '0';
        }
        updateFades();
        navContainer.addEventListener('scroll', updateFades);

        navContainer.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                navContainer.scrollBy({ left: -100, behavior: 'smooth' });
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                navContainer.scrollBy({ left: 100, behavior: 'smooth' });
            }
        });
    }
});
