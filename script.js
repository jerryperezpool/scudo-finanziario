const fmt = (n) => n.toLocaleString('it-IT', { maximumFractionDigits: 0 });
const fmtPct = (n) => n.toLocaleString('it-IT', { maximumFractionDigits: 1 }) + '%';

const form = document.getElementById('finance-form');
const results = document.getElementById('results');
const rendimentoInput = document.getElementById('rendimento');
const rendimentoValue = document.getElementById('rendimento-value');

let lastInputs = null;
let liveUpdateTimer = null;

function readInputs() {
  return {
    reddito: Number(document.getElementById('reddito').value) || 0,
    spese: Number(document.getElementById('spese').value) || 0,
    risparmi: Number(document.getElementById('risparmi').value) || 0,
    fontiReddito: Number(document.getElementById('fontiReddito').value) || 0,
    mesiRicollocazione: Number(document.getElementById('mesiRicollocazione').value) || 0,
    settoreRischio: document.getElementById('settoreRischio').checked,
    debiti: Number(document.getElementById('debiti').value) || 0,
    tassoDebito: Number(document.getElementById('tassoDebito').value) || 0,
    investimenti: Number(document.getElementById('investimenti').value) || 0,
    valoreCasa: Number(document.getElementById('valoreCasa').value) || 0,
    mutuoCasa: Number(document.getElementById('mutuoCasa').value) || 0,
    allocAzioni: Number(document.getElementById('allocAzioni').value) || 0,
    allocObbligazioni: Number(document.getElementById('allocObbligazioni').value) || 0,
    allocImmobili: Number(document.getElementById('allocImmobili').value) || 0,
    allocCripto: Number(document.getElementById('allocCripto').value) || 0,
    allocLiquidita: Number(document.getElementById('allocLiquidita').value) || 0,
    assicSanitaria: document.getElementById('assicSanitaria').checked,
    assicCasa: document.getElementById('assicCasa').checked,
    assicVita: document.getElementById('assicVita').checked,
  };
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  lastInputs = readInputs();
  render(lastInputs);
  results.hidden = false;
  results.scrollIntoView({ behavior: 'smooth' });
});

form.addEventListener('input', () => {
  if (results.hidden) return;
  clearTimeout(liveUpdateTimer);
  liveUpdateTimer = setTimeout(() => {
    lastInputs = readInputs();
    render(lastInputs);
  }, 150);
});

form.addEventListener('change', () => {
  if (results.hidden) return;
  lastInputs = readInputs();
  render(lastInputs);
});

rendimentoInput.addEventListener('input', () => {
  rendimentoValue.textContent = rendimentoInput.value + '%';
  if (lastInputs) renderScenari(lastInputs);
});

function render(data) {
  renderSituazione(data);
  renderMappaRischi(data);
  renderLiquidita(data);
  renderDebito(data);
  renderCapacita(data);
  renderImmobiliare(data);
  renderCapitaleUmano(data);
  renderDiversificazione(data);
  renderScenari(data);
  renderInflazione(data);
  renderRischi(data);
}

function renderSituazione(data) {
  const risparmioMensile = data.reddito - data.spese;
  const patrimonioNetto = data.risparmi + data.investimenti - data.debiti;
  const el = document.getElementById('stat-situazione');
  el.innerHTML = [
    stat('Risparmio mensile', (risparmioMensile >= 0 ? '+' : '') + fmt(risparmioMensile) + ' €'),
    stat('Patrimonio netto', fmt(patrimonioNetto) + ' €'),
    stat('Risparmi totali', fmt(data.risparmi) + ' €'),
    stat('Debiti totali', fmt(data.debiti) + ' €'),
  ].join('');
}

function stat(label, value) {
  return `<div class="stat"><div class="label">${label}</div><div class="value">${value}</div></div>`;
}

function sogliaFondoEmergenza(data) {
  const copertureMaggiori = (data.assicSanitaria ? 1 : 0) + (data.assicCasa ? 1 : 0);
  const sogliaMin = Math.max(1, 3 - copertureMaggiori);
  const sogliaBuona = Math.max(sogliaMin + 1, 6 - copertureMaggiori * 1.5);
  return { sogliaMin, sogliaBuona, copertureMaggiori };
}

function levelLiquidita(data) {
  const mesi = data.spese > 0 ? data.risparmi / data.spese : Infinity;
  const { sogliaMin, sogliaBuona, copertureMaggiori } = sogliaFondoEmergenza(data);
  let cls = 'good', level = 'Ottimo';
  if (mesi < sogliaMin) { cls = 'bad'; level = 'Basso'; }
  else if (mesi < sogliaBuona) { cls = 'warn'; level = 'Adeguato'; }
  return { cls, level, mesi, sogliaMin, sogliaBuona, copertureMaggiori };
}

function renderLiquidita(data) {
  const { cls, level, mesi, sogliaMin, sogliaBuona, copertureMaggiori } = levelLiquidita(data);

  let msg;
  if (level === 'Basso') {
    msg = `Il tuo fondo di emergenza copre circa ${fmt(mesi)} mesi di spese. Un imprevisto (auto, salute, lavoro) potrebbe metterti in difficoltà. L'obiettivo minimo consigliato per te è ${fmt(sogliaMin)}-${fmt(sogliaBuona)} mesi di spese.`;
  } else if (level === 'Adeguato') {
    msg = `Il tuo fondo di emergenza copre circa ${fmt(mesi)} mesi di spese: sei nella fascia consigliata per te (${fmt(sogliaMin)}-${fmt(sogliaBuona)} mesi), ma potresti rafforzarlo ulteriormente prima di aumentare gli investimenti.`;
  } else {
    msg = `Il tuo fondo di emergenza copre circa ${fmt(mesi)} mesi di spese: hai una buona riserva di sicurezza. Potresti valutare di investire la liquidità in eccesso.`;
  }

  const notaAssicurazione = copertureMaggiori > 0
    ? `<p class="explain" style="margin-top:8px;">Hai indicato di avere ${copertureMaggiori === 2 ? 'assicurazione sanitaria e casa' : (data.assicSanitaria ? 'assicurazione sanitaria' : 'assicurazione casa')}: queste coperture assorbono già parte degli imprevisti più costosi, quindi il fondo di emergenza minimo consigliato per te è più basso rispetto a chi non ha polizze attive.</p>`
    : `<p class="explain" style="margin-top:8px;">Non hai indicato assicurazioni attive: senza una copertura sanitaria o casa, un imprevisto grave grava interamente sul tuo fondo di emergenza — per questo la soglia consigliata resta quella standard (3-6 mesi).</p>`;

  document.getElementById('liquidita').innerHTML =
    `<span class="badge ${cls}">${level}</span><p class="explain">${msg}</p>${notaAssicurazione}`;
}

function levelDebito(data) {
  if (data.debiti <= 0) return { cls: 'good', level: 'Nessun debito', rapporto: 0 };
  const redditoAnnuo = data.reddito * 12;
  const rapporto = redditoAnnuo > 0 ? (data.debiti / redditoAnnuo) * 100 : 0;
  let cls = 'good', level = 'Sotto controllo';
  if (data.tassoDebito >= 8 || rapporto > 40) { cls = 'bad'; level = 'Da affrontare con priorità'; }
  else if (data.tassoDebito >= 4 || rapporto > 20) { cls = 'warn'; level = 'Da monitorare'; }
  return { cls, level, rapporto };
}

function renderDebito(data) {
  if (data.debiti <= 0) {
    document.getElementById('debito').innerHTML =
      `<span class="badge good">Nessun debito</span><p class="explain">Non hai debiti registrati. Ottima base di partenza.</p>`;
    return;
  }
  const interessiAnnui = data.debiti * (data.tassoDebito / 100);
  const { cls, level, rapporto } = levelDebito(data);

  let consiglio;
  if (level === 'Da affrontare con priorità') {
    consiglio = data.tassoDebito >= 8
      ? 'Un tasso così alto rende quasi sempre più conveniente estinguere il debito prima di investire.'
      : 'Anche se il tasso non è altissimo, il debito pesa molto sul tuo reddito annuo: prima di aumentare investimenti, valuta un piano per ridurlo.';
  } else if (level === 'Da monitorare') {
    consiglio = 'A questo livello, valuta caso per caso se conviene ridurre il debito o continuare a risparmiare/investire.';
  } else {
    consiglio = 'Il debito è a un livello gestibile rispetto al tuo reddito e al tasso applicato.';
  }

  const msg = `I tuoi debiti (${fmt(data.debiti)} €) ti costano circa ${fmt(interessiAnnui)} € l'anno in interessi (tasso ${fmtPct(data.tassoDebito)}). ` +
    `Rappresentano circa ${fmtPct(rapporto)} del tuo reddito annuo. ${consiglio}`;

  document.getElementById('debito').innerHTML =
    `<span class="badge ${cls}">${level}</span><p class="explain">${msg}</p>`;
}

function renderCapacita(data) {
  const risparmioMensile = data.reddito - data.spese;
  const tasso = data.reddito > 0 ? (risparmioMensile / data.reddito) * 100 : 0;
  let cls = 'good', level = 'Buona capacità di risparmio';
  if (risparmioMensile <= 0) { cls = 'bad'; level = 'Nessuna capacità di risparmio'; }
  else if (tasso < 10) { cls = 'warn'; level = 'Capacità di risparmio limitata'; }

  const msg = risparmioMensile <= 0
    ? `Le tue spese mensili (${fmt(data.spese)} €) sono pari o superiori al tuo reddito (${fmt(data.reddito)} €). Prima di pensare a risparmio o investimenti, serve rivedere il budget.`
    : `Ogni mese ti restano circa ${fmt(risparmioMensile)} €, pari al ${fmtPct(tasso)} del tuo reddito. ` +
      (tasso < 10
        ? 'Un obiettivo comune è risparmiare almeno il 10-20% del reddito: potresti avere margine analizzando le spese.'
        : 'Sei in linea o sopra gli obiettivi comuni di risparmio (10-20% del reddito).');

  document.getElementById('capacita').innerHTML =
    `<span class="badge ${cls}">${level}</span><p class="explain">${msg}</p>`;
}

function categorieDiversificazione(data) {
  return [
    { label: 'Azioni', valore: data.allocAzioni },
    { label: 'Obbligazioni', valore: data.allocObbligazioni },
    { label: 'Immobili', valore: data.allocImmobili },
    { label: 'Criptovalute', valore: data.allocCripto },
    { label: 'Liquidità / altro', valore: data.allocLiquidita },
  ];
}

function levelDiversificazione(data) {
  const categorie = categorieDiversificazione(data);
  const totale = categorie.reduce((s, c) => s + c.valore, 0);
  if (totale <= 0) return { cls: 'neutral', level: 'Dati mancanti', totale: 0 };
  const massimo = categorie.reduce((m, c) => c.valore > m.valore ? c : m, categorie[0]);
  const pctMassimo = (massimo.valore / totale) * 100;
  let cls = 'good', level = 'Ben diversificato';
  if (pctMassimo >= 70) { cls = 'bad'; level = 'Concentrazione alta'; }
  else if (pctMassimo >= 50) { cls = 'warn'; level = 'Concentrazione moderata'; }
  return { cls, level, totale, massimo, pctMassimo };
}

function renderDiversificazione(data) {
  const categorie = categorieDiversificazione(data);
  const { cls, level, totale, massimo, pctMassimo } = levelDiversificazione(data);
  const el = document.getElementById('diversificazione');

  if (totale <= 0) {
    el.innerHTML = `<p class="explain">Compila la sezione facoltativa "Come sono ripartiti i tuoi investimenti?" nel modulo per vedere qui l'analisi di diversificazione.</p>`;
    return;
  }

  const barre = categorie
    .filter(c => c.valore > 0)
    .map(c => {
      const pct = (c.valore / totale) * 100;
      return `<div class="alloc-bar-row">
        <span class="alloc-label">${c.label}</span>
        <span class="alloc-bar-track"><span class="alloc-bar-fill" style="width:${pct}%"></span></span>
        <span class="alloc-bar-value">${fmtPct(pct)}</span>
      </div>`;
    }).join('');

  let msg = `Nessuna categoria supera il 50% del totale: il rischio è distribuito su più asset.`;
  if (level === 'Concentrazione alta') {
    msg = `${massimo.label} da sola pesa il ${fmtPct(pctMassimo)} del totale. Un crollo in questo settore avrebbe un impatto molto forte su tutto il tuo patrimonio investito.`;
  } else if (level === 'Concentrazione moderata') {
    msg = `${massimo.label} pesa il ${fmtPct(pctMassimo)} del totale: più della metà del rischio dipende da una sola categoria.`;
  }

  const notaSomma = Math.round(totale) !== 100
    ? `<p class="explain" style="margin-top:8px;">Nota: le percentuali inserite sommano a ${fmt(totale)}%, qui sotto sono state riproporzionate su 100%.</p>`
    : '';

  el.innerHTML = `
    <span class="badge ${cls}">${level}</span>
    ${barre}
    <p class="explain" style="margin-top:10px;">${msg}</p>
    ${notaSomma}
  `;
}

function levelImmobiliare(data) {
  if (data.valoreCasa <= 0) return { cls: 'neutral', level: 'Dati mancanti' };
  if (data.mutuoCasa <= 0) return { cls: 'good', level: 'Nessun mutuo' };
  if (data.mutuoCasa > data.valoreCasa) return { cls: 'bad', level: 'Underwater', ltv: (data.mutuoCasa / data.valoreCasa) * 100 };
  const ltv = (data.mutuoCasa / data.valoreCasa) * 100;
  let cls = 'good', level = 'Margine solido';
  if (ltv >= 90) { cls = 'bad'; level = 'Margine minimo'; }
  else if (ltv >= 70) { cls = 'warn'; level = 'Margine ridotto'; }
  return { cls, level, ltv };
}

function renderImmobiliare(data) {
  const el = document.getElementById('immobiliare');
  if (data.valoreCasa <= 0) {
    el.innerHTML = `<p class="explain">Compila la sezione facoltativa "Hai una casa con mutuo?" nel modulo per vedere qui l'analisi del rischio immobiliare.</p>`;
    return;
  }

  const { cls, level } = levelImmobiliare(data);
  const capitaleProprio = data.valoreCasa - data.mutuoCasa;

  let msgBase;
  if (data.mutuoCasa <= 0) {
    msgBase = `Non hai un mutuo residuo su questa casa: il suo intero valore (${fmt(data.valoreCasa)} €) è tuo capitale, senza rischio di restare "underwater".`;
  } else if (data.mutuoCasa > data.valoreCasa) {
    msgBase = `Il tuo mutuo (${fmt(data.mutuoCasa)} €) supera già il valore stimato della casa (${fmt(data.valoreCasa)} €): sei "underwater" di ${fmt(data.mutuoCasa - data.valoreCasa)} € — se vendessi oggi, il ricavato non basterebbe a coprire il debito.`;
  } else {
    msgBase = `Il tuo capitale proprio nella casa è di ${fmt(capitaleProprio)} € (valore ${fmt(data.valoreCasa)} € meno mutuo ${fmt(data.mutuoCasa)} €).`;
  }

  let simulazioneHtml = '';
  if (data.mutuoCasa > 0) {
    const cali = [10, 20, 30];
    const righe = cali.map((calo) => {
      const nuovoValore = data.valoreCasa * (1 - calo / 100);
      const nuovoCapitale = nuovoValore - data.mutuoCasa;
      const underwater = nuovoCapitale < 0;
      return `<tr>
        <td>-${calo}%</td>
        <td>${fmt(nuovoValore)} €</td>
        <td class="${underwater ? 'risk-negative' : ''}">${nuovoCapitale >= 0 ? '' : '−'}${fmt(Math.abs(nuovoCapitale))} €${underwater ? ' (underwater)' : ''}</td>
      </tr>`;
    }).join('');

    simulazioneHtml = `
      <p class="explain" style="margin-top:12px;">Cosa succede al tuo capitale proprio se il mercato immobiliare scende:</p>
      <table class="scenario-table">
        <thead><tr><th>Calo mercato</th><th>Nuovo valore casa</th><th>Capitale proprio residuo</th></tr></thead>
        <tbody>${righe}</tbody>
      </table>
      <p class="explain" style="margin-top:10px;">L'assicurazione tradizionale copre incendio, furto e danni fisici, ma non il calo di prezzo. Alcuni economisti (tra cui Robert Shiller) hanno proposto forme di assicurazione sul valore della casa, simili a una "put option" — oggi non è un prodotto comune, ma sapere quanto sei esposto è già un primo passo di gestione del rischio.</p>
    `;
  }

  document.getElementById('immobiliare').innerHTML =
    `<span class="badge ${cls}">${level}</span><p class="explain">${msgBase}</p>${simulazioneHtml}`;
}

function levelCapitaleUmano(data) {
  if (data.fontiReddito <= 0) return { cls: 'neutral', level: 'Dati mancanti' };

  let score = 0;
  if (data.fontiReddito <= 1) score += 2;
  else if (data.fontiReddito === 2) score += 1;
  if (data.mesiRicollocazione >= 6) score += 2;
  else if (data.mesiRicollocazione >= 3) score += 1;
  if (data.settoreRischio) score += 1;

  let cls = 'good', level = 'Ben diversificato';
  if (score >= 4) { cls = 'bad'; level = 'Molto concentrato'; }
  else if (score >= 2) { cls = 'warn'; level = 'Moderatamente concentrato'; }
  return { cls, level, score };
}

function renderCapitaleUmano(data) {
  const el = document.getElementById('capitale-umano');
  if (data.fontiReddito <= 0) {
    el.innerHTML = `<p class="explain">Compila la sezione facoltativa "Il tuo capitale umano" nel modulo per vedere qui l'analisi.</p>`;
    return;
  }

  const { cls, level } = levelCapitaleUmano(data);

  const puntiFonti = data.fontiReddito <= 1
    ? `Dipendi da un'unica fonte di reddito: se quella si interrompe, il tuo reddito va a zero, un po' come avere il 100% di un portafoglio in un solo titolo.`
    : data.fontiReddito === 2
      ? `Hai 2 fonti di reddito indipendenti: un po' di diversificazione, ma la perdita di una pesa comunque molto.`
      : `Hai ${fmt(data.fontiReddito)} fonti di reddito indipendenti: il tuo capitale umano è relativamente diversificato.`;

  const puntiRicollocazione = data.mesiRicollocazione >= 6
    ? `Stimi che ti servirebbero ${fmt(data.mesiRicollocazione)} mesi per trovare un reddito equivalente: un periodo lungo in cui il tuo fondo di emergenza dovrebbe coprire le spese.`
    : data.mesiRicollocazione >= 3
      ? `Stimi ${fmt(data.mesiRicollocazione)} mesi per ricollocarti: un tempo ragionevole, ma da considerare nel dimensionare il fondo di emergenza.`
      : `Stimi di poter ricollocarti in meno di 3 mesi: un buon segnale di flessibilità del tuo capitale umano.`;

  const puntiSettore = data.settoreRischio
    ? `Hai indicato che il tuo reddito dipende da un settore/tecnologia a rapido cambiamento: come nell'esempio di chi studia una tecnologia che poi diventa meno richiesta, questo aggiunge un rischio di obsolescenza che nessuna assicurazione tradizionale copre.`
    : '';

  document.getElementById('capitale-umano').innerHTML = `
    <span class="badge ${cls}">${level}</span>
    <p class="explain">${puntiFonti}</p>
    <p class="explain" style="margin-top:8px;">${puntiRicollocazione}</p>
    ${puntiSettore ? `<p class="explain" style="margin-top:8px;">${puntiSettore}</p>` : ''}
    <p class="explain" style="margin-top:12px;">Alcuni economisti hanno proposto forme di "wage insurance" (assicurazione sul reddito): se perdi il lavoro e ne trovi uno pagato meno, l'assicurazione compenserebbe parte della differenza per un periodo. Non è un prodotto comune oggi, ma la difesa più concreta resta un fondo di emergenza dimensionato sul tuo reale rischio di concentrazione.</p>
  `;
}

function renderScenari(data) {
  const risparmioMensile = Math.max(0, data.reddito - data.spese);
  const rendimentoAnnuo = Number(rendimentoInput.value) / 100;
  const rendimentoMensile = rendimentoAnnuo / 12;
  const anni = [1, 5, 10];

  const rows = anni.map((anniN) => {
    const mesi = anniN * 12;
    const soloRisparmio = data.risparmi + risparmioMensile * mesi;
    const investito = futureValueSeries(data.risparmi, risparmioMensile, rendimentoMensile, mesi);
    const differenza = investito - soloRisparmio;
    return `<tr>
      <td>${anniN} ${anniN === 1 ? 'anno' : 'anni'}</td>
      <td>${fmt(soloRisparmio)} €</td>
      <td>${fmt(investito)} €</td>
      <td>${differenza >= 0 ? '+' : ''}${fmt(differenza)} €</td>
    </tr>`;
  }).join('');

  document.getElementById('scenari').innerHTML = `
    <table class="scenario-table">
      <thead>
        <tr><th>Orizzonte</th><th>Solo risparmio (0%)</th><th>Investendo al ${fmtPct(Number(rendimentoInput.value))}</th><th>Differenza</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="explain">Proiezione semplificata: assume che tu continui a risparmiare ${fmt(risparmioMensile)} €/mese e ignora inflazione, tasse e variazioni di reddito/spese.</p>
  `;
}

function levelAssicurazione(data) {
  const count = (data.assicSanitaria ? 1 : 0) + (data.assicCasa ? 1 : 0) + (data.assicVita ? 1 : 0);
  let cls = 'bad', level = 'Nessuna protezione indicata';
  if (count >= 3) { cls = 'good'; level = 'Buona copertura'; }
  else if (count >= 1) { cls = 'warn'; level = 'Copertura parziale'; }
  return { cls, level, count };
}

function levelInflazione(data) {
  const patrimonioLiquido = data.risparmi + data.investimenti;
  if (patrimonioLiquido <= 0) return { cls: 'neutral', level: 'Dati insufficienti' };
  const quotaNonInvestita = data.risparmi / patrimonioLiquido;
  let cls = 'good', level = 'Ben protetto';
  if (quotaNonInvestita >= 0.7) { cls = 'bad'; level = 'Molto esposto'; }
  else if (quotaNonInvestita >= 0.4) { cls = 'warn'; level = 'Parzialmente esposto'; }
  return { cls, level, quotaNonInvestita };
}

function renderMappaRischi(data) {
  const liquidita = levelLiquidita(data);
  const debito = levelDebito(data);
  const diversificazione = levelDiversificazione(data);
  const inflazione = levelInflazione(data);
  const assicurazione = levelAssicurazione(data);
  const immobiliare = levelImmobiliare(data);
  const capitaleUmano = levelCapitaleUmano(data);

  const tile = (icon, label, cls, level) => `
    <div class="risk-tile ${cls === 'neutral' ? 'neutral' : ''}">
      <div class="risk-icon">${icon}</div>
      <div class="risk-label">${label}</div>
      <span class="badge ${cls}">${level}</span>
    </div>`;

  const tiles = [
    tile('🏠', 'Immobiliare', immobiliare.cls, immobiliare.level),
    tile('💼', 'Capitale umano', capitaleUmano.cls, capitaleUmano.level),
    tile('💧', 'Liquidità', liquidita.cls, liquidita.level),
    tile('💳', 'Debito', debito.cls, debito.level),
    tile('📈', 'Investimenti', diversificazione.cls, diversificazione.level),
    tile('💶', 'Inflazione', inflazione.cls, inflazione.level),
    tile('🛡️', 'Assicurazione', assicurazione.cls, assicurazione.level),
  ];

  document.getElementById('mappa-rischi').innerHTML = tiles.join('');
}

function renderInflazione(data) {
  const anni = [10, 20, 30];
  const tassiInflazione = [2, 4, 6];
  const base = data.risparmi;

  const risparmioRows = anni.map((anniN) => {
    const celle = tassiInflazione.map((infl) => {
      const valoreReale = base / Math.pow(1 + infl / 100, anniN);
      return `<td>${fmt(valoreReale)} €</td>`;
    }).join('');
    return `<tr><td>${anniN} anni</td>${celle}</tr>`;
  }).join('');

  const intestazioni = tassiInflazione.map(i => `<th>Inflazione ${i}%</th>`).join('');

  let debitoHtml = '';
  if (data.debiti > 0) {
    const debitoRows = anni.map((anniN) => {
      const celle = tassiInflazione.map((infl) => {
        const pesoReale = data.debiti / Math.pow(1 + infl / 100, anniN);
        return `<td>${fmt(pesoReale)} €</td>`;
      }).join('');
      return `<tr><td>${anniN} anni</td>${celle}</tr>`;
    }).join('');

    debitoHtml = `
      <p class="explain" style="margin-top:18px;">Effetto opposto sui debiti a tasso fisso: l'inflazione riduce anche il loro peso reale nel tempo (chi presta perde potere d'acquisto, chi è indebitato in termini fissi ne beneficia).</p>
      <table class="scenario-table">
        <thead><tr><th>Orizzonte</th>${intestazioni}</tr></thead>
        <tbody>${debitoRows}</tbody>
      </table>
    `;
  }

  const { cls: inflCls, level: inflLevel } = levelInflazione(data);

  document.getElementById('inflazione').innerHTML = `
    <span class="badge ${inflCls}">${inflLevel}</span>
    <p class="explain"><strong>I tuoi risparmi attuali (${fmt(base)} €)</strong> in termini di potere d'acquisto reale, se restano fermi (es. su un conto corrente):</p>
    <table class="scenario-table">
      <thead><tr><th>Orizzonte</th>${intestazioni}</tr></thead>
      <tbody>${risparmioRows}</tbody>
    </table>
    ${debitoHtml}
  `;
}

function futureValueSeries(principale, contributoMensile, tassoMensile, mesi) {
  if (tassoMensile === 0) return principale + contributoMensile * mesi;
  const fvPrincipale = principale * Math.pow(1 + tassoMensile, mesi);
  const fvContributi = contributoMensile * ((Math.pow(1 + tassoMensile, mesi) - 1) / tassoMensile);
  return fvPrincipale + fvContributi;
}

function renderRischi(data) {
  const risparmioMensile = data.reddito - data.spese;
  const mesiCopertura = data.spese > 0 ? data.risparmi / data.spese : Infinity;
  const redditoAnnuo = data.reddito * 12;
  const rapportoDebito = redditoAnnuo > 0 ? (data.debiti / redditoAnnuo) * 100 : 0;

  const rischi = [];

  if (risparmioMensile <= 0) {
    rischi.push({ cls: 'bad', text: 'Spendi quanto o più di quanto guadagni: senza margine mensile, ogni imprevisto va coperto con debito o risparmi esistenti.' });
  } else {
    rischi.push({ cls: 'ok', text: 'Hai un margine positivo tra reddito e spese ogni mese.' });
  }

  const { sogliaMin: sogliaMinFondo } = sogliaFondoEmergenza(data);
  if (mesiCopertura < sogliaMinFondo) {
    rischi.push({ cls: 'bad', text: `Fondo di emergenza sotto la soglia minima consigliata per te (${fmt(sogliaMinFondo)} mesi, hai ${fmt(mesiCopertura)} mesi): rischio elevato in caso di imprevisti.` });
  } else {
    rischi.push({ cls: 'ok', text: `Fondo di emergenza adeguato (${fmt(mesiCopertura)} mesi di spese).` });
  }

  if (data.debiti > 0 && data.tassoDebito >= 8) {
    rischi.push({ cls: 'bad', text: `Debito a tasso elevato (${fmtPct(data.tassoDebito)}): gli interessi eroderanno rapidamente qualunque rendimento da investimento.` });
  } else if (data.debiti > 0 && data.tassoDebito >= 4) {
    rischi.push({ cls: 'warn', text: `Debito a tasso medio (${fmtPct(data.tassoDebito)}): valuta se estinguerlo in anticipo conviene rispetto a investire.` });
  }

  if (rapportoDebito > 40) {
    rischi.push({ cls: 'bad', text: `Il debito è pari al ${fmtPct(rapportoDebito)} del tuo reddito annuo: livello di indebitamento alto.` });
  }

  if (data.investimenti === 0 && risparmioMensile > 0 && mesiCopertura >= 3) {
    rischi.push({ cls: 'warn', text: 'Hai margine di risparmio e un fondo di emergenza adeguato, ma nessun investimento: rischi di perdere potere d\'acquisto per via dell\'inflazione tenendo tutto liquido a lungo termine.' });
  }

  const diversificazione = levelDiversificazione(data);
  if (diversificazione.level === 'Concentrazione alta') {
    rischi.push({ cls: 'bad', text: `I tuoi investimenti sono concentrati per il ${fmtPct(diversificazione.pctMassimo)} in una sola categoria di asset: poca diversificazione, alto rischio in caso di crollo di quel settore.` });
  } else if (diversificazione.level === 'Concentrazione moderata') {
    rischi.push({ cls: 'warn', text: `Più della metà (${fmtPct(diversificazione.pctMassimo)}) dei tuoi investimenti è in una sola categoria: valuta di diversificare ulteriormente.` });
  }

  const immobiliare = levelImmobiliare(data);
  if (immobiliare.level === 'Underwater') {
    rischi.push({ cls: 'bad', text: `Il tuo mutuo residuo supera il valore stimato della casa: sei "underwater", un rischio che l'assicurazione tradizionale della casa non copre.` });
  } else if (immobiliare.level === 'Margine minimo') {
    rischi.push({ cls: 'warn', text: `Il mutuo copre oltre il 90% del valore della casa: anche un piccolo calo del mercato immobiliare potrebbe metterti "underwater".` });
  }

  if (!data.assicVita) {
    rischi.push({ cls: 'warn', text: 'Non hai indicato un\'assicurazione vita: se hai persone a tuo carico (partner, figli), valuta se una copertura minima li proteggerebbe in caso di eventi imprevisti.' });
  }

  const capitaleUmano = levelCapitaleUmano(data);
  if (capitaleUmano.level === 'Molto concentrato') {
    const { sogliaBuona: sogliaBuonaFondo } = sogliaFondoEmergenza(data);
    const avviso = mesiCopertura < sogliaBuonaFondo
      ? ' Il tuo fondo di emergenza attuale non è ancora abbastanza ampio da compensare bene questo rischio.'
      : '';
    rischi.push({ cls: 'bad', text: `Il tuo capitale umano (la tua capacità di generare reddito) è molto concentrato in una singola fonte: è il tuo asset più grande, ma rischi come un portafoglio con un solo titolo.${avviso}` });
  }

  const ul = document.getElementById('rischi');
  ul.innerHTML = rischi.map(r => `<li class="${r.cls === 'ok' ? 'ok' : r.cls}">${r.text}</li>`).join('');
}

const GASTOS_KEY = 'fincopilot_gastos';
const GASTO_CATEGORIAS = {
  Comida: '🍽️', Transporte: '🚌', Ocio: '🎉', Salud: '💊', Casa: '🏠', Otros: '📦',
};
const INGRESO_CATEGORIAS = {
  Salario: '💼', Venta: '🛒', Regalo: '🎁', Otro: '➕',
};

function todayStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function loadGastos() {
  try {
    const raw = localStorage.getItem(GASTOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveGastos(gastos) {
  try {
    localStorage.setItem(GASTOS_KEY, JSON.stringify(gastos));
  } catch (e) {
    // localStorage no disponible: los datos no se guardarán entre visitas.
  }
}

function fmtEuro(n) {
  return n.toLocaleString('es-ES', { maximumFractionDigits: 2 }) + ' €';
}

function catIcon(tipo, categoria) {
  const map = tipo === 'ingreso' ? INGRESO_CATEGORIAS : GASTO_CATEGORIAS;
  return map[categoria] || (tipo === 'ingreso' ? '➕' : '📦');
}

function renderGastos() {
  const gastos = loadGastos();
  const hoy = todayStr();
  const movimientosHoy = gastos.filter(g => g.fecha === hoy);

  const ingresosHoy = movimientosHoy.filter(g => g.tipo === 'ingreso').reduce((s, g) => s + g.importe, 0);
  const gastosHoySum = movimientosHoy.filter(g => g.tipo !== 'ingreso').reduce((s, g) => s + g.importe, 0);
  const balanceHoy = ingresosHoy - gastosHoySum;

  document.getElementById('expense-today-income').textContent = '+' + fmtEuro(ingresosHoy);
  document.getElementById('expense-today-expense').textContent = '−' + fmtEuro(gastosHoySum);
  const balanceEl = document.getElementById('expense-today-total');
  balanceEl.textContent = (balanceHoy >= 0 ? '+' : '−') + fmtEuro(Math.abs(balanceHoy));
  balanceEl.classList.toggle('positive', balanceHoy >= 0);
  balanceEl.classList.toggle('negative', balanceHoy < 0);

  const listEl = document.getElementById('expense-list');
  if (movimientosHoy.length === 0) {
    listEl.innerHTML = `<li class="expense-empty">Todavía no has añadido ningún movimiento hoy.</li>`;
  } else {
    listEl.innerHTML = movimientosHoy.slice().reverse().map(g => {
      const esIngreso = g.tipo === 'ingreso';
      return `
      <li>
        <span class="expense-cat">${catIcon(g.tipo, g.categoria)}</span>
        <span class="expense-desc">${escapeHtml(g.descripcion)}</span>
        <span class="expense-amount ${esIngreso ? 'positive' : 'negative'}">${esIngreso ? '+' : '−'}${fmtEuro(g.importe)}</span>
        <button class="expense-delete" data-id="${g.id}" aria-label="Eliminar movimiento" title="Eliminar">✕</button>
      </li>
    `;
    }).join('');
  }

  const porDia = {};
  gastos.forEach(g => {
    if (g.fecha === hoy) return;
    if (!porDia[g.fecha]) porDia[g.fecha] = 0;
    porDia[g.fecha] += g.tipo === 'ingreso' ? g.importe : -g.importe;
  });
  const dias = Object.keys(porDia).sort((a, b) => b.localeCompare(a)).slice(0, 6);
  const historyEl = document.getElementById('expense-history-list');
  if (dias.length === 0) {
    historyEl.innerHTML = `<li class="expense-empty">Aún no hay días anteriores registrados.</li>`;
  } else {
    historyEl.innerHTML = dias.map(fecha => {
      const label = new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
      const neto = porDia[fecha];
      const cls = neto >= 0 ? 'positive' : 'negative';
      return `<li><span>${label}</span><span class="value ${cls}">${neto >= 0 ? '+' : '−'}${fmtEuro(Math.abs(neto))}</span></li>`;
    }).join('');
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

const btnTipoIngreso = document.getElementById('btnTipoIngreso');
const btnTipoGasto = document.getElementById('btnTipoGasto');
const expenseTipoActual = document.getElementById('expenseTipoActual');
const expenseCategoriaGasto = document.getElementById('expenseCategoriaGasto');
const expenseCategoriaIngreso = document.getElementById('expenseCategoriaIngreso');

function setExpenseTipo(tipo) {
  expenseTipoActual.value = tipo;
  btnTipoIngreso.classList.toggle('active', tipo === 'ingreso');
  btnTipoGasto.classList.toggle('active', tipo === 'gasto');
  expenseCategoriaIngreso.hidden = tipo !== 'ingreso';
  expenseCategoriaGasto.hidden = tipo === 'ingreso';
}

btnTipoIngreso.addEventListener('click', () => setExpenseTipo('ingreso'));
btnTipoGasto.addEventListener('click', () => setExpenseTipo('gasto'));

const expenseForm = document.getElementById('expense-form');
expenseForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const importeInput = document.getElementById('expenseImporte');
  const descripcionInput = document.getElementById('expenseDescripcion');
  const tipo = expenseTipoActual.value;
  const categoriaInput = tipo === 'ingreso' ? expenseCategoriaIngreso : expenseCategoriaGasto;

  const importe = Number(importeInput.value);
  const descripcion = descripcionInput.value.trim();
  if (!importe || importe <= 0 || !descripcion) return;

  const gastos = loadGastos();
  gastos.push({
    id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    tipo,
    importe,
    descripcion,
    categoria: categoriaInput.value,
    fecha: todayStr(),
  });
  saveGastos(gastos);
  renderGastos();

  importeInput.value = '';
  descripcionInput.value = '';
  importeInput.focus();
});

document.getElementById('expense-list').addEventListener('click', (e) => {
  const btn = e.target.closest('.expense-delete');
  if (!btn) return;
  const id = btn.getAttribute('data-id');
  const gastos = loadGastos().filter(g => g.id !== id);
  saveGastos(gastos);
  renderGastos();
});

renderGastos();
