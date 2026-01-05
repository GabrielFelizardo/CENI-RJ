(function() {
    'use strict';

    // ========================================
    // CONFIGURAÇÃO
    // ========================================
    const CONFIG = {
        smoothScrollDuration: 800,
        smoothScrollEasing: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
        progressThrottle: 16,
        sectionDetectionOffset: 100
    };

    // ========================================
    // SMOOTH SCROLL PROGRAMÁTICO
    // ========================================
    function smoothScrollTo(target, duration = CONFIG.smoothScrollDuration) {
        const startPosition = window.pageYOffset;
        const targetPosition = target.getBoundingClientRect().top + startPosition;
        const distance = targetPosition - startPosition;
        let startTime = null;

        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            const ease = CONFIG.smoothScrollEasing(progress);
            
            window.scrollTo(0, startPosition + (distance * ease));

            if (timeElapsed < duration) {
                requestAnimationFrame(animation);
            }
        }

        requestAnimationFrame(animation);
    }

    // ========================================
    // INDICADOR DE PROGRESSO
    // ========================================
    const progressBar = document.getElementById('progressBar');
    let progressTicking = false;

    function updateProgress() {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        
        if (progressBar) {
            progressBar.style.width = scrolled + '%';
        }
        
        progressTicking = false;
    }

    function requestProgressUpdate() {
        if (!progressTicking) {
            requestAnimationFrame(updateProgress);
            progressTicking = true;
        }
    }

    // ========================================
    // DETECÇÃO DE SEÇÃO ATIVA
    // ========================================
    let sectionUpdateTimeout;
    
    function updateActiveSection() {
        const sections = document.querySelectorAll('section[id], .gt-section[id]');
        const navLinks = document.querySelectorAll('.main-nav a[href^="#"], .nav-grid a[href^="#"]');
        
        if (sections.length === 0) return;
        
        let currentSection = '';
        const scrollPosition = window.pageYOffset + CONFIG.sectionDetectionOffset;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + currentSection) {
                link.classList.add('active');
            }
        });
    }
    
    function requestSectionUpdate() {
        if (!sectionUpdateTimeout) {
            sectionUpdateTimeout = setTimeout(() => {
                updateActiveSection();
                sectionUpdateTimeout = null;
            }, 200);
        }
    }

    // ========================================
    // ANIMAÇÕES DE ENTRADA - CORRIGIDO
    // ========================================
    const observerOptions = {
        threshold: 0,
        rootMargin: '0px 0px -10% 0px'
    };

    const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const delay = element.getAttribute('data-delay') || '0';
                const totalDelay = parseInt(delay);
                
                setTimeout(() => {
                    element.classList.add('animated');
                    element.dispatchEvent(new CustomEvent('ceni:animated', {
                        detail: { element }
                    }));
                }, totalDelay);
                
                animationObserver.unobserve(element);
            }
        });
    }, observerOptions);

    // ========================================
    // ANIMAR ELEMENTOS JÁ VISÍVEIS (FALLBACK)
    // ========================================
    function animateVisibleElements() {
        const animatedElements = document.querySelectorAll('[data-animate]:not(.animated)');
        
        animatedElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const isVisible = (
                rect.top < window.innerHeight &&
                rect.bottom > 0
            );
            
            if (isVisible) {
                const delay = element.getAttribute('data-delay') || '0';
                setTimeout(() => {
                    element.classList.add('animated');
                }, parseInt(delay));
            }
        });
    }

    // ========================================
    // NAVEGAÇÃO SUAVE PARA ÂNCORAS
    // ========================================
    function initSmoothLinks() {
        const links = document.querySelectorAll('a[href^="#"]');
        
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                if (href === '#' || href === '') return;
                
                const target = document.querySelector(href);
                
                if (target) {
                    e.preventDefault();
                    smoothScrollTo(target);
                    
                    if (history.pushState) {
                        history.pushState(null, null, href);
                    }
                }
            });
        });
    }

    // ========================================
    // BACK TO TOP
    // ========================================
    function initBackToTop() {
        const backToTop = document.getElementById('backToTop');
        
        if (backToTop) {
            backToTop.addEventListener('click', (e) => {
                e.preventDefault();
                smoothScrollTo(document.body, 600);
            });
        }
    }

    // ========================================
    // SCROLL HANDLER
    // ========================================
    let scrollTimer;
    let isScrolling = false;
    
    function handleScroll() {
        clearTimeout(scrollTimer);
        
        if (!isScrolling) {
            document.body.classList.add('is-scrolling');
            isScrolling = true;
        }
        
        requestProgressUpdate();
        
        scrollTimer = setTimeout(() => {
            document.body.classList.remove('is-scrolling');
            isScrolling = false;
            requestSectionUpdate();
            animateVisibleElements(); // Animar novos elementos visíveis
        }, 150);
    }

    // ========================================
    // INICIALIZAÇÃO
    // ========================================
    function init() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            console.log('⚡ CENI Scroll: Modo reduzido respeitado');
            // Ainda assim, mostrar os elementos
            document.querySelectorAll('[data-animate]').forEach(el => {
                el.classList.add('animated');
            });
            return;
        }

        // Observar elementos com data-animate
        const animatedElements = document.querySelectorAll('[data-animate]');
        animatedElements.forEach(el => animationObserver.observe(el));

        // IMPORTANTE: Animar elementos já visíveis imediatamente
        setTimeout(() => {
            animateVisibleElements();
        }, 100);

        // Inicializar navegação suave
        initSmoothLinks();
        initBackToTop();

        // Adicionar listener de scroll
        window.addEventListener('scroll', handleScroll, { passive: true });

        // Primeira execução
        updateProgress();
        setTimeout(requestSectionUpdate, 100);

        console.log(`⚡ CENI Enhanced Scroll: Sistema ativado (OTIMIZADO)`);
        console.log(`   → Animações: ${animatedElements.length} elementos`);
    }

    // Executar quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ========================================
    // MUTATION OBSERVER - Para conteúdo dinâmico
    // ========================================
    const contentObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Observar novos elementos com data-animate
                        const newAnimElements = node.querySelectorAll ? 
                            node.querySelectorAll('[data-animate]') : [];
                        
                        newAnimElements.forEach(el => {
                            if (!el.classList.contains('animated')) {
                                animationObserver.observe(el);
                            }
                        });
                        
                        // Se o próprio node tem data-animate
                        if (node.hasAttribute && node.hasAttribute('data-animate')) {
                            if (!node.classList.contains('animated')) {
                                animationObserver.observe(node);
                            }
                        }
                        
                        // Animar elementos já visíveis
                        setTimeout(animateVisibleElements, 50);
                    }
                });
            }
        });
    });

    // Observar mudanças no body
    if (document.body) {
        contentObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // ========================================
    // API PÚBLICA
    // ========================================
    window.CENIScroll = {
        scrollTo: smoothScrollTo,
        refresh: () => {
            updateProgress();
            requestSectionUpdate();
            animateVisibleElements();
        },
        forceAnimate: () => {
            document.querySelectorAll('[data-animate]').forEach(el => {
                el.classList.add('animated');
            });
        },
        stats: () => {
            console.log('📊 CENI Scroll Stats (Otimizado):');
            console.log(`   Scroll position: ${window.pageYOffset}px`);
            console.log(`   Progress: ${Math.round((window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight)) * 100)}%`);
            console.log(`   Elementos animados: ${document.querySelectorAll('[data-animate].animated').length}`);
            console.log(`   Elementos pendentes: ${document.querySelectorAll('[data-animate]:not(.animated)').length}`);
        }
    };

})();
