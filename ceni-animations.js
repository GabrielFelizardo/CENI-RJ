(function() {
    'use strict';

    // ========================================
    // CONFIGURAÇÃO AVANÇADA
    // ========================================
    const CONFIG = {
        // Intersection Observer Settings
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
        rootMargin: '0px 0px -50px 0px',
        
        // Performance Settings
        useRAF: true,
        batchSize: 10,
        
        // Delays disponíveis (em ms)
        delays: {
            '0': 0,
            '50': 50,
            '100': 100,
            '150': 150,
            '200': 200,
            '250': 250,
            '300': 300,
            '350': 350,
            '400': 400,
            '450': 450,
            '500': 500,
            '600': 600,
            '700': 700,
            '800': 800
        },
        
        repeatAnimation: false
    };

    // ========================================
    // DETECÇÃO DE CAPACIDADES DO DISPOSITIVO
    // ========================================
    const deviceCapabilities = {
        prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        hasIntersectionObserver: 'IntersectionObserver' in window,
        isLowPowerDevice: navigator.hardwareConcurrency ? navigator.hardwareConcurrency <= 4 : false,
        isSlowConnection: navigator.connection ? 
            (navigator.connection.effectiveType === '2g' || 
             navigator.connection.effectiveType === 'slow-2g') : false
    };

    // ========================================
    // AJUSTES ADAPTATIVOS DE PERFORMANCE
    // ========================================
    function adjustConfigForPerformance() {
        if (deviceCapabilities.isLowPowerDevice || deviceCapabilities.isSlowConnection) {
            CONFIG.threshold = [0, 0.5, 1];
            CONFIG.batchSize = 5;
        }
        
        if (deviceCapabilities.isMobile && deviceCapabilities.prefersReducedMotion) {
            return false;
        }
        
        return true;
    }

    // ========================================
    // SISTEMA DE FILA PARA ANIMAÇÕES
    // ========================================
    const animationQueue = [];
    let isProcessingQueue = false;

    function addToQueue(element, delay) {
        animationQueue.push({ element, delay, timestamp: Date.now() });
        
        if (!isProcessingQueue) {
            processQueue();
        }
    }

    function processQueue() {
        if (animationQueue.length === 0) {
            isProcessingQueue = false;
            return;
        }
        
        isProcessingQueue = true;
        const batch = animationQueue.splice(0, CONFIG.batchSize);
        
        batch.forEach(item => {
            scheduleAnimation(item.element, item.delay);
        });
        
        if (CONFIG.useRAF && animationQueue.length > 0) {
            requestAnimationFrame(() => {
                setTimeout(processQueue, 16);
            });
        } else if (animationQueue.length > 0) {
            setTimeout(processQueue, 50);
        } else {
            isProcessingQueue = false;
        }
    }

    // ========================================
    // AGENDAMENTO DE ANIMAÇÃO INDIVIDUAL
    // ========================================
    function scheduleAnimation(element, delay) {
        const actualDelay = CONFIG.delays[delay] || 0;
        
        if (CONFIG.useRAF && actualDelay > 0) {
            setTimeout(() => {
                requestAnimationFrame(() => {
                    triggerAnimation(element);
                });
            }, actualDelay);
        } else if (actualDelay > 0) {
            setTimeout(() => {
                triggerAnimation(element);
            }, actualDelay);
        } else {
            if (CONFIG.useRAF) {
                requestAnimationFrame(() => {
                    triggerAnimation(element);
                });
            } else {
                triggerAnimation(element);
            }
        }
    }

    // ========================================
    // TRIGGER DE ANIMAÇÃO
    // ========================================
    function triggerAnimation(element) {
        element.classList.add('animated');
        
        const event = new CustomEvent('ceni:animated', {
            detail: { 
                element,
                animationType: element.getAttribute('data-animate'),
                timestamp: Date.now()
            },
            bubbles: true
        });
        element.dispatchEvent(event);
        
        if (window.gtag) {
            window.gtag('event', 'animation_triggered', {
                'animation_type': element.getAttribute('data-animate'),
                'element_id': element.id || 'unnamed'
            });
        }
    }

    // ========================================
    // INTERSECTION OBSERVER HANDLER
    // ========================================
    let observer = null;

    function handleIntersection(entries) {
        entries.forEach(entry => {
            const element = entry.target;
            
            if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
                const delay = element.getAttribute('data-delay') || '0';
                addToQueue(element, delay);
                
                if (!CONFIG.repeatAnimation) {
                    observer.unobserve(element);
                }
            }
            else if (!entry.isIntersecting && CONFIG.repeatAnimation) {
                element.classList.remove('animated');
            }
        });
    }

    // ========================================
    // FALLBACK PARA NAVEGADORES ANTIGOS
    // ========================================
    function fallbackAnimation() {
        console.warn('⚠️ CENI Animations: Intersection Observer não suportado. Usando fallback.');
        
        const elements = document.querySelectorAll('[data-animate]');
        elements.forEach((el, index) => {
            const delay = parseInt(el.getAttribute('data-delay') || '0');
            setTimeout(() => {
                el.style.opacity = '1';
                el.style.transform = 'none';
                el.classList.add('animated');
            }, delay + (index * 50));
        });
    }

    // ========================================
    // FIX PARA LOGO - Remove GPU Acceleration
    // ========================================
    function fixLogoRendering() {
        // Selecionar todos os elementos do header
        const headerElements = document.querySelectorAll('.gov-header, .gov-header *, .header-grid, .header-grid *, .gov-logo-img');
        
        headerElements.forEach(el => {
            // Remover propriedades de GPU acceleration
            el.style.transform = 'none';
            el.style.backfaceVisibility = 'visible';
            el.style.perspective = 'none';
            el.style.willChange = 'auto';
        });
        
        console.log('🔧 Logo rendering fixed - GPU acceleration removida do header');
    }

    // ========================================
    // INICIALIZAÇÃO INTELIGENTE
    // ========================================
    function init() {
        console.log('🎨 CENI Animation System V2.1 Iniciando...');
        
        // FIX: Aplicar correção do logo IMEDIATAMENTE
        fixLogoRendering();
        
        if (!adjustConfigForPerformance()) {
            console.log('⚡ Animações desabilitadas devido a preferências do usuário');
            document.querySelectorAll('[data-animate]').forEach(el => {
                el.style.opacity = '1';
                el.style.transform = 'none';
            });
            return;
        }
        
        if (deviceCapabilities.prefersReducedMotion) {
            console.log('♿ Modo acessibilidade: Animações simplificadas');
            document.querySelectorAll('[data-animate]').forEach(el => {
                el.style.opacity = '1';
                el.style.transform = 'none';
            });
            return;
        }
        
        if (!deviceCapabilities.hasIntersectionObserver) {
            fallbackAnimation();
            return;
        }
        
        observer = new IntersectionObserver(handleIntersection, {
            threshold: CONFIG.threshold,
            rootMargin: CONFIG.rootMargin
        });
        
        const elements = document.querySelectorAll('[data-animate]');
        
        if (elements.length === 0) {
            console.log('ℹ️ Nenhum elemento para animar encontrado');
            return;
        }
        
        elements.forEach(el => {
            observer.observe(el);
        });
        
        console.log(`✨ CENI Animations: ${elements.length} elementos prontos`);
        console.log(`📱 Dispositivo: ${deviceCapabilities.isMobile ? 'Mobile' : 'Desktop'}`);
        console.log(`⚡ Performance: ${deviceCapabilities.isLowPowerDevice ? 'Modo Econômico' : 'Modo Completo'}`);
        
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.table({
                'Intersection Thresholds': CONFIG.threshold.length,
                'Batch Size': CONFIG.batchSize,
                'Use RAF': CONFIG.useRAF,
                'Repeat Animations': CONFIG.repeatAnimation,
                'Prefers Reduced Motion': deviceCapabilities.prefersReducedMotion
            });
        }
    }

    // ========================================
    // API PÚBLICA EXPANDIDA
    // ========================================
    window.CENIAnimations = {
        version: '2.1.0',
        
        refresh: function() {
            if (!observer) {
                console.warn('Observer não inicializado. Executando init()...');
                init();
                return;
            }
            
            const newElements = document.querySelectorAll('[data-animate]:not(.animated)');
            newElements.forEach(el => observer.observe(el));
            
            console.log(`🔄 Refresh: ${newElements.length} novos elementos adicionados`);
            return newElements.length;
        },
        
        stats: function() {
            const total = document.querySelectorAll('[data-animate]').length;
            const animated = document.querySelectorAll('[data-animate].animated').length;
            const pending = total - animated;
            const percentage = total > 0 ? Math.round((animated / total) * 100) : 0;
            
            const stats = {
                total,
                animated,
                pending,
                percentage: `${percentage}%`,
                queueSize: animationQueue.length,
                isProcessing: isProcessingQueue
            };
            
            console.log('📊 CENI Animation Stats:');
            console.table(stats);
            
            return stats;
        },
        
        animate: function(elementOrSelector) {
            const element = typeof elementOrSelector === 'string' 
                ? document.querySelector(elementOrSelector)
                : elementOrSelector;
            
            if (!element) {
                console.error('Elemento não encontrado:', elementOrSelector);
                return false;
            }
            
            triggerAnimation(element);
            return true;
        },
        
        reset: function(elementOrSelector) {
            const element = typeof elementOrSelector === 'string'
                ? document.querySelector(elementOrSelector)
                : elementOrSelector;
            
            if (!element) {
                console.error('Elemento não encontrado:', elementOrSelector);
                return false;
            }
            
            element.classList.remove('animated');
            
            if (observer) {
                observer.observe(element);
            }
            
            return true;
        },
        
        resetAll: function() {
            const elements = document.querySelectorAll('[data-animate].animated');
            elements.forEach(el => {
                el.classList.remove('animated');
                if (observer) {
                    observer.observe(el);
                }
            });
            
            console.log(`🔄 Reset: ${elements.length} animações resetadas`);
            return elements.length;
        },
        
        pause: function() {
            if (observer) {
                observer.disconnect();
                console.log('⏸️ Sistema de animações pausado');
            }
        },
        
        resume: function() {
            if (observer) {
                const elements = document.querySelectorAll('[data-animate]:not(.animated)');
                elements.forEach(el => observer.observe(el));
                console.log(`▶️ Sistema retomado: ${elements.length} elementos re-observados`);
            }
        },
        
        configure: function(options) {
            Object.assign(CONFIG, options);
            console.log('⚙️ Configuração atualizada:', options);
            return CONFIG;
        },
        
        getConfig: function() {
            return { ...CONFIG };
        },
        
        getDeviceCapabilities: function() {
            return { ...deviceCapabilities };
        },
        
        fixLogo: function() {
            fixLogoRendering();
            console.log('🔧 Logo fix aplicado manualmente');
        },
        
        enableDebug: function() {
            document.addEventListener('ceni:animated', (e) => {
                console.log('🎬 Animação disparada:', {
                    element: e.detail.element,
                    type: e.detail.animationType,
                    time: new Date(e.detail.timestamp).toLocaleTimeString()
                });
            });
            
            console.log('🐛 Modo debug habilitado');
        }
    };

    // ========================================
    // AUTO-INICIALIZAÇÃO
    // ========================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Re-aplicar fix do logo após 100ms para garantir
    setTimeout(fixLogoRendering, 100);

    // ========================================
    // LISTENER PARA MUDANÇAS DE PREFERÊNCIA
    // ========================================
    const motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    motionMediaQuery.addEventListener('change', (e) => {
        if (e.matches) {
            console.log('♿ Usuário ativou modo de movimento reduzido');
            document.querySelectorAll('[data-animate]').forEach(el => {
                el.style.transition = 'none';
                el.style.opacity = '1';
                el.style.transform = 'none';
            });
        }
    });

    // ========================================
    // PERFORMANCE MONITORING
    // ========================================
    if (window.PerformanceObserver) {
        try {
            const perfObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 100) {
                        console.warn(`⚠️ Animação lenta detectada: ${entry.duration.toFixed(2)}ms`);
                    }
                }
            });
            
            perfObserver.observe({ entryTypes: ['measure'] });
        } catch (e) {
            // Performance Observer não suportado
        }
    }

    console.log('%c CENI-RJ Animation System V2.1 ', 
                'background: #1e3a8a; color: white; font-weight: bold; padding: 4px 8px;');

})();
