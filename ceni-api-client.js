// ============================================
// CONFIGURAÇÃO
// ============================================

const CENI_API = {
  // ⚠️ SUBSTITUIR PELA URL DO SEU APPS SCRIPT
  URL: 'https://script.google.com/macros/s/AKfycbwsvOjSDjDINcjOz2O8qCXQIebL8XzWmKrbMHT7rmJDUjov2razcVPIGT3v7ne1jEw0jg/exec',
  
  // Versão atual dos dados/estrutura. 
  // ⚠️ MUDE ISTO (ex: '1.1') PARA FORÇAR LIMPEZA DE CACHE EM TODOS OS USUÁRIOS
  VERSION: '1.0',

  // Cache local (5 minutos)
  CACHE_DURATION: 5 * 60 * 1000,
  
  // Chaves de cache no localStorage
  CACHE_KEYS: {
    DOCUMENTOS: 'ceni_documentos_cache',
    EVENTOS: 'ceni_eventos_cache',
    TIMELINE: 'ceni_timeline_cache',
    TIMESTAMP: 'ceni_cache_timestamp',
    APP_VERSION: 'ceni_app_version' // ✅ NOVA CHAVE
  }
};

// ============================================
// BUSCAR DADOS DA API
// ============================================

async function fetchCENIData(tipo = 'all') {
  try {
    // Verificar integridade e versão do cache antes de tudo
    verificarVersaoCache();

    // Verificar cache
    const cached = getCachedData(tipo);
    if (cached) {
      console.log('✅ Dados do cache local');
      return cached;
    }
    
    // Buscar da API
    console.log(`📥 Buscando dados: ${tipo}`);
    
    const url = `${CENI_API.URL}?tipo=${tipo}&t=${Date.now()}`; // Cache busting
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Erro desconhecido');
    }
    
    // Salvar no cache com a versão atual
    saveCacheData(tipo, result.data);
    
    console.log('✅ Dados recebidos com sucesso');
    return result.data;
    
  } catch (error) {
    console.error('❌ Erro ao buscar dados:', error);
    
    // Tentar usar cache antigo em caso de erro
    const oldCache = getCachedData(tipo, true); // ignorar expiração
    if (oldCache) {
      console.log('⚠️ Usando cache antigo devido a erro');
      return oldCache;
    }
    
    throw error;
  }
}

// ============================================
// CACHE LOCAL E VERSIONAMENTO
// ============================================

// ✅ NOVA FUNÇÃO: Verifica se a versão mudou
function verificarVersaoCache() {
  const cachedVersion = localStorage.getItem(CENI_API.CACHE_KEYS.APP_VERSION);
  
  if (cachedVersion !== CENI_API.VERSION) {
    console.warn(`📦 Nova versão detectada (v${CENI_API.VERSION}). Limpando cache antigo (v${cachedVersion})...`);
    limparCacheLocal();
    // Salva a nova versão imediatamente
    localStorage.setItem(CENI_API.CACHE_KEYS.APP_VERSION, CENI_API.VERSION);
  }
}

function getCachedData(tipo, ignoreExpiration = false) {
  try {
    const timestamp = localStorage.getItem(CENI_API.CACHE_KEYS.TIMESTAMP);
    const now = Date.now();
    
    // Verificar expiração de tempo
    if (!ignoreExpiration && timestamp && (now - parseInt(timestamp)) > CENI_API.CACHE_DURATION) {
      console.log('⏰ Cache expirado (tempo)');
      return null;
    }
    
    // Buscar dados
    let cacheKey;
    if (tipo === 'all') {
      const docs = localStorage.getItem(CENI_API.CACHE_KEYS.DOCUMENTOS);
      const eventos = localStorage.getItem(CENI_API.CACHE_KEYS.EVENTOS);
      const timeline = localStorage.getItem(CENI_API.CACHE_KEYS.TIMELINE);
      
      if (docs && eventos && timeline) {
        return {
          documentos: JSON.parse(docs),
          eventos: JSON.parse(eventos),
          timeline: JSON.parse(timeline)
        };
      }
    } else if (tipo === 'documentos') {
      cacheKey = CENI_API.CACHE_KEYS.DOCUMENTOS;
    } else if (tipo === 'eventos') {
      cacheKey = CENI_API.CACHE_KEYS.EVENTOS;
    } else if (tipo === 'timeline') {
      cacheKey = CENI_API.CACHE_KEYS.TIMELINE;
    }
    
    if (cacheKey) {
      const data = localStorage.getItem(cacheKey);
      return data ? JSON.parse(data) : null;
    }
    
    return null;
    
  } catch (error) {
    console.warn('Erro ao ler cache:', error);
    return null;
  }
}

function saveCacheData(tipo, data) {
  try {
    if (tipo === 'all') {
      localStorage.setItem(CENI_API.CACHE_KEYS.DOCUMENTOS, JSON.stringify(data.documentos));
      localStorage.setItem(CENI_API.CACHE_KEYS.EVENTOS, JSON.stringify(data.eventos));
      localStorage.setItem(CENI_API.CACHE_KEYS.TIMELINE, JSON.stringify(data.timeline));
    } else if (tipo === 'documentos') {
      localStorage.setItem(CENI_API.CACHE_KEYS.DOCUMENTOS, JSON.stringify(data));
    } else if (tipo === 'eventos') {
      localStorage.setItem(CENI_API.CACHE_KEYS.EVENTOS, JSON.stringify(data));
    } else if (tipo === 'timeline') {
      localStorage.setItem(CENI_API.CACHE_KEYS.TIMELINE, JSON.stringify(data));
    }
    
    localStorage.setItem(CENI_API.CACHE_KEYS.TIMESTAMP, Date.now().toString());
    localStorage.setItem(CENI_API.CACHE_KEYS.APP_VERSION, CENI_API.VERSION); // Garante que a versão está salva
    
  } catch (error) {
    console.warn('Erro ao salvar cache:', error);
  }
}

// ============================================
// RENDERIZAR DOCUMENTOS
// ============================================

async function renderizarDocumentos() {
  const container = document.getElementById('documentos-container');
  if (!container) return;
  
  try {
    container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div> Carregando documentos...</div>';
    
    const data = await fetchCENIData('documentos');
    const documentosData = data.documentos || data;
    
    if (!documentosData || documentosData.length === 0) {
      container.innerHTML = '<div class="empty-state">Nenhum documento disponível</div>';
      return;
    }
    
    const porCategoria = data.porCategoria || agruparPorCategoria(documentosData);
    const categorias = {
      'institucionais': 'Documentos Institucionais',
      'atas': 'Atas de Reunião',
      'relatorios': 'Relatórios e Estudos',
      'materiais': 'Materiais de Apoio'
    };
    
    let html = '';
    
    for (const [categoriaKey, categoriaNome] of Object.entries(categorias)) {
      const docs = porCategoria[categoriaKey] || [];
      if (docs.length === 0) continue;
      
      html += `
        <section class="categoria-section">
          <div class="categoria-header">
            <h2>${categoriaNome}</h2>
          </div>
          <ul class="documento-list">
      `;
      
      docs.forEach((doc, index) => {
        html += criarCardDocumento(doc, index + 1);
      });
      
      html += `
          </ul>
        </section>
      `;
    }
    
    if (html === '') {
      container.innerHTML = '<div class="empty-state">Nenhum documento disponível</div>';
    } else {
      container.innerHTML = html;
    }
    
  } catch (error) {
    console.error('Erro ao renderizar documentos:', error);
    container.innerHTML = `
      <div class="error-state">
        <p>Erro ao carregar documentos.</p>
        <button onclick="renderizarDocumentos()">Tentar Novamente</button>
      </div>
    `;
  }
}

function agruparPorCategoria(documentos) {
  const grupos = {
    'institucionais': [],
    'atas': [],
    'relatorios': [],
    'materiais': []
  };
  documentos.forEach(doc => {
    const cat = doc.categoria || 'materiais';
    if (grupos[cat]) grupos[cat].push(doc);
  });
  return grupos;
}

function criarCardDocumento(doc, numero) {
  const statusLabels = { 'disponivel': 'Baixar', 'em_breve': 'Em Breve', 'em_elaboracao': 'Em Elaboração' };
  const statusIcons = { 'disponivel': 'fa-download', 'em_breve': 'fa-clock', 'em_elaboracao': 'fa-hourglass-half' };
  const status = doc.status || 'em_breve';
  const label = statusLabels[status] || 'Indisponível';
  const icon = statusIcons[status] || 'fa-clock';
  const disabled = status !== 'disponivel' ? 'disabled' : '';
  const dataFormatada = doc.data_publicacao ? formatarData(doc.data_publicacao) : 'Data não definida';
  
  return `
    <li class="documento-item" data-animate="fade-up">
      <div class="doc-number">${String(numero).padStart(2, '0')}</div>
      <div class="doc-info">
        <h4>${doc.titulo}</h4>
        <p><i class="fas fa-calendar-alt"></i> ${doc.descricao || dataFormatada}</p>
      </div>
      ${doc.link_arquivo && status === 'disponivel' ? `
        <a href="${doc.link_arquivo}" target="_blank" class="btn-doc" aria-label="Baixar ${doc.titulo}">
          <i class="fas ${icon}"></i> ${label}
        </a>
      ` : `
        <button class="btn-doc ${disabled}" disabled aria-label="${label}">
          <i class="fas ${icon}"></i> ${label}
        </button>
      `}
    </li>
  `;
}

// ============================================
// RENDERIZAR EVENTOS
// ============================================

async function renderizarEventos() {
  const container = document.getElementById('eventos-container');
  if (!container) return;
  
  try {
    container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div> Carregando eventos...</div>';
    
    const data = await fetchCENIData('eventos');
    const eventosData = data.eventos || data;
    
    if (!eventosData || eventosData.length === 0) {
      container.innerHTML = '<div class="empty-state">Nenhum evento disponível</div>';
      return;
    }
    
    let html = '';
    eventosData.forEach(evento => { html += criarCardEvento(evento); });
    container.innerHTML = html;
    
    setTimeout(() => updateEventCounts(), 100);
    
  } catch (error) {
    console.error('Erro ao renderizar eventos:', error);
    container.innerHTML = `
      <div class="error-state">
        <p>Erro ao carregar eventos.</p>
        <button onclick="renderizarEventos()">Tentar Novamente</button>
      </div>
    `;
  }
}

function criarCardEvento(evento) {
  const [ano, mes, dia] = evento.data_evento.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  
  const diaFormatado = data.getDate();
  const mesFormatado = data.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase();
  const anoFormatado = data.getFullYear();
  
  const categoriaClasses = { 'reuniao': 'reuniao', 'prazo': 'prazo', 'marco': 'marco', 'ecossistema': 'ecossistema' };
  const categoriaLabels = { 'reuniao': 'Reunião Ordinária', 'prazo': 'Prazo', 'marco': 'Marco Importante', 'ecossistema': 'Evento Externo' };
  const statusClasses = { 'futuro': 'futuro', 'hoje': 'hoje', 'concluido': 'concluido' };
  const statusLabels = { 'futuro': 'Aguardando', 'hoje': 'Hoje', 'concluido': 'Concluído' };
  
  const catClass = categoriaClasses[evento.categoria] || 'reuniao';
  const catLabel = categoriaLabels[evento.categoria] || evento.categoria;
  const statusClass = statusClasses[evento.status] || 'futuro';
  const statusLabel = statusLabels[evento.status] || evento.status;
  
  return `
    <article class="evento-card" data-category="${evento.categoria}" data-animate="fade-up">
      <div class="evento-date-box">
        <div class="evento-day">${diaFormatado}</div>
        <div class="evento-month">${mesFormatado}</div>
        <div class="evento-year">${anoFormatado}</div>
      </div>
      <div class="evento-content">
        <div class="evento-header">
          <span class="evento-category ${catClass}">${catLabel}</span>
          <h3 class="evento-title">${evento.titulo}</h3>
          <p class="evento-description">${evento.descricao}</p>
          <div class="evento-meta">
            ${evento.horario && evento.horario !== '-' ? `<div class="evento-meta-item"><i class="fas fa-clock"></i><span>${evento.horario}</span></div>` : ''}
            ${evento.local ? `<div class="evento-meta-item"><i class="fas fa-map-marker-alt"></i><span>${evento.local}</span></div>` : ''}
          </div>
        </div>
        <div class="evento-footer">
          <span class="evento-status ${statusClass}"><span class="evento-status-dot"></span>${statusLabel}</span>
          ${evento.link_materiais ? `<a href="${evento.link_materiais}" class="evento-action" target="_blank">Acessar Material</a>` : `<button class="evento-action disabled" disabled>Aguardando</button>`}
        </div>
      </div>
    </article>
  `;
}

function updateEventCounts() {
  const eventoCards = document.querySelectorAll('.evento-card');
  if (eventoCards.length === 0) return;
  
  const counts = { todos: eventoCards.length, reuniao: 0, prazo: 0, marco: 0, ecossistema: 0 };
  
  eventoCards.forEach(card => {
    const category = card.getAttribute('data-category');
    if (counts.hasOwnProperty(category)) counts[category]++;
  });
  
  Object.keys(counts).forEach(key => {
    const badge = document.getElementById(`count-${key}`);
    if (badge) badge.textContent = counts[key];
  });
}

// ============================================
// UTILITÁRIOS
// ============================================

function formatarData(dataStr) {
  if (!dataStr) return '';
  const [ano, mes, dia] = dataStr.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function limparCacheLocal() {
  // Limpa chaves específicas para não apagar dados de outros apps
  localStorage.removeItem(CENI_API.CACHE_KEYS.DOCUMENTOS);
  localStorage.removeItem(CENI_API.CACHE_KEYS.EVENTOS);
  localStorage.removeItem(CENI_API.CACHE_KEYS.TIMELINE);
  localStorage.removeItem(CENI_API.CACHE_KEYS.TIMESTAMP);
  localStorage.removeItem(CENI_API.CACHE_KEYS.APP_VERSION); // Também reseta a versão
  console.log('🧹 Cache local limpo!');
}

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  console.log(`🚀 CENI API Client v${CENI_API.VERSION} inicializando...`);
  if (document.getElementById('documentos-container')) renderizarDocumentos();
  if (document.getElementById('eventos-container')) renderizarEventos();
});

window.CENI = {
  renderizarDocumentos,
  renderizarEventos,
  limparCache: limparCacheLocal,
  fetchData: fetchCENIData,
  updateEventCounts
};
