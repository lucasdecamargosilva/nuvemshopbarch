/* Vitrine da Barch (20/10/2026): botão "Escolher lentes" nos cartões de ARMAÇÃO da home e das categorias,
   junto do "Comprar" de cada cartão. Leva para a página do produto com ?lentes=1, que já abre o fluxo de lentes.
   Só liga quando o fluxo em lista está ativo (lentes_fluxo_config.geral.ativo). Carregado pelo lentes-barch.js. */
(function () {
    'use strict';
    if (window.__PLL_VITRINE__) return; window.__PLL_VITRINE__ = true;
    var SUPA_URL = 'https://quantic-supabase.k5jwra.easypanel.host';
    var SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.pCFnSnrlSUM2EwXi9gxAegpoC-9U0Mjx3iAtROR-E20';
    var DOMINIO = String(location.hostname || '').replace(/^www\./, '').toLowerCase();
    var CACHE = 'plb_lentes_cfg_' + DOMINIO;
    function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(); }
    function cfg() {
        try { var c = JSON.parse(sessionStorage.getItem(CACHE) || 'null'); if (c && Date.now() - c.t < 300000) return Promise.resolve(c.cfg); } catch (e) {}
        return fetch(SUPA_URL + '/rest/v1/lentes_fluxo_config?select=config&dominio=eq.' + encodeURIComponent(DOMINIO), { headers: { apikey: SUPA_ANON, Authorization: 'Bearer ' + SUPA_ANON } })
            .then(function (r) { return r.ok ? r.json() : null; }).then(function (rows) { var c = rows && rows[0] && rows[0].config || null; try { sessionStorage.setItem(CACHE, JSON.stringify({ t: Date.now(), cfg: c })); } catch (e) {} return c; })
            .catch(function () { return null; });
    }
    var TEXTO = 'Escolher lentes', COR = '#303030', COR_TX = '#ffffff', MARROM = '#8b654f';
    function estilo() {
        if (document.getElementById('pll-vitrine-css')) return;
        var st = document.createElement('style'); st.id = 'pll-vitrine-css';
        st.textContent = '.pll-vbtn{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;margin:10px 0 8px;padding:10px 8px;border:0;border-radius:8px;background:' + COR + ';color:' + COR_TX + ';font:inherit;font-size:11.5px;font-weight:700;line-height:1.15;letter-spacing:.06em;text-transform:uppercase;text-align:center;cursor:pointer;text-decoration:none;box-sizing:border-box}' +
            '.pll-vbtn:hover{filter:brightness(1.15);color:' + COR_TX + '}.pll-vbtn svg{flex:none}' +
            /* "Comprar" do cartão no mesmo padrão: largura toda, contorno marrom (como o "Comprar só armação" do produto) */
            '.pll-vcard .js-item-submit-container,.pll-vcard .item-submit-container{width:100%!important;margin:0!important}' +
            '.pll-vcard .js-quickshop-modal-open,.pll-vcard .js-item-submit-container .btn,.pll-vcard .js-item-submit-container input.js-addtocart{display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;min-height:0!important;height:auto!important;margin:0!important;padding:9px 8px!important;' +
                'background:transparent!important;color:' + MARROM + '!important;border:1.5px solid ' + MARROM + '!important;border-radius:8px!important;font:inherit!important;font-size:11.5px!important;font-weight:700!important;letter-spacing:.06em!important;text-transform:uppercase!important;line-height:1.15!important;box-shadow:none!important;box-sizing:border-box!important}' +
            '.pll-vcard .js-quickshop-modal-open:hover,.pll-vcard .js-item-submit-container .btn:hover{background:' + MARROM + '!important;color:#fff!important}' +
            '.pll-vcard .js-quickshop-modal-open *{color:inherit!important;font:inherit!important}';
        document.head.appendChild(st);
    }
    var OC = '<svg viewBox="0 0 256 256" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M200 40a8 8 0 0 0 0 16 16 16 0 0 1 16 16v58.1A44 44 0 0 0 145.7 152h-35.4A44 44 0 0 0 40 130.1V72a16 16 0 0 1 16-16 8 8 0 0 0 0-16 32 32 0 0 0-32 32v104a44 44 0 0 0 87.8 4h32.4A44 44 0 0 0 232 176V72a32 32 0 0 0-32-32ZM68 204a28 28 0 1 1 28-28 28 28 0 0 1-28 28Zm120 0a28 28 0 1 1 28-28 28 28 0 0 1-28 28Z"/></svg>';
    function decora() {
        [].forEach.call(document.querySelectorAll('.js-item-product'), function (card) {
            if (card.querySelector('.pll-vbtn')) return;
            var nome = (card.querySelector('.js-item-name,.item-name,[data-store^="product-item-name"]') || {}).textContent || '';
            if (!/^armacao\b/.test(norm(nome))) return;
            var link = card.querySelector('a[href*="/produtos/"]'); if (!link) return;
            // o "Comprar" que aparece no cartão (o form de variantes do quick-shop fica escondido)
            var alvo = [].filter.call(card.querySelectorAll('.js-item-submit-container,.item-submit-container,.buy-button-container,.js-quickshop-modal-open,.js-addtocart'), function (el) { return !el.closest('.js-item-variants,.hidden,[style*="display: none"]'); })[0];
            if (!alvo) return;
            var b = document.createElement('a'); b.className = 'pll-vbtn';
            var u = link.href.split('#')[0]; b.href = u + (u.indexOf('?') === -1 ? '?' : '&') + 'lentes=1';
            b.innerHTML = OC + '<span>' + TEXTO + '</span>';
            b.addEventListener('click', function (e) { e.stopPropagation(); });
            var box = alvo.closest('.js-item-submit-container,.item-submit-container,.buy-button-container') || alvo;
            box.parentNode.insertBefore(b, box);
            card.classList.add('pll-vcard');
        });
    }
    cfg().then(function (c) {
        if (!c || c.modo !== 'lista' || !(c.geral && c.geral.ativo === true)) return;
        var L = c.lista || {}, t = L.textos || {}, v = L.visual || {};
        if (String(t.botao_vitrine || '').trim()) TEXTO = String(t.botao_vitrine).trim();
        if (/^#[0-9a-f]{3,6}$/i.test(v.cor_primaria || '')) COR = v.cor_primaria;
        estilo(); decora();
        var ag = null;
        new MutationObserver(function () { clearTimeout(ag); ag = setTimeout(decora, 200); }).observe(document.body, { childList: true, subtree: true });
    });
})();
