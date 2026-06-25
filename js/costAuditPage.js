/* Khumbuka Cost Audit Page
   Popup/modal version for product audit details.
   Uses the shared audit engine from js/costAudit.js.
*/
(function(){
  let selectedAuditProductId=null;

  function n(value){ return typeof num==='function' ? num(value) : Number(value)||0; }
  function inr(value){ return typeof money==='function' ? money(value) : `₹${n(value).toFixed(2)}`; }
  function esc(value){ return typeof escapeHtml==='function' ? escapeHtml(value) : String(value ?? '').replace(/[&<>"']/g, s=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[s])); }
  function pctFormat(value){ return `${n(value).toFixed(1)}%`; }
  function el(id){ return typeof byId==='function' ? byId(id) : document.getElementById(id); }
  function getVal(id){ return el(id)?.value || ''; }
  function normalize(text){ return String(text||'').toLowerCase().trim(); }
  function jsArg(value){ return String(value ?? '').replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }

  function appState(){
    try{ if(typeof state !== 'undefined') return state; }catch(e){}
    return window.state || {};
  }

  function auditSourceLabel(source){
    const map={
      manual_override:'Manual Override',
      product_components:'Product Components',
      legacy_recipe_links_plus_packaging:'Old Recipe Links + Packaging',
      packaging_only:'Packaging Only',
      none:'No Cost'
    };
    return map[source] || source || 'No Cost';
  }

  function statusHtml(audit){
    if(!audit) return '<span class="status-pill warn">No audit</span>';
    if(audit.warning_count>0) return `<span class="status-pill warn">${audit.warning_count} warning${audit.warning_count>1?'s':''}</span>`;
    return '<span class="status-pill ok">Clean</span>';
  }

  function ensureCostAuditPageStyle(){
    if(document.getElementById('costAuditPageRuntimeStyle')) return;
    const style=document.createElement('style');
    style.id='costAuditPageRuntimeStyle';
    style.textContent=`
      .selected-row{outline:2px solid rgba(139,69,19,.28);background:rgba(139,69,19,.06)}
      .cost-audit-view-btn{cursor:pointer}
      .cost-audit-modal-overlay{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;background:rgba(17,24,39,.58);padding:22px}
      .cost-audit-modal-overlay.open{display:flex}
      .cost-audit-modal{width:min(1120px,96vw);max-height:92vh;overflow:auto;background:#fff;border-radius:22px;box-shadow:0 24px 80px rgba(0,0,0,.32);border:1px solid rgba(255,255,255,.65)}
      .cost-audit-modal-header{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;gap:16px;align-items:flex-start;padding:22px 24px;background:linear-gradient(180deg,#fff 0%,#fffaf5 100%);border-bottom:1px solid #eee}
      .cost-audit-modal-header h2{margin:0 0 6px;font-size:22px}
      .cost-audit-modal-header p{margin:0;color:#666}
      .cost-audit-close{border:0;border-radius:999px;background:#111827;color:#fff;font-size:20px;line-height:1;width:38px;height:38px;cursor:pointer}
      .cost-audit-modal-body{padding:22px 24px 26px}
      .cost-audit-modal-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}
      .cost-audit-modal-actions button{border:1px solid #ddd;border-radius:999px;background:#fff;padding:9px 13px;cursor:pointer;font-weight:700}
      .cost-audit-modal-actions button.primary{background:#111827;color:#fff;border-color:#111827}
      .cost-audit-metric-grid{display:grid;grid-template-columns:repeat(4,minmax(140px,1fr));gap:12px;margin:14px 0 18px}
      .cost-audit-metric{padding:14px;border:1px solid #eee;border-radius:16px;background:#fffaf5}
      .cost-audit-metric span{display:block;font-size:12px;color:#666;margin-bottom:6px}
      .cost-audit-metric strong{font-size:18px}
      .cost-audit-health-score{display:inline-flex;align-items:center;gap:8px;padding:7px 10px;border-radius:999px;font-weight:800;background:#f0fdf4;color:#14532d;border:1px solid #bbf7d0}
      .cost-audit-health-score.mid{background:#fff7ed;color:#7c2d12;border-color:#fed7aa}
      .cost-audit-health-score.low{background:#fef2f2;color:#7f1d1d;border-color:#fecaca}
      .warning-priority{display:inline-flex;align-items:center;border-radius:999px;padding:3px 8px;font-size:11px;font-weight:800;margin-right:6px;text-transform:uppercase}
      .warning-priority.critical{background:#fee2e2;color:#7f1d1d}
      .warning-priority.warning{background:#ffedd5;color:#7c2d12}
      .warning-priority.info{background:#e0f2fe;color:#075985}
      .cost-audit-section{margin-top:18px}
      .cost-audit-section h3{margin:0 0 10px;font-size:16px}
      .cost-audit-warning-box{padding:12px 14px;border-radius:14px;background:#fff7ed;border:1px solid #fed7aa;color:#7c2d12}
      .cost-audit-warning-box.clean{background:#f0fdf4;border-color:#bbf7d0;color:#14532d}
      .cost-audit-warning-box ul{margin:8px 0 0 18px;padding:0}
      .cost-audit-component-table{width:100%;border-collapse:collapse}
      .cost-audit-component-table th,.cost-audit-component-table td{padding:10px;border-bottom:1px solid #eee;text-align:left;vertical-align:top}
      .cost-audit-component-table th{font-size:12px;text-transform:uppercase;color:#666;background:#fafafa}
      .cost-audit-component-table .num{text-align:right;white-space:nowrap}
      .cost-audit-clickable-row{cursor:pointer}
      .cost-audit-clickable-row:hover{background:#fffaf5}
      body.cost-audit-modal-open{overflow:hidden}
      @media(max-width:720px){.cost-audit-modal-overlay{padding:0;align-items:stretch}.cost-audit-modal{width:100vw;max-height:100vh;border-radius:0}.cost-audit-metric-grid{grid-template-columns:repeat(2,minmax(120px,1fr))}.cost-audit-modal-header{padding:18px}.cost-audit-modal-body{padding:18px}.cost-audit-component-table{font-size:13px}}
    `;
    document.head.appendChild(style);
  }

  function ensureCostAuditModal(){
    ensureCostAuditPageStyle();
    let overlay=document.getElementById('costAuditModalOverlay');
    if(overlay) return overlay;
    overlay=document.createElement('div');
    overlay.id='costAuditModalOverlay';
    overlay.className='cost-audit-modal-overlay';
    overlay.innerHTML=`<div class="cost-audit-modal" role="dialog" aria-modal="true" aria-labelledby="costAuditModalTitle">
      <div id="costAuditModalContent"></div>
    </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(event){ if(event.target===overlay) closeCostAuditModal(); });
    document.addEventListener('keydown', function(event){ if(event.key==='Escape' && overlay.classList.contains('open')) closeCostAuditModal(); });
    return overlay;
  }

  function allAudits(){
    const engine=window.KhumbukaCostAudit;
    if(!engine?.calculateAllProductAudits) return [];
    if(!(appState().products||[]).length) return [];
    return engine.calculateAllProductAudits() || [];
  }

  function fillCostAuditFilters(){
    const branch=el('costAuditBranchFilter');
    const category=el('costAuditCategoryFilter');
    if(branch){
      const current=branch.value;
      const rows=(appState().branches||[]).filter(b=>b.active!==false);
      branch.innerHTML='<option value="">All Branches</option>'+rows.map(b=>`<option value="${esc(b.id)}" ${String(b.id)===String(current)?'selected':''}>${esc(b.name||b.location||'Branch')}</option>`).join('');
      branch.value=current;
    }
    if(category){
      const current=category.value;
      const cats=[...new Set((appState().products||[]).map(p=>p.category).filter(Boolean))].sort();
      category.innerHTML='<option value="">All Categories</option>'+cats.map(c=>`<option value="${esc(c)}" ${c===current?'selected':''}>${esc(c)}</option>`).join('');
      category.value=current;
    }
  }

  function filteredAudits(){
    let audits=allAudits();
    fillCostAuditFilters();
    const q=normalize(getVal('costAuditSearch'));
    const branch=getVal('costAuditBranchFilter');
    const category=getVal('costAuditCategoryFilter');
    const status=getVal('costAuditStatusFilter') || 'all';
    const sort=getVal('costAuditSort') || 'warnings_desc';
    audits=audits.filter(a=>{
      const hay=normalize([a.product_name,a.category,a.branch_name,a.cost_source,(a.warnings||[]).join(' ')].join(' '));
      if(q && !hay.includes(q)) return false;
      if(branch && String(a.branch_id)!==String(branch)) return false;
      if(category && a.category!==category) return false;
      if(status==='warnings' && !a.warning_count) return false;
      if(status==='clean' && a.warning_count) return false;
      if(status==='missing_cost' && n(a.total_cost)>0) return false;
      return true;
    });
    audits.sort((a,b)=>{
      if(sort==='cost_desc') return n(b.total_cost)-n(a.total_cost);
      if(sort==='margin_asc') return n(a.offline_margin)-n(b.offline_margin);
      if(sort==='profit_asc') return n(a.offline_profit)-n(b.offline_profit);
      if(sort==='name_asc') return String(a.product_name||'').localeCompare(String(b.product_name||''));
      return n(b.warning_count)-n(a.warning_count) || String(a.product_name||'').localeCompare(String(b.product_name||''));
    });
    return audits;
  }

  function renderKPIs(){
    const target=el('costAuditKPIs'); if(!target) return;
    const all=allAudits();
    const warningCount=all.filter(a=>a.warning_count>0).length;
    const zeroCost=all.filter(a=>n(a.total_cost)<=0).length;
    const avgMargin=all.length ? all.reduce((s,a)=>s+n(a.offline_margin),0)/all.length : 0;
    const totalComponentCost=all.reduce((s,a)=>s+n(a.total_cost),0);
    target.innerHTML =
      (typeof kpi==='function' ? kpi('Products Audited',all.length) : `<div class="kpi"><span>Products Audited</span><strong>${all.length}</strong></div>`)+
      (typeof kpi==='function' ? kpi('With Warnings',warningCount,warningCount?'loss':'profit') : `<div class="kpi"><span>With Warnings</span><strong>${warningCount}</strong></div>`)+
      (typeof kpi==='function' ? kpi('Zero / Missing Cost',zeroCost,zeroCost?'loss':'profit') : `<div class="kpi"><span>Zero / Missing Cost</span><strong>${zeroCost}</strong></div>`)+
      (typeof kpi==='function' ? kpi('Avg Offline Margin',pctFormat(avgMargin),avgMargin<30?'loss':'profit') : `<div class="kpi"><span>Avg Offline Margin</span><strong>${pctFormat(avgMargin)}</strong></div>`)+
      (typeof kpi==='function' ? kpi('Total Menu Cost Basis',inr(totalComponentCost)) : `<div class="kpi"><span>Total Menu Cost Basis</span><strong>${inr(totalComponentCost)}</strong></div>`);
  }

  function renderTable(audits){
    const target=el('costAuditTable'); if(!target) return;
    if(!audits.length){
      target.innerHTML='<div class="empty-state-card">No products found for audit. Change filters or check Product Master data.</div>';
      return;
    }
    const rows=audits.map(a=>{
      const selected=String(a.product_id)===String(selectedAuditProductId);
      const id=esc(a.product_id);
      const inlineId=jsArg(a.product_id);
      return `<tr class="cost-audit-clickable-row ${selected?'selected-row':''}" data-cost-audit-row="${id}" onclick="if(!event.target.closest('button')){openCostAuditModal('${inlineId}');}">
        <td><strong>${esc(a.product_name)}</strong><br><span class="small">${esc(a.category||'-')} · ${esc(a.branch_name||'All Branches')}</span></td>
        <td>${auditSourceLabel(a.cost_source)}</td>
        <td class="num"><strong>${inr(a.total_cost)}</strong></td>
        <td class="num">${inr(a.offline_price)}</td>
        <td class="num ${n(a.offline_profit)<0?'negative-text':'positive-text'}">${inr(a.offline_profit)}</td>
        <td class="num ${n(a.offline_margin)<30?'negative-text':'positive-text'}">${pctFormat(a.offline_margin)}</td>
        <td class="num">${inr(a.online_price)}</td>
        <td class="num ${n(a.online_profit)<0?'negative-text':'positive-text'}">${inr(a.online_profit)}</td>
        <td>${statusHtml(a)}</td>
        <td class="row-actions"><button type="button" class="cost-audit-view-btn" data-cost-audit-view="${id}" onclick="openCostAuditModal('${inlineId}');return false;">View</button></td>
      </tr>`;
    });
    target.innerHTML=typeof table==='function' ? table(['Product','Cost Source','Total Cost','Offline Price','Offline Profit','Offline Margin','Online Price','Online Profit','Health','Actions'],rows) : `<div class="table-scroll"><table><thead><tr><th>Product</th><th>Cost Source</th><th>Total Cost</th><th>Offline Price</th><th>Offline Profit</th><th>Offline Margin</th><th>Online Price</th><th>Online Profit</th><th>Health</th><th>Actions</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
  }

  function metric(label,value,extraClass=''){
    return `<div class="cost-audit-metric"><span>${esc(label)}</span><strong class="${extraClass}">${value}</strong></div>`;
  }

  function warningPriority(message){
    const text=normalize(message);
    if(text.includes('not found') || text.includes('missing recipe') || text.includes('missing ingredient') || text.includes('no product components') || text.includes('no component') || text.includes('no ingredients') || text.includes('quantity is missing') || text.includes('quantity is zero') || text.includes('purchase price is missing') || text.includes('calculated product cost is zero') || text.includes('recipe cost is zero')) return 'critical';
    if(text.includes('offline price') || text.includes('online price') || text.includes('commission') || text.includes('packaging cost field') || text.includes('double')) return 'warning';
    return 'info';
  }

  function warningLabel(priority){
    if(priority==='critical') return 'Critical';
    if(priority==='warning') return 'Warning';
    return 'Info';
  }

  function warningWeight(priority){
    if(priority==='critical') return 25;
    if(priority==='warning') return 10;
    return 4;
  }

  function auditHealthScore(a){
    const warnings=a?.warnings||[];
    let score=100;
    warnings.forEach(w=>{ score-=warningWeight(warningPriority(w)); });
    if(n(a?.total_cost)<=0) score-=20;
    return Math.max(0,Math.min(100,Math.round(score)));
  }

  function healthScoreHtml(a){
    const score=auditHealthScore(a);
    const cls=score<60?'low':score<85?'mid':'';
    return `<span class="cost-audit-health-score ${cls}">${score}% Cost Health</span>`;
  }

  function warningLineHtml(w){
    const priority=warningPriority(w);
    return `<li><span class="warning-priority ${priority}">${warningLabel(priority)}</span>${esc(w)}</li>`;
  }

  function componentRowsHtml(a){
    if(!(a.breakdown||[]).length) return '<div class="empty-state-card">No component rows found for this product.</div>';
    const total=n(a.total_cost);
    const rows=(a.breakdown||[]).map(row=>{
      const contribution=total>0 ? (n(row.cost)/total)*100 : 0;
      return `<tr>
      <td><strong>${esc(row.component_name||row.source_name)}</strong><br><span class="small">${esc(row.component_role||row.component_type||'Component')}</span></td>
      <td>${esc(row.source_name||'-')}</td>
      <td class="num">${n(row.quantity).toFixed(2)}</td>
      <td>${esc(row.unit||'')}</td>
      <td class="num">${inr(row.rate)}</td>
      <td class="num"><strong>${inr(row.cost)}</strong></td>
      <td class="num">${contribution.toFixed(1)}%</td>
      <td>${(row.warnings||[]).length ? row.warnings.map(w=>`<span class="status-pill warn">${esc(w)}</span>`).join(' ') : '<span class="status-pill ok">OK</span>'}</td>
    </tr>`;
    }).join('');
    return `<div class="table-scroll"><table class="cost-audit-component-table"><thead><tr><th>Component</th><th>Source</th><th class="num">Qty</th><th>Unit</th><th class="num">Rate</th><th class="num">Cost</th><th class="num">% of Cost</th><th>Health</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function modalHtml(a){
    const clean=!(a.warnings||[]).length;
    const inlineId=jsArg(a.product_id);
    const warningHtml=clean
      ? '<div class="cost-audit-warning-box clean"><strong>No costing warnings.</strong><br>Product costing looks clean.</div>'
      : `<div class="cost-audit-warning-box"><strong>${a.warnings.length} warning${a.warnings.length>1?'s':''}</strong><ul>${a.warnings.map(w=>warningLineHtml(w)).join('')}</ul></div>`;
    return `<div class="cost-audit-modal-header">
      <div>
        <h2 id="costAuditModalTitle">Product Cost Audit</h2>
        <p><strong>${esc(a.product_name)}</strong> · ${esc(a.category||'-')} · ${esc(a.branch_name||'All Branches')}</p>
        <p>Cost Source: <strong>${auditSourceLabel(a.cost_source)}</strong> · Health: ${statusHtml(a)} ${healthScoreHtml(a)}</p>
        <div class="cost-audit-modal-actions">
          <button type="button" class="primary" onclick="openProductCostBuilderFromAudit('${inlineId}')">Open Product Builder</button>
          <button type="button" onclick="copyCostAuditSummary('${inlineId}')">Copy Summary</button>
        </div>
      </div>
      <button type="button" class="cost-audit-close" onclick="closeCostAuditModal()" aria-label="Close">×</button>
    </div>
    <div class="cost-audit-modal-body">
      <div class="cost-audit-metric-grid">
        ${metric('Cost Health Score',healthScoreHtml(a))}
        ${metric('Total Product Cost',inr(a.total_cost))}
        ${metric('Offline Price',inr(a.offline_price))}
        ${metric('Offline Profit',inr(a.offline_profit),n(a.offline_profit)<0?'negative-text':'positive-text')}
        ${metric('Offline Margin',pctFormat(a.offline_margin),n(a.offline_margin)<30?'negative-text':'positive-text')}
        ${metric('Online Price',inr(a.online_price))}
        ${metric('Commission',pctFormat(a.commission_percent))}
        ${metric('Online Profit',inr(a.online_profit),n(a.online_profit)<0?'negative-text':'positive-text')}
        ${metric('Online Margin',pctFormat(a.online_margin),n(a.online_margin)<30?'negative-text':'positive-text')}
      </div>
      <div class="cost-audit-section">
        <h3>Warnings</h3>
        ${warningHtml}
      </div>
      <div class="cost-audit-section">
        <h3>Component Breakdown</h3>
        ${componentRowsHtml(a)}
      </div>
    </div>`;
  }

  function openCostAuditModal(productId){
    const overlay=ensureCostAuditModal();
    const id=productId || selectedAuditProductId || filteredAudits()[0]?.product_id;
    if(!id) return;
    const a=window.KhumbukaCostAudit?.calculateProductAudit?.(id);
    const content=document.getElementById('costAuditModalContent');
    if(!a?.found){
      if(content) content.innerHTML=`<div class="cost-audit-modal-header"><div><h2>Product Cost Audit</h2><p>Product not found.</p></div><button type="button" class="cost-audit-close" onclick="closeCostAuditModal()">×</button></div>`;
    }else{
      selectedAuditProductId=String(id);
      if(content) content.innerHTML=modalHtml(a);
    }
    overlay.classList.add('open');
    document.body.classList.add('cost-audit-modal-open');
    renderTable(filteredAudits());
    setTimeout(()=>document.querySelector('.cost-audit-close')?.focus?.(),20);
  }

  function closeCostAuditModal(){
    const overlay=document.getElementById('costAuditModalOverlay');
    if(overlay) overlay.classList.remove('open');
    document.body.classList.remove('cost-audit-modal-open');
  }


  function productBuilderOpenDelay(callback){
    setTimeout(callback,120);
  }

  function openProductCostBuilderFromAudit(productId){
    if(!productId) return;
    closeCostAuditModal();
    if(typeof showTab==='function') showTab('products');
    productBuilderOpenDelay(function(){
      if(typeof renderProductSelectors==='function') renderProductSelectors();
      const selector=el('builderProduct');
      if(selector){ selector.value=String(productId); }
      const panel=el('productRecipeBuilderPanel');
      if(panel) panel.setAttribute('open','');
      if(typeof renderProductRecipes==='function') renderProductRecipes();
      if(panel) panel.scrollIntoView({behavior:'smooth',block:'start'});
    });
  }

  function buildCostAuditSummaryText(productId){
    const a=window.KhumbukaCostAudit?.calculateProductAudit?.(productId);
    if(!a?.found) return 'Product audit not found.';
    const warningText=(a.warnings||[]).length ? a.warnings.map(w=>`- [${warningLabel(warningPriority(w))}] ${w}`).join('\n') : 'Clean';
    const componentText=(a.breakdown||[]).length ? (a.breakdown||[]).map(row=>`- ${row.component_name||row.source_name||'Component'}: ${n(row.quantity).toFixed(2)} ${row.unit||''} = ${inr(row.cost)}`).join('\n') : 'No component rows found.';
    return [
      `Product Cost Audit: ${a.product_name}`,
      `Category: ${a.category || '-'}`,
      `Branch: ${a.branch_name || 'All Branches'}`,
      `Cost Source: ${auditSourceLabel(a.cost_source)}`,
      `Cost Health Score: ${auditHealthScore(a)}%`,
      '',
      `Total Cost: ${inr(a.total_cost)}`,
      `Offline Price: ${inr(a.offline_price)}`,
      `Offline Profit: ${inr(a.offline_profit)}`,
      `Offline Margin: ${pctFormat(a.offline_margin)}`,
      `Online Price: ${inr(a.online_price)}`,
      `Commission: ${pctFormat(a.commission_percent)}`,
      `Online Profit: ${inr(a.online_profit)}`,
      `Online Margin: ${pctFormat(a.online_margin)}`,
      '',
      'Warnings:',
      warningText,
      '',
      'Component Breakdown:',
      componentText
    ].join('\n');
  }

  async function copyCostAuditSummary(productId){
    const text=buildCostAuditSummaryText(productId);
    try{
      if(navigator.clipboard?.writeText){
        await navigator.clipboard.writeText(text);
      }else{
        const textarea=document.createElement('textarea');
        textarea.value=text;
        textarea.style.position='fixed';
        textarea.style.left='-9999px';
        document.body.appendChild(textarea);
        textarea.focus(); textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      if(typeof showToast==='function') showToast('Audit summary copied.');
    }catch(error){
      console.warn('Copy audit summary failed',error);
      if(typeof showWarning==='function') showWarning('Could not copy automatically. You can select and copy the audit text manually.');
    }
  }

  function renderCostAudit(){
    ensureCostAuditPageStyle();
    ensureCostAuditModal();
    const audits=filteredAudits();
    if(!selectedAuditProductId && audits[0]?.product_id) selectedAuditProductId=String(audits[0].product_id);
    if(selectedAuditProductId && !audits.some(a=>String(a.product_id)===String(selectedAuditProductId))){
      selectedAuditProductId=audits[0]?.product_id ? String(audits[0].product_id) : null;
    }
    renderKPIs();
    const picker=el('costAuditProductPicker'); if(picker) picker.innerHTML='';
    const detail=el('costAuditDetail'); if(detail) detail.innerHTML='<div class="empty-state-card">Click <strong>View</strong> on any product to open the audit popup.</div>';
    renderTable(audits);
  }

  document.addEventListener('click', function(event){
    const btn=event.target?.closest?.('[data-cost-audit-view]');
    if(!btn) return;
    event.preventDefault();
    event.stopPropagation();
    openCostAuditModal(btn.getAttribute('data-cost-audit-view'));
  });

  window.renderCostAudit=renderCostAudit;
  window.openCostAuditModal=openCostAuditModal;
  window.closeCostAuditModal=closeCostAuditModal;
  window.selectCostAuditProduct=openCostAuditModal;
  window.openProductCostBuilderFromAudit=openProductCostBuilderFromAudit;
  window.copyCostAuditSummary=copyCostAuditSummary;
})();
