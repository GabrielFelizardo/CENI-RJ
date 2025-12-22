(function() {
    'use strict';

    // Configuração
    const CONFIG = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    // Delays disponíveis (em ms)
    const DELAYS = {
        '0': 0,
        '100': 100,
        '150': 150,
        '200': 200,
        '300': 300,
        '400': 400,
        '500': 500,
        '600': 600
    };

    // Intersection Observer
    const observer = new IntersectionObserver(handleIntersection, CONFIG);

    function handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const delay = element.getAttribute('data-delay') || '0';
                
                // Aplicar delay
                setTimeout(() => {
                    element.classList.add('animated');
                    
                    // Disparar evento customizado
                    element.dispatchEvent(new CustomEvent('ceni:animated', {
                        detail: { element }
                    }));
                }, DELAYS[delay] || 0);
                
                // Parar de observar (animar apenas uma vez)
                observer.unobserve(element);
            }
        });
    }

    // Inicializar quando DOM estiver pronto
    function init() {
        // Verificar se usuário prefere sem animações
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            // Mostrar tudo imediatamente
            document.querySelectorAll('[data-animate]').forEach(el => {
                el.style.opacity = '1';
                el.style.transform = 'none';
            });
            return;
        }

        // Observar todos os elementos com data-animate
        const elements = document.querySelectorAll('[data-animate]');
        elements.forEach(el => observer.observe(el));
        
        console.log(`✨ CENI Animations: ${elements.length} elementos prontos`);
    }

    // Inicializar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // API pública
    window.CENIAnimations = {
        // Reinicializar (para conteúdo dinâmico)
        refresh: function() {
            init();
        },
        
        // Stats de quantos elementos foram animados
        stats: function() {
            const total = document.querySelectorAll('[data-animate]').length;
            const animated = document.querySelectorAll('[data-animate].animated').length;
            console.log(`📊 Animações: ${animated}/${total} visíveis`);
            return { total, animated };
        }
    };

})();
