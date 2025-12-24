(function() {
    'use strict';

    // ========================================
    // CONFIGURAÇÃO
    // ========================================
    const CONFIG = {
        smoothScrollDuration: 800,
        smoothScrollEasing: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
        parallaxIntensity: 0.3,
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
    // PARALLAX SUTIL EM NÚMEROS DE SEÇÃO
    // ========================================
    const parallaxElements = document.querySelectorAll('.section-number, .hero-number');
    let ticking = false;

    function updateParallax() {
        const scrolled = window.pageYOffset;
        
        parallaxElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top + scrolled;
            const elementVisible = elementTop < (scrolled + window.innerHeight) && 
                                   elementTop + element.offsetHeight > scrolled;
            
            if (elementVisible) {
                const offset = (scrolled - elementTop) * CONFIG.parallaxIntensity;
                element.style.transform = `translateY(${offset}px)`;
            }
        });
        
        ticking = false;
    }

    function requestParallaxUpdate() {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }

    // ========================================
    // INDICADOR DE PROGRESSO REFINADO
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
    function updateActiveSection() {
        const sections = document.querySelectorAll('section[id], .gt-section[id]');
        const navLinks = document.querySelectorAll('.main-nav a[href^="#"], .nav-grid a[href^="#"]');
        
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

    // ========================================
    // ANIMAÇÕES DE ENTRADA APRIMORADAS
    // ========================================
    const observerOptions = {
        threshold: [0, 0.1, 0.5],
        rootMargin: '0px 0px -10% 0px'
    };

    const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const delay = element.getAttribute('data-delay') || '0';
                
                // Adiciona pequeno delay baseado na posição vertical
                const additionalDelay = Math.min(entry.boundingClientRect.top / 10, 100);
                const totalDelay = parseInt(delay) + additionalDelay;
                
                setTimeout(() => {
                    element.classList.add('animated');
                    
                    // Disparar evento customizado
                    element.dispatchEvent(new CustomEvent('ceni:animated', {
                        detail: { element, intersectionRatio: entry.intersectionRatio }
                    }));
                }, totalDelay);
                
                animationObserver.unobserve(element);
            }
        });
    }, observerOptions);

    // ========================================
    // SCROLL SNAP SUTIL PARA SEÇÕES
    // ========================================
    let scrollTimeout;
    let lastScrollTop = 0;

    function handleScrollEnd() {
        const currentScrollTop = window.pageYOffset;
        const scrollDirection = currentScrollTop > lastScrollTop ? 'down' : 'up';
        lastScrollTop = currentScrollTop;

        // Encontrar seção mais próxima
        const sections = document.querySelectorAll('section, .gt-section');
        let closestSection = null;
        let closestDistance = Infinity;

        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const distance = Math.abs(rect.top);
            
            if (distance < closestDistance && distance < window.innerHeight / 2) {
                closestDistance = distance;
                closestSection = section;
            }
        });

        // Snap sutil apenas se estiver muito próximo de uma seção
        if (closestSection && closestDistance < 50) {
            smoothScrollTo(closestSection, 400);
        }
    }

    // ========================================
    // NAVEGAÇÃO SUAVE PARA ÂNCORAS
    // ========================================
    function initSmoothLinks() {
        const links = document.querySelectorAll('a[href^="#"]');
        
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                // Ignorar links vazios ou apenas "#"
                if (href === '#' || href === '') return;
                
                const target = document.querySelector(href);
                
                if (target) {
                    e.preventDefault();
                    smoothScrollTo(target);
                    
                    // Atualizar URL sem causar scroll
                    if (history.pushState) {
                        history.pushState(null, null, href);
                    }
                }
            });
        });
    }

    // ========================================
    // BACK TO TOP APRIMORADO
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
    // PREVENÇÃO DE JANK EM SCROLL
    // ========================================
    let scrollTimer;
    
    function handleScroll() {
        // Cancelar timer anterior
        clearTimeout(scrollTimer);
        
        // Adicionar classe durante scroll
        document.body.classList.add('is-scrolling');
        
        // Atualizar elementos
        requestProgressUpdate();
        requestParallaxUpdate();
        updateActiveSection();
        
        // Remover classe após scroll terminar
        scrollTimer = setTimeout(() => {
            document.body.classList.remove('is-scrolling');
            handleScrollEnd();
        }, 150);
    }

    // ========================================
    // INICIALIZAÇÃO
    // ========================================
    function init() {
        // Verificar preferência de movimento reduzido
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            console.log('⚡ CENI Scroll: Modo reduzido respeitado');
            return;
        }

        // Observar elementos com data-animate
        const animatedElements = document.querySelectorAll('[data-animate]');
        animatedElements.forEach(el => animationObserver.observe(el));

        // Inicializar navegação suave
        initSmoothLinks();
        initBackToTop();

        // Adicionar listener de scroll otimizado
        window.addEventListener('scroll', handleScroll, { passive: true });

        // Primeira execução
        updateProgress();
        updateParallax();
        updateActiveSection();

        console.log(`⚡ CENI Enhanced Scroll: Sistema ativado`);
        console.log(`   → Parallax: ${parallaxElements.length} elementos`);
        console.log(`   → Animações: ${animatedElements.length} elementos`);
    }

    // Executar quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ========================================
    // API PÚBLICA
    // ========================================
    window.CENIScroll = {
        scrollTo: smoothScrollTo,
        refresh: () => {
            updateProgress();
            updateParallax();
            updateActiveSection();
        },
        stats: () => {
            console.log('CENI Scroll Stats:');
            console.log(`   Parallax elements: ${parallaxElements.length}`);
            console.log(`   Scroll position: ${window.pageYOffset}px`);
            console.log(`   Progress: ${Math.round((window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight)) * 100)}%`);
        }
    };

})();
