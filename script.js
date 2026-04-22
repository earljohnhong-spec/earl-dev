if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.onbeforeunload = function () {
    window.scrollTo(0, 0);
};

document.addEventListener('DOMContentLoaded', () => {
    window.scrollTo(0, 0);

    gsap.registerPlugin(ScrollTrigger, Flip);

    // ==========================================
    // 0. Smooth Scrolling (Lenis)
    // ==========================================
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
    });

    // Force Lenis to strictly lock to top on load
    lenis.scrollTo(0, { immediate: true });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    // ==========================================
    // 1. Initial Page Load & Entrance Animations
    // ==========================================
    const sidebarEl = document.getElementById('sidebar');
    const introCenter = document.getElementById('introCenter');
    const brandTitle = document.getElementById('brandTitle');
    const brandHeaderContainer = document.getElementById('brandHeaderContainer');
    const introEnterBtn = document.getElementById('introEnterBtn');

    if (sidebarEl && sidebarEl.classList.contains('intro-mode')) {
        // Lock lenis scrolling instead of body overflow to keep scrollbar visible (fixes UI jump)
        lenis.stop();
        gsap.set('.main-content', { opacity: 0, pointerEvents: 'none' });

        // Force explicitly staggering to opacity 1 to solve the missing button
        gsap.fromTo(".intro-center > *",
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: "power3.out", delay: 0.3 }
        );

        introEnterBtn.addEventListener('click', () => {
            gsap.to(introEnterBtn, { opacity: 0, scale: 0.8, duration: 0.3 });

            // CRITICAL: Hide the ENTIRE section elements (not just children) so that:
            // - separator border lines disappear (they are borders on the element itself)
            // - active indicator disappears
            // - no flicker of any internal UI during the slide
            gsap.set(['.sidebar-header', '.sidebar-nav', '.sidebar-footer', '.active-indicator'], {
                opacity: 0,
                visibility: 'hidden',
                pointerEvents: 'none'
            });

            // Record GSAP Flip state
            const state = Flip.getState(brandTitle);

            // Execute DOM swap & remove initial mode (triggers CSS width transition)
            brandHeaderContainer.appendChild(brandTitle);
            brandTitle.classList.remove('intro-size');
            sidebarEl.classList.remove('intro-mode');

            // Animate title with Flip
            Flip.from(state, { duration: 1.2, ease: "power3.inOut" });

            // Listen for CSS width transition to FINISH — then reveal contents
            // On mobile there is no width transition, so fire immediately
            const isMobile = window.innerWidth <= 900;

            function revealSidebarContents() {
                const tl = gsap.timeline();
                tl.fromTo('.sidebar-header',
                    { opacity: 0, visibility: 'hidden', y: -10, scale: 0.98 },
                    { opacity: 1, visibility: 'visible', pointerEvents: 'auto', y: 0, scale: 1, duration: 0.4, ease: "power2.out" }
                );
                tl.fromTo('.sidebar-nav',
                    { opacity: 0, visibility: 'hidden' },
                    { opacity: 1, visibility: 'visible', pointerEvents: 'auto', duration: 0.2 },
                    "-=0.1"
                );
                tl.fromTo('.sidebar-item',
                    { opacity: 0, y: -10, scale: 0.98 },
                    { opacity: 1, y: 0, scale: 1, duration: 0.35, stagger: 0.08, ease: "power2.out" },
                    "-=0.05"
                );
                tl.fromTo('.active-indicator',
                    { opacity: 0, visibility: 'hidden' },
                    { opacity: 1, visibility: 'visible', duration: 0.3 },
                    "<"
                );
                tl.fromTo('.sidebar-footer',
                    { opacity: 0, visibility: 'hidden', y: -8 },
                    { opacity: 1, visibility: 'visible', pointerEvents: 'auto', y: 0, duration: 0.35, ease: "power2.out" },
                    "-=0.1"
                );
            }

            if (isMobile) {
                setTimeout(revealSidebarContents, 100);
            } else {
                sidebarEl.addEventListener('transitionend', function onSidebarDone(e) {
                    if (e.propertyName !== 'width') return;
                    sidebarEl.removeEventListener('transitionend', onSidebarDone);
                    revealSidebarContents();
                });
            }

            // Reveal main content and unlock scroll
            gsap.to('.main-content', {
                opacity: 1,
                pointerEvents: 'auto',
                clearProps: 'pointerEvents',
                duration: 1,
                delay: 0.7,
                ease: "power2.out",
                onComplete: () => {
                    lenis.start();
                    introCenter.remove();
                }
            });
        });
    } else {
        // Fallback or mobile sliding logic if not using intro mode
        if (window.innerWidth > 900) {
            gsap.from(".sidebar", {
                y: "-100%", opacity: 0, duration: 1.2, ease: "power3.out"
            });
        }
    }

    // ScrollTrigger: Headers
    gsap.utils.toArray('.gs-header').forEach(header => {
        gsap.from(header, {
            scrollTrigger: {
                trigger: header,
                start: "top 85%",
            },
            y: 50,
            opacity: 0,
            duration: 0.8,
            ease: "power2.out"
        });
    });

    // ScrollTrigger: About Text Stagger
    const aboutText = document.querySelectorAll('.gs-stagger p');
    if (aboutText.length > 0) {
        gsap.from(aboutText, {
            scrollTrigger: { trigger: "#about", start: "top 70%" },
            x: -50, opacity: 0, duration: 0.8, stagger: 0.15, ease: "power2.out"
        });
    }

    // ScrollTrigger: About Image Entrance
    gsap.from(".gs-slide-right", {
        scrollTrigger: { trigger: "#about", start: "top 70%" },
        x: 50, opacity: 0, duration: 1, ease: "back.out(1.4)"
    });



    // Stabilize intro: remove gs-slide-right after 2 seconds to prevent re-triggering
    setTimeout(() => {
        const slideRightElements = document.querySelectorAll('.gs-slide-right');
        slideRightElements.forEach(el => {
            // el.classList.remove('gs-slide-right');
            // Actually, better to just let ScrollTrigger do its thing, 
            // but if it's re-triggering on reparenting, we can disable it.
            if (ScrollTrigger.getById(el.id + "_trigger")) {
                // ScrollTrigger.getById(el.id + "_trigger").kill();
            }
        });
    }, 2000);


    // ScrollTrigger: Project Category Cards Stagger Expand
    const projectCards = document.querySelectorAll('.project-category-card');
    if (projectCards.length > 0) {
        gsap.from(projectCards, {
            scrollTrigger: { trigger: "#projects", start: "top 60%" },
            y: 50, opacity: 0, duration: 0.8, stagger: 0.15, ease: "power2.out"
        });
    }

    // Secondary ScrollTriggers (Skills, Exp, Edu, Contact)
    gsap.from(".section-subtitle", {
        scrollTrigger: { trigger: "#skills", start: "top 75%" },
        y: 20, opacity: 0, duration: 0.6, delay: 0.1, ease: "power2.out"
    });

    gsap.from(".gs-skill", {
        scrollTrigger: { trigger: "#skills", start: "top 75%" },
        y: 30, opacity: 0, duration: 0.5, stagger: 0.05, delay: 0.2, ease: "power1.out"
    });

    gsap.from(".gs-timeline", {
        scrollTrigger: { trigger: "#experience", start: "top 75%" },
        x: -30, opacity: 0, duration: 0.6, stagger: 0.2, ease: "power2.out"
    });

    gsap.from(".gs-edu-left", {
        scrollTrigger: { trigger: "#education", start: "top 75%" },
        x: -50, opacity: 0, duration: 0.8, ease: "power2.out"
    });
    gsap.from(".gs-edu-right", {
        scrollTrigger: { trigger: "#education", start: "top 75%" },
        x: 50, opacity: 0, duration: 0.8, ease: "power2.out"
    });

    gsap.from(".gs-icon", {
        scrollTrigger: { trigger: "#contact", start: "top 80%" },
        y: 40, opacity: 0, duration: 0.8, stagger: 0.1, ease: "back.out(1.5)"
    });


    // ==========================================
    // 2. Dynamic Active Nav & Sidebar Mechanisms
    // ==========================================
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    const activeIndicator = document.getElementById('activeIndicator');
    const sections = document.querySelectorAll('.section');

    // Updates Active Highlight Pillar Bar Geometry
    function updateActiveIndicator() {
        const activeItem = document.querySelector('.sidebar-item.active');
        if (activeItem && activeIndicator) {
            // Measure offset relative to nearest positioned ancestor (.sidebar-nav)
            const topOffset = activeItem.offsetTop;
            const ht = activeItem.offsetHeight;

            // GSAP handles the smooth tracking animation natively
            gsap.to(activeIndicator, {
                y: topOffset,
                height: ht,
                duration: 0.3,
                ease: "power2.out"
            });
        }
    }

    // Initialize indicator position
    setTimeout(updateActiveIndicator, 100);

    // Scroll binding
    window.addEventListener('scroll', () => {
        let scrollPos = window.scrollY + 250;

        sections.forEach(section => {
            if (section.offsetTop <= scrollPos && (section.offsetTop + section.offsetHeight) > scrollPos) {
                const id = section.getAttribute('id');
                const correspondingItem = document.querySelector(`.sidebar-item[data-target='${id}']`);

                if (correspondingItem && !correspondingItem.classList.contains('active')) {
                    sidebarItems.forEach(i => i.classList.remove('active'));
                    correspondingItem.classList.add('active');
                    updateActiveIndicator();
                }
            }
        });
    });

    // Sidebar Manual Link Click
    sidebarItems.forEach(item => {
        item.addEventListener('click', function () {
            // Close mobile menu if open
            if (sidebar.classList.contains('open')) {
                toggleSidebar();
            }
            // Navigate
            const target = document.getElementById(this.dataset.target);
            if (target) {
                // Better smooth scrolling natively through Lenis
                lenis.scrollTo(target, { duration: 1.2 });

                // Reset Projects custom state if selecting the Projects tab to avoid modal overlaps
                if (this.dataset.target === 'projects') {
                    const expandedView = document.getElementById('expandedView');
                    const innerViewerOverlay = document.getElementById('innerViewerOverlay');
                    const expandedTitleOverlay = document.getElementById('expandedTitleOverlay');
                    const mainProjectsHeader = document.getElementById('mainProjectsHeader');
                    const btnCloseExpanded = document.getElementById('btnCloseExpanded');

                    if (expandedView && expandedView.classList.contains('active')) {
                        expandedView.classList.remove('active');
                        gsap.set(expandedView, { x: '-100%', opacity: 0 });

                        if (innerViewerOverlay) innerViewerOverlay.classList.remove('active');
                        if (expandedTitleOverlay) gsap.set(expandedTitleOverlay, { x: -200, opacity: 0 });
                        if (mainProjectsHeader) gsap.set(mainProjectsHeader, { x: 0, opacity: 1 });

                        if (btnCloseExpanded) {
                            btnCloseExpanded.classList.remove('is-back');
                            btnCloseExpanded.querySelector('i').className = 'fa-solid fa-xmark';
                            btnCloseExpanded.setAttribute('aria-label', 'Close');
                        }
                    }
                }

                // Determine if we are already viewing the section
                const rect = target.getBoundingClientRect();
                const isInView = Math.abs(rect.top) < window.innerHeight * 0.5;

                // Identify all GSAP scroll triggers tied to this section and restart them
                ScrollTrigger.getAll().forEach(st => {
                    if (st.trigger === target || target.contains(st.trigger)) {
                        if (st.animation) {
                            if (isInView) {
                                st.animation.restart(); // Play instantly if already on screen
                            } else {
                                st.animation.restart(true).pause(); // Pause at zero state
                                setTimeout(() => {
                                    st.animation.play(); // Play right as the scroll arrives
                                }, 800);
                            }
                        }
                    }
                });
            }
        });
    });

    // Mobile Hamburger
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    function toggleSidebar() {
        const isOpen = sidebar.classList.contains('open');
        if (isOpen) {
            hamburger.classList.remove('active');
            sidebar.classList.remove('open');
            overlay.style.display = 'none';
            document.body.style.overflow = '';
        } else {
            hamburger.classList.add('active');
            sidebar.classList.add('open');
            overlay.style.display = 'block';
            document.body.style.overflow = 'hidden';

            // On open mobile nav animate lists
            gsap.fromTo(sidebarItems,
                { x: -20, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: "power2.out", onComplete: updateActiveIndicator }
            );
        }
    }
    if (hamburger) hamburger.addEventListener('click', toggleSidebar);
    if (overlay) overlay.addEventListener('click', toggleSidebar);

    // ==========================================
    // 3. Stretched Footer Mechanic 
    // ==========================================
    const footer = document.getElementById('sidebarFooter');

    window.addEventListener('scroll', () => {
        // Detect if user scrolled near bottom of page
        const scrollPosition = window.innerHeight + window.scrollY;
        const pageHeight = document.body.offsetHeight;

        // 50px buffer allows natural detection
        if (scrollPosition >= pageHeight - 50 && window.innerWidth > 900) {
            footer.classList.add('stretched');
        } else {
            footer.classList.remove('stretched');
        }
    });

    // ==========================================
    // 4. Expanded Project Modal State
    // ==========================================
    const expandedView = document.getElementById('expandedView');
    const closeExpanded = document.getElementById('closeExpanded');
    const mainProjectsHeader = document.getElementById('mainProjectsHeader');
    const expandedTitleOverlay = document.getElementById('expandedTitleOverlay');

    window.openExpandedProj = function (title) {
        if (expandedTitleOverlay) expandedTitleOverlay.textContent = title;
        expandedView.classList.add('active');

        // Force initial positions before sync animation
        gsap.set(mainProjectsHeader, { x: 0, opacity: 1 });
        gsap.set(expandedTitleOverlay, { x: -200, opacity: 0 });

        const syncDur = 0.6;
        const syncEase = "power3.inOut";

        // Define a strict timeline to guarantee synchronous side-by-side gap behavior
        let syncTl = gsap.timeline();

        syncTl.to(mainProjectsHeader, {
            x: 200, opacity: 0, duration: syncDur, ease: syncEase
        }, 0);

        syncTl.to(expandedTitleOverlay, {
            x: 0, opacity: 1, duration: syncDur, ease: syncEase
        }, 0);

        // Modal slide in mechanism
        expandedView.style.pointerEvents = "none";
        gsap.fromTo(expandedView,
            { x: '-100%', opacity: 0 },
            { x: '0%', opacity: 1, duration: 0.5, ease: "power2.out", onComplete: () => expandedView.style.pointerEvents = "auto" }
        );

        // Show correct category grid, hide others
        document.querySelectorAll('.expanded-grid').forEach(g => g.style.display = 'none');
        const activeGrid = document.getElementById('grid-' + title);
        if (activeGrid) activeGrid.style.display = '';

        // Stagger grid slots
        const gridSlots = activeGrid ? activeGrid.querySelectorAll('.grid-slot') : [];
        gsap.fromTo(gridSlots,
            { scale: 0.8, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.4, stagger: 0.05, ease: "back.out(1.2)", delay: 0.2 }
        );
    };

    if (closeExpanded) {
        closeExpanded.addEventListener('click', () => {
            const syncDur = 0.5;
            const syncEase = "power3.inOut";

            // Revert titles perfectly synchronized
            let syncTl = gsap.timeline();

            syncTl.to(expandedTitleOverlay, {
                x: -200, opacity: 0, duration: syncDur, ease: syncEase
            }, 0);

            syncTl.to(mainProjectsHeader, {
                x: 0, opacity: 1, duration: syncDur, ease: syncEase
            }, 0);

            gsap.to(expandedView, {
                x: '-100%', opacity: 0, duration: 0.4, ease: "power2.in",
                onComplete: () => {
                    expandedView.classList.remove('active');
                }
            });
        });
    }

    // ==========================================
    // 5. Inner Project Viewer (Grid Click)
    // ==========================================
    const innerViewerOverlay = document.getElementById('innerViewerOverlay');
    const btnCloseExpanded = document.getElementById('btnCloseExpanded');

    // Show cover image on slots that have a src in first slot-img
    document.querySelectorAll('.grid-slot').forEach(slot => {
        const imgs = slot.querySelectorAll('.slot-img');
        const icon = slot.querySelector('i');
        if (imgs[0] && imgs[0].src && imgs[0].src !== window.location.href) {
            const cover = document.createElement('img');
            cover.src = imgs[0].src;
            cover.className = 'slot-cover';
            slot.appendChild(cover);
            if (icon) icon.style.display = 'none';
        }
    });

    // Open inner viewer on grid slot click
    document.querySelectorAll('.grid-slot').forEach(slot => {
        slot.addEventListener('click', () => {
            const imgs = slot.querySelectorAll('.slot-img');
            const thumbSlots = document.querySelectorAll('#ivThumbnails .iv-thumb-slot');
            const ivMainImg = document.getElementById('ivMainImg');
            const ivMainPlaceholder = document.getElementById('ivMainPlaceholder');

            thumbSlots.forEach((thumb, i) => {
                const src = imgs[i] && imgs[i].src !== window.location.href ? imgs[i].src : '';
                const thumbImg = thumb.querySelector('.thumb-img');
                const thumbIcon = thumb.querySelector('i');
                if (src) {
                    thumbImg.src = src;
                    thumbImg.style.display = 'block';
                    thumbIcon.style.display = 'none';
                } else {
                    thumbImg.src = '';
                    thumbImg.style.display = 'none';
                    thumbIcon.style.display = '';
                }
                thumb.classList.remove('active-thumb');
            });
            thumbSlots[0].classList.add('active-thumb');

            const firstSrc = imgs[0] && imgs[0].src !== window.location.href ? imgs[0].src : '';
            if (firstSrc) {
                ivMainImg.src = firstSrc;
                ivMainImg.style.display = 'block';
                ivMainPlaceholder.style.display = 'none';
                gsap.fromTo(ivMainImg, { scale: 0.95, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' });
            } else {
                ivMainImg.style.display = 'none';
                ivMainPlaceholder.style.display = '';
            }

            thumbSlots.forEach((thumb, i) => {
                thumb.onclick = () => {
                    const src = imgs[i] && imgs[i].src !== window.location.href ? imgs[i].src : '';
                    thumbSlots.forEach(t => t.classList.remove('active-thumb'));
                    thumb.classList.add('active-thumb');
                    if (src) {
                        ivMainImg.src = src;
                        ivMainImg.style.display = 'block';
                        ivMainPlaceholder.style.display = 'none';
                        gsap.fromTo(ivMainImg, { opacity: 0.4 }, { opacity: 1, duration: 0.3 });
                    } else {
                        ivMainImg.style.display = 'none';
                        ivMainPlaceholder.style.display = '';
                    }
                };
            });

            if (innerViewerOverlay) {
                innerViewerOverlay.classList.add('active');
                if (btnCloseExpanded) {
                    btnCloseExpanded.classList.add('is-back');
                    btnCloseExpanded.querySelector('i').className = 'fa-solid fa-arrow-left';
                    btnCloseExpanded.setAttribute('aria-label', 'Back to Grid');
                }
            }
        });
    });

    // Helper: reset close button back to X (close expanded)
    function resetCloseBtn() {
        if (btnCloseExpanded) {
            btnCloseExpanded.classList.remove('is-back');
            btnCloseExpanded.querySelector('i').className = 'fa-solid fa-xmark';
            btnCloseExpanded.setAttribute('aria-label', 'Close');
        }
    }

    // Outside click on inner viewer backdrop closes it and reverts button
    if (innerViewerOverlay) {
        innerViewerOverlay.addEventListener('click', (e) => {
            if (e.target === innerViewerOverlay) {
                innerViewerOverlay.classList.remove('active');
                resetCloseBtn();
            }
        });
    }

    // Outside click to close Expanded View
    if (expandedView) {
        expandedView.addEventListener('click', (e) => {
            if (e.target === expandedView) {
                expandedView.classList.remove('active');
                gsap.to(expandedTitleOverlay, { x: -200, opacity: 0, duration: 0.6, ease: "power3.inOut" });
                gsap.to(mainProjectsHeader, { x: 0, opacity: 1, duration: 0.6, ease: "power3.inOut" });
            }
        });
    }

    // Shared close / back button logic
    if (btnCloseExpanded) {
        btnCloseExpanded.addEventListener('click', () => {
            if (btnCloseExpanded.classList.contains('is-back')) {
                // Inner viewer is open — close it, revert to X
                if (innerViewerOverlay) innerViewerOverlay.classList.remove('active');
                resetCloseBtn();
            } else {
                // Close the whole expanded grid
                gsap.to(expandedView, {
                    x: '-100%', opacity: 0, duration: 0.4, ease: "power2.in",
                    onComplete: () => {
                        expandedView.classList.remove('active');
                        if (innerViewerOverlay) innerViewerOverlay.classList.remove('active');
                        resetCloseBtn();
                    }
                });
                gsap.to(expandedTitleOverlay, { x: -200, opacity: 0, duration: 0.5, ease: "power3.inOut" });
                gsap.to(mainProjectsHeader, { x: 0, opacity: 1, duration: 0.5, ease: "power3.inOut" });
            }
        });
    }

    /* ==========================================
       5. Projects Background Marquee Logic
       ========================================== */
    const projectMarquee = document.getElementById('projectsMarquee');
    const marqueeRows = document.querySelectorAll('.marquee-row');

    // Combined Image Pool from all categories
    const marqueePool = [
        100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, // Default
        200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, // Recent
        300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, // UI/UX
        400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411  // Graphics
    ];

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function populateMarquee() {
        marqueeRows.forEach((row, rowIndex) => {
            row.innerHTML = '';
            // Get a random shuffled slice of the pool for this row
            let rowIds = shuffleArray([...marqueePool]).slice(0, 12);
            
            // Duplicate for seamless scroll
            const contentIds = [...rowIds, ...rowIds];
            contentIds.forEach(id => {
                const item = document.createElement('div');
                item.className = 'marquee-item';
                const img = document.createElement('img');
                img.src = `https://picsum.photos/400/300?random=${id}`;
                img.loading = 'lazy';
                item.appendChild(img);
                row.appendChild(item);
            });
        });
    }

    // Initialize once with randomized pool
    if (projectMarquee) {
        populateMarquee();
    }

});




