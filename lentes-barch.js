(function () {
    'use strict';

    if (window.__PL_BARCH_LENS_FLOW__) return;

    var pagePath = String(location.pathname || '').replace(/\/+$/, '').toLowerCase();
    if (!/^\/produtos\/[^/]+$/.test(pagePath)) return;

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
    var FRAME_TYPE = /sem aro|tres pecas|3 pecas/.test(normalizedProductName) ? 'sem_aro' : 'comum';
    var NO_PHOTO = '';

    /* Produtos, variantes e preços conferidos em barcheyewear.com.br em 09/09/2026. */
    var DESCANSO = {
        comum: lens('339122257', '1507195966', 'Lentes de descanso com filtro azul', 179, 'Sem grau · armação comum', 2, 0, 0, 0, null),
        sem_aro: lens('339122428', '1507196626', 'Lentes de descanso com filtro azul', 229, 'Sem grau · armação sem aro', 2, 0, 0, 0, null)
    };
    var SOLAR = {
        comum: lens('339420487', '1508547832', 'Lentes solares com grau', 349, 'Armação comum', 5, -4, 4, 2, null),
        sem_aro: lens('339421181', '1508550457', 'Lentes solares com grau', 499, 'Armação sem aro', 5, -4, 4, 2, null)
    };
    var MONO = [
        mono('339126389','1507216023','Grau leve · antirreflexo',229,'ar',-3,3,2),
        mono('339136452','1507246188','Grau leve · antirreflexo + filtro azul',289,'blue',-3,3,2),
        mono('339135206','1507242951','Grau médio · antirreflexo',439,'ar',-4,4,2),
        mono('339136518','1507246491','Grau médio · antirreflexo + filtro azul',499,'blue',-4,4,2),
        mono('349148230','1539477705','Astigmatismo alto · antirreflexo',499,'ar',-3,3,5),
        mono('349148425','1539478511','Astigmatismo alto · antirreflexo + filtro azul',559,'blue',-3,3,5),
        mono('339135540','1507243540','Grau alto · antirreflexo',629,'ar',-6,6,4),
        mono('339136598','1507246821','Grau alto · antirreflexo + filtro azul',689,'blue',-6,6,4),
        mono('339136384','1507245974','Grau super alto · antirreflexo',989,'ar',-10,8,4),
        mono('339136787','1507247936','Grau super alto · antirreflexo + filtro azul',1049,'blue',-10,8,4)
    ];
    var MULTI = [
        multi('339142388','1507281894','Multifocal Básico · sem antirreflexo',499,'basico','sem_ar',-7,4,3,4,5),
        multi('339416735','1508532963','Multifocal Básico · AR PRIME',899,'basico','prime',-7,4,3,4,7),
        multi('339142531','1507283125','Multifocal Básico · grau alto · sem antirreflexo',699,'basico','sem_ar',-10,6,5,4,5),
        multi('339145295','1507294063','Multifocal Básico · grau alto · AR PRIME',1099,'basico','prime',-10,6,5,4,7),
        multi('339143031','1507285899','Multifocal Intermediário · sem antirreflexo',699,'intermediario','sem_ar',-7,4,3,4,5),
        multi('339416919','1508533864','Multifocal Intermediário · AR PRIME',1029,'intermediario','prime',-7,4,3,4,5),
        multi('339143456','1507287315','Multifocal Intermediário · grau alto · sem antirreflexo',899,'intermediario','sem_ar',-10,6,5,4,5),
        multi('339417507','1508538194','Multifocal Intermediário · grau alto · AR PRIME',1299,'intermediario','prime',-10,7,5,4,7),
        multi('339144709','1507291365','Multifocal Avançado · sem antirreflexo',1199,'avancado','sem_ar',-7,4,3,4,5),
        multi('339418002','1508539756','Multifocal Avançado · AR PRIME',1599,'avancado','prime',-7,4,3,4,7),
        multi('339144796','1507291559','Multifocal Avançado · grau alto · sem antirreflexo',1499,'avancado','sem_ar',-10,6,5,4,5),
        multi('339418955','1508542049','Multifocal Avançado · grau alto · AR PRIME',1899,'avancado','prime',-10,7,5,4,7)
    ];
    var TRANSITIONS = {
        comum: {
            material: '1.49 Resina', prazo: 5,
            Cinza: variant('1354827543',799), Marrom: variant('1354827547',799), Rubi: variant('1354827548',799),
            Esmeralda: variant('1354827550',799), Ametista: variant('1354827551',799), Safira: variant('1354827553',799),
            'Verde Grafite': variant('1354827554',799), 'Âmbar': variant('1354827557',799)
        },
        sem_aro: {
            material: '1.59 Policarbonato', prazo: 5,
            Cinza: variant('1354821646',1296), Marrom: variant('1354821650',1296), Rubi: variant('1354821652',942),
            Esmeralda: variant('1354821654',942), Ametista: variant('1354821655',942), Safira: variant('1354821656',942),
            'Verde Grafite': variant('1354821660',942), 'Âmbar': variant('1354821662',942)
        }
    };
    var TRANSITIONS_IMAGE = 'https://acdn-us.mitiendanube.com/stores/004/982/616/products/202-c5b5a7a9748677746817620041956603-1024-1024.webp';

    function lens(id, variantId, nome, preco, material, prazo, neg, pos, cil, add) {
        return { id:id, variantId:variantId, nome:nome, preco:preco, material:material, prazo:prazo, neg:neg, pos:pos, cil:cil, add:add, img:NO_PHOTO };
    }
    function mono(id, variantId, nome, preco, tratamento, neg, pos, cil) {
        var item=lens(id,variantId,nome,preco,'Visão simples',5,neg,pos,cil,null); item.tratamento=tratamento; return item;
    }
    function multi(id, variantId, nome, preco, modelo, tratamento, neg, pos, cil, add, prazo) {
        var item=lens(id,variantId,nome,preco,'Multifocal',prazo,neg,pos,cil,add); item.modelo=modelo; item.tratamento=tratamento; return item;
    }
    function variant(id, price) { return { id:id, price:price }; }

    var state = { need:null, treatment:null, model:null, color:null, prescription:null, lens:null, last:null };
    var $ = function (selector) { return document.querySelector(selector); };
    var $$ = function (selector) { return [].slice.call(document.querySelectorAll(selector)); };
    var esc = function (value) { var div=document.createElement('div'); div.textContent=String(value == null ? '' : value); return div.innerHTML; };
    var brl = function (value) { return Number(value).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); };

    function sessionId() {
        try { var value=localStorage.getItem('pl_sid'); if(!value){value='s'+Date.now().toString(36)+Math.random().toString(36).slice(2,10);localStorage.setItem('pl_sid',value);} return value; }
        catch (_) { return 'nostore'; }
    }
    function phone() {
        var current=($('#plb-phone')||{}).value||'';
        var existing=($('#q-phone')||{}).value||'';
        var saved=''; try { saved=localStorage.getItem('pl_last_phone')||''; } catch (_) {}
        return (current||existing||saved).replace(/\D/g,'').replace(/^55(?=\d{10,11}$)/,'');
    }
    function track(step, detail) {
        state.last=step;
        try { fetch(WEBHOOK_STEP,{method:'POST',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({session_id:sessionId(),loja:'barch',origin:location.origin,telefone:phone(),step:step,produto:frame().name,tipo_armacao:FRAME_TYPE,detail:detail||{}})}).catch(function(){}); } catch (_) {}
    }
    function frame() {
        var name=String((document.querySelector('h1.product-name,h1.product__title,h1')||{}).textContent||productName||document.title).trim();
        var price=0;
        try { if(window.LS&&window.LS.variants&&window.LS.variants[0]) price=Number(window.LS.variants[0].price_number)||0; } catch (_) {}
        if(!price){var txt=String((document.querySelector('.js-price-display,.product-price,.price')||{}).textContent||'');var match=txt.match(/[\d.]+,\d{2}/);if(match)price=Number(match[0].replace(/\./g,'').replace(',','.'));}
        return {name:name,price:price};
    }
    function values() {
        return { odEsf:getValue('odEsf'),odCil:getValue('odCil')||0,odEixo:getValue('odEixo'),oeEsf:getValue('oeEsf'),oeCil:getValue('oeCil')||0,oeEixo:getValue('oeEixo'),adicao:state.need==='multifocal'?getValue('adicao'):null };
    }
    function validPrescription(value) {
        return value.odEsf!=null&&value.oeEsf!=null&&(state.need!=='multifocal'||value.adicao!=null);
    }
    function fits(item, value) {
        var spheres=[Number(value.odEsf)||0,Number(value.oeEsf)||0];
        var cylinders=[Math.abs(Number(value.odCil)||0),Math.abs(Number(value.oeCil)||0)];
        return spheres.every(function(v){return v>=item.neg&&v<=item.pos;})&&cylinders.every(function(v){return v<=item.cil;})&&(item.add==null||value.adicao==null||Number(value.adicao)<=item.add);
    }
    function transitionLens() {
        var group=TRANSITIONS[FRAME_TYPE], selected=group[state.color];
        if(!selected)return null;
        var item=lens('304529275',selected.id,'Transitions · '+state.color,selected.price,group.material,group.prazo,-6,4,3,null);
        item.img=TRANSITIONS_IMAGE; item.tratamento='transitions'; return item;
    }
    function recommend() {
        if(state.need==='descanso') return DESCANSO[FRAME_TYPE];
        var value=state.prescription;
        if(state.need==='solar') return fits(SOLAR[FRAME_TYPE],value)?SOLAR[FRAME_TYPE]:null;
        if(state.need==='simples'&&state.treatment==='transitions') { var t=transitionLens(); return t&&fits(t,value)?t:null; }
        var pool=state.need==='multifocal'?MULTI:MONO;
        return pool.filter(function(item){
            if(item.tratamento!==state.treatment)return false;
            if(state.need==='multifocal'&&item.modelo!==state.model)return false;
            return fits(item,value);
        }).sort(function(a,b){return a.preco-b.preco;})[0]||null;
    }

    var style=document.createElement('style');
    style.id='plb-lens-style';
    style.textContent='\
.plb-lens-btn{display:flex;align-items:center;justify-content:center;width:100%;margin:0 0 10px;padding:13px 16px;background:#3a2e26;color:#fff;border:1.5px solid #3a2e26;border-radius:8px;font:600 14px/1.2 inherit;letter-spacing:.5px;cursor:pointer;box-sizing:border-box;transition:opacity .2s}.plb-lens-btn:hover{opacity:.86}\
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

    var overlay=document.createElement('div');
    overlay.id='plb-lens-modal'; overlay.className='plb-overlay';
    overlay.innerHTML='<div class="plb-card" role="dialog" aria-modal="true" aria-label="Escolher lentes"><button class="plb-close" type="button" aria-label="Fechar">&times;</button><div class="plb-head"><b>Escolher lentes</b><img src="https://acdn-us.mitiendanube.com/stores/004/982/616/themes/common/logo-6628445411204466754-1777675117-e2457ea4d103baf41ed0b9598683ef981777675117-480-0.webp" alt="BARCH"></div><div class="plb-body">'+
      step('contact',1,'Qual é o seu WhatsApp?','<div class="plb-note">Salvamos sua indicação e ajudamos você caso seja necessário.</div><div class="plb-field"><label>WhatsApp com DDD</label><input id="plb-phone" type="tel" inputmode="numeric" maxlength="15" placeholder="(11) 99999-9999"><div class="plb-phone-error" id="plb-phone-error">Informe um celular válido com DDD.</div></div><button class="plb-primary" id="plb-contact-next">Continuar</button>')+
      step('need',2,'Que tipo de lente você precisa?','<button class="plb-opt" data-need="simples"><b>Visão simples</b><small>Para perto ou para longe</small></button><button class="plb-opt" data-need="multifocal"><b>Multifocal</b><small>Para perto e para longe no mesmo óculos</small></button><button class="plb-opt" data-need="descanso"><b>Sem grau</b><small>Filtro de luz azul para telas</small></button><button class="plb-opt" data-need="solar"><b>Solar com grau</b><small>Lentes escuras nas cores preta ou marrom</small></button>')+
      step('simple-treatment',3,'Qual tratamento você prefere?','<button class="plb-opt" data-treatment="ar"><b>Antirreflexo</b><small>Mais conforto e menos reflexos</small></button><button class="plb-opt" data-treatment="blue"><b>Antirreflexo + filtro azul</b><small>Indicado para uso frequente de telas</small></button><button class="plb-opt" data-treatment="transitions"><b>Transitions</b><small>Clareia em ambientes internos e escurece no sol</small></button><button class="plb-back" data-go="need">voltar</button>')+
      step('multi-model',3,'Escolha o modelo multifocal','<button class="plb-opt" data-model="basico"><b>Básico</b><small>Campo de visão essencial para adaptação econômica</small></button><button class="plb-opt" data-model="intermediario"><b>Intermediário</b><small>Mais conforto e campo de visão ampliado</small></button><button class="plb-opt" data-model="avancado"><b>Avançado</b><small>Campo de visão mais amplo e adaptação superior</small></button><button class="plb-back" data-go="need">voltar</button>')+
      step('multi-treatment',3,'Qual tratamento você prefere?','<button class="plb-opt" data-treatment="sem_ar"><b>Sem antirreflexo</b><small>Opção essencial</small></button><button class="plb-opt" data-treatment="prime"><b>Antirreflexo PRIME</b><small>Mais transparência, conforto e proteção</small></button><button class="plb-back" data-go="multi-model">voltar</button>')+
      step('recipe',4,'Como quer informar sua receita?','<input type="file" id="plb-file" accept="image/*,application/pdf" hidden><button class="plb-opt" id="plb-upload"><b>Enviar foto ou PDF</b><small>Nós lemos e preenchemos os dados</small></button><button class="plb-opt" data-manual="1"><b>Digitar os dados</b><small>Preencha exatamente como está na receita</small></button><button class="plb-opt" data-no-recipe="1"><b>Não tenho receita</b><small>Fale com a equipe da BARCH</small></button><div class="plb-error" id="plb-file-error"></div><button class="plb-back" data-recipe-back="1">voltar</button>')+
      step('loading',4,'','<div class="plb-loading"><div class="plb-spinner"></div><b>Lendo sua receita…</b><div class="plb-note">A leitura pode levar alguns segundos.<br>Confira os números antes de continuar.</div></div>')+
      step('form',4,'Confira sua receita','<div class="plb-note" id="plb-read-note" style="display:none"></div><div class="plb-eyes"><div class="plb-eye"><strong>Olho direito (OD)</strong>'+eyeFields('od')+'</div><div class="plb-eye"><strong>Olho esquerdo (OE)</strong>'+eyeFields('oe')+'</div></div><div class="plb-field" id="plb-add-wrap" style="display:none"><label>Adição (grau de perto)</label><select data-r="adicao"></select></div><div class="plb-error" id="plb-form-error"></div><button class="plb-primary" id="plb-recommend">Continuar</button><button class="plb-back" data-go="recipe">voltar</button>')+
      step('color',5,'Escolha a cor das lentes','<div class="plb-colors" id="plb-colors"></div><button class="plb-back" data-go="form">voltar</button>')+
      step('result',5,'Sua lente indicada','<div class="plb-result" id="plb-result"></div><button class="plb-primary" id="plb-buy-both">Comprar armação + lente</button><button class="plb-secondary" id="plb-buy-frame">Comprar somente a armação</button><button class="plb-back" data-result-back="1">revisar escolhas</button>')+
      '</div></div>';
    document.body.appendChild(overlay);

    function progress(active) { var html='<div class="plb-progress">'; for(var i=1;i<=5;i++)html+='<i'+(i<=active?' class="on"':'')+'></i>'; return html+'</div>'; }
    function step(name, active, label, content) { return '<section class="plb-step" data-step="'+name+'">'+progress(active)+(label?'<span class="plb-label">'+label+'</span>':'')+content+'</section>'; }
    function eyeFields(prefix) { return '<div class="plb-field"><label>Esférico</label><select data-r="'+prefix+'Esf"></select></div><div class="plb-field"><label>Cilíndrico</label><select data-r="'+prefix+'Cil"></select></div><div class="plb-field"><label>Eixo</label><select data-r="'+prefix+'Eixo"></select></div>'; }
    function show(name) { $$('.plb-step').forEach(function(item){item.classList.toggle('on',item.dataset.step===name);}); var body=$('.plb-body'); if(body)body.scrollTop=0; }
    function open() { state={need:null,treatment:null,model:null,color:null,prescription:null,lens:null,last:'abriu'}; var saved='';try{saved=localStorage.getItem('pl_last_phone')||'';}catch(_){}$('#plb-phone').value=maskPhone(saved.replace(/\D/g,''));overlay.style.display='flex';document.documentElement.style.overflow='hidden';show('contact');track('abriu',{origem:'botao_produto'});track('pediu_telefone',{}); }
    function close() { overlay.style.display='none';document.documentElement.style.overflow='';if(state.last&&!/carrinho|so_armacao/.test(state.last))track('saiu',{ultimo_step:state.last}); }

    function optionRange(from,to,increment) { var html='<option value="">—</option>';for(var value=from;value<=to+.001;value+=increment){var fixed=value.toFixed(2);html+='<option value="'+fixed+'">'+(value>0?'+':'')+fixed.replace('.',',')+'</option>';}return html; }
    $$('[data-r$="Esf"]').forEach(function(select){select.innerHTML=optionRange(-12,8,.25);});
    $$('[data-r$="Cil"]').forEach(function(select){select.innerHTML=optionRange(-6,0,.25);select.value='0.00';});
    $$('[data-r$="Eixo"]').forEach(function(select){var html='<option value="">—</option>';for(var i=0;i<=180;i++)html+='<option value="'+i+'">'+i+'°</option>';select.innerHTML=html;});
    $('[data-r="adicao"]').innerHTML=optionRange(.75,4,.25);

    function getValue(key) { var field=$('[data-r="'+key+'"]'); return field&&field.value!==''?Number(field.value):null; }
    function nearest(key,value) { if(value==null)return;var select=$('[data-r="'+key+'"]');if(!select)return;var best='',distance=Infinity;[].slice.call(select.options).forEach(function(option){if(option.value==='')return;var current=Math.abs(Number(option.value)-Number(value));if(current<distance){distance=current;best=option.value;}});select.value=best; }
    function maskPhone(value) { var digits=String(value||'').replace(/\D/g,'').slice(0,11);if(digits.length<=2)return digits?'('+digits:'';var cut=digits.length===11?7:6;return '('+digits.slice(0,2)+') '+digits.slice(2,cut)+(digits.length>cut?'-'+digits.slice(cut):''); }
    function validPhone() { var value=phone(),error=$('#plb-phone-error');var valid=/^\d{10,11}$/.test(value)&&/^[1-9]{2}/.test(value)&&(value.length===10||value.charAt(2)==='9');if(error)error.style.display=valid?'none':'block';if(valid)try{localStorage.setItem('pl_last_phone',value);}catch(_){}return valid; }
    function previousChoiceStep() { if(state.need==='multifocal')return 'multi-treatment';if(state.need==='simples')return 'simple-treatment';return 'need'; }
    function goForm(note) { $('#plb-add-wrap').style.display=state.need==='multifocal'?'block':'none';var box=$('#plb-read-note');box.style.display=note?'block':'none';box.innerHTML=note||'';show('form'); }
    function readPrescription(file) { show('loading');var reader=new FileReader();reader.onload=function(){var base64=String(reader.result).split(',')[1];fetch(WEBHOOK_RECEITA,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image:base64,mime:file.type||'image/jpeg',path:sessionId()+'/'+Date.now()+'.'+((file.type||'image/jpeg').split('/')[1]||'jpg')})}).then(function(response){return response.json();}).then(function(response){if(!response.ok)throw new Error(response.erro||'leitura');var data=response.dados||{};nearest('odEsf',data.odEsf);nearest('oeEsf',data.oeEsf);nearest('odCil',data.odCil);nearest('oeCil',data.oeCil);nearest('odEixo',data.odEixo);nearest('oeEixo',data.oeEixo);nearest('adicao',data.adicao);track('receita_lida',{ok:true,confianca:data.confianca||null});goForm(data.confianca==='baixa'?'A leitura ficou com baixa confiança.<br><strong>Confira todos os números.</strong>':'Preenchemos o que encontramos.<br><strong>Confira antes de continuar.</strong>');}).catch(function(){track('receita_lida',{ok:false});goForm('Não conseguimos ler automaticamente.<br><strong>Digite os dados da receita.</strong>');});};reader.onerror=function(){goForm('Não conseguimos abrir o arquivo.<br>Digite os dados da receita.');};reader.readAsDataURL(file); }
    function colorChoices() {
        var colors=state.need==='solar'?['Preto','Marrom']:Object.keys(TRANSITIONS[FRAME_TYPE]).filter(function(key){return key!=='material'&&key!=='prazo';});
        $('#plb-colors').innerHTML=colors.map(function(color){var price='';if(state.need==='simples'){var item=TRANSITIONS[FRAME_TYPE][color];price='<small>'+brl(item.price)+'</small>';}return '<button class="plb-opt" data-color="'+esc(color)+'"><b>'+esc(color)+'</b>'+price+'</button>';}).join('');show('color'); }
    function renderResult() {
        var item=recommend(),box=$('#plb-result'),primary=$('#plb-buy-both');state.lens=item;
        if(!item){box.innerHTML='<h3>Precisamos conferir esta receita</h3><div class="plb-why">O grau informado está fora das faixas disponíveis para essa escolha. Fale com a equipe da BARCH para receber uma indicação sob medida.</div>';primary.textContent='Falar com a BARCH';primary.dataset.out='1';}
        else {delete primary.dataset.out;primary.textContent='Comprar armação + lente';var why=state.need==='descanso'?'Proteção para telas sem grau, compatível com esta armação.':state.need==='solar'?'Seu grau está dentro da faixa disponível. A cor escolhida foi '+state.color+'.':'A faixa do produto atende aos números informados na sua receita.';box.innerHTML=(item.img?'<img src="'+item.img+'" alt="">':'')+'<h3>'+esc(item.nome)+'</h3><small>'+esc(item.material)+' · produção em até '+item.prazo+' dias úteis</small><div class="plb-price">'+brl(item.preco)+'</div><div class="plb-why">'+esc(why)+'</div><div class="plb-note" style="margin:11px 0 0">A BARCH confere sua receita antes da montagem.</div>';}
        show('result');track('recomendou',{lente:item?item.nome:null,preco:item?item.preco:null,fora:!item,necessidade:state.need,tratamento:state.treatment,modelo:state.model,cor:state.color,receita:state.prescription});
    }
    function whatsapp(message) { window.open('https://wa.me/'+WHATSAPP_LOJA+'?text='+encodeURIComponent(message),'_blank'); }
    function getProductForm() { var form=document.querySelector('#product_form,form.js-product-form');return form&&form.querySelector('[name="add_to_cart"]')?form:null; }
    function buyFrame() { var source=getProductForm();if(!source)return;var form=document.createElement('form');form.method='post';form.action=source.getAttribute('action')||'/comprar/';form.style.display='none';source.querySelectorAll('input,select,textarea').forEach(function(field){if(!field.name||((field.type==='radio'||field.type==='checkbox')&&!field.checked))return;var hidden=document.createElement('input');hidden.type='hidden';hidden.name=field.name;hidden.value=field.value;form.appendChild(hidden);});if(!form.querySelector('[name="quantity"]')){var quantity=document.createElement('input');quantity.type='hidden';quantity.name='quantity';quantity.value='1';form.appendChild(quantity);}document.body.appendChild(form);form.submit(); }
    function lock(button) { if(button.disabled)return false;button.disabled=true;button.dataset.label=button.textContent;button.textContent='Adicionando…';setTimeout(function(){button.disabled=false;button.textContent=button.dataset.label||'Tentar novamente';},12000);return true; }
    function addLens(item) { var body='add_to_cart='+encodeURIComponent(item.id)+'&quantity=1&add_to_cart_enhanced=1';if(item.variantId)body+='&variant_id='+encodeURIComponent(item.variantId);return fetch('/comprar/',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/x-www-form-urlencoded','X-Requested-With':'XMLHttpRequest'},body:body}).then(function(response){if(!response.ok)throw new Error('http_'+response.status);return response.json();}).then(function(result){if(!result.success)throw new Error('cart');}); }

    $('.plb-close').addEventListener('click',close);overlay.addEventListener('click',function(event){if(event.target===overlay)close();});
    $('#plb-phone').addEventListener('input',function(){this.value=maskPhone(this.value);$('#plb-phone-error').style.display='none';});
    $('#plb-phone').addEventListener('keydown',function(event){if(event.key==='Enter'){event.preventDefault();$('#plb-contact-next').click();}});
    $('#plb-contact-next').addEventListener('click',function(){if(!validPhone())return;track('telefone',{origem:'fluxo_lentes'});show('need');});
    $('#plb-upload').addEventListener('click',function(){track('receita_metodo',{metodo:'enviar'});$('#plb-file').click();});
    $('#plb-file').addEventListener('change',function(){var file=this.files&&this.files[0];if(file)readPrescription(file);});
    $('#plb-recommend').addEventListener('click',function(){var value=values(),error=$('#plb-form-error');if(!validPrescription(value)){error.textContent='Preencha o grau esférico dos dois olhos'+(state.need==='multifocal'?' e a adição.':'.');error.style.display='block';return;}error.style.display='none';state.prescription=value;if(state.need==='solar'||state.treatment==='transitions')colorChoices();else renderResult();});
    $('#plb-buy-both').addEventListener('click',function(){if(!validPhone())return;if(this.dataset.out){track('contato_sob_medida',{receita:state.prescription});whatsapp('Olá! Quero ajuda para escolher as lentes da '+frame().name+'. Minha receita ficou fora da faixa automática.');return;}if(!state.lens||!lock(this))return;var button=this;track('carrinho',{lente:state.lens.nome,preco:state.lens.preco,cor:state.color,receita:state.prescription});addLens(state.lens).then(buyFrame).catch(function(){button.disabled=false;button.textContent=button.dataset.label||'Comprar armação + lente';alert('Não conseguimos adicionar a lente ao carrinho. Tente novamente.');});});
    $('#plb-buy-frame').addEventListener('click',function(){if(!validPhone()||!lock(this))return;track('so_armacao',{necessidade:state.need});buyFrame();});

    overlay.addEventListener('click',function(event){var target=event.target.closest('[data-go],[data-need],[data-model],[data-treatment],[data-manual],[data-no-recipe],[data-color],[data-recipe-back],[data-result-back]');if(!target)return;event.preventDefault();if(target.dataset.go){show(target.dataset.go);return;}if(target.dataset.recipeBack){show(previousChoiceStep());return;}if(target.dataset.resultBack){show(state.need==='descanso'?'need':(state.need==='solar'||state.treatment==='transitions'?'color':'form'));return;}if(target.dataset.need){state.need=target.dataset.need;track('necessidade',{necessidade:state.need});if(state.need==='descanso'){state.prescription=null;state.color=null;renderResult();}else if(state.need==='multifocal')show('multi-model');else if(state.need==='simples')show('simple-treatment');else{state.treatment='solar';show('recipe');}return;}if(target.dataset.model){state.model=target.dataset.model;track('modelo',{modelo:state.model});show('multi-treatment');return;}if(target.dataset.treatment){state.treatment=target.dataset.treatment;track('tratamento',{necessidade:state.need,tratamento:state.treatment,modelo:state.model});show('recipe');return;}if(target.dataset.manual){track('receita_metodo',{metodo:'digitar'});goForm('');return;}if(target.dataset.noRecipe){track('sem_receita_whatsapp',{necessidade:state.need,tratamento:state.treatment});whatsapp('Olá! Não tenho receita e quero ajuda para escolher as lentes da '+frame().name+'.');return;}if(target.dataset.color){state.color=target.dataset.color;track('cor',{necessidade:state.need,cor:state.color});renderResult();}});

    function insertButton() { var form=getProductForm(),buy=form&&form.querySelector('.js-addtocart,.btn-add-to-cart,[data-component="product.add-to-cart"]');if(!buy||document.querySelector('.plb-lens-btn'))return !!buy;var button=document.createElement('button');button.type='button';button.className='plb-lens-btn';button.textContent='Escolher lentes e comprar';button.addEventListener('click',function(event){event.preventDefault();open();});var tryOn=document.querySelector('.q-btn-inline-provador');var anchor=tryOn||buy;anchor.parentNode.insertBefore(button,anchor.nextSibling);return true; }
    if(!insertButton()){var attempts=0,timer=setInterval(function(){if(insertButton()||++attempts>40)clearInterval(timer);},300);}
})();
