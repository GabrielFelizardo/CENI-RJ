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
        useRAF: true, // RequestAnimationFrame para melhor performance
        batchSize: 10, // Processar animações em lotes
        
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
        
        // Animação repetível (para elementos que saem/entram do viewport)
        repeatAnimation: false
    };

    // ========================================
    // DETECÇÃO DE CAPACIDADES DO DISPOSITIVO
    // ========================================
    const deviceCapabilities = {
        // Detectar se usuário prefere movimento reduzido
        prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        
        // Detectar tipo de dispositivo (aproximado)
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        
        // Detectar suporte a Intersection Observer
        hasIntersectionObserver: 'IntersectionObserver' in window,
        
        // Detectar performance do dispositivo (heurística)
        isLowPowerDevice: navigator.hardwareConcurrency ? navigator.hardwareConcurrency <= 4 : false,
        
        // Detectar conexão lenta
        isSlowConnection: navigator.connection ? 
            (navigator.connection.effectiveType === '2g' || 
             navigator.connection.effectiveType === 'slow-2g') : false
    };

    // ========================================
    // AJUSTES ADAPTATIVOS DE PERFORMANCE
    // ========================================
    function adjustConfigForPerformance() {
        // Reduzir complexidade em dispositivos de baixa performance
        if (deviceCapabilities.isLowPowerDevice || deviceCapabilities.isSlowConnection) {
            CONFIG.threshold = [0, 0.5, 1];
            CONFIG.batchSize = 5;
        }
        
        // Desabilitar animações em mobile se preferência de movimento reduzido
        if (deviceCapabilities.isMobile && deviceCapabilities.prefersReducedMotion) {
            return false; // Sinaliza para desabilitar animações
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
        
        // Processar próximo lote usando RAF
        if (CONFIG.useRAF && animationQueue.length > 0) {
            requestAnimationFrame(() => {
                setTimeout(processQueue, 16); // ~60fps
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
            // Usar RAF para delays maiores
            setTimeout(() => {
                requestAnimationFrame(() => {
                    triggerAnimation(element);
                });
            }, actualDelay);
        } else if (actualDelay > 0) {
            // Usar setTimeout tradicional
            setTimeout(() => {
                triggerAnimation(element);
            }, actualDelay);
        } else {
            // Sem delay, animar imediatamente
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
        // Adicionar classe animated
        element.classList.add('animated');
        
        // Disparar evento customizado
        const event = new CustomEvent('ceni:animated', {
            detail: { 
                element,
                animationType: element.getAttribute('data-animate'),
                timestamp: Date.now()
            },
            bubbles: true
        });
        element.dispatchEvent(event);
        
        // Analytics tracking (se disponível)
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
            
            // Elemento entrando no viewport
            if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
                const delay = element.getAttribute('data-delay') || '0';
                
                // Adicionar à fila de animação
                addToQueue(element, delay);
                
                // Se não repetir animação, parar de observar
                if (!CONFIG.repeatAnimation) {
                    observer.unobserve(element);
                }
            }
            // Elemento saindo do viewport (se repetição habilitada)
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
            }, delay + (index * 50)); // Stagger automático
        });
    }

    // ========================================
    // INICIALIZAÇÃO INTELIGENTE
    // ========================================
    function init() {
        console.log('🎨 CENI Animation System V2.0 Iniciando...');
        
        // Verificar se devemos executar animações
        if (!adjustConfigForPerformance()) {
            console.log('⚡ Animações desabilitadas devido a preferências do usuário');
            // Mostrar tudo imediatamente sem animações
            document.querySelectorAll('[data-animate]').forEach(el => {
                el.style.opacity = '1';
                el.style.transform = 'none';
            });
            return;
        }
        
        // Verificar se usuário prefere sem animações
        if (deviceCapabilities.prefersReducedMotion) {
            console.log('♿ Modo acessibilidade: Animações simplificadas');
            document.querySelectorAll('[data-animate]').forEach(el => {
                el.style.opacity = '1';
                el.style.transform = 'none';
            });
            return;
        }
        
        // Verificar suporte a Intersection Observer
        if (!deviceCapabilities.hasIntersectionObserver) {
            fallbackAnimation();
            return;
        }
        
        // Criar Intersection Observer
        observer = new IntersectionObserver(handleIntersection, {
            threshold: CONFIG.threshold,
            rootMargin: CONFIG.rootMargin
        });
        
        // Observar todos os elementos com data-animate
        const elements = document.querySelectorAll('[data-animate]');
        
        if (elements.length === 0) {
            console.log('ℹ️ Nenhum elemento para animar encontrado');
            return;
        }
        
        // Adicionar observers de forma eficiente
        elements.forEach(el => {
            observer.observe(el);
        });
        
        console.log(`✨ CENI Animations: ${elements.length} elementos prontos`);
        console.log(`📱 Dispositivo: ${deviceCapabilities.isMobile ? 'Mobile' : 'Desktop'}`);
        console.log(`⚡ Performance: ${deviceCapabilities.isLowPowerDevice ? 'Modo Econômico' : 'Modo Completo'}`);
        
        // Log de configuração (apenas em desenvolvimento)
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
        // Versão
        version: '2.0.0',
        
        // Reinicializar sistema (para conteúdo dinâmico)
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
        
        // Estatísticas de animação
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
        
        // Animar elemento específico manualmente
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
        
        // Resetar animação de elemento
        reset: function(elementOrSelector) {
            const element = typeof elementOrSelector === 'string'
                ? document.querySelector(elementOrSelector)
                : elementOrSelector;
            
            if (!element) {
                console.error('Elemento não encontrado:', elementOrSelector);
                return false;
            }
            
            element.classList.remove('animated');
            
            // Re-observar se observer existe
            if (observer) {
                observer.observe(element);
            }
            
            return true;
        },
        
        // Resetar todas as animações
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
        
        // Pausar sistema de animações
        pause: function() {
            if (observer) {
                observer.disconnect();
                console.log('⏸️ Sistema de animações pausado');
            }
        },
        
        // Retomar sistema de animações
        resume: function() {
            if (observer) {
                const elements = document.querySelectorAll('[data-animate]:not(.animated)');
                elements.forEach(el => observer.observe(el));
                console.log(`▶️ Sistema retomado: ${elements.length} elementos re-observados`);
            }
        },
        
        // Configurar opções em runtime
        configure: function(options) {
            Object.assign(CONFIG, options);
            console.log('⚙️ Configuração atualizada:', options);
            return CONFIG;
        },
        
        // Obter configuração atual
        getConfig: function() {
            return { ...CONFIG };
        },
        
        // Obter capacidades do dispositivo
        getDeviceCapabilities: function() {
            return { ...deviceCapabilities };
        },
        
        // Debug mode
        enableDebug: function() {
            // Adicionar listeners para todos os eventos de animação
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

    // ========================================
    // HOT MODULE REPLACEMENT (Desenvolvimento)
    // ========================================
    if (module && module.hot) {
        module.hot.accept();
        module.hot.dispose(() => {
            if (observer) {
                observer.disconnect();
            }
        });
    }

    // ========================================
    // LISTENER PARA MUDANÇAS DE PREFERÊNCIA
    // ========================================
    const motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    motionMediaQuery.addEventListener('change', (e) => {
        if (e.matches) {
            console.log('♿ Usuário ativou modo de movimento reduzido');
            // Remover todas as animações ativas
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
            // Performance Observer não suportado ou erro
        }
    }

    // Expor versão para debugging
    console.log('%c CENI-RJ Animation System V2.0 ', 
                'background: #1e3a8a; color: white; font-weight: bold; padding: 4px 8px;');

})();
