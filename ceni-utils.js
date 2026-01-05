/**
 * ============================================
 * CENI-RJ - Utilitários e Debugging
 * ============================================
 * 
 * Funções auxiliares para desenvolvimento,
 * debugging e UX enhancements
 */

// ============================================
// TOAST NOTIFICATIONS
// ============================================

const CENIToast = {
  container: null,
  
  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },
  
  show(message, type = 'info', duration = 5000) {
    this.init();
    
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <i class="fas ${icons[type]}"></i>
      <div class="toast-message">${message}</div>
      <button class="toast-close" aria-label="Fechar">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    // Adicionar à página
    this.container.appendChild(toast);
    
    // Fechar ao clicar
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.close(toast));
    
    // Auto-fechar
    if (duration > 0) {
      setTimeout(() => this.close(toast), duration);
    }
    
    return toast;
  },
  
  close(toast) {
    toast.style.animation = 'toastSlideIn 0.3s ease-out reverse';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  },
  
  success(message, duration) {
    return this.show(message, 'success', duration);
  },
  
  error(message, duration) {
    return this.show(message, 'error', duration);
  },
  
  warning(message, duration) {
    return this.show(message, 'warning', duration);
  },
  
  info(message, duration) {
    return this.show(message, 'info', duration);
  }
};

// ============================================
// REFRESH INDICATOR
// ============================================

const RefreshIndicator = {
  element: null,
  
  show() {
    if (!this.element) {
      this.element = document.createElement('div');
      this.element.className = 'refresh-indicator';
      this.element.innerHTML = '<i class="fas fa-sync"></i> Atualizando dados...';
      document.body.appendChild(this.element);
    }
    
    setTimeout(() => {
      this.element.classList.add('visible');
    }, 10);
  },
  
  hide() {
    if (this.element) {
      this.element.classList.remove('visible');
      setTimeout(() => {
        if (this.element && this.element.parentNode) {
          this.element.parentNode.removeChild(this.element);
          this.element = null;
        }
      }, 300);
    }
  }
};

// ============================================
// DEBUGGING E CONSOLE HELPERS
// ============================================

window.CENIDebug = {
  
  // Mostrar todas as informações de cache
  async showCacheInfo() {
    console.group('📦 CACHE INFO');
    
    const keys = Object.values(CENI_API.CACHE_KEYS);
    keys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        if (key.includes('timestamp')) {
          const timestamp = parseInt(data);
          const age = Date.now() - timestamp;
          const ageMinutes = Math.floor(age / 60000);
          console.log(`${key}: ${ageMinutes} minutos atrás`);
        } else {
          const parsed = JSON.parse(data);
          console.log(`${key}:`, parsed);
        }
      } else {
        console.log(`${key}: (vazio)`);
      }
    });
    
    console.groupEnd();
  },
  
  // Forçar atualização completa
  async forceRefresh() {
    console.log('🔄 Forçando atualização...');
    RefreshIndicator.show();
    
    // Limpar cache
    CENI.limparCache();
    
    try {
      // Recarregar dados
      if (document.getElementById('documentos-container')) {
        await CENI.renderizarDocumentos();
      }
      
      if (document.getElementById('eventos-container')) {
        await CENI.renderizarEventos();
      }
      
      RefreshIndicator.hide();
      CENIToast.success('Dados atualizados com sucesso!');
      console.log('✅ Atualização concluída');
      
    } catch (error) {
      RefreshIndicator.hide();
      CENIToast.error('Erro ao atualizar dados');
      console.error('❌ Erro:', error);
    }
  },
  
  // Testar API diretamente
  async testAPI() {
    console.group('🧪 TESTE DE API');
    
    try {
      console.log('📡 Testando endpoint de documentos...');
      const docs = await CENI.fetchData('documentos');
      console.log('✅ Documentos:', docs);
      
      console.log('\n📡 Testando endpoint de eventos...');
      const eventos = await CENI.fetchData('eventos');
      console.log('✅ Eventos:', eventos);
      
      console.log('\n✅ API funcionando corretamente!');
      CENIToast.success('API testada com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao testar API:', error);
      CENIToast.error('Erro ao testar API');
    }
    
    console.groupEnd();
  },
  
  // Simular erro de conexão
  simulateError() {
    console.log('⚠️ Simulando erro de conexão...');
    
    const originalURL = CENI_API.URL;
    CENI_API.URL = 'https://invalid-url-that-will-fail.com';
    
    this.forceRefresh().then(() => {
      CENI_API.URL = originalURL;
      console.log('URL restaurada');
    });
  },
  
  // Estatísticas de performance
  async performanceStats() {
    console.group('⚡ PERFORMANCE STATS');
    
    const start = performance.now();
    
    try {
      await CENI.fetchData('all');
      const end = performance.now();
      const duration = end - start;
      
      console.log(`Tempo de carregamento: ${duration.toFixed(2)}ms`);
      
      if (duration < 100) {
        console.log('✅ Excelente (cache)');
      } else if (duration < 500) {
        console.log('✅ Bom');
      } else if (duration < 1000) {
        console.log('⚠️ Aceitável');
      } else {
        console.log('❌ Lento');
      }
      
    } catch (error) {
      console.error('❌ Erro:', error);
    }
    
    console.groupEnd();
  },
  
  // Limpar tudo e resetar
  reset() {
    console.log('🔄 Resetando aplicação...');
    
    // Limpar cache
    CENI.limparCache();
    
    // Recarregar página
    location.reload();
  },
  
  // Listar todos os comandos disponíveis
  help() {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                  CENI DEBUG CONSOLE                        ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  CENIDebug.showCacheInfo()     - Ver cache atual          ║
║  CENIDebug.forceRefresh()      - Atualizar tudo           ║
║  CENIDebug.testAPI()           - Testar conexão API       ║
║  CENIDebug.performanceStats()  - Ver performance          ║
║  CENIDebug.reset()             - Resetar aplicação        ║
║                                                            ║
║  CENI.limparCache()            - Limpar cache local       ║
║  CENI.renderizarDocumentos()   - Renderizar docs          ║
║  CENI.renderizarEventos()      - Renderizar eventos       ║
║  CENI.fetchData('tipo')        - Buscar dados da API      ║
║                                                            ║
║  CENIToast.success('msg')      - Notificação sucesso      ║
║  CENIToast.error('msg')        - Notificação erro         ║
║  CENIToast.warning('msg')      - Notificação aviso        ║
║  CENIToast.info('msg')         - Notificação info         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
  }
};

// ============================================
// SMOOTH SCROLL ENHANCEMENTS
// ============================================

function smoothScrollToElement(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  }
}

// ============================================
// COPY TO CLIPBOARD
// ============================================

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    CENIToast.success('Copiado para a área de transferência!');
    return true;
  } catch (error) {
    console.error('Erro ao copiar:', error);
    CENIToast.error('Erro ao copiar texto');
    return false;
  }
}

// ============================================
// SHARE API (se disponível)
// ============================================

async function shareContent(title, text, url) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      CENIToast.success('Compartilhado com sucesso!');
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Erro ao compartilhar:', error);
        CENIToast.error('Erro ao compartilhar');
      }
    }
  } else {
    // Fallback: copiar URL
    copyToClipboard(url || window.location.href);
  }
}

// ============================================
// INTERSECTION OBSERVER UTILITIES
// ============================================

function lazyLoadImages() {
  const images = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        imageObserver.unobserve(img);
      }
    });
  });
  
  images.forEach(img => imageObserver.observe(img));
}

// ============================================
// FORM VALIDATION HELPERS
// ============================================

function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validatePhone(phone) {
  // Remove caracteres não numéricos
  const numbers = phone.replace(/\D/g, '');
  // Aceita 10 ou 11 dígitos (telefone ou celular)
  return numbers.length === 10 || numbers.length === 11;
}

function formatPhone(phone) {
  const numbers = phone.replace(/\D/g, '');
  if (numbers.length === 11) {
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (numbers.length === 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}

// ============================================
// LOCAL STORAGE HELPERS
// ============================================

const Storage = {
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
      return false;
    }
  },
  
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Erro ao ler do localStorage:', error);
      return defaultValue;
    }
  },
  
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Erro ao remover do localStorage:', error);
      return false;
    }
  },
  
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Erro ao limpar localStorage:', error);
      return false;
    }
  }
};

// ============================================
// DATE FORMATTERS
// ============================================

const DateFormat = {
  // "30 de dezembro de 2024"
  long(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  },
  
  // "30/12/2024"
  short(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  },
  
  // "2024-12-30"
  iso(dateStr) {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  },
  
  // "há 2 dias"
  relative(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `Há ${diffDays} dias`;
    if (diffDays < 30) return `Há ${Math.floor(diffDays / 7)} semanas`;
    if (diffDays < 365) return `Há ${Math.floor(diffDays / 30)} meses`;
    return `Há ${Math.floor(diffDays / 365)} anos`;
  }
};

// ============================================
// ANALYTICS HELPERS (opcional)
// ============================================

const Analytics = {
  trackEvent(category, action, label) {
    console.log('📊 Event:', { category, action, label });
    // Integrar com Google Analytics, Matomo, etc.
  },
  
  trackPageView(page) {
    console.log('📄 Page View:', page);
  },
  
  trackError(error, context) {
    console.error('❌ Error:', error, 'Context:', context);
  }
};

// ============================================
// CONSOLE WELCOME MESSAGE
// ============================================

console.log(`
%c╔════════════════════════════════════════════════════════════╗
║                    CENI-RJ v1.0                            ║
║           Comitê Estadual de Negócios de Impacto          ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  💡 Digite CENIDebug.help() para ver comandos disponíveis ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`, 'color: #1e3a8a; font-weight: bold; font-family: monospace;');

// ============================================
// EXPORT TO WINDOW
// ============================================

window.CENIToast = CENIToast;
window.RefreshIndicator = RefreshIndicator;
window.smoothScrollToElement = smoothScrollToElement;
window.copyToClipboard = copyToClipboard;
window.shareContent = shareContent;
window.lazyLoadImages = lazyLoadImages;
window.validateEmail = validateEmail;
window.validatePhone = validatePhone;
window.formatPhone = formatPhone;
window.Storage = Storage;
window.DateFormat = DateFormat;
window.Analytics = Analytics;
