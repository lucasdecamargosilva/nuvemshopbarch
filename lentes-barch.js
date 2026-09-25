(function () {
    'use strict';

    if (window.__PL_BARCH_LENS_FLOW__) return;
    var PREVIEW = window.BARCH_LENTES_PREVIEW === true;

    var pagePath = String(location.pathname || '').replace(/\/+$/, '').toLowerCase();
    if (!PREVIEW && !/^\/produtos\/[^/]+$/.test(pagePath)) return;

    function normalize(value) {
        return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    var productName = '';
    try { productName = String(window.LS && window.LS.product && window.LS.product.name || ''); } catch (_) {}
    if (!productName) productName = String((document.querySelector('h1.product-name,h1.product__title,h1') || {}).textContent || '');
    var normalizedProductName = normalize(productName);
    if (!/^armacao\b/.test(normalizedProductName) || /^lente\b/.test(normalizedProductName)) return;

    window.__PL_BARCH_LENS_FLOW__ = true;

    var WEBHOOK_RECEITA = 'https://n8n.segredosdodrop.com/webhook/pl-ler-receita';
    var WEBHOOK_STEP = 'https://n8n.segredosdodrop.com/webhook/pl-lentes-step';
    var WHATSAPP_LOJA = '5534991632975';
    var NO_PHOTO = '';

    /* Fluxo espelhado do Lente Ideal Pro (app.lenteidealpro.com.br, conta Ótica BARCH) em 25/09/2026:
       mesmas telas, na mesma ordem, com os mesmos textos. O PREÇO exibido é o que a loja cobra no
       carrinho (conferido em barcheyewear.com.br em 25/09/2026) — nos multifocais e no solar sem aro
       ele está diferente do cadastrado no Lente Ideal. */
    var DESCANSO = {
        comum: lens('339122257', '1507195966', 'Lentes de descanso: Filtro Azul (Sem Grau) · Armação Comum', 179, 5),
        sem_aro: lens('339122428', '1507196626', 'Lentes de descanso: Filtro Azul (Sem Grau) · Armação Sem Aro', 229, 5)
    };
    var SOLAR = {
        comum: lens('339420487', '1508547832', 'Lentes de Sol com Grau · Armação Comum', 349, 5),
        sem_aro: lens('339421181', '1508550457', 'Lentes de Sol com Grau · Armação Sem Aro', 499, 5)
    };
    var MONO = {
        leve:   { ar: lens('339126389','1507216023','Monofocal · Grau Leve · Antirreflexo',229,5),   blue: lens('339136452','1507246188','Monofocal · Grau Leve · Antirreflexo e Filtro Luz Azul',289,5) },
        medio:  { ar: lens('339135206','1507242951','Monofocal · Grau Médio · Antirreflexo',439,5),  blue: lens('339136518','1507246491','Monofocal · Grau Médio · Antirreflexo e Filtro Luz Azul',499,5) },
        alto:   { ar: lens('339135540','1507243540','Monofocal · Grau Alto · Antirreflexo',629,5),   blue: lens('339136598','1507246821','Monofocal · Grau Alto · Antirreflexo e Filtro Luz Azul',689,5) },
        super:  { ar: lens('339136384','1507245974','Monofocal · Grau Super Alto · Antirreflexo',989,5), blue: lens('339136787','1507247936','Monofocal · Grau Super Alto · Antirreflexo e Filtro Luz Azul',1049,5) },
        astig:  { ar: lens('349148230','1539477705','Monofocal · Astigmatismo Alto · Antirreflexo',499,5), blue: lens('349148425','1539478511','Monofocal · Astigmatismo Alto · Antirreflexo e Filtro Luz Azul',559,5) }
    };
    var MULTI = {
        basico: {
            leve: { sem_ar: lens('339142388','1507281894','Multifocal Básico · Grau Leve a Médio · Sem Antirreflexo',599,5), prime: lens('339416735','1508532963','Multifocal Básico · Grau Leve a Médio · Antirreflexo PRIME',999,7) },
            alto: { sem_ar: lens('339142531','1507283125','Multifocal Básico · Grau Alto · Sem Antirreflexo',799,5),         prime: lens('339145295','1507294063','Multifocal Básico · Grau Alto · Antirreflexo PRIME',1199,7) }
        },
        intermediario: {
            leve: { sem_ar: lens('339143031','1507285899','Multifocal Intermediário · Grau Leve a Médio · Sem Antirreflexo',799,5), prime: lens('339416919','1508533864','Multifocal Intermediário · Grau Leve a Médio · Antirreflexo PRIME',1129,7) },
            alto: { sem_ar: lens('339143456','1507287315','Multifocal Intermediário · Grau Alto · Sem Antirreflexo',999,5),         prime: lens('339417507','1508538194','Multifocal Intermediário · Grau Alto · Antirreflexo PRIME',1399,7) }
        },
        avancado: {
            leve: { sem_ar: lens('339144709','1507291365','Multifocal Avançado · Grau Leve a Médio · Sem Antirreflexo',1299,5), prime: lens('339418002','1508539756','Multifocal Avançado · Grau Leve a Médio · Antirreflexo PRIME',1699,7) },
            alto: { sem_ar: lens('339144796','1507291559','Multifocal Avançado · Grau Alto · Sem Antirreflexo',1599,5),         prime: lens('339418955','1508542049','Multifocal Avançado · Grau Alto · Antirreflexo PRIME',1999,7) }
        }
    };
    var MULTI_NAME = { basico: 'Multifocal Básico', intermediario: 'Multifocal Intermediário', avancado: 'Multifocal Avançado' };
    var MULTI_SUB = { basico: '', intermediario: 'Escolha de acordo com o seu grau', avancado: 'Escolha de acordo com sua receita' };
    var MULTI_RANGE = {
        leve: 'Esférico (ESF): Miopia: até -7 e Hipermetropia: até +4,00<br>Cilíndrico (CIL) Astigmatismo: até -3,00<br>Adição (ADD): até +3,50',
        alto: 'Esférico (ESF): Miopia: até -10 e Hipermetropia: até +6,00<br>Cilíndrico (CIL) Astigmatismo: até -5,00<br>Adição (ADD): até +4,50'
    };

    function lens(id, variantId, nome, preco, prazo) {
        return { id:id, variantId:variantId, nome:nome, preco:preco, prazo:prazo, img:NO_PHOTO };
    }

    var state = {};
    var navStack = [];
    var $ = function (selector) { return document.querySelector(selector); };
    var $$ = function (selector) { return [].slice.call(document.querySelectorAll(selector)); };
    var esc = function (value) { var div=document.createElement('div'); div.textContent=String(value == null ? '' : value); return div.innerHTML; };
    var brl = function (value) { return Number(value).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); };

    function sessionId() {
        try { var value=localStorage.getItem('pl_sid'); if(!value){value='s'+Date.now().toString(36)+Math.random().toString(36).slice(2,10);localStorage.setItem('pl_sid',value);} return value; }
        catch (_) { return 'nostore'; }
    }
    function phone() {
        var existing=($('#q-phone')||{}).value||'';
        var saved=''; try { saved=localStorage.getItem('pl_last_phone')||''; } catch (_) {}
        return (existing||saved).replace(/\D/g,'').replace(/^55(?=\d{10,11}$)/,'');
    }
    function track(step, detail) {
        state.last=step;
        if(PREVIEW)return;
        try { fetch(WEBHOOK_STEP,{method:'POST',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({session_id:sessionId(),loja:'barch',origin:location.origin,telefone:phone(),step:step,produto:frame().name,tipo_armacao:state.frameType||null,detail:detail||{}})}).catch(function(){}); } catch (_) {}
    }
    function frame() {
        var name=String((document.querySelector('h1.product-name,h1.product__title,h1')||{}).textContent||productName||document.title).trim();
        var price=0;
        try { if(window.LS&&window.LS.variants&&window.LS.variants[0]) price=Number(window.LS.variants[0].price_number)||0; } catch (_) {}
        if(!price){var txt=String((document.querySelector('.js-price-display,.product-price,.price')||{}).textContent||'');var match=txt.match(/[\d.]+,\d{2}/);if(match)price=Number(match[0].replace(/\./g,'').replace(',','.'));}
        return {name:name,price:price};
    }
    function values() {
        return { odEsf:getValue('odEsf'),odCil:getValue('odCil'),odEixo:getValue('odEixo'),oeEsf:getValue('oeEsf'),oeCil:getValue('oeCil'),oeEixo:getValue('oeEixo'),adicao:state.need==='multifocal'?getValue('adicao'):null };
    }
    function chosenLens() {
        if(state.need==='descanso') return DESCANSO[state.frameType];
        if(state.need==='solar') return SOLAR[state.frameType];
        if(state.need==='simples') return MONO[state.grau] && MONO[state.grau][state.trat];
        if(state.need==='multifocal') return MULTI[state.model] && MULTI[state.model][state.grau] && MULTI[state.model][state.grau][state.trat];
        return null;
    }
    function choicesSummary() {
        var rows=[];
        if(state.need==='simples'){ rows.push(state.dist==='perto'?'Perto':'Longe'); }
        if(state.need==='solar'&&state.color) rows.push('Cor: '+state.color);
        if(state.recipeMode==='pular') rows.push('Receita: enviar depois (a BARCH chama no WhatsApp da compra)');
        else if(state.recipeMode==='digitar'||state.recipeMode==='foto') rows.push('Receita: informada');
        return rows;
    }

    var style=document.createElement('style');
    style.id='plb-lens-style';
    style.textContent='\
.lip-btn-wrapper,.btn-lente-ideal-injetado{display:none!important}.plb-lens-btn{display:flex;align-items:center;justify-content:center;width:100%;margin:0 0 10px;padding:13px 16px;background:#3a2e26;color:#fff;border:1.5px solid #3a2e26;border-radius:8px;font:600 14px/1.2 inherit;letter-spacing:.5px;cursor:pointer;box-sizing:border-box;transition:opacity .2s}.plb-lens-btn:hover{opacity:.86}\
.plb-overlay{position:fixed;inset:0;z-index:2147483646;background:rgba(245,239,233,.96);display:none;align-items:center;justify-content:center;box-sizing:border-box;font-family:inherit}.plb-overlay *{box-sizing:border-box}\
.plb-card{width:440px;max-width:92vw;max-height:96vh;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 24px 70px rgba(58,46,38,.2);color:#3a2e26;position:relative;display:flex;flex-direction:column;animation:plb-in .3s ease-out}@keyframes plb-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}\
.plb-head{padding:25px 28px 20px;border-bottom:1px solid #e3d6cb;display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;flex-shrink:0}.plb-head b{font-size:21px;font-weight:500;letter-spacing:3px;text-transform:uppercase}.plb-head img{height:50px;width:auto;max-width:160px;object-fit:contain}.plb-close{position:absolute;right:15px;top:13px;border:0;background:none;color:#999;font-size:25px;cursor:pointer;padding:4px 7px;z-index:2}\
.plb-body{padding:24px 28px 28px;overflow:auto;max-height:calc(96vh - 100px)}.plb-step{display:none}.plb-step.on{display:block}.plb-progress{display:flex;gap:5px;margin-bottom:20px}.plb-progress i{height:3px;flex:1;background:#e3d6cb;border-radius:2px}.plb-progress i.on{background:#8a6d5b}.plb-label{display:block;font-size:16px;font-weight:500;letter-spacing:2px;line-height:1.4;text-transform:uppercase;text-align:center;margin:0 0 15px}\
.plb-opt{width:100%;text-align:left;background:#fff;border:1.5px solid #e3d6cb;border-radius:12px;padding:14px 15px;margin:0 0 9px;cursor:pointer;color:#3a2e26;font-family:inherit;display:flex;flex-direction:column;gap:3px;transition:border-color .18s,background .18s}.plb-opt:hover{border-color:#8a6d5b;background:#f5efe9}.plb-opt b{font-size:14px;font-weight:650}.plb-opt small{display:block;color:#75675e;font-size:11.5px;line-height:1.45}.plb-back{display:block;border:0;background:none;text-decoration:underline;color:#8a6d5b;font:12px/1.4 inherit;margin:13px auto 0;cursor:pointer}\
.plb-note{font-size:11.5px;line-height:1.55;color:#75675e;background:#f5efe9;border-radius:8px;padding:11px 13px;margin:0 0 15px}.plb-field{margin-bottom:11px}.plb-field label{font-size:10px;color:#75675e;text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:5px}.plb-field input,.plb-field select{display:block;width:100%;height:44px;border:1.5px solid #e3d6cb;border-radius:8px;padding:0 10px;background:#fff;color:#3a2e26;font:13px inherit;outline:none}.plb-field input:focus,.plb-field select:focus{border-color:#8a6d5b}\
.plb-eyes{display:block}.plb-eye{border:1.5px solid #e3d6cb;border-radius:12px;padding:12px;margin-bottom:10px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.plb-eye>strong{grid-column:1/-1;font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#75675e}.plb-eye .plb-field{margin:0}.plb-eye .plb-field select{height:38px;padding:0 5px;font-size:12px}\
.plb-primary,.plb-secondary{width:100%;height:50px;border-radius:10px;padding:0 13px;font-family:inherit;font-size:13px;letter-spacing:1.3px;text-transform:uppercase;cursor:pointer}.plb-primary{border:0;background:#3a2e26;color:#fff;font-weight:650;margin-top:7px}.plb-primary:hover{opacity:.88}.plb-primary[disabled],.plb-secondary[disabled]{opacity:.6;cursor:default}.plb-secondary{border:1.5px solid #8a6d5b;background:transparent;color:#3a2e26;font-weight:600;margin-top:9px}\
.plb-error{display:none;color:#9b2c2c;background:#fff5f5;border:1px solid #f1c4c4;padding:10px 12px;border-radius:9px;font-size:11.5px;line-height:1.5;margin:9px 0}.plb-phone-error{display:none;color:#a22;font-size:11px;margin-top:6px}.plb-loading{text-align:center;padding:38px 0;color:#75675e}.plb-loading b{display:block;margin-bottom:14px}.plb-spinner{width:26px;height:26px;border:2.5px solid #e3d6cb;border-top-color:#8a6d5b;border-radius:50%;animation:plb-spin .8s linear infinite;margin:0 auto 16px}@keyframes plb-spin{to{transform:rotate(360deg)}}\
.plb-result{border:1.5px solid #8a6d5b;border-radius:13px;padding:16px;margin-bottom:11px}.plb-result img{display:block;width:175px;max-width:100%;margin:0 auto 12px;border-radius:9px}.plb-result h3{font-size:15px;line-height:1.35;margin:0 0 4px}.plb-result small{font-size:11.5px;color:#75675e}.plb-price{font-size:26px;font-weight:750;margin:10px 0}.plb-why{font-size:12px;line-height:1.5;background:#f5efe9;padding:10px 11px;border-radius:8px}.plb-colors{display:grid;grid-template-columns:1fr 1fr;gap:8px}.plb-colors .plb-opt{margin:0;padding:12px;text-align:center;align-items:center}\
@media(max-width:767px){.plb-overlay{align-items:flex-start;overflow-y:auto}.plb-card{width:100%;max-width:none;max-height:none;min-height:100svh;border-radius:0;box-shadow:none}.plb-body{max-height:none;flex:1}.plb-head{padding-top:24px}}@media(max-width:390px){.plb-body{padding:22px 18px 26px}.plb-head{padding-left:18px;padding-right:18px}.plb-head b{font-size:18px}}';
    document.head.appendChild(style);

    var extraStyle=document.createElement('style');
    extraStyle.textContent='.plb-sub{display:block;text-align:center;font-size:12px;line-height:1.5;color:#75675e;margin:-8px 0 16px}.plb-opt .plb-row{display:flex;align-items:center;justify-content:space-between;gap:10px}.plb-opt .plb-tag{font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;background:#f5efe9;color:#8a6d5b;border-radius:20px;padding:3px 8px;white-space:nowrap}.plb-opt .plb-p{font-size:13px;font-weight:700;white-space:nowrap}.plb-opt small b{font-weight:650}.plb-list{margin:10px 0 0;padding:0 0 0 16px;font-size:12px;line-height:1.6;color:#3a2e26}';
    document.head.appendChild(extraStyle);

    function opt(attrs, name, desc, right) {
        return '<button type="button" class="plb-opt" '+attrs+'><span class="plb-row"><b>'+name+'</b>'+(right||'')+'</span>'+(desc?'<small>'+desc+'</small>':'')+'</button>';
    }
    function price(v) { return '<span class="plb-p">'+esc(v)+'</span>'; }
    function tag(t) { return '<span class="plb-tag">'+esc(t)+'</span>'; }
    function back() { return '<button type="button" class="plb-back" data-back="1">voltar</button>'; }
    function step(name, label, sub, content) {
        return '<div class="plb-step" data-step="'+name+'"><div class="plb-progress" data-progress></div>'+(label?'<span class="plb-label" data-label>'+label+'</span>':'')+(sub!=null?'<span class="plb-sub" data-sub>'+sub+'</span>':'')+'<div data-content>'+content+'</div></div>';
    }
    var AR_PRIME_DELTA = MULTI.basico.leve.prime.preco - MULTI.basico.leve.sem_ar.preco;
    var SUN_SEM_ARO_DELTA = SOLAR.sem_aro.preco - SOLAR.comum.preco;
    var EYE = function(p){ return '<div class="plb-eye"><strong>'+(p==='od'?'Olho direito (OD)':'Olho esquerdo (OE)')+'</strong><div class="plb-field"><label>Esférico</label><select data-r="'+p+'Esf"></select></div><div class="plb-field"><label>Cilíndrico</label><select data-r="'+p+'Cil"></select></div><div class="plb-field"><label>Eixo</label><select data-r="'+p+'Eixo"></select></div></div>'; };

    var overlay=document.createElement('div');
    overlay.id='plb-lens-modal'; overlay.className='plb-overlay';
    overlay.innerHTML='<div class="plb-card" role="dialog" aria-modal="true" aria-label="Escolher lentes"><button class="plb-close" type="button" aria-label="Fechar">&times;</button><div class="plb-head"><b>Escolher lentes</b><img src="https://acdn-us.mitiendanube.com/stores/004/982/616/themes/common/logo-6628445411204466754-1777675117-e2457ea4d103baf41ed0b9598683ef981777675117-480-0.webp" alt="BARCH"></div><div class="plb-body">'+
      step('need','Qual tipo de lente você procura?','Receba o seu óculos em casa já pronto para usar',
        opt('data-need="descanso"','Lentes de descanso: Filtro Azul (Sem Grau)','MAIS Proteção e MENOS Cansaço Visual e dores de cabeça')+
        opt('data-need="simples"','Visão simples: Monofocal','Correção Visual para Perto OU Longe')+
        opt('data-need="multifocal"','Multifocal','Correção Visual para Perto E Longe')+
        opt('data-need="solar"','Lentes de Sol com Grau','Transforme qualquer óculos em solar com grau'))+
      step('desc-frame','Lentes Filtro Azul','Escolha de acordo com a armação selecionada',
        opt('data-frame="comum"','Armação Comum','Usada para armações em acetato, metal, nylon<br>+ até 5 dias úteis no prazo final',price(brl(DESCANSO.comum.preco)))+
        opt('data-frame="sem_aro"','Armação Sem Aro','Usada para armações sem aro ou parafusadas<br>+ até 5 dias úteis no prazo final',price(brl(DESCANSO.sem_aro.preco)))+back())+
      step('mono-dist','Monofocal pré',null,
        opt('data-dist="perto"','Perto','')+opt('data-dist="longe"','Longe','')+back())+
      step('mono-grau','Como é o seu grau? Lentes Monofocais','Escolha de acordo com sua receita',
        opt('data-grau="leve"','Grau Leve','Esférico: Miopia até -3 / Hipermetropia até +3<br>Cilíndrico: Astigmatismo até -2,00',price(brl(MONO.leve.ar.preco)))+
        opt('data-grau="medio"','Grau Médio','Esférico: Miopia até -4 / Hipermetropia até +4<br>Cilíndrico: Astigmatismo até -2,00',price(brl(MONO.medio.ar.preco)))+
        opt('data-grau="alto"','Grau Alto','Esférico: Miopia até -6 / Hipermetropia até +6<br>Cilíndrico: Astigmatismo até -4,00',price(brl(MONO.alto.ar.preco)))+
        opt('data-grau="super"','Grau Super Alto','Esférico: Miopia até -10 / Hipermetropia até +8<br>Cilíndrico: Astigmatismo até -4,00',price(brl(MONO.super.ar.preco)))+
        opt('data-grau="astig"','Astigmatismo Alto','Esférico: Miopia até -3 / Hipermetropia até +3<br>Cilíndrico: Astigmatismo até -5,00',price(brl(MONO.astig.ar.preco)))+back())+
      step('mono-trat','Qual tratamento extra você deseja?','Opcional para maior conforto.',
        opt('data-trat="blue"','Antirreflexo e Filtro Luz Azul','Proteção de Filtro Luz Azul UV e azul-violeta de telas<br>Reduz cansaço e ardência nos olhos',tag('Mais Vendido')+' '+price('+'+brl(MONO.leve.blue.preco-MONO.leve.ar.preco)))+
        opt('data-trat="ar"','Apenas proteção Antirreflexo','Bloqueia os reflexos indesejados<br>Visão mais nítida e confortável',tag('Já incluso'))+back())+
      step('multi-model','Tipo de Multifocais','Escolha qual você deseja:',
        opt('data-model="basico"','Modelo Básico','<b>OBRIGATÓRIO TER A MEDIDA DA DNP</b><br>Amplitude Visual: 6/10 · Visão dinâmica: 6/10 · Campo de Leitura: 7/10',price('a partir de '+brl(MULTI.basico.leve.sem_ar.preco)))+
        opt('data-model="intermediario"','Modelo Intermediário','<b>OBRIGATÓRIO TER A MEDIDA DA DNP</b><br>Amplitude Visual: 7/10 · Visão dinâmica: 7/10 · Campo de Leitura: 7/10',price('a partir de '+brl(MULTI.intermediario.leve.sem_ar.preco)))+
        opt('data-model="avancado"','Modelo Avançado','<b>OBRIGATÓRIO TER A MEDIDA DA DNP</b><br>Amplitude Visual: 9/10 · Visão dinâmica: 9/10 · Campo de Leitura: 9/10',price('a partir de '+brl(MULTI.avancado.leve.sem_ar.preco)))+back())+
      step('multi-grau','Multifocal','','<div id="plb-multi-grau"></div>'+back())+
      step('multi-trat','Tratamento Antirreflexo',null,
        opt('data-trat="prime"','Antirreflexo PRIME','10 camadas de proteção<br>Resistente a arranhões e manchas<br>+ até 7 dias úteis no prazo final',price('+'+brl(AR_PRIME_DELTA)))+
        opt('data-trat="sem_ar"','Sem Antirreflexo','Lentes já possuem Filtro Azul',tag('Sem custo'))+back())+
      step('sun-grau','Lentes de Sol',null,
        opt('data-sungrau="leve"','Grau leve a médio','Esférico (ESF): Miopia: até -6 e Hipermetropia: até +6,00<br>Cilíndrico (CIL) Astigmatismo: até -2,00<br>+ até 5 dias úteis no prazo final',price('a partir de '+brl(SOLAR.comum.preco)))+back())+
      step('sun-frame','Tipos de Lentes Solar','Escolha de acordo com o óculos que deseja transformar em sol ou sol com grau',
        opt('data-frame="comum"','Armação Comum','Usada para armações em acetato, metal, nylon<br>+ até 5 dias úteis no prazo final',tag('Sem custo'))+
        opt('data-frame="sem_aro"','Armação Sem Aro','Usada para armações sem aro ou parafusadas<br>+ até 5 dias úteis no prazo final',price('+'+brl(SUN_SEM_ARO_DELTA)))+back())+
      step('sun-color','Cor lentes solares','Escolha a cor desejada',
        '<div class="plb-colors">'+opt('data-color="Marrom"','Marrom','')+opt('data-color="Preto"','Preto','')+'</div>'+back())+
      step('recipe','Como deseja enviar sua receita?','Escolha a melhor forma para você. Pulando essa etapa, te chamaremos no número de WhatsApp utilizado na compra',
        opt('data-recipe="foto"','Enviar foto da receita','Nós lemos e preenchemos os dados')+
        opt('data-recipe="digitar"','Digitar os graus','Preencha exatamente como está na receita')+
        opt('data-recipe="whatsapp"','Falar no WhatsApp','Tire suas dúvidas com a equipe da BARCH')+
        opt('data-recipe="pular"','Pular esta etapa','Envie a receita depois: chamamos você no WhatsApp da compra')+
        '<input type="file" id="plb-file" accept="image/*,application/pdf" style="display:none">'+back())+
      step('loading','',null,'<div class="plb-loading"><div class="plb-spinner"></div><b>Lendo sua receita…</b>A leitura pode levar alguns segundos. Confira os números antes de continuar.</div>')+
      step('form','Confira sua receita',null,'<div class="plb-note" id="plb-read-note" style="display:none"></div><div class="plb-eyes">'+EYE('od')+EYE('oe')+'</div><div class="plb-field" id="plb-add-wrap"><label>Adição (grau de perto)</label><select data-r="adicao"></select></div><button type="button" class="plb-primary" id="plb-form-next">Continuar</button>'+back())+
      step('result','Sua lente',null,'<div id="plb-result"></div><button type="button" class="plb-primary" id="plb-buy-both">Comprar armação + lente</button><button type="button" class="plb-back" data-back="1">revisar escolhas</button>')+
      step('cart','Carrinho de demonstração',null,'<div class="plb-note">Nenhum produto foi adicionado à loja.</div><div class="plb-result" id="plb-preview-cart"></div><button type="button" class="plb-back" data-back="1">Voltar à indicação</button>')+
      '</div></div>';
    document.body.appendChild(overlay);

    // Barra de progresso: quantas telas o caminho escolhido tem até a lente.
    function pathFor() {
        if(state.need==='descanso') return ['need','desc-frame','result'];
        if(state.need==='simples') return ['need','mono-dist','mono-grau','mono-trat','recipe','result'];
        if(state.need==='multifocal') return ['need','multi-model','multi-grau','multi-trat','recipe','result'];
        if(state.need==='solar') return ['need','sun-grau','sun-frame','sun-color','recipe','result'];
        return ['need','x','x','x','recipe','result'];
    }
    function paintProgress(name) {
        var path=pathFor(), key=(name==='form'||name==='loading')?'recipe':name, idx=Math.max(0,path.indexOf(key));
        var html=''; for(var i=0;i<path.length;i++) html+='<i class="'+(i<=idx?'on':'')+'"></i>';
        $$('.plb-step[data-step="'+name+'"] [data-progress]').forEach(function(el){ el.innerHTML=html; });
    }
    function show(name, noPush) {
        var current=($('.plb-step.on')||{dataset:{}}).dataset.step;
        if(!noPush&&current&&current!==name&&current!=='loading') navStack.push(current);
        $$('.plb-step').forEach(function(item){item.classList.toggle('on',item.dataset.step===name);});
        paintProgress(name);
        var body=$('.plb-body'); if(body)body.scrollTop=0;
    }
    function goBack() { var prev=navStack.pop(); if(prev) show(prev,true); }
    function open() {
        state={need:null,frameType:null,dist:null,grau:null,trat:null,model:null,color:null,prescription:null,recipeMode:null,lens:null,last:'abriu'};
        navStack=[];
        $$('[data-r]').forEach(function(s){ s.value=''; });
        overlay.style.display='flex';document.documentElement.style.overflow='hidden';
        show('need',true);track('abriu',{origem:'botao_produto'});
    }
    function close() { overlay.style.display='none';document.documentElement.style.overflow='';if(state.last&&!/carrinho/.test(state.last))track('saiu',{ultimo_step:state.last}); }

    // Receita: faixas iguais às colunas configuradas no Lente Ideal (esférico -20 a +20).
    function optionRange(from,to,increment) { var html='<option value="">—</option>';for(var value=from;value<=to+1e-9;value+=increment){var fixed=value.toFixed(2);html+='<option value="'+fixed+'">'+(value>0?'+':'')+fixed.replace('.',',')+'</option>';}return html; }
    $$('[data-r$="Esf"]').forEach(function(select){select.innerHTML=optionRange(-20,20,.25);});
    $$('[data-r$="Cil"]').forEach(function(select){select.innerHTML=optionRange(-8,0,.25);});
    $$('[data-r$="Eixo"]').forEach(function(select){var html='<option value="">—</option>';for(var i=0;i<=180;i+=1)html+='<option value="'+i+'">'+i+'°</option>';select.innerHTML=html;});
    $('[data-r="adicao"]').innerHTML=optionRange(.75,4.5,.25);

    function getValue(key) { var field=$('[data-r="'+key+'"]'); return field&&field.value!==''?Number(field.value):null; }
    function nearest(key,value) { if(value==null)return;var select=$('[data-r="'+key+'"]');if(!select)return;var best='',distance=Infinity;[].slice.call(select.options).forEach(function(option){if(option.value==='')return;var current=Math.abs(Number(option.value)-Number(value));if(current<distance){distance=current;best=option.value;}});select.value=best; }
    function goForm(note) { $('#plb-add-wrap').style.display=state.need==='multifocal'?'block':'none';var box=$('#plb-read-note');box.style.display=note?'block':'none';box.innerHTML=note||'';show('form'); }
    function readPrescription(file) { show('loading');var reader=new FileReader();reader.onload=function(){var base64=String(reader.result).split(',')[1];fetch(WEBHOOK_RECEITA,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image:base64,mime:file.type||'image/jpeg',path:sessionId()+'/'+Date.now()+'.'+((file.type||'image/jpeg').split('/')[1]||'jpg')})}).then(function(response){return response.json();}).then(function(response){if(!response.ok)throw new Error(response.erro||'leitura');var data=response.dados||{};nearest('odEsf',data.odEsf);nearest('oeEsf',data.oeEsf);nearest('odCil',data.odCil);nearest('oeCil',data.oeCil);nearest('odEixo',data.odEixo);nearest('oeEixo',data.oeEixo);nearest('adicao',data.adicao);track('receita_lida',{ok:true,confianca:data.confianca||null});goForm(data.confianca==='baixa'?'A leitura ficou com baixa confiança.<br><strong>Confira todos os números.</strong>':'Preenchemos o que encontramos.<br><strong>Confira antes de continuar.</strong>');}).catch(function(){track('receita_lida',{ok:false});goForm('Não conseguimos ler automaticamente.<br><strong>Digite os dados da receita.</strong>');});};reader.onerror=function(){goForm('Não conseguimos abrir o arquivo.<br>Digite os dados da receita.');};reader.readAsDataURL(file); }

    function renderMultiGrau() {
        var m=state.model, g=MULTI[m];
        var st=$('.plb-step[data-step="multi-grau"]');
        st.querySelector('[data-label]').textContent=MULTI_NAME[m];
        var sub=st.querySelector('[data-sub]'); sub.textContent=MULTI_SUB[m]; sub.style.display=MULTI_SUB[m]?'block':'none';
        $('#plb-multi-grau').innerHTML=
            opt('data-grau="leve"','Grau Leve a Médio',MULTI_RANGE.leve+'<br>+ até 5 dias úteis no prazo final',price(brl(g.leve.sem_ar.preco)))+
            opt('data-grau="alto"','Grau Alto',MULTI_RANGE.alto+'<br>+ até 5 dias úteis no prazo final',price(brl(g.alto.sem_ar.preco)));
        show('multi-grau');
    }
    function renderResult() {
        var item=chosenLens(),box=$('#plb-result');state.lens=item;
        if(!item){box.innerHTML='<div class="plb-why">Não encontramos essa combinação. Volte e revise as escolhas.</div>';show('result');return;}
        var extra=choicesSummary();
        var recipeNote=state.need==='descanso'?'Lente sem grau: não precisa de receita.':(state.recipeMode==='pular'?'Depois da compra, a BARCH chama você no WhatsApp usado na compra para receber a receita.':'A BARCH confere sua receita antes da montagem.');
        box.innerHTML='<div class="plb-result">'+(item.img?'<img src="'+item.img+'" alt="">':'')+'<h3>'+esc(item.nome)+'</h3><small>Produção em até '+item.prazo+' dias úteis</small><div class="plb-price">'+brl(item.preco)+'</div>'+(extra.length?'<ul class="plb-list">'+extra.map(function(r){return '<li>'+esc(r)+'</li>';}).join('')+'</ul>':'')+'<div class="plb-note" style="margin:11px 0 0">'+esc(recipeNote)+'</div></div>';
        show('result');
        track('recomendou',{lente:item.nome,preco:item.preco,necessidade:state.need,armacao:state.frameType,distancia:state.dist,grau:state.grau,modelo:state.model,tratamento:state.trat,cor:state.color,receita_modo:state.recipeMode,receita:state.prescription});
    }
    function whatsapp(message) { if(PREVIEW){alert('Na loja, esta opção abrirá o WhatsApp da BARCH. Nenhuma mensagem foi enviada nesta prévia.');return;}window.open('https://wa.me/'+WHATSAPP_LOJA+'?text='+encodeURIComponent(message),'_blank'); }
    function getProductForm() { var form=document.querySelector('#product_form,form.js-product-form');return form&&form.querySelector('[name="add_to_cart"]')?form:null; }
    function showPreviewCart() { var product=frame(),quantity=Number(((getProductForm()||document).querySelector('[name="quantity"]')||{}).value)||1,total=product.price*quantity+(state.lens?state.lens.preco*quantity:0);$('#plb-preview-cart').innerHTML='<h3>'+esc(product.name)+'</h3><small>Quantidade: '+quantity+'</small><div class="plb-price">'+brl(product.price*quantity)+'</div>'+(state.lens?'<h3>'+esc(state.lens.nome)+'</h3><div class="plb-price">'+brl(state.lens.preco*quantity)+'</div>':'')+'<div class="plb-why"><strong>Total demonstrativo: '+brl(total)+'</strong></div>';show('cart'); }
    function buyFrame() { if(PREVIEW){showPreviewCart();return;}var source=getProductForm();if(!source)return;var form=document.createElement('form');form.method='post';form.action=source.getAttribute('action')||'/comprar/';form.style.display='none';source.querySelectorAll('input,select,textarea').forEach(function(field){if(!field.name||((field.type==='radio'||field.type==='checkbox')&&!field.checked))return;var hidden=document.createElement('input');hidden.type='hidden';hidden.name=field.name;hidden.value=field.value;form.appendChild(hidden);});if(!form.querySelector('[name="quantity"]')){var quantity=document.createElement('input');quantity.type='hidden';quantity.name='quantity';quantity.value='1';form.appendChild(quantity);}document.body.appendChild(form);form.submit(); }
    function lock(button) { if(button.disabled)return false;button.disabled=true;button.dataset.label=button.textContent;button.textContent='Adicionando…';setTimeout(function(){button.disabled=false;button.textContent=button.dataset.label||'Tentar novamente';},12000);return true; }
    function addLens(item) { if(PREVIEW)return Promise.resolve();var body='add_to_cart='+encodeURIComponent(item.id)+'&quantity=1&add_to_cart_enhanced=1';if(item.variantId)body+='&variant_id='+encodeURIComponent(item.variantId);return fetch('/comprar/',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/x-www-form-urlencoded','X-Requested-With':'XMLHttpRequest'},body:body}).then(function(response){if(!response.ok)throw new Error('http_'+response.status);return response.json();}).then(function(result){if(!result.success)throw new Error('cart');}); }

    $('.plb-close').addEventListener('click',close);overlay.addEventListener('click',function(event){if(event.target===overlay)close();});
    $('#plb-file').addEventListener('change',function(){var file=this.files&&this.files[0];if(file)readPrescription(file);this.value='';});
    $('#plb-form-next').addEventListener('click',function(){state.prescription=values();renderResult();});
    $('#plb-buy-both').addEventListener('click',function(){if(!state.lens||!lock(this))return;var button=this;track('carrinho',{lente:state.lens.nome,preco:state.lens.preco,distancia:state.dist,cor:state.color,receita_modo:state.recipeMode,receita:state.prescription});addLens(state.lens).then(function(){buyFrame();}).catch(function(){button.disabled=false;button.textContent=button.dataset.label||'Comprar armação + lente';alert('Não conseguimos adicionar a lente ao carrinho. Tente novamente.');});});

    overlay.addEventListener('click',function(event){
        var t=event.target.closest('[data-back],[data-need],[data-frame],[data-dist],[data-grau],[data-trat],[data-model],[data-sungrau],[data-color],[data-recipe]');
        if(!t)return; event.preventDefault(); var d=t.dataset;
        if(d.back){goBack();return;}
        if(d.need){state={need:d.need,last:state.last};track('necessidade',{necessidade:d.need});
            if(d.need==='descanso')show('desc-frame');else if(d.need==='simples')show('mono-dist');else if(d.need==='multifocal')show('multi-model');else show('sun-grau');return;}
        if(d.frame){state.frameType=d.frame;track('armacao',{armacao:d.frame});if(state.need==='descanso')renderResult();else show('sun-color');return;}
        if(d.dist){state.dist=d.dist;track('distancia',{distancia:d.dist});show('mono-grau');return;}
        if(d.model){state.model=d.model;track('modelo',{modelo:d.model});renderMultiGrau();return;}
        if(d.grau){state.grau=d.grau;track('grau',{grau:d.grau,modelo:state.model||null});show(state.need==='multifocal'?'multi-trat':'mono-trat');return;}
        if(d.trat){state.trat=d.trat;track('tratamento',{tratamento:d.trat});show('recipe');return;}
        if(d.sungrau){state.grau=d.sungrau;show('sun-frame');return;}
        if(d.color){state.color=d.color;track('cor',{cor:d.color});show('recipe');return;}
        if(d.recipe){state.recipeMode=d.recipe;track('receita_metodo',{metodo:d.recipe});
            if(d.recipe==='foto'){$('#plb-file').click();return;}
            if(d.recipe==='digitar'){goForm('');return;}
            if(d.recipe==='whatsapp'){whatsapp('Olá! Quero ajuda com a receita para as lentes da '+frame().name+'.');return;}
            if(d.recipe==='pular'){state.prescription=null;renderResult();return;}}
    });

    function insertButton() { var form=getProductForm(),buy=form&&form.querySelector('.js-addtocart,.btn-add-to-cart,[data-component="product.add-to-cart"]');if(!buy||document.querySelector('.plb-lens-btn'))return !!buy;var button=document.createElement('button');button.type='button';button.className='plb-lens-btn';button.textContent='Escolher lentes e comprar';button.addEventListener('click',function(event){event.preventDefault();open();});var tryOn=document.querySelector('.q-btn-inline-provador');var anchor=tryOn||buy;anchor.parentNode.insertBefore(button,anchor.nextSibling);return true; }
    if(!insertButton()){var attempts=0,timer=setInterval(function(){if(insertButton()||++attempts>40)clearInterval(timer);},300);}
})();
