/**
 * RENDERIZAR PRÓXIMA REUNIÃO DINAMICAMENTE
 * Busca o próximo evento futuro e atualiza a seção de destaque
 */

async function renderizarProximaReuniao() {
    const container = document.getElementById('proxima-reuniao-container');
    if (!container) return;
    
    try {
        // Buscar eventos
        const data = await fetchCENIData('eventos');
        const eventosData = data.eventos || data;
        
        if (!eventosData || eventosData.length === 0) {
            // Manter conteúdo estático se não houver dados
            return;
        }
        
        // Filtrar apenas eventos futuros
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        const eventosFuturos = eventosData.filter(evento => {
            const [ano, mes, dia] = evento.data_evento.split('-').map(Number);
            const dataEvento = new Date(ano, mes - 1, dia);
            return dataEvento >= hoje;
        });
        
        if (eventosFuturos.length === 0) {
            // Sem eventos futuros - manter estático ou mostrar mensagem
            container.innerHTML = `
                <span class="label">Agenda</span>
                <h3 style="font-size: 1.5rem; font-weight: 700; text-transform: uppercase; margin-bottom: 1rem;">
                    Próximas Reuniões em Breve
                </h3>
                <p style="font-size: 1.125rem; margin: 0;">
                    Aguarde a divulgação do calendário oficial de reuniões do CENI-RJ
                </p>
            `;
            return;
        }
        
        // Ordenar por data e pegar o mais próximo
        eventosFuturos.sort((a, b) => {
            return new Date(a.data_evento) - new Date(b.data_evento);
        });
        
        const proximoEvento = eventosFuturos[0];
        
        // Formatar data
        const [ano, mes, dia] = proximoEvento.data_evento.split('-').map(Number);
        const dataFormatada = new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        // Renderizar dinamicamente
        container.innerHTML = `
            <span class="label">Próximo Evento</span>
            <h3 style="font-size: 1.5rem; font-weight: 700; text-transform: uppercase; margin-bottom: 1rem;">
                ${proximoEvento.titulo}
            </h3>
            <p style="font-size: 1.125rem; margin: 0;">
                <strong>Data:</strong> ${dataFormatada}${proximoEvento.horario && proximoEvento.horario !== '-' ? ` • ${proximoEvento.horario}` : ''}${proximoEvento.local ? ` • ${proximoEvento.local}` : ''}
            </p>
            ${proximoEvento.descricao ? `
                <p style="font-size: 1rem; margin-top: 1rem; opacity: 0.9;">
                    ${proximoEvento.descricao}
                </p>
            ` : ''}
        `;
        
        console.log('✅ Próxima reunião carregada dinamicamente');
        
    } catch (error) {
        console.error('Erro ao carregar próxima reunião:', error);
        // Em caso de erro, manter conteúdo estático (não fazer nada)
    }
}

// Executar quando os eventos forem carregados
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um pouco para garantir que ceni-api-client.js foi carregado
    setTimeout(renderizarProximaReuniao, 500);
});
