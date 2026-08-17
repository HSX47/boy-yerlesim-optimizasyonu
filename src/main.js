/**
 * Kesim Eniyileme — Ana Uygulama
 */

// Stiller
import './styles/index.css';
import './styles/components.css';
import './styles/animations.css';

// Core
import { i18n } from './i18n/index.js';
import { theme } from './core/theme.js';
import { createProject, createStockItem, createCutPiece } from './core/models.js';
import { runOptimization } from './core/optimizer.js';

// UI
import { renderNavbar } from './ui/navbar.js';
import { renderStockPanel } from './ui/inputPanel.js';
import { renderCutListPanel } from './ui/cutListPanel.js';
import { renderParamsPanel } from './ui/paramsPanel.js';
import { renderResultsPanel } from './ui/resultsPanel.js';
import { renderVisualizer } from './ui/visualizer.js';
import { showToast } from './ui/toast.js';

// Services
import { exportPdf } from './services/exportPdf.js';
import { exportExcel } from './services/exportExcel.js';
import { authConfig } from './config/authConfig.js';
import { onAuthChange, getCurrentUser } from './services/auth.js';
import { openAuthModal } from './ui/authModal.js';
import { openContactModal } from './ui/contactModal.js';

// ── Uygulama Durumu ─────────────────────────────────────────
const project = createProject({
  name: 'Yeni Proje',
  stockItems: [
    createStockItem({ length: 6000, label: '6 m', quantity: 0, unitPrice: 0 }),
  ],
  cutPieces: [
    createCutPiece({ length: 0, quantity: 1, label: '' }),
  ],
});

let lastResult = null;
let resultsView = null;
let visualizerView = null;

// Üyelik zorunlu mod (authConfig.requireAuth === true) açıksa ve kullanıcı giriş yapmadıysa modal aç
onAuthChange((user) => {
  if (authConfig.requireAuth && !user) {
    openAuthModal('login');
  }
});

// ── İlk Render ──────────────────────────────────────────────
function init() {
  // Navbar
  renderNavbar(document.getElementById('navbar-root'));

  // Stok Malzeme Paneli
  renderStockPanel(
    document.getElementById('stock-panel-root'),
    project.stockItems,
    (items) => { project.stockItems = items; }
  );

  // Kesim Listesi Paneli
  renderCutListPanel(
    document.getElementById('cuts-panel-root'),
    project.cutPieces,
    (items) => { project.cutPieces = items; }
  );

  // Parametreler Paneli
  renderParamsPanel(
    document.getElementById('params-panel-root'),
    project.params,
    (params) => { project.params = params; }
  );

  // Sonuçlar Paneli (boş durumda)
  resultsView = renderResultsPanel(
    document.getElementById('results-panel-root'),
    null,
    {
      onExportPdf: handleExportPdf,
      onExportExcel: handleExportExcel,
    }
  );

  // Görselleştirici (boş)
  visualizerView = renderVisualizer(
    document.getElementById('visualizer-root'),
    null
  );

  // Optimize butonu
  const optimizeBtn = document.getElementById('optimize-btn');
  optimizeBtn.addEventListener('click', handleOptimize);

  // Sıfırla butonu
  document.getElementById('reset-btn').addEventListener('click', handleReset);

  // Footer İletişim Butonu
  document.getElementById('footer-contact-btn')?.addEventListener('click', () => {
    openContactModal();
  });

  // i18n ilk güncelleme
  i18n.setLocale(i18n.locale);

  // i18n değişince butonları güncelle
  i18n.onChange(() => {
    const btn = document.getElementById('optimize-btn');
    if (btn) {
      btn.querySelector('[data-i18n]').textContent = i18n.t('actions.optimize');
    }
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
      resetBtn.querySelector('[data-i18n]').textContent = i18n.t('actions.reset');
    }
  });
}

// ── Optimize İşlevi ─────────────────────────────────────────
function handleOptimize() {
  const t = (key) => i18n.t(key);

  if (project.params.algorithm === 'branchBound' && !getCurrentUser()) {
    showToast('Dal ve Sınır (Branch & Bound) algoritmasını kullanmak için lütfen ücretsiz üye olun veya giriş yapın.', 'warning');
    openAuthModal('signup');
    return;
  }

  // Doğrulama
  const validStocks = project.stockItems.filter(s => s.length > 0);
  const validCuts = project.cutPieces.filter(c => c.length > 0 && c.quantity > 0);

  if (validStocks.length === 0 || validCuts.length === 0) {
    showToast(t('toast.noData'), 'warning');
    return;
  }

  // Buton durumunu güncelle
  const btn = document.getElementById('optimize-btn');
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.classList.remove('btn--optimize-pulse');
  btn.innerHTML = `<span class="spinner"></span> <span>${t('actions.optimizing')}</span>`;

  // Küçük gecikme ile UI güncellemesine izin ver
  requestAnimationFrame(() => {
    setTimeout(() => {
      try {
        const { success, result, error } = runOptimization({
          stockItems: project.stockItems,
          cutPieces: project.cutPieces,
          params: project.params,
        });

        if (success) {
          lastResult = result;
          project.lastResult = result;

          // Sonuçları güncelle
          resultsView.update(result);
          visualizerView.update(result);

          if (result.unplacedCount > 0) {
            showToast(
              i18n.t('toast.unplacedCuts', { count: result.unplacedCount }),
              'warning'
            );
          } else {
            showToast(
              `${t('toast.optimizeSuccess')} — ${t('results.waste')}: %${result.totalWastePercentage.toFixed(1)}`,
              result.totalWastePercentage < 10 ? 'success' : result.totalWastePercentage < 20 ? 'warning' : 'info'
            );
          }

          // Sonuçlara scroll
          document.getElementById('results-panel-root')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        } else {
          showToast(t(`errors.${error}`) || t('toast.optimizeError'), 'error');
        }
      } catch (err) {
        console.error('Optimization error:', err);
        showToast(t('toast.optimizeError'), 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
        btn.classList.add('btn--optimize-pulse');
      }
    }, 30);
  });
}

// ── PDF Dışa Aktarım ─────────────────────────────────────────
async function handleExportPdf() {
  if (!lastResult) return;
  try {
    await exportPdf(lastResult, project.stockItems, project.cutPieces, project.params);
    showToast(i18n.t('toast.exportSuccess'), 'success');
  } catch (err) {
    console.error('PDF export error:', err);
    showToast(i18n.t('toast.exportError'), 'error');
  }
}

// ── Excel Dışa Aktarım ──────────────────────────────────────
function handleExportExcel() {
  if (!lastResult) return;
  try {
    exportExcel(lastResult, project.stockItems, project.cutPieces, project.params);
    showToast(i18n.t('toast.exportSuccess'), 'success');
  } catch (err) {
    console.error('Excel export error:', err);
    showToast(i18n.t('toast.exportError'), 'error');
  }
}

// ── Sıfırla ─────────────────────────────────────────────────
function handleReset() {
  project.cutPieces.length = 0;
  project.cutPieces.push(createCutPiece({ length: 0, quantity: 1, label: '' }));
  lastResult = null;
  project.lastResult = null;

  // Panelleri yeniden render et
  renderCutListPanel(
    document.getElementById('cuts-panel-root'),
    project.cutPieces,
    (items) => { project.cutPieces = items; }
  );

  resultsView.update(null);
  visualizerView.update(null);

  showToast(i18n.t('actions.reset'), 'info');
}

// ── Başlat ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
