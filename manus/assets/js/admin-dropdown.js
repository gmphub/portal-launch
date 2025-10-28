document.addEventListener('DOMContentLoaded', function() {
    const moreBtn = document.getElementById('moreDropdown');
    const moreMenu = document.getElementById('moreDropdownMenu');

    if (moreBtn && moreMenu) {
        let isOpen = false;

        moreBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            isOpen = !isOpen;
            moreMenu.style.display = isOpen ? 'block' : 'none';

            const chevron = moreBtn.querySelector('.fa-chevron-down');
            if (chevron) {
                chevron.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
            }
        });

        document.addEventListener('click', function(e) {
            if (!moreBtn.contains(e.target) && !moreMenu.contains(e.target)) {
                isOpen = false;
                moreMenu.style.display = 'none';
                const chevron = moreBtn.querySelector('.fa-chevron-down');
                if (chevron) {
                    chevron.style.transform = 'rotate(0deg)';
                }
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && isOpen) {
                isOpen = false;
                moreMenu.style.display = 'none';
                const chevron = moreBtn.querySelector('.fa-chevron-down');
                if (chevron) {
                    chevron.style.transform = 'rotate(0deg)';
                }
                moreBtn.focus();
            }
        });
    }
});
