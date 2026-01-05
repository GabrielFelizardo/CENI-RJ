/**
 * ============================================
 * RENDERIZAÇÃO DINÂMICA DA TIMELINE
 * ============================================
 * 
 * Busca dados da aba 'timeline' e renderiza
 * a seção "Próximos Passos" dinamicamente
 */

async function renderizarTimeline() {
    const container = document.querySelector('.timeline');
    if (!container) return;
    
    try {
        console.log('📋 Carregando timeline em carrossel...');
        
        // Buscar dados da timeline
        const data = await fetchCENIData('timeline');
        const timelineData = data.marcos || data;
        
        // 🔍 DEBUG: Mostrar TODOS os dados recebidos
        console.group('🔍 DEBUG - Dados Recebidos da API');
        console.log('Total de marcos na planilha:', timelineData.length);
        console.table(timelineData);
        console.groupEnd();
        
        if (!timelineData || timelineData.length === 0) {
            console.log('⚠️ Nenhum marco encontrado, mantendo conteúdo estático');
            return;
        }
        
        // ✅ FILTRAR: Apenas itens com status "ativo"
        const marcosAtivos = timelineData.filter(marco => {
            const status = (marco.status || '').toLowerCase().trim();
            return status === 'ativo';
        });
        
        // 🔍 DEBUG: Mostrar resultado do filtro
        console.group('🔍 DEBUG - Filtro de Status');
        console.log('Marcos após filtro (apenas "ativo" ou "concluido"):', marcosAtivos.length);
        console.table(marcosAtivos);
        
        // Mostrar quais foram filtrados FORA
        const marcosOcultos = timelineData.filter(marco => {
            const status = (marco.status || '').toLowerCase().trim();
            return status !== 'ativo' && status !== 'concluido';
        });
        
        if (marcosOcultos.length > 0) {
            console.log('⚠️ Marcos NÃO exibidos (status diferente de "ativo" ou "concluido"):');
            console.table(marcosOcultos);
        }
        console.groupEnd();
        
        if (marcosAtivos.length === 0) {
            console.log('⚠️ Nenhum marco ativo/concluído encontrado');
            return;
        }
        
        // ✅ CRIAR ESTRUTURA DO CARROSSEL
        container.className = 'timeline-carousel-container';
        container.innerHTML = '';
        
        // Criar o carrossel interno
        const carousel = document.createElement('div');
        carousel.className = 'timeline-carousel';
        
        // Renderizar cards no carrossel
        marcosAtivos.forEach((marco, index) => {
            const card = criarCardTimeline(marco, index);
            carousel.appendChild(card);
        });
        
        container.appendChild(carousel);
        
        // ✅ INICIALIZAR CARROSSEL
        setTimeout(() => {
            const carouselInstance = new TimelineCarousel(container);
            
            // Aplicar animações do sistema
            if (window.CENIScroll && window.CENIScroll.refresh) {
                window.CENIScroll.refresh();
            }
            
            console.log(`✅ Timeline em carrossel renderizada: ${marcosAtivos.length} marcos ativos (${timelineData.length - marcosAtivos.length} ocultos)`);
        }, 100);
        
    } catch (error) {
        console.error('❌ Erro ao renderizar timeline:', error);
        // Em caso de erro, manter conteúdo estático (não fazer nada)
    }
}

function criarCardTimeline(marco, index) {
    // Card informativo simples (não clicável)
    const card = document.createElement('div');
    card.className = 'timeline-item';
    
    // Montar HTML
    let html = `
        <div class="timeline-month">${marco.periodo}</div>
    `;
    
    // Adicionar título se existir
    if (marco.titulo && marco.titulo !== '-') {
        html += `<div style="font-size: 1.125rem; font-weight: 700; margin-bottom: 1rem; opacity: 0.9;">${marco.titulo}</div>`;
    }
    
    // Adicionar TODOS os itens (sem limite)
    if (marco.itens && marco.itens.length > 0) {
        html += '<ul>';
        marco.itens.forEach(item => {
            html += `<li>${item}</li>`;
        });
        html += '</ul>';
    }
    
    card.innerHTML = html;
    
    return card;
}

// ============================================
// ATUALIZAR ceni-api-client.js
// ============================================

// Adicionar ao objeto CENI_API
const CENI_API_TIMELINE = {
    ...CENI_API,
    CACHE_KEYS: {
        ...CENI_API.CACHE_KEYS,
        TIMELINE: 'ceni_timeline_cache'
    }
};

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um pouco para garantir que ceni-api-client.js foi carregado
    if (document.querySelector('.timeline')) {
        console.log('🚀 Detectada página com timeline');
        setTimeout(renderizarTimeline, 500);
    }
});

// Expor função globalmente
if (window.CENI) {
    window.CENI.renderizarTimeline = renderizarTimeline;
}

console.log('✅ Timeline script carregado');
