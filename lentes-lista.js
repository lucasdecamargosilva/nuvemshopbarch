/* Fluxo de lentes "modo lista" (19/10/2026) — Provou Levou.
   Lê config.lista de lentes_fluxo_config: etapas em ordem (perguntas com opções ou receita), cada opção com
   rota (seguir | ir_para | finalizar | so_armacao | aviso), etiqueta (tag) e "exige DNP"; lentes com etiquetas
   e limites de grau. No fim, a lente indicada é a que tem TODAS as etiquetas escolhidas (etiqueta que nenhuma
   lente usa é ignorada) e cujo grau cobre a receita, quando ela foi informada.
   Carregado pelo lentes-<loja>.js quando config.modo === 'lista' (window.__PLL_CFG já vem preenchido). */
(function () {
    'use strict';
    if (window.__PLL_LISTA__) return;
    window.__PLL_LISTA__ = true;

    var PREVIEW = window.BARCH_LENTES_PREVIEW === true || window.PL_LENTES_PREVIEW === true;
    var WEBHOOK_RECEITA = 'https://n8n.segredosdodrop.com/webhook/pl-ler-receita';
    var WEBHOOK_STEP = 'https://n8n.segredosdodrop.com/webhook/pl-lentes-step';
    var CFG = window.__PLL_CFG || {};
    var L = CFG.lista || {};
    var LOJA = window.__PLL_LOJA || 'loja';

    /* ---------- utilidades ---------- */
    function esc(v) { var d = document.createElement('div'); d.textContent = String(v == null ? '' : v); return d.innerHTML; }
    // descrição vem do editor (HTML simples): deixa só p, br, b, strong, i, em, u, ul, ol, li, span
    function rico(html) {
        var tpl = document.createElement('template'); tpl.innerHTML = String(html || '');
        (function limpa(no) {
            [].slice.call(no.childNodes).forEach(function (n) {
                if (n.nodeType === 1) {
                    var tag = n.tagName.toLowerCase();
                    if (!/^(p|br|b|strong|i|em|u|ul|ol|li|span)$/.test(tag)) { var t = document.createTextNode(n.textContent); n.parentNode.replaceChild(t, n); return; }
                    [].slice.call(n.attributes).forEach(function (a) { n.removeAttribute(a.name); });
                    limpa(n);
                } else if (n.nodeType !== 3) n.parentNode.removeChild(n);
            });
        })(tpl.content);
        var out = tpl.innerHTML.replace(/<p>(\s|&nbsp;|<br>)*<\/p>/g, '');
        return out;
    }
    function brl(n) { return Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
    function num(v) { if (v === '' || v == null) return null; var n = Number(String(v).replace(',', '.')); return isFinite(n) ? n : null; }
    function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
    function sid() { try { var v = localStorage.getItem('pl_sid'); if (!v) { v = 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); localStorage.setItem('pl_sid', v); } return v; } catch (e) { return 'nostore'; } }
    function produtoNome() {
        try { if (window.LS && LS.product && LS.product.name) return String(LS.product.name); } catch (e) {}
        return String((document.querySelector('h1.product-name,h1.product__title,h1') || {}).textContent || document.title).trim();
    }
    function produtoId() { try { return String(LS.product.id || ''); } catch (e) { return ''; } }
    var T = function (k, d) { var t = L.textos || {}; return String(t[k] || '').trim() ? t[k] : d; };
    var V = function (k, d) { var t = L.visual || {}; return String(t[k] || '').trim() ? t[k] : d; };
    var ZAP = String(L.whatsapp || '').replace(/\D/g, '');
    if (ZAP && !/^55/.test(ZAP)) ZAP = '55' + ZAP;

    /* ---------- estado ---------- */
    var st = {};
    function zera() {
        st = { idx: 0, hist: [], sel: {}, rx: { passo: null, metodo: null, dados: {}, arquivos: [], lidos: [], nome: '', zap: '' }, ultimo: 'abriu' };
    }
    zera();
    function etapas() { return (L.etapas || []).filter(function (e) { return e && e.ativo !== false; }); }
    function vale(e) {   // etapa só para alguns produtos
        if (e.todos_produtos !== false) return true;
        var ws = String(e.produtos || '').split(',').map(function (s) { return norm(s).trim(); }).filter(Boolean);
        if (!ws.length) return true;
        var n = norm(produtoNome()), id = produtoId();
        return ws.some(function (w) { return w === id || n.indexOf(w) !== -1; });
    }
    function escolhas() {   // na ordem do caminho
        var out = [];
        st.hist.concat([st.idx]).forEach(function (i) { var e = etapas()[i]; if (e && st.sel[e.id]) out.push(st.sel[e.id]); });
        return out;
    }
    function pedeDnp() { return escolhas().some(function (s) { return s.dnp; }); }

    function track(step, detail) {
        st.ultimo = step;
        if (PREVIEW) return;
        try {
            fetch(WEBHOOK_STEP, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: sid(), loja: LOJA, origin: location.origin, telefone: String(st.rx.zap || '').replace(/\D/g, ''), step: step, produto: produtoNome(), detail: detail || {} }) }).catch(function () {});
        } catch (e) {}
    }

    /* ---------- lente indicada ---------- */
    function olhos(d) {
        var r = [];
        [['od_esf', 'od_cil'], ['oe_esf', 'oe_cil']].forEach(function (k) {
            var e = num(d[k[0]]), c = num(d[k[1]]) || 0;
            if (e == null && !c) return;
            e = e || 0; if (c > 0) { e = e + c; c = -c; }   // cilíndrico positivo: transpõe
            r.push({ esf: e, cil: c });
        });
        return r;
    }
    function indicadas() {
        var lentes = (L.lentes || []).filter(function (l) { return l && l.ativo !== false; });
        var usadas = {}; lentes.forEach(function (l) { (l.tags || []).forEach(function (t) { usadas[t] = 1; }); });
        var tags = escolhas().map(function (s) { return s.tag; }).filter(function (t) { return t && usadas[t]; });
        var d = st.rx.dados || {}, oo = olhos(d), add = num(d.od_add) != null ? num(d.od_add) : num(d.oe_add);
        return lentes.filter(function (l) {
            var tem = {}; (l.tags || []).forEach(function (t) { tem[t] = 1; });
            if (!tags.every(function (t) { return tem[t]; })) return false;
            var ok = true;
            oo.forEach(function (o) {
                var a = num(l.esf_min), b = num(l.esf_max), c1 = num(l.cil_min), c2 = num(l.cil_max);
                if (a != null && o.esf < a - 1e-6) ok = false;
                if (b != null && o.esf > b + 1e-6) ok = false;
                if (c1 != null && o.cil < c1 - 1e-6) ok = false;
                if (c2 != null && o.cil > c2 + 1e-6) ok = false;
            });
            if (add != null && add > 0) { var am = num(l.add_min), ax = num(l.add_max); if (am != null && add < am - 1e-6) ok = false; if (ax != null && add > ax + 1e-6) ok = false; }
            return ok;
        });
    }

    /* ---------- carrinho ---------- */
    function formProduto() { var f = document.querySelector('#product_form,form.js-product-form'); return f && f.querySelector('[name="add_to_cart"]') ? f : null; }
    function compraArmacao() {
        if (PREVIEW) return;
        var src = formProduto(); if (!src) return;
        var f = document.createElement('form'); f.method = 'post'; f.action = src.getAttribute('action') || '/comprar/'; f.style.display = 'none';
        src.querySelectorAll('input,select,textarea').forEach(function (x) {
            if (!x.name || ((x.type === 'radio' || x.type === 'checkbox') && !x.checked)) return;
            var h = document.createElement('input'); h.type = 'hidden'; h.name = x.name; h.value = x.value; f.appendChild(h);
        });
        if (!f.querySelector('[name="quantity"]')) { var q = document.createElement('input'); q.type = 'hidden'; q.name = 'quantity'; q.value = '1'; f.appendChild(q); }
        document.body.appendChild(f); f.submit();
    }
    function propriedades() {
        var p = { 'Armação escolhida': produtoNome() };
        escolhas().forEach(function (s) { p[s.etapa] = s.nome; });
        var d = st.rx.dados || {}, r = [];
        if (st.rx.metodo === 'manual') ['od_esf', 'od_cil', 'od_eixo', 'od_add', 'oe_esf', 'oe_cil', 'oe_eixo', 'oe_add'].forEach(function (k) { if (d[k] !== '' && d[k] != null) r.push(k.toUpperCase().replace('_', ' ') + ' ' + d[k]); });
        if (r.length) p['Receita'] = r.join(' · ');
        if (st.rx.metodo) p['Receita enviada'] = { manual: 'Digitada', upload: 'Foto anexada', whatsapp: 'Vai enviar pelo WhatsApp', ignorado: 'Pulou' }[st.rx.metodo] || st.rx.metodo;
        return p;
    }
    function addLente(l) {
        if (PREVIEW) return Promise.resolve();
        var body = 'add_to_cart=' + encodeURIComponent(l.produto_id) + '&quantity=1&add_to_cart_enhanced=1';
        if (l.variante_id) body += '&variant_id=' + encodeURIComponent(l.variante_id);
        var p = propriedades(); Object.keys(p).forEach(function (k) { body += '&' + encodeURIComponent('properties[' + k + ']') + '=' + encodeURIComponent(p[k]); });
        return fetch('/comprar/', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest' }, body: body })
            .then(function (r) { if (!r.ok) throw new Error('http_' + r.status); return r.json(); }).then(function (r) { if (!r.success) throw new Error('carrinho'); });
    }

    /* ---------- ícones ---------- */
    var IC = {
        voltar: '<svg viewBox="0 0 256 256" width="16" height="16"><path fill="currentColor" d="M224 128a8 8 0 0 1-8 8H59.3l58.4 58.3a8 8 0 0 1-11.4 11.4l-72-72a8 8 0 0 1 0-11.4l72-72a8 8 0 0 1 11.4 11.4L59.3 120H216a8 8 0 0 1 8 8Z"/></svg>',
        relogio: '<svg viewBox="0 0 256 256" width="13" height="13"><path fill="currentColor" d="M128 24a104 104 0 1 0 104 104A104.2 104.2 0 0 0 128 24Zm0 192a88 88 0 1 1 88-88 88.1 88.1 0 0 1-88 88Zm64-88a8 8 0 0 1-8 8h-56a8 8 0 0 1-8-8V72a8 8 0 0 1 16 0v48h48a8 8 0 0 1 8 8Z"/></svg>',
        fechar: '<svg viewBox="0 0 256 256" width="20" height="20"><path fill="currentColor" d="M205.7 194.3a8 8 0 0 1-11.4 11.4L128 139.3l-66.3 66.4a8 8 0 0 1-11.4-11.4l66.4-66.3-66.4-66.3a8 8 0 0 1 11.4-11.4l66.3 66.4 66.3-66.4a8 8 0 0 1 11.4 11.4L139.3 128Z"/></svg>',
        teclado: '<svg viewBox="0 0 256 256" width="30" height="30"><path fill="currentColor" d="M224 48H32a16 16 0 0 0-16 16v128a16 16 0 0 0 16 16h192a16 16 0 0 0 16-16V64a16 16 0 0 0-16-16Zm0 144H32V64h192Zm-16-64a8 8 0 0 1-8 8H56a8 8 0 0 1 0-16h144a8 8 0 0 1 8 8Zm0-32a8 8 0 0 1-8 8H56a8 8 0 0 1 0-16h144a8 8 0 0 1 8 8ZM72 160a8 8 0 0 1-8 8h-8a8 8 0 0 1 0-16h8a8 8 0 0 1 8 8Zm96 0a8 8 0 0 1-8 8H96a8 8 0 0 1 0-16h64a8 8 0 0 1 8 8Zm40 0a8 8 0 0 1-8 8h-8a8 8 0 0 1 0-16h8a8 8 0 0 1 8 8Z"/></svg>',
        camera: '<svg viewBox="0 0 256 256" width="30" height="30"><path fill="currentColor" d="M208 56h-27.7l-13.6-20.4A8 8 0 0 0 160 32H96a8 8 0 0 0-6.7 3.6L75.7 56H48a24 24 0 0 0-24 24v112a24 24 0 0 0 24 24h160a24 24 0 0 0 24-24V80a24 24 0 0 0-24-24Zm8 136a8 8 0 0 1-8 8H48a8 8 0 0 1-8-8V80a8 8 0 0 1 8-8h32a8 8 0 0 0 6.7-3.6L100.3 48h55.4l13.6 20.4A8 8 0 0 0 176 72h32a8 8 0 0 1 8 8Zm-88-112a44 44 0 1 0 44 44 44.1 44.1 0 0 0-44-44Zm0 72a28 28 0 1 1 28-28 28 28 0 0 1-28 28Z"/></svg>',
        zap: '<svg viewBox="0 0 256 256" width="22" height="22"><path fill="currentColor" d="M187.6 154.3 155.6 138.3a8 8 0 0 0-8 .5l-14.7 9.8a40.5 40.5 0 0 1-24-24l9.8-14.7a8 8 0 0 0 .5-8l-16-32A8 8 0 0 0 96 64a40 40 0 0 0-40 40 96.1 96.1 0 0 0 96 96 40 40 0 0 0 40-40 8 8 0 0 0-4.4-5.7ZM128 24A104 104 0 0 0 36.8 178l-11.4 34a16 16 0 0 0 20.2 20.2l34-11.4A104 104 0 1 0 128 24Z"/></svg>',
        ok: '<svg viewBox="0 0 256 256" width="16" height="16"><path fill="currentColor" d="M229.7 77.7l-128 128a8 8 0 0 1-11.4 0l-56-56a8 8 0 0 1 11.4-11.4L96 188.7 218.3 66.3a8 8 0 0 1 11.4 11.4Z"/></svg>',
        alerta: '<svg viewBox="0 0 256 256" width="56" height="56"><path fill="currentColor" d="M236.8 188.1 149.4 36.2a24.8 24.8 0 0 0-42.8 0L19.2 188.1a23.5 23.5 0 0 0 0 23.7A24.4 24.4 0 0 0 40.6 224h174.8a24.4 24.4 0 0 0 21.4-12.2 23.5 23.5 0 0 0 0-23.7ZM120 104a8 8 0 0 1 16 0v40a8 8 0 0 1-16 0Zm8 88a12 12 0 1 1 12-12 12 12 0 0 1-12 12Z"/></svg>',
        lixo: '<svg viewBox="0 0 256 256" width="16" height="16"><path fill="currentColor" d="M216 48h-40v-8a24 24 0 0 0-24-24h-48a24 24 0 0 0-24 24v8H40a8 8 0 0 0 0 16h8v144a16 16 0 0 0 16 16h128a16 16 0 0 0 16-16V64h8a8 8 0 0 0 0-16ZM96 40a8 8 0 0 1 8-8h48a8 8 0 0 1 8 8v8H96Zm96 168H64V64h128Z"/></svg>',
        escudo: '<svg viewBox="0 0 256 256" width="16" height="16"><path fill="currentColor" d="M208 40H48a16 16 0 0 0-16 16v58.8c0 89.8 75.8 119.5 91 124.5a15.4 15.4 0 0 0 10 0c15.2-5 91-34.7 91-124.5V56a16 16 0 0 0-16-16Zm-34.3 69.7-56 56a8 8 0 0 1-11.4 0l-24-24a8 8 0 0 1 11.4-11.4l18.3 18.4 50.3-50.4a8 8 0 0 1 11.4 11.4Z"/></svg>',
        caminhao: '<svg viewBox="0 0 256 256" width="16" height="16"><path fill="currentColor" d="m255.4 117-14-35A15.9 15.9 0 0 0 226.6 72H192V64a8 8 0 0 0-8-8H32a16 16 0 0 0-16 16v112a16 16 0 0 0 16 16h17a32 32 0 0 0 62 0h50a32 32 0 0 0 62 0h17a16 16 0 0 0 16-16v-64a7.9 7.9 0 0 0-.6-3ZM80 208a16 16 0 1 1 16-16 16 16 0 0 1-16 16Zm112 0a16 16 0 1 1 16-16 16 16 0 0 1-16 16Z"/></svg>',
        cartao: '<svg viewBox="0 0 256 256" width="16" height="16"><path fill="currentColor" d="M224 48H32a16 16 0 0 0-16 16v128a16 16 0 0 0 16 16h192a16 16 0 0 0 16-16V64a16 16 0 0 0-16-16Zm0 16v24H32V64Zm0 128H32v-88h192Zm-16-24a8 8 0 0 1-8 8h-32a8 8 0 0 1 0-16h32a8 8 0 0 1 8 8Z"/></svg>'
    };
    var ICONE_SELO = { 'ph-shield-check': IC.escudo, 'ph-truck': IC.caminhao, 'ph-credit-card': IC.cartao };

    /* ---------- janela (shadow DOM: o CSS da loja não interfere) ---------- */
    var host, sh, ui = {};
    function css() {
        var p = V('cor_primaria', '#303030'), fundo = V('cor_fundo', '#ffffff'), borda = V('cor_borda', '#e2e8f0'), fonte = V('fonte', 'Onest');
        return ':host{all:initial}*{box-sizing:border-box}' +
            '.ov{position:fixed;inset:0;z-index:2147483600;background:rgba(15,23,42,.45);opacity:0;pointer-events:none;transition:opacity .25s}' +
            '.ov.on{opacity:1;pointer-events:auto}' +
            '.pn{position:absolute;top:0;right:0;height:100%;width:min(480px,100%);background:' + fundo + ';display:flex;flex-direction:column;transform:translateX(100%);transition:transform .32s cubic-bezier(.2,.8,.2,1);box-shadow:-10px 0 40px rgba(15,23,42,.18);' +
            'font-family:"' + fonte + '",system-ui,-apple-system,"Segoe UI",sans-serif;color:#0f172a;font-size:14px;line-height:1.45}' +
            '.ov.on .pn{transform:none}' +
            '.hd{padding:22px 22px 14px;border-bottom:1px solid ' + borda + ';position:relative}' +
            '.hd h2{margin:0 36px 4px 0;font-size:22px;font-weight:800;line-height:1.2;letter-spacing:-.01em}' +
            '.hd p{margin:0;color:#64748b;font-size:14px}' +
            '.x{position:absolute;top:18px;right:16px;border:0;background:none;color:#64748b;cursor:pointer;padding:6px;border-radius:8px;display:flex}' +
            '.x:hover{background:#f1f5f9}' +
            '.bd{flex:1;overflow-y:auto;padding:16px 22px 22px}' +
            '.ft{border-top:1px solid ' + borda + ';padding:12px 16px;display:flex;flex-wrap:wrap;gap:8px 16px;justify-content:center;color:#475569;font-size:12px}' +
            '.ft span{display:inline-flex;align-items:center;gap:5px}' +
            '.back{display:inline-flex;align-items:center;gap:6px;border:0;background:none;color:#64748b;font:600 13px inherit;font-family:inherit;cursor:pointer;padding:4px 0;margin:0 0 12px}' +
            '.back:hover{color:' + p + '}' +
            '.ops{display:grid;gap:10px}' +
            '.op{position:relative;display:flex;gap:12px;align-items:flex-start;text-align:left;width:100%;border:1.5px solid ' + borda + ';background:#fff;border-radius:14px;padding:14px;cursor:pointer;font:inherit;color:inherit;transition:border-color .15s,box-shadow .15s,transform .1s}' +
            '.op:hover{border-color:' + p + ';box-shadow:0 4px 14px rgba(15,23,42,.08)}.op:active{transform:scale(.99)}' +
            '.op.on{border-color:' + p + ';box-shadow:0 0 0 1px ' + p + ' inset}' +
            '.op img{width:64px;height:64px;object-fit:cover;flex:none;border-radius:10px;background:#f1f5f9}.op img.c{border-radius:50%}' +
            '.op .tx{flex:1;min-width:0}.op .nm{font-weight:700;font-size:16px;line-height:1.3}' +
            '.op .ds{color:#475569;font-size:13px;margin-top:3px}.op .ds p{margin:0 0 2px}' +
            '.op .pz{display:inline-flex;align-items:center;gap:4px;margin-top:6px;color:#64748b;font-size:12px;font-weight:600}' +
            '.op .pr{flex:none;font-weight:800;font-size:15px;color:' + p + ';white-space:nowrap;padding-left:6px}' +
            '.selo{position:absolute;top:-9px;right:14px;background:' + p + ';color:#fff;font-size:10.5px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;padding:3px 9px;border-radius:999px}' +
            '.dc{display:flex;gap:14px;align-items:center;border:1.5px solid ' + borda + ';border-radius:14px;padding:16px;margin-bottom:10px;cursor:pointer;background:#fff;width:100%;text-align:left;font:inherit;color:inherit}' +
            '.dc:hover{border-color:' + p + '}.dc svg{color:' + p + ';flex:none}.dc h4{margin:0 0 2px;font-size:15px}.dc p{margin:0;color:#64748b;font-size:13px}' +
            '.dc.zp svg{color:#25d366}' +
            '.obg{display:inline-flex;align-items:center;gap:4px;margin-top:6px;background:#fef2f2;color:#dc2626;font-size:10.5px;font-weight:800;padding:3px 8px;border-radius:6px;border:1px solid #fecaca;text-transform:uppercase}' +
            '.pula{display:block;margin:14px auto 0;border:0;background:none;color:#64748b;font:600 13px inherit;font-family:inherit;text-decoration:underline;cursor:pointer}' +
            '.tb{border:1px solid ' + borda + ';border-radius:12px;padding:10px;display:grid;gap:8px;margin-bottom:14px}' +
            '.tr{display:grid;grid-template-columns:44px repeat(var(--n),minmax(0,1fr));gap:6px;align-items:center}' +
            '.th{font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;text-align:center}' +
            '.eye{font-weight:800;font-size:13px;line-height:1.1}.eye small{display:block;color:#94a3b8;font-size:10px;font-weight:600}' +
            'select{width:100%;height:38px;border:1px solid ' + borda + ';border-radius:8px;background:#f8fafc;font:inherit;font-size:13px;padding:0 4px;color:#0f172a}' +
            '.fld{display:grid;gap:5px;margin-bottom:12px}.fld label{font-size:13px;font-weight:700}' +
            '.fld input{height:42px;border:1px solid ' + borda + ';border-radius:8px;background:#f8fafc;font:inherit;padding:0 12px;color:#0f172a}' +
            '.btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:48px;border:0;border-radius:12px;background:' + p + ';color:#fff;font:800 14px inherit;font-family:inherit;letter-spacing:.02em;cursor:pointer;text-decoration:none;padding:0 16px}' +
            '.btn:hover{filter:brightness(1.1)}.btn[disabled]{opacity:.6;cursor:default}' +
            '.btn.sec{background:#f1f5f9;color:#0f172a}.btn.zp{background:#25d366}' +
            '.up{display:grid;place-items:center;gap:4px;text-align:center;border:2px dashed ' + borda + ';border-radius:14px;padding:22px;cursor:pointer;margin-bottom:12px;background:#f8fafc}' +
            '.up:hover{border-color:' + p + '}.up svg{color:' + p + '}.up span{color:#64748b;font-size:12.5px}' +
            '.fi{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:10px;background:#ecfdf5;color:#065f46;font-weight:600;font-size:13px;margin-bottom:8px}' +
            '.fi button{border:0;background:none;color:#b91c1c;cursor:pointer;display:flex}' +
            '.dnp{background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:12px 14px;margin-bottom:14px;color:#b45309;font-size:13px}.dnp b{display:block;color:#92400e;font-size:14px;margin-bottom:4px}.dnp p{margin:0 0 3px}' +
            '.err{color:#dc2626;font-size:13px;font-weight:700;text-align:center;margin:6px 0 10px}' +
            '.okb{background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:12px 14px;color:#047857;font-weight:700;margin-bottom:16px;display:flex;gap:8px}' +
            '.ln{border:1.5px solid ' + borda + ';border-radius:14px;padding:14px;margin-bottom:12px}' +
            '.ln .hh{display:flex;gap:12px;align-items:center}.ln img,.ln .ph{width:60px;height:60px;border-radius:10px;object-fit:cover;background:#e2e8f0;flex:none}' +
            '.ln h4{margin:0;font-size:15px;line-height:1.3}.ln .vl{font-weight:800;font-size:16px;color:' + p + ';margin-top:2px}' +
            '.ln .ds{color:#475569;font-size:13px;margin-top:8px}.ln .pz{color:#64748b;font-size:12.5px;font-weight:700;margin-top:8px}.ln .btn{margin-top:12px}' +
            '.ctr{text-align:center;padding:22px 6px}.ctr svg{color:#f59e0b;margin-bottom:8px}.ctr h3{margin:0 0 8px;font-size:19px}.ctr .sb{color:#64748b;margin-bottom:22px}.ctr .sb p{margin:0 0 4px}.ctr .btn{margin-bottom:10px}' +
            '.spin{width:44px;height:44px;border-radius:50%;border:4px solid #e2e8f0;border-top-color:' + p + ';animation:g 1s linear infinite;margin:40px auto 14px}@keyframes g{to{transform:rotate(360deg)}}' +
            '.zfl{position:absolute;right:16px;bottom:64px;width:46px;height:46px;border-radius:50%;background:#25d366;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px rgba(0,0,0,.2);text-decoration:none}' +
            '@media(max-width:520px){.hd{padding:18px 18px 12px}.hd h2{font-size:20px}.bd{padding:14px 16px 18px}.op .nm{font-size:15px}}' +
            '.topo,.passos,.pw{display:none}' + (MODAL() ? cssModal() : '');
    }
    /* Formato "modal" (19/10/2026): o mesmo visual do Provador Virtual da loja (modal central, "Provador virtual" + logo,
       barra de progresso, Powered by). Só muda a apresentação; perguntas, rotas e lentes são as mesmas. */
    function MODAL() { return V('layout', 'gaveta') === 'modal'; }
    var FONTE_LOJA = '';
    function cssModal() {
        var tinta = V('cor_tinta', '#3a2e26'), linha = V('cor_linha', '#e3d6cb'), sup = V('cor_superficie', '#f5efe9'), p = V('cor_primaria', tinta);
        var fonte = FONTE_LOJA || 'system-ui,-apple-system,"Segoe UI",sans-serif';
        return '.ov{background:rgba(240,238,235,.96);display:flex;align-items:center;justify-content:center;overflow-y:auto}' +
            '.pn{position:relative;top:auto;right:auto;height:auto;max-height:96vh;width:440px;max-width:92vw;transform:translateY(14px);opacity:0;transition:transform .32s cubic-bezier(.22,1,.36,1),opacity .25s;' +
                'box-shadow:0 32px 80px rgba(0,0,0,.18),0 0 0 1px rgba(0,0,0,.06);font-family:' + fonte + ';color:' + tinta + '}' +
            '.ov.on .pn{transform:none;opacity:1}' +
            '.topo{display:flex;flex-direction:column;align-items:center;gap:10px;padding:26px 28px 20px;border-bottom:1px solid ' + linha + ';text-align:center}' +
            '.topo h1{margin:0;font-size:19px;font-weight:400;letter-spacing:.3px;line-height:1;color:' + tinta + '}.topo img{height:54px;width:auto;max-width:70%;object-fit:contain}' +
            '.passos{display:flex;gap:6px;padding:16px 28px 0}.passos i{flex:1;height:3px;border-radius:3px;background:' + linha + '}.passos i.on{background:' + tinta + '}' +
            '.hd{border-bottom:0;text-align:center;padding:16px 40px 6px}.hd h2{margin:0;font-size:15px;font-weight:600;letter-spacing:2px;text-transform:uppercase;line-height:1.35;color:' + tinta + '}' +
            '.hd p{color:#8b8079;font-size:13px;margin-top:6px}.hd{position:static}.x{top:12px;right:12px;color:#999;z-index:2}.op .ds,.ln .ds{color:#6b5e55}' +
            '.bd{padding:12px 24px 22px}.back{color:#8b8079}.back:hover{color:' + tinta + '}' +
            '.op,.dc,.ln,.tb{border-color:' + linha + '}.op:hover,.op.on,.dc:hover{border-color:' + tinta + ';box-shadow:none}.op.on{box-shadow:0 0 0 1px ' + tinta + ' inset}' +
            '.op .nm{color:' + tinta + '}.op .pr,.ln .vl{color:' + tinta + '}.selo{background:' + tinta + '}' +
            '.btn{background:' + p + ';border-radius:12px}.btn.sec{background:' + sup + ';color:' + tinta + '}select,.fld input{background:' + sup + ';border-color:' + linha + '}' +
            '.ft{border-top:1px solid ' + linha + '}' +
            '.pw{display:flex;align-items:center;justify-content:center;gap:6px;padding:12px 20px;background:' + sup + ';border-top:1px solid ' + linha + ';text-decoration:none;color:#999;font-size:10px;letter-spacing:1.5px}' +
            '.pw b{font-size:13px;letter-spacing:0;color:#6d28d9;font-weight:700}.pw b em{font-style:normal;color:#a78bfa;font-weight:500}' +
            '.zfl{bottom:96px}' +
            '@media(max-width:767px){.ov{align-items:stretch}.pn{width:100%;max-width:100%;max-height:none;min-height:100%;border-radius:0;transform:translateY(24px)}}';
    }
    function passos(feito, total) {
        var el = sh && sh.querySelector('.passos'); if (!el) return;
        var h = ''; for (var k = 0; k < total; k++) h += '<i class="' + (k <= feito ? 'on' : '') + '"></i>'; el.innerHTML = h;
    }
    function restante(i) {   // quantas telas ainda vêm, seguindo as escolhas feitas (ou a 1ª opção) até a receita / fim
        var es = etapas(), n = 0, g = 0;
        while (i < es.length && g++ < 40) {
            var e = es[i]; if (!vale(e)) { i++; continue; }
            n++; if (e.tipo === 'receita') break;
            var ops = (e.opcoes || []).filter(function (x) { return x && x.ativo !== false; }), sel = st.sel[e.id], o = ops[0];
            if (sel) o = ops.filter(function (x) { return String(x.id) === sel.op; })[0] || o;
            if (!o) break; var a = o.acao || 'seguir';
            if (a === 'finalizar' || a === 'so_armacao' || a === 'aviso') break;
            if (a === 'ir_para') { var k = es.findIndex(function (x) { return String(x.id) === String(o.destino); }); i = k !== -1 ? k : i + 1; } else i++;
        }
        return n;
    }
    function monta() {
        if (host) return;
        var fonte = V('fonte', 'Onest');
        if (!document.getElementById('pll-fonte')) {
            var lk = document.createElement('link'); lk.id = 'pll-fonte'; lk.rel = 'stylesheet';
            lk.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(fonte).replace(/%20/g, '+') + ':wght@400;600;700;800&display=swap';
            document.head.appendChild(lk);
        }
        try { FONTE_LOJA = getComputedStyle(document.body).fontFamily || ''; } catch (e) {}
        host = document.createElement('div'); host.id = 'pll-host'; document.body.appendChild(host);
        sh = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
        sh.innerHTML = '<style id="s">' + css() + '</style><div class="ov"><div class="pn" role="dialog" aria-modal="true">' +
            '<div class="topo"><h1>' + esc(V('titulo_topo', 'Provador virtual')) + '</h1>' + (String(V('logo', '')).trim() ? '<img src="' + esc(V('logo', '')) + '" alt="">' : '') + '</div><div class="passos"></div>' +
            '<div class="hd"><h2></h2><p></p><button class="x" aria-label="Fechar">' + IC.fechar + '</button></div><div class="bd"></div><div class="ft"></div>' +
            '<a class="pw" href="https://provoulevou.com.br?utm_source=widget&utm_medium=lojista&utm_campaign=' + encodeURIComponent(LOJA) + '" target="_blank" rel="noopener"><span>Powered by</span><b>provou<em>levou</em></b></a></div></div>';
        ui.ov = sh.querySelector('.ov'); ui.h = sh.querySelector('.hd h2'); ui.s = sh.querySelector('.hd p'); ui.b = sh.querySelector('.bd'); ui.f = sh.querySelector('.ft');
        sh.querySelector('.x').addEventListener('click', fecha);
        ui.ov.addEventListener('click', function (e) { if (e.target === ui.ov) fecha(); });
        ui.b.addEventListener('click', clique);
        ui.b.addEventListener('change', muda);
        rodape();
    }
    function rodape() {
        var v = L.visual || {}, sel = Array.isArray(v.selos) ? v.selos : [];
        var h = v.selos_ativo === false ? '' : sel.filter(function (s) { return s && String(s.texto || '').trim(); }).map(function (s) { return '<span>' + (ICONE_SELO[s.icone] || IC.escudo) + esc(s.texto) + '</span>'; }).join('');
        ui.f.innerHTML = h; ui.f.style.display = h ? '' : 'none';
        var velho = sh.querySelector('.zfl'); if (velho) velho.remove();
        if (ZAP && v.whatsapp_flutuante !== false) {
            var a = document.createElement('a'); a.className = 'zfl'; a.target = '_blank'; a.rel = 'noopener'; a.href = 'https://wa.me/' + ZAP + '?text=' + encodeURIComponent('Olá! Preciso de ajuda para escolher minhas lentes.');
            a.setAttribute('aria-label', 'Falar no WhatsApp'); a.innerHTML = IC.zap; a.setAttribute('data-a', 'zapflut');
            sh.querySelector('.pn').appendChild(a);
            a.addEventListener('click', function (e) { if (PREVIEW) { e.preventDefault(); } track('whatsapp', { de: 'botao_flutuante' }); });
        }
    }
    function abre() {
        monta(); zera();
        ui.ov.classList.add('on'); document.documentElement.style.overflow = 'hidden';
        track('abriu', { origem: 'botao_produto' });
        mostra(primeira(0));
    }
    function fecha() { if (!ui.ov) return; ui.ov.classList.remove('on'); document.documentElement.style.overflow = ''; if (!/carrinho/.test(st.ultimo)) track('saiu', { ultimo_step: st.ultimo }); }
    function primeira(i) { var es = etapas(); while (i < es.length && !vale(es[i])) i++; return i; }
    function cab(t, s) { ui.h.innerHTML = rico(t); ui.s.innerHTML = rico(s || ''); ui.s.style.display = String(s || '').trim() ? '' : 'none'; }
    var voltarHtml = function (acao) { return '<button class="back" data-a="' + (acao || 'voltar') + '">' + IC.voltar + ' Voltar</button>'; };

    /* ---------- telas ---------- */
    function mostra(i) {
        var es = etapas(), e = es[i];
        if (!e) return busca();
        st.idx = i;
        if (e.tipo === 'receita' && !st.rx.passo) st.rx.passo = 'decisao';
        track('etapa', { etapa: e.nome || e.titulo, etapa_id: e.id });
        cab(e.titulo, e.subtitulo);
        passos(st.hist.length, st.hist.length + restante(i) + 1);
        var h = '';
        var subRx = e.tipo === 'receita' && st.rx.passo !== 'decisao';
        if (st.hist.length || subRx) h += voltarHtml(subRx ? 'rxvolta' : 'voltar');
        if (e.tipo === 'receita') h += telaReceita(e);
        else {
            h += '<div class="ops">';
            (e.opcoes || []).filter(function (o) { return o && o.ativo !== false && String(o.nome || '').trim(); }).forEach(function (o) {
                var on = st.sel[e.id] && st.sel[e.id].op === String(o.id);
                h += '<button type="button" class="op' + (on ? ' on' : '') + '" data-a="op" data-op="' + esc(o.id) + '">' +
                    (String(o.selo || '').trim() ? '<span class="selo">' + esc(o.selo) + '</span>' : '') +
                    (e.fotos && String(o.img || '').trim() ? '<img src="' + esc(o.img) + '" alt="" class="' + (e.formato === 'circulo' ? 'c' : '') + '">' : '') +
                    '<span class="tx"><span class="nm">' + esc(o.nome) + '</span>' +
                    (String(o.desc || '').trim() ? '<span class="ds">' + rico(o.desc) + '</span>' : '') +
                    (String(o.prazo || '').trim() ? '<span class="pz">' + IC.relogio + esc(o.prazo) + '</span>' : '') + '</span>' +
                    (String(o.preco || '').trim() ? '<span class="pr">' + esc(o.preco) + '</span>' : '') + '</button>';
            });
            h += '</div>';
        }
        ui.b.innerHTML = h; ui.b.scrollTop = 0;
        avisaPrevia(e.id);
    }
    function avanca(e, o) {
        // seleções de etapas que saíram do caminho são descartadas
        var no = {}; st.hist.concat([st.idx]).forEach(function (i) { var x = etapas()[i]; if (x && st.sel[x.id]) no[x.id] = st.sel[x.id]; });
        st.sel = no;
        st.sel[e.id] = { op: String(o.id), tag: o.tag || '', nome: o.nome, etapa: e.nome || e.titulo, dnp: !!o.dnp };
        track('opcao', { etapa: e.nome || e.titulo, opcao: o.nome, tag: o.tag || null });
        st.hist.push(st.idx);
        var a = o.acao || 'seguir';
        if (a === 'finalizar') { st.rx.metodo = st.rx.metodo || 'ignorado'; return busca(); }
        if (a === 'so_armacao') return soArmacao();
        if (a === 'aviso') return aviso();
        var es = etapas(), prox = st.idx + 1;
        if (a === 'ir_para' && o.destino != null) { var k = es.findIndex(function (x) { return String(x.id) === String(o.destino); }); if (k !== -1) prox = k; }
        prox = primeira(prox);
        mostra(prox);
    }
    function volta() {
        if (!st.hist.length) return;
        st.rx.passo = null;
        mostra(st.hist.pop());
    }

    function cfgRx(e) {
        var r = e.receita || {}, c = r.colunas || {};
        var col = function (k, on, mn, mx) { var x = c[k] || {}; return { on: x.ativo !== undefined ? x.ativo !== false : on, min: num(x.min) != null ? num(x.min) : mn, max: num(x.max) != null ? num(x.max) : mx }; };
        return {
            manual: r.manual !== false, upload: r.upload !== false, whatsapp: r.whatsapp !== false, pular: r.pular !== false,
            grauObrig: !!r.grau_obrigatorio, uploadObrig: !!r.upload_obrigatorio,
            esf: col('esf', true, -20, 20), cil: col('cil', true, -10, 0), eixo: col('eixo', true, 0, 180), add: col('add', true, 0.75, 4)
        };
    }
    function opcoesGrau(id, mn, mx, passo, val, inteiro) {
        var h = '<select data-rx="' + id + '"><option value="">Sel.</option>';
        if (mn > mx) { var t = mn; mn = mx; mx = t; }
        for (var i = 0, v = mn; v <= mx + 1e-9; i++, v = mn + i * passo) {
            var r = Math.round(v * 100) / 100, txt = inteiro ? String(r) : (r > 0 ? '+' : '') + r.toFixed(2).replace('.', ',');
            var s = val !== '' && val != null && Math.abs(Number(val) - r) < 0.001 ? ' selected' : '';
            h += '<option value="' + r + '"' + s + '>' + txt + '</option>';
        }
        return h + '</select>';
    }
    function telaReceita(e) {
        var c = cfgRx(e), dnp = pedeDnp(), h = '', d = st.rx.dados || {};
        if (st.rx.passo === 'decisao') {
            if (c.manual) h += '<button type="button" class="dc" data-a="rxtabela">' + IC.teclado + '<span><h4>Preencher grau manualmente</h4><p>Selecione os dados da sua receita agora.</p></span></button>';
            var obg = dnp ? '<span class="obg">Obrigatório: receita + foto da DNP</span>' : (c.uploadObrig ? '<span class="obg">Envio obrigatório</span>' : '');
            if (c.upload || dnp || c.uploadObrig) h += '<button type="button" class="dc" data-a="rxupload">' + IC.camera + '<span><h4>Anexar foto da receita</h4><p>Tire uma foto ou envie um arquivo.</p>' + obg + '</span></button>';
            if (c.whatsapp && !dnp && !c.uploadObrig) h += '<button type="button" class="dc zp" data-a="rxzap">' + IC.zap.replace('width="22" height="22"', 'width="30" height="30"') + '<span><h4>Enviar depois por WhatsApp</h4><p>Compre agora, envie a receita depois.</p></span></button>';
            if (c.pular && !dnp && !c.uploadObrig && !c.grauObrig) h += '<button type="button" class="pula" data-a="rxpula">Pular esta etapa</button>';
        } else if (st.rx.passo === 'tabela') {
            var cols = [['esf', 'Esf.', 0.25], ['cil', 'Cil.', 0.25], ['eixo', 'Eixo', 1], ['add', 'Add', 0.25]].filter(function (k) { return c[k[0]].on; });
            if (c.grauObrig) h += '<div class="err" style="text-align:left">A tabela de graus é obrigatória.</div>';
            h += '<div class="tb" style="--n:' + cols.length + '"><div class="tr"><span></span>' + cols.map(function (k) { return '<span class="th">' + k[1] + '</span>'; }).join('') + '</div>';
            [['od', 'OD', 'Dir.'], ['oe', 'OE', 'Esq.']].forEach(function (o) {
                h += '<div class="tr"><span class="eye">' + o[1] + '<small>' + o[2] + '</small></span>' + cols.map(function (k) {
                    var x = c[k[0]]; return opcoesGrau(o[0] + '_' + k[0], x.min, x.max, k[2], d[o[0] + '_' + k[0]], k[0] === 'eixo');
                }).join('') + '</div>';
            });
            h += '</div><div class="err" data-erro hidden></div><button type="button" class="btn" data-a="rxtabok">Avançar</button>';
        } else if (st.rx.passo === 'upload') {
            if (dnp) h += '<div class="dnp"><b>' + rico(T('dnp_titulo', 'Precisamos da sua DNP (distância das pupilas)')) + '</b>' + rico(T('dnp_sub', 'Anexe a foto que mostra a DNP junto com a foto da receita.')) + '</div>';
            h += '<div class="fld"><label>Seu nome completo *</label><input type="text" data-rx="nome" autocomplete="name" placeholder="Ex.: João da Silva" value="' + esc(st.rx.nome) + '"></div>' +
                '<div class="fld"><label>Seu WhatsApp *</label><input type="tel" data-rx="zap" inputmode="numeric" autocomplete="tel" placeholder="(11) 99999-9999" value="' + esc(st.rx.zap) + '"></div>';
            if (st.rx.arquivos.length < 3) h += '<input type="file" data-rx="arq" accept=".jpg,.jpeg,.png,.pdf,image/*,application/pdf" multiple hidden><div class="up" data-a="rxarq" role="button" tabindex="0">' + IC.camera + '<b>Anexar arquivo (' + st.rx.arquivos.length + '/3)</b><span>Envie até 3 fotos da sua receita ou documento.</span></div>';
            st.rx.arquivos.forEach(function (a, i) { h += '<div class="fi"><span>' + IC.ok + ' ' + esc(a.nome) + (a.lendo ? ' · lendo…' : '') + '</span><button type="button" data-a="rxdel" data-i="' + i + '" aria-label="Remover">' + IC.lixo + '</button></div>'; });
            h += '<div class="err" data-erro hidden></div>';
            if (st.rx.arquivos.length) h += '<button type="button" class="btn" data-a="rxupok">Confirmar imagens</button>';
            else if (dnp || c.uploadObrig) h += '<div class="err">O envio de pelo menos 1 arquivo é obrigatório.</div>';
        }
        return h;
    }
    function erro(msg) { var el = ui.b.querySelector('[data-erro]'); if (el) { el.textContent = msg; el.hidden = false; } else if (!PREVIEW) alert(msg); }
    function mascara(v) { v = String(v).replace(/\D/g, '').slice(0, 11); if (v.length > 2) v = '(' + v.slice(0, 2) + ') ' + v.slice(2); if (v.length > 10) v = v.slice(0, 10) + '-' + v.slice(10); return v; }
    function lerArquivo(file) {
        var item = { nome: file.name || 'arquivo', lendo: true };
        st.rx.arquivos.push(item);
        var rd = new FileReader();
        rd.onload = function () {
            var b64 = String(rd.result).split(',')[1], mime = file.type || 'image/jpeg';
            fetch(WEBHOOK_RECEITA, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: b64, mime: mime, path: LOJA + '/' + sid() + '/' + Date.now() + '.' + ((mime.split('/')[1] || 'jpg').replace('jpeg', 'jpg')) }) })
                .then(function (r) { return r.json(); }).then(function (r) {
                    item.lendo = false; item.url = r && (r.url || r.path) || null;
                    var dd = r && r.ok && r.dados || null;
                    if (dd) { item.lido = dd; st.rx.lidos.push(dd); }
                    track('receita_lida', { ok: !!dd, confianca: dd && dd.confianca || null });
                    if (st.rx.passo === 'upload') mostra(st.idx);
                }).catch(function () { item.lendo = false; if (st.rx.passo === 'upload') mostra(st.idx); });
        };
        rd.readAsDataURL(file);
    }
    function receitaLida() {   // usa o grau lido da foto para conferir os limites das lentes
        var d = null; st.rx.lidos.forEach(function (x) { if (x && (x.odEsf != null || x.oeEsf != null)) d = x; });
        if (!d) return;
        var m = { odEsf: 'od_esf', odCil: 'od_cil', odEixo: 'od_eixo', oeEsf: 'oe_esf', oeCil: 'oe_cil', oeEixo: 'oe_eixo' }, out = {};
        Object.keys(m).forEach(function (k) { if (d[k] != null) out[m[k]] = d[k]; });
        if (d.adicao != null) { out.od_add = d.adicao; out.oe_add = d.adicao; }
        if (!Object.keys(st.rx.dados || {}).some(function (k) { return st.rx.dados[k] !== '' && st.rx.dados[k] != null; })) st.rx.dados = out;
    }
    function fimReceita(metodo) {
        var e = etapas()[st.idx], c = cfgRx(e);
        st.rx.metodo = metodo;
        if (c.grauObrig && metodo !== 'whatsapp' && metodo !== 'ignorado') {
            var d = st.rx.dados || {};
            if (!(d.od_esf || d.od_cil || d.oe_esf || d.oe_cil)) { st.rx.passo = 'tabela'; mostra(st.idx); setTimeout(function () { erro('Para esta lente, a tabela de graus é obrigatória.'); }, 0); return; }
        }
        track('receita_metodo', { metodo: metodo, nome: st.rx.nome || null, whatsapp: String(st.rx.zap || '').replace(/\D/g, '') || null, grau: metodo === 'manual' ? st.rx.dados : null, arquivos: st.rx.arquivos.map(function (a) { return a.url || a.nome; }), dnp: pedeDnp() });
        st.hist.push(st.idx);
        st.rx.passo = null;
        busca();
    }

    function busca() {
        passos(99, st.hist.length + 1);
        cab('Analisando sua receita…', 'Buscando a melhor lente para você.');
        ui.b.innerHTML = '<div class="spin"></div><p style="text-align:center;color:#64748b;font-weight:600">Cruzando suas escolhas com o nosso catálogo…</p>';
        if (st.rx.metodo === 'upload') receitaLida();
        setTimeout(function () {
            var ls = indicadas();
            track('recomendou', { lentes: ls.map(function (l) { return l.nome; }), escolhas: escolhas().map(function (s) { return s.nome; }), receita_modo: st.rx.metodo, grau: st.rx.dados || null });
            if (!ls.length) return semLente();
            cab('Suas lentes ideais', 'Escolha uma das opções compatíveis com sua receita.');
            var h = voltarHtml('voltar') + '<div class="okb">' + IC.ok + '<span>' + rico(T('sucesso', 'Sua configuração foi finalizada. Escolha sua lente para adicionar ao carrinho.')) + '</span></div>';
            ls.forEach(function (l, i) {
                h += '<div class="ln"><div class="hh">' + (String(l.img || '').trim() ? '<img src="' + esc(l.img) + '" alt="">' : '<span class="ph"></span>') +
                    '<div><h4>' + esc(l.nome) + '</h4><div class="vl">' + brl(Number(l.preco) || 0) + '</div></div></div>' +
                    (String(l.desc || '').trim() ? '<div class="ds">' + rico(l.desc) + '</div>' : '') +
                    (String(l.prazo || '').trim() ? '<div class="pz">' + IC.relogio + ' Produção: ' + esc(l.prazo) + '</div>' : '') +
                    '<button type="button" class="btn" data-a="compra" data-i="' + i + '">' + esc(T('botao_carrinho', 'ADICIONAR AO CARRINHO')) + '</button></div>';
            });
            st.lentes = ls;
            ui.b.innerHTML = h; ui.b.scrollTop = 0;
            avisaPrevia('resultado');
        }, PREVIEW ? 250 : 700);
    }
    function linkZap(msg) { return ZAP ? 'https://wa.me/' + ZAP + '?text=' + encodeURIComponent(msg) : '#'; }
    function semLente() {
        cab(T('falha_titulo', 'Nenhuma lente encontrada'), '');
        ui.b.innerHTML = '<div class="ctr">' + IC.alerta.replace('fill="currentColor"', 'fill="#ef4444"') + '<div class="sb">' + rico(T('falha_sub', 'Não encontramos lentes compatíveis com sua receita ou seleção no momento. Mas podemos analisar manualmente!')) + '</div>' +
            '<button type="button" class="btn sec" data-a="voltar">Tentar novamente</button>' +
            '<a class="btn zp" data-a="zaplink" target="_blank" rel="noopener" href="' + linkZap('Olá! Não encontrei lentes compatíveis com minha receita. Podem me ajudar? Armação: ' + produtoNome()) + '">' + IC.zap + ' Falar com especialista</a></div>';
        track('sem_lente', { escolhas: escolhas().map(function (s) { return s.nome; }) });
        avisaPrevia('resultado');
    }
    function soArmacao() {
        cab(T('armacao_titulo', 'Apenas armação'), T('armacao_sub', 'Você optou por levar apenas a armação. Clique abaixo para prosseguir.'));
        ui.b.innerHTML = '<div class="ctr"><button type="button" class="btn" data-a="soarm">' + esc(T('armacao_btn', 'Adicionar armação ao carrinho')) + '</button>' + voltarHtml('voltar').replace('class="back"', 'class="back" style="margin:14px auto 0;display:flex"') + '</div>';
        avisaPrevia('so_armacao');
    }
    function aviso() {
        cab(T('aviso_titulo', 'Aviso importante'), T('aviso_sub', 'Entre em contato conosco pelo WhatsApp!'));
        ui.b.innerHTML = '<div class="ctr">' + IC.alerta + '<a class="btn zp" data-a="zaplink" target="_blank" rel="noopener" href="' + linkZap('Olá, gostaria de ajuda com minhas lentes! Armação: ' + produtoNome()) + '">' + IC.zap + ' Falar com especialista</a>' +
            voltarHtml('voltar').replace('class="back"', 'class="back" style="margin:14px auto 0;display:flex"') + '</div>';
        track('aviso', { escolhas: escolhas().map(function (s) { return s.nome; }) });
        avisaPrevia('aviso');
    }

    /* ---------- cliques ---------- */
    function clique(ev) {
        var t = ev.target.closest('[data-a]'); if (!t) return;
        var a = t.getAttribute('data-a'), es = etapas(), e = es[st.idx];
        if (a === 'zaplink') { if (PREVIEW) ev.preventDefault(); track('whatsapp', { de: st.ultimo }); return; }
        ev.preventDefault();
        if (a === 'voltar') return volta();
        if (a === 'rxvolta') { st.rx.passo = 'decisao'; return mostra(st.idx); }
        if (a === 'op') { var o = (e.opcoes || []).filter(function (x) { return String(x.id) === t.getAttribute('data-op'); })[0]; if (o) avanca(e, o); return; }
        if (a === 'rxtabela') { st.rx.passo = 'tabela'; st.rx.metodo = 'manual'; return mostra(st.idx); }
        if (a === 'rxupload') { st.rx.passo = 'upload'; st.rx.metodo = 'upload'; return mostra(st.idx); }
        if (a === 'rxzap') return fimReceita('whatsapp');
        if (a === 'rxpula') return fimReceita('ignorado');
        if (a === 'rxtabok') {
            var c = cfgRx(e), d = {};
            [].forEach.call(ui.b.querySelectorAll('select[data-rx]'), function (s) { d[s.getAttribute('data-rx')] = s.value; });
            st.rx.dados = d;
            if (c.grauObrig && !(d.od_esf || d.od_cil || d.oe_esf || d.oe_cil)) return erro('A seleção da tabela de graus é obrigatória para continuar.');
            if (((d.od_cil && Number(d.od_cil) !== 0) && d.od_eixo === '') || ((d.oe_cil && Number(d.oe_cil) !== 0) && d.oe_eixo === '')) { if (c.eixo.on) return erro('Com cilíndrico, preencha também o eixo.'); }
            if ((c.uploadObrig || pedeDnp()) && !st.rx.arquivos.length) { st.rx.passo = 'upload'; return mostra(st.idx); }
            return fimReceita('manual');
        }
        if (a === 'rxarq') {
            var nome = (ui.b.querySelector('[data-rx="nome"]') || {}).value || '', zap = (ui.b.querySelector('[data-rx="zap"]') || {}).value || '';
            st.rx.nome = nome.trim(); st.rx.zap = zap;
            if (!st.rx.nome || String(zap).replace(/\D/g, '').length < 10) return erro('Preencha seu nome e WhatsApp antes de anexar a foto.');
            var inp = ui.b.querySelector('[data-rx="arq"]'); if (inp) inp.click(); return;
        }
        if (a === 'rxdel') { st.rx.arquivos.splice(+t.getAttribute('data-i'), 1); return mostra(st.idx); }
        if (a === 'rxupok') {
            if (st.rx.arquivos.some(function (x) { return x.lendo; })) return erro('Aguarde: ainda estamos recebendo o arquivo.');
            return fimReceita(st.rx.metodo === 'manual' ? 'manual' : 'upload');
        }
        if (a === 'compra') {
            var l = (st.lentes || [])[+t.getAttribute('data-i')]; if (!l || t.disabled) return;
            t.disabled = true; var txt = t.textContent; t.textContent = 'Adicionando…';
            track('carrinho', { lente: l.nome, preco: l.preco, receita_modo: st.rx.metodo });
            if (PREVIEW) { t.textContent = 'Na loja, a lente e a armação vão para o carrinho'; return; }
            addLente(l).then(compraArmacao).catch(function () { t.disabled = false; t.textContent = txt; alert('Não conseguimos adicionar a lente ao carrinho. Tente novamente.'); });
            return;
        }
        if (a === 'soarm') { track('carrinho_so_armacao', {}); if (PREVIEW) { t.textContent = 'Na loja, a armação vai para o carrinho'; return; } t.disabled = true; compraArmacao(); return; }
    }
    function muda(ev) {
        var t = ev.target;
        if (t.getAttribute('data-rx') === 'arq') {
            var fs = [].slice.call(t.files || []);
            if (st.rx.arquivos.length + fs.length > 3) return erro('Você pode enviar no máximo 3 arquivos (ex.: receita frente, verso e DNP).');
            for (var i = 0; i < fs.length; i++) {
                if (fs[i].size > 5 * 1024 * 1024) return erro('O arquivo "' + fs[i].name + '" passa de 5 MB.');
                if (!/\.(jpe?g|png|pdf)$/i.test(fs[i].name) && !/^image\//.test(fs[i].type)) return erro('Envie foto (JPG/PNG) ou PDF.');
            }
            fs.forEach(lerArquivo); mostra(st.idx); return;
        }
        if (t.getAttribute('data-rx') === 'nome') st.rx.nome = t.value;
    }
    document.addEventListener('input', function (ev) {
        var t = ev.composedPath ? ev.composedPath()[0] : ev.target;
        if (t && t.getAttribute && t.getAttribute('data-rx') === 'zap') { t.value = mascara(t.value); st.rx.zap = t.value; }
    }, true);

    /* ---------- prévia do painel ---------- */
    function avisaPrevia(et) { if (PREVIEW && window.parent !== window) try { window.parent.postMessage({ type: 'pl-lentes-etapa', etapa: String(et) }, '*'); } catch (e) {} }
    if (PREVIEW) window.addEventListener('message', function (ev) {
        var d = ev.data || {};
        if (d.type === 'pl-lentes-cfg-live' && d.config) {
            CFG = d.config; L = CFG.lista || {}; ZAP = String(L.whatsapp || '').replace(/\D/g, ''); if (ZAP && !/^55/.test(ZAP)) ZAP = '55' + ZAP;
            if (sh) { sh.getElementById ? (sh.getElementById('s').textContent = css()) : 0; rodape(); }
            if (ui.ov && ui.ov.classList.contains('on')) { var es = etapas(); if (st.idx >= es.length) st.idx = 0; mostra(st.idx); }
            atualizaBotao(); estilo();
        } else if (d.type === 'pl-lentes-ir') {
            if (!ui.ov || !ui.ov.classList.contains('on')) abre();
            var es2 = etapas(), k = es2.findIndex(function (x) { return String(x.id) === String(d.etapa); });
            if (k !== -1) { st.hist = []; st.rx.passo = null; mostra(k); }
            else if (d.etapa === 'resultado') busca();
        }
    });

    /* ---------- botão na página do produto (19/10/2026) ----------
       Entra no lugar do botão do Lente Ideal (div.lip-btn-wrapper dentro de .product-actions). Assim o layout de botões
       que já existe no widget-barch.js (18/10, pedido da Mari) monta sozinho: ESCOLHER LENTES E COMPRAR na largura toda,
       COMPRAR SÓ ARMAÇÃO + PROVADOR VIRTUAL lado a lado com contorno. Se o Lente Ideal voltar, o botão dele fica escondido. */
    var botao;
    var OCULOS = '<svg viewBox="0 0 256 256" width="22" height="22" aria-hidden="true" style="flex:none"><path fill="currentColor" d="M200 40a8 8 0 0 0 0 16 16 16 0 0 1 16 16v58.08A44 44 0 0 0 145.68 152h-35.36A44 44 0 0 0 40 130.08V72a16 16 0 0 1 16-16 8 8 0 0 0 0-16 32 32 0 0 0-32 32v104a44 44 0 0 0 87.81 4h32.38A44 44 0 0 0 232 176V72a32 32 0 0 0-32-32ZM68 204a28 28 0 1 1 28-28 28 28 0 0 1-28 28Zm120 0a28 28 0 1 1 28-28 28 28 0 0 1-28 28Z"/></svg>';
    function atualizaBotao() { if (botao) botao.innerHTML = OCULOS + '<span>' + esc(T('botao_abrir', 'ESCOLHER LENTES E COMPRAR')) + '</span>'; }
    function estilo() {
        var p = V('cor_primaria', '#303030'), st = document.getElementById('pll-acoes-css');
        if (!st) { st = document.createElement('style'); st.id = 'pll-acoes-css'; document.head.appendChild(st); }
        st.textContent = '.lip-btn-wrapper:not(.pll-wrap),.btn-lente-ideal-injetado,.plb-lens-btn{display:none!important}' +
            '.pll-wrap{width:100%}' +
            '.pll-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;height:64px;margin:0;padding:0 16px;border:0;border-radius:10px;background:' + p + ';color:' + V('cor_texto_botao', '#ffffff') + ';font-family:inherit;font-weight:800;font-size:15px;line-height:1.2;letter-spacing:2px;text-transform:uppercase;box-shadow:0 8px 18px rgba(0,0,0,.18);cursor:pointer;transition:transform .12s,filter .15s}' +
            '.pll-btn:hover{filter:brightness(1.12)}.pll-btn:active{transform:scale(.99)}' +
            '@media(max-width:480px){.pll-btn{font-size:13px;letter-spacing:1px}}';
    }
    function insere() {
        var f = formProduto(), buy = f && (f.querySelector('.js-addtocart.js-prod-submit-form,input.js-addtocart,.btn-add-to-cart,[data-component="product.add-to-cart"]') || f.querySelector('.js-addtocart:not(.js-addtocart-placeholder)'));
        if (!buy) return false;
        if (document.querySelector('.pll-btn')) return true;
        estilo();
        var acts = buy.closest('.product-actions') || buy.parentNode;
        var w = document.createElement('div'); w.className = 'lip-btn-wrapper pll-wrap';
        botao = document.createElement('button'); botao.type = 'button'; botao.className = 'pll-btn';
        atualizaBotao();
        botao.addEventListener('click', function (e) { e.preventDefault(); abre(); });
        w.appendChild(botao);
        acts.insertBefore(w, acts.firstChild);
        return true;
    }
    if (!insere()) { var n = 0, iv = setInterval(function () { if (insere() || ++n > 40) clearInterval(iv); }, 300); }
    window.__PLL_ABRE = abre;
    if (PREVIEW && window.parent !== window) try { window.parent.postMessage({ type: 'pl-lentes-live-ok' }, '*'); } catch (e) {}   // painel manda as mudanças sem recarregar
})();
