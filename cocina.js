/* FitApp Web — fase 3b: registro por voz, escáner de productos, «¿Qué cocino?» y lista de compras. */
'use strict';

// ───────────────────────── Utilidades ─────────────────────────

const palabrasDe = (t) => normalizar(t).split(/[^a-z0-9ñ.,]+/).filter(Boolean);
const singular = (p) => (p.length > 4 && p.endsWith('es') ? p.slice(0, -2) : p.length > 3 && p.endsWith('s') ? p.slice(0, -1) : p);

function cargarScript(url) {
  return new Promise((ok, mal) => {
    if (document.querySelector(`script[src="${url}"]`)) return ok();
    const s = document.createElement('script');
    s.src = url; s.onload = () => ok(); s.onerror = () => mal(new Error('Necesitas internet la primera vez para descargar el lector.'));
    document.head.appendChild(s);
  });
}

// Dictado con el micrófono (si el navegador lo permite). Si no, el 🎤 del teclado sirve igual.
const Reconocimiento = window.SpeechRecognition || window.webkitSpeechRecognition;
let dictadoActivo = null;
function botonDictar(destino) {
  return Reconocimiento
    ? `<button class="boton chico" style="background:linear-gradient(135deg,#FF4F8B,#9B5CFF)" data-a="dictar" data-destino="${destino}">🎤 Dictar</button>`
    : '<span class="mini suave">Toca el 🎤 del teclado para dictar.</span>';
}
function alternarDictado(b) {
  const area = document.getElementById(b.dataset.destino);
  if (dictadoActivo) { dictadoActivo.stop(); return; }
  try {
    const r = new Reconocimiento();
    r.lang = 'es-MX'; r.interimResults = true; r.continuous = false;
    const base = area.value.trim() ? area.value.trim() + ', ' : '';
    r.onresult = (ev) => {
      let t = '';
      for (const res of ev.results) t += res[0].transcript;
      area.value = base + t;
      area.dispatchEvent(new Event('input', { bubbles: true }));
    };
    r.onend = () => { dictadoActivo = null; b.textContent = '🎤 Dictar'; };
    r.onerror = (e) => { if (e.error === 'not-allowed') alert('Permite el micrófono para Safari en Ajustes del iPhone.'); };
    r.start(); dictadoActivo = r; b.textContent = '⏹ Detener';
  } catch (e) { alert('El dictado no está disponible aquí. Usa el 🎤 del teclado.'); }
}

// ───────────────────────── Intérprete de frases ─────────────────────────

const NUMEROS = { un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, doce: 12, medio: 0.5, media: 0.5, cuarto: 0.25 };
const UNIDADES_PORCION = new Set(['taza', 'tazas', 'plato', 'platos', 'porcion', 'porciones', 'unidad', 'unidades', 'pieza', 'piezas', 'vaso', 'vasos',
  'rebanada', 'rebanadas', 'lata', 'latas', 'cucharada', 'cucharadas', 'cda', 'cdas', 'cucharadita', 'cucharaditas', 'scoop', 'scoops', 'trozo', 'trozos',
  'puñado', 'punado', 'filete', 'filetes', 'bolsita', 'barra']);
const UNIDADES_GRAMO = { gramos: 1, gramo: 1, g: 1, gr: 1, grs: 1, onza: 28.35, onzas: 28.35, oz: 28.35, kilo: 1000, kilos: 1000, kg: 1000, libra: 453.6, libras: 453.6 };
const VACIAS = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'con', 'un', 'una', 'y', 'a', 'al', 'en', 'mi', 'comi', 'me', 'tome']);

function partesDeFrase(frase) {
  let t = ' ' + normalizar(frase) + ' ';
  for (const s of [' y ', ' mas ', '\n', '+', ';']) t = t.split(s).join(',');
  return t.split(',').map((x) => x.trim()).filter(Boolean);
}

function candidatos(buscadas, limite = 4, puntuar = null) {
  const res = [];
  for (const a of todos()) {
    const nombre = palabrasDe(a.nombre).map(singular);
    const coinciden = buscadas.filter((b) => nombre.some((w) => w.startsWith(b) || (b.startsWith(w) && w.length > 3)));
    if (!coinciden.length) continue;
    let p = coinciden.length / buscadas.length * 10 - nombre.length * 0.3;
    if (nombre[0] && nombre[0].startsWith(buscadas[0])) p += 2;
    p += Math.min(uso(a.codigo).vecesUsado, 10) * 0.2;
    if (puntuar) p += puntuar(a);
    res.push([a, p]);
  }
  return res.sort((x, y) => y[1] - x[1]).slice(0, limite).map((x) => x[0]);
}

function interpretarFrase(frase) {
  return partesDeFrase(frase).map((parte) => {
    let tokens = palabrasDe(parte), cantidad = 1, gramos = null;
    if (!tokens.length) return null;
    const v = parseFloat(tokens[0].replace(',', '.'));
    if (Number.isFinite(v)) { cantidad = v; tokens.shift(); }
    else if (NUMEROS[tokens[0]] != null) {
      cantidad = NUMEROS[tokens.shift()];
      if (tokens[0] && NUMEROS[tokens[0]] != null && NUMEROS[tokens[0]] < 1) cantidad = NUMEROS[tokens.shift()];
    }
    if (tokens[0] && UNIDADES_GRAMO[tokens[0]]) gramos = cantidad * UNIDADES_GRAMO[tokens.shift()];
    else if (tokens[0] && UNIDADES_PORCION.has(tokens[0])) tokens.shift();
    const buscadas = tokens.filter((t) => !VACIAS.has(t)).map(singular);
    if (!buscadas.length) return null;
    const cand = candidatos(buscadas, 4, (a) => {
      let b = 0;
      if (/cocid|hervid|plancha|entero|natural|blanco|fresc/.test(a._n)) b += 2.5;
      if (/amarillo|frit|empaniz|nugget|salvaje|evaporad|condensad|molleja|higado/.test(a._n)) b -= 2;
      if (/crud/.test(a._n) && !/avena|verdura|fruta/.test(a._n) && !['Verduras', 'Frutas', 'Frutos secos y semillas'].includes(a.categoria)) b -= 2;
      return b;
    });
    const elegido = cand[0];
    return { texto: buscadas.join(' '), cantidad, gramosFijos: gramos, candidatos: cand.map((a) => a.codigo), elegido: elegido ? elegido.codigo : '',
      gramos: elegido ? r0(gramos ?? cantidad * elegido.porcion_gramos) : 0, incluir: !!elegido };
  }).filter(Boolean);
}

// ───────────────────────── Hoja: registrar por voz ─────────────────────────

VISTAS_EXTRA.voz = function (h) {
  const t = tipoInfo(h.tipoComida);
  const total = (h.lineas || []).filter((l) => l.incluir && l.elegido).reduce((s, l) => s + valores(alimento(l.elegido), l.gramos).calorias, 0);
  return cabecera('Registrar por voz', '‹ Atrás') + `<div class="hoja-cuerpo pila">
    <div class="tarjeta pila">
      <div class="negrita">Dime qué comiste</div>
      <textarea id="voz-texto" rows="3" placeholder="Ej.: dos huevos revueltos, una taza de arroz y 150 gramos de pollo">${esc(h.texto || '')}</textarea>
      <div class="fila entre">${botonDictar('voz-texto')}<button class="boton chico" data-a="interpretar-voz">Interpretar ›</button></div>
    </div>
    ${(h.lineas || []).map((l, i) => {
      if (!l.elegido) return `<div class="tarjeta peq"><b>«${esc(l.texto)}»</b> <span class="suave">no lo encontré. Prueba con otro nombre.</span></div>`;
      const a = alimento(l.elegido), v = valores(a, l.gramos);
      return `<div class="tarjeta pila" style="gap:8px;opacity:${l.incluir ? 1 : 0.5}">
        <div class="fila entre"><span class="mini suave">«${esc(l.texto)}»</span><label class="fila mini"><input type="checkbox" data-voz-incluir="${i}" ${l.incluir ? 'checked' : ''}> Incluir</label></div>
        <select data-voz-elegir="${i}">${l.candidatos.map((c) => `<option value="${c}" ${c === l.elegido ? 'selected' : ''}>${esc(alimento(c).nombre)}</option>`).join('')}</select>
        <div class="fila entre"><span class="numerico"><button class="circulo" data-a="voz-gramos" data-i="${i}" data-n="-10">−</button>
          <b class="num" style="min-width:70px;text-align:center">${l.gramos} g</b><button class="circulo" data-a="voz-gramos" data-i="${i}" data-n="10">+</button></span>
          <b class="num">${r0(v.calorias)} kcal</b></div></div>`;
    }).join('')}
    ${(h.lineas || []).some((l) => l.incluir && l.elegido) ? `<button class="boton" style="background:${t.g}" data-a="voz-agregar">Añadir a ${t.nombre} · ${r0(total)} kcal</button>` : ''}
  </div>`;
};

// ───────────────────────── Escáner de productos ─────────────────────────

function codigoProducto(texto) {
  const t = String(texto || '').trim();
  const sinCero = (c) => (c.length === 14 && c.startsWith('0') ? c.slice(1) : c);
  if (/^\d{8,14}$/.test(t)) return sinCero(t);
  const m = t.match(/\/01\/(\d{8,14})/);
  return m ? sinCero(m[1]) : null;
}

function productoGuardado(codigo) {
  const variantes = new Set([codigo, '0' + codigo, codigo.replace(/^0/, '')]);
  const a = S.alimentosPersonalizados.find((x) => x.codigoBarras && variantes.has(x.codigoBarras));
  return a ? alimento(a.codigo) : null;
}

async function leerCodigo(archivo) {
  if ('BarcodeDetector' in window) {
    try {
      const det = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'itf', 'qr_code'] });
      const res = await det.detect(await createImageBitmap(archivo));
      if (res.length) return res[0].rawValue;
    } catch (e) { /* sigue con ZXing */ }
  }
  await cargarScript('https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js');
  const Z = window.ZXing;
  const pistas = new Map();
  pistas.set(Z.DecodeHintType.TRY_HARDER, true);
  pistas.set(Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.EAN_13, Z.BarcodeFormat.EAN_8, Z.BarcodeFormat.UPC_A, Z.BarcodeFormat.UPC_E,
    Z.BarcodeFormat.CODE_128, Z.BarcodeFormat.ITF, Z.BarcodeFormat.QR_CODE]);
  const lector = new Z.BrowserMultiFormatReader(pistas);
  const url = URL.createObjectURL(archivo);
  try { return (await lector.decodeFromImageUrl(url)).getText(); }
  catch (e) { return null; }
  finally { URL.revokeObjectURL(url); }
}

async function buscarOpenFoodFacts(codigo) {
  let datos;
  try {
    const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${codigo}.json?fields=product_name,product_name_es,brands,serving_quantity,nutriments`);
    if (r.status === 404) return { estado: 'noEncontrado' };
    datos = await r.json();
  } catch (e) { return { estado: 'sinConexion' }; }
  if (!datos || datos.status !== 1 || !datos.product) return { estado: 'noEncontrado' };
  const p = datos.product, n = p.nutriments || {};
  const num = (v) => { const x = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(x) ? x : null; };
  const marca = String(p.brands || '').split(',')[0].trim();
  let nombre = (p.product_name_es || p.product_name || '').trim() || marca || `Producto ${codigo}`;
  if (marca && !normalizar(nombre).includes(normalizar(marca))) nombre += ` (${marca})`;
  const kcal = num(n['energy-kcal_100g']) ?? (num(n.energy_100g) != null ? num(n.energy_100g) / 4.184 : null);
  if (!(kcal > 0)) return { estado: 'sinDatos', nombre };
  const porcion = num(p.serving_quantity);
  return { estado: 'encontrado', producto: { nombre, porcion: porcion > 0 ? porcion : null, kcal, p: num(n.proteins_100g) || 0,
    c: num(n.carbohydrates_100g) || 0, g: num(n.fat_100g) || 0, f: num(n.fiber_100g) || 0 } };
}

function guardarProducto(pr, codigo) {
  let nombre = pr.nombre;
  if (todos().some((a) => normalizar(a.nombre) === normalizar(nombre))) nombre += ` (${codigo.slice(-4)})`;
  const nuevo = { codigo: 'custom-' + uid(), nombre, categoria: 'Productos escaneados', porcionGramos: pr.porcion || 100,
    descripcionPorcion: pr.porcion ? `1 porción (${fmt(pr.porcion)} g)` : '100 g', calorias100g: r1(pr.kcal), proteina100g: r1(pr.p),
    carbohidratos100g: r1(pr.c), grasa100g: r1(pr.g), fibra100g: r1(pr.f), esFavorito: false, vecesUsado: 0, codigoBarras: codigo };
  S.alimentosPersonalizados.push(nuevo); cacheTodos = null; guardar();
  return alimento(nuevo.codigo);
}

// Lectura de la tabla nutricional (OCR)
function interpretarEtiqueta(filas) {
  const lineas = filas.map((t) => normalizar(t)
    .replace(/(^|[^a-z])o(?=\s?(g|mg|,|\.)\b)/g, '$10').replace(/(\d)\s*o(?=\s?g\b)/g, '$10'));
  const R = /(\d+(?:[.,]\d+)?)\s*((?:kcal|cal|kj|mg|mcg|g|ml)(?![a-z])|%)?/g;
  const nums = (t) => [...t.matchAll(R)].map((m) => ({ v: parseFloat(m[1].replace(',', '.')), u: m[2] === 'cal' ? 'kcal' : (m[2] || '') }));
  const despues = (claves, l) => { for (const c of claves) { const i = l.indexOf(c); if (i >= 0) return l.slice(i + c.length); } return null; };
  const gramos = (claves, ex = []) => {
    for (let i = 0; i < lineas.length; i++) {
      const l = lineas[i];
      if (ex.some((e) => l.includes(e))) continue;
      const r = despues(claves, l); if (r == null) continue;
      let c = nums(r); if (!c.length && i + 1 < lineas.length) c = nums(lineas[i + 1]);
      const g = c.find((x) => x.u === 'g' || x.u === ''); if (g) return g.v;
      const mg = c.find((x) => x.u === 'mg'); if (mg) return mg.v / 1000;
    }
    return null;
  };
  const d = { calorias: null };
  const claveE = ['calorias', 'caloria', 'energia', 'valor energetico', 'calories', 'energy'];
  for (let i = 0; i < lineas.length && d.calorias == null; i++) {
    let l = lineas[i];
    for (const corte of ['calorias de grasa', 'calorias de la grasa', 'calories from fat', 'from fat']) { const j = l.indexOf(corte); if (j >= 0) l = l.slice(0, j); }
    if (['grasa', 'dieta', 'diet', 'basad', 'based'].some((x) => l.includes(x))) continue;
    const tiene = claveE.some((c) => l.includes(c));
    if (!tiene && !l.includes('kcal')) continue;
    let c = nums(despues(claveE, l) ?? l); if (!c.length && i + 1 < lineas.length) c = nums(lineas[i + 1]);
    const k = c.find((x) => x.u === 'kcal'), s = c.find((x) => x.u === ''), kj = c.find((x) => x.u === 'kj');
    if (k) d.calorias = k.v; else if (tiene && s) d.calorias = s.v; else if (kj) d.calorias = Math.round(kj.v / 4.184);
  }
  d.proteina = gramos(['proteinas', 'proteina', 'protein']);
  d.carbohidratos = gramos(['carbohidratos totales', 'carbohidrato total', 'carbohidratos', 'carbohidrato', 'hidratos de carbono', 'total carbohydrate', 'carbohydrate', 'carbs']);
  const exG = ['saturad', 'trans', 'monoinsat', 'poliinsat', 'calorias', 'calories', 'from fat'];
  d.grasa = gramos(['grasa total', 'grasas totales', 'total fat', 'lipidos'], exG) ?? gramos(['grasas', 'grasa', 'fat'], exG);
  d.fibra = gramos(['fibra dietetica', 'fibra alimentaria', 'fibra', 'dietary fiber', 'fiber', 'fibre']);
  d.porcion = null;
  const exP = ['porciones por', 'servings per', 'por envase', 'per container', 'raciones por', 'porciones aprox'];
  for (const l of lineas) {
    if (d.porcion != null) break;
    if (!['porcion', 'serving', 'racion', 'tamano'].some((x) => l.includes(x)) || exP.some((x) => l.includes(x))) continue;
    const c = nums(l).filter((x) => (x.u === 'g' || x.u === 'ml') && x.v > 0);
    if (c.length) d.porcion = c[c.length - 1].v;
  }
  d.por100 = d.porcion == null && lineas.some((l) => /100 ?g|100 ml/.test(l));
  if (d.calorias == null && (d.proteina != null || d.carbohidratos != null || d.grasa != null)) {
    d.calorias = Math.round((d.proteina || 0) * 4 + (d.carbohidratos || 0) * 4 + (d.grasa || 0) * 9);
  }
  d.encontro = d.calorias != null || d.proteina != null || d.carbohidratos != null || d.grasa != null;
  return d;
}
window.interpretarEtiqueta = interpretarEtiqueta;   // para pruebas

async function leerTabla(archivo, progreso) {
  await cargarScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js');
  const worker = await window.Tesseract.createWorker('spa', 1, {
    logger: (m) => { if (m.status === 'recognizing text' && progreso) progreso(Math.round(m.progress * 100)); }
  });
  try {
    const { data } = await worker.recognize(archivo);
    return String(data.text || '').split('\n').map((x) => x.trim()).filter(Boolean);
  } finally { await worker.terminate(); }
}

VISTAS_EXTRA.escaner = function (h) {
  h.modo = h.modo || 'codigo';
  const t = tipoInfo(h.tipoComida), esCodigo = h.modo === 'codigo';
  let resultado = '';
  const e = h.estado || {};
  if (e.tipo === 'trabajando') resultado = `<div class="tarjeta centro peq negrita">⏳ ${esc(e.texto)}</div>`;
  if (e.tipo === 'error') resultado = `<div class="tarjeta peq negrita" style="color:var(--coral)">⚠️ ${esc(e.texto)}</div>`;
  if (e.tipo === 'qr') resultado = `<div class="tarjeta pila"><div class="negrita" style="color:var(--naranja)">Este QR no es de un producto</div>
    <div class="mini suave" style="word-break:break-all">${esc(e.texto)}</div><div class="peq suave">Muchos QR llevan a la web de la marca. Escanea el código de barras o fotografía la tabla nutricional.</div></div>`;
  if (e.tipo === 'sinProducto') resultado = `<div class="tarjeta pila"><div class="negrita" style="color:var(--naranja)">${e.sinConexion ? '📵 Sin conexión a internet' : esc(e.nombre || 'Producto no encontrado')}</div>
    <div class="peq suave">${e.sinConexion ? `Leí el código ${e.codigo}, pero no puedo buscarlo sin internet.` : `El código ${e.codigo} no tiene calorías en la base abierta.`} Fotografía la tabla nutricional y quedará guardado para la próxima.</div>
    <button class="boton" style="background:linear-gradient(135deg,#22C47A,#2F8CFF)" data-a="escaner-modo" data-v="etiqueta">📄 Fotografiar la tabla nutricional</button>
    <button class="boton secundario" data-a="escaner-manual">Escribir los datos a mano</button></div>`;
  if (e.tipo === 'encontrado') {
    const a = alimento(e.codigo), g = leerNum(h.gramos) ?? a.porcion_gramos, v = valores(a, g);
    resultado = `<div class="tarjeta pila"><div class="negrita" style="color:var(--verde)">✅ ${e.nuevo ? 'Producto guardado en tus alimentos' : 'Ya tenías este producto guardado'}</div>
      <div class="negrita" style="font-size:17px">${esc(a.nombre)}</div><div class="mini suave">Por 100 g:</div>${bloques(valores(a, 100))}
      <div class="etiqueta">¿Cuánto comiste?</div>
      <div class="numerico"><button class="circulo" data-a="escaner-gramos" data-n="-10">−</button><input type="text" inputmode="decimal" id="escaner-g" value="${esc(h.gramos ?? fmt(a.porcion_gramos))}"><span class="unidad">g</span><button class="circulo" data-a="escaner-gramos" data-n="10">+</button></div>
      <button class="boton" style="background:${t.g}" data-a="escaner-agregar">Añadir a ${t.nombre} · <span id="escaner-kcal">${r0(v.calorias)}</span> kcal</button>
      <button class="boton secundario" data-a="cerrar">Solo guardar</button>
      <div class="mini tenue">Queda en «Mis alimentos»: la próxima vez lo encuentras en el buscador o al escanear el mismo código.</div></div>`;
  }
  return cabecera('Escanear producto', '‹ Atrás') + `<div class="hoja-cuerpo pila">
    <div class="segmentos"><button class="${esCodigo ? 'sel' : ''}" data-a="escaner-modo" data-v="codigo">Código de barras / QR</button><button class="${!esCodigo ? 'sel' : ''}" data-a="escaner-modo" data-v="etiqueta">Tabla nutricional</button></div>
    <div class="portada centro" style="background:${esCodigo ? 'linear-gradient(135deg,#2F8CFF,#9B5CFF)' : 'linear-gradient(135deg,#22C47A,#2F8CFF)'}">
      <div style="font-size:48px">${esCodigo ? '🏷️' : '📄'}</div>
      <div style="font-size:20px;font-weight:800">${esCodigo ? 'Escanea el código de barras' : 'Fotografía la tabla nutricional'}</div>
      <div class="peq" style="opacity:.92;margin-top:4px">${esCodigo ? 'Te digo qué producto es y sus calorías (base gratuita Open Food Facts, necesita internet la primera vez).' : 'Leo calorías, proteína, carbohidratos, grasa y porción. Tú solo revisas y guardas.'}</div></div>
    ${h.codigo && !esCodigo ? `<div class="mini suave centro">🏷️ Se guardará con el código ${esc(h.codigo)}</div>` : ''}
    <label class="boton">📷 Tomar o elegir foto<input type="file" accept="image/*" id="escaner-foto" hidden></label>
    <div class="mini suave centro">${esCodigo ? 'Acércate: que el código se vea completo, nítido y con buena luz.' : 'De frente, que la tabla llene la foto y sin reflejos.'}</div>
    ${resultado}</div>`;
};

async function procesarEscaneo(archivo) {
  const h = hojaActual();
  const estado = (e) => { if (hojaActual() === h) { h.estado = e; pintarHoja(); } };
  if (h.modo === 'codigo') {
    estado({ tipo: 'trabajando', texto: 'Buscando el código…' });
    let texto;
    try { texto = await leerCodigo(archivo); } catch (e) { return estado({ tipo: 'error', texto: e.message }); }
    if (!texto) return estado({ tipo: 'error', texto: 'No encontré un código de barras. Acércate, que se vea completo y con buena luz.' });
    const codigo = codigoProducto(texto);
    if (!codigo) return estado({ tipo: 'qr', texto });
    h.codigo = codigo;
    const local = productoGuardado(codigo);
    if (local) return estado({ tipo: 'encontrado', codigo: local.codigo, nuevo: false });
    estado({ tipo: 'trabajando', texto: `Buscando el producto ${codigo}…` });
    const r = await buscarOpenFoodFacts(codigo);
    if (r.estado === 'encontrado') { const a = guardarProducto(r.producto, codigo); h.gramos = null; return estado({ tipo: 'encontrado', codigo: a.codigo, nuevo: true }); }
    h.nombre = r.nombre || '';
    return estado({ tipo: 'sinProducto', codigo, nombre: r.nombre, sinConexion: r.estado === 'sinConexion' });
  }
  estado({ tipo: 'trabajando', texto: 'Leyendo la tabla nutricional… (la primera vez descarga el lector)' });
  let filas;
  try {
    filas = await leerTabla(archivo, (p) => { const el = document.querySelector('.hoja-cuerpo .tarjeta.centro'); if (el) el.textContent = `⏳ Leyendo la tabla… ${p}%`; });
  } catch (e) { return estado({ tipo: 'error', texto: e.message || 'No se pudo leer la foto.' }); }
  const d = interpretarEtiqueta(filas);
  if (!d.encontro) return estado({ tipo: 'error', texto: 'No pude leer la tabla. Toma la foto de frente, que llene la pantalla y sin reflejos. También puedes escribir los datos a mano.' });
  h.estado = null;
  abrirFormularioProducto(h, d);
}

function abrirFormularioProducto(h, d) {
  const nombre = h.nombre || 'Producto escaneado ' + new Date().toLocaleDateString('es', { day: 'numeric', month: 'short' });
  const t = (v) => (v == null ? '' : fmt(v));
  abrir({ tipo: 'nuevo', tipoComida: h.tipoComida, f: {
    nombre, categoria: 'Productos escaneados', modo: d && d.por100 ? '100' : 'porcion', porcion: d && d.porcion ? fmt(d.porcion) : '100',
    descripcion: d && d.porcion ? `1 porción (${fmt(d.porcion)} g)` : '', calorias: t(d && d.calorias), proteina: t(d && d.proteina),
    carbohidratos: t(d && d.carbohidratos), grasa: t(d && d.grasa), fibra: t(d && d.fibra), deEtiqueta: !!d, codigoBarras: h.codigo || '' } });
}

// ───────────────────────── ¿Qué cocino? ─────────────────────────

const RAPIDOS = ['Huevos', 'Pollo', 'Atún', 'Carne molida', 'Frijoles', 'Queso blanco', 'Yogur', 'Arroz', 'Avena', 'Pan integral', 'Pasta', 'Papa',
  'Plátano', 'Tortilla', 'Tomate', 'Cebolla', 'Lechuga', 'Pepino', 'Zanahoria', 'Brócoli', 'Guineo', 'Manzana', 'Papaya', 'Aguacate', 'Aceite de oliva', 'Maní'];
const VACIAS_DESPENSA = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'con', 'un', 'una', 'unos', 'unas', 'y', 'a', 'al', 'en', 'mi', 'tengo', 'hay', 'algo',
  'poco', 'poca', 'mucho', 'mucha', 'paquete', 'bolsa', 'lata', 'latas', 'kilo', 'libra', 'libras', 'media', 'medio']);

function mejoresIngredientes(texto) {
  const buscadas = palabrasDe(texto).filter((p) => !VACIAS_DESPENSA.has(p) && !Number.isFinite(parseFloat(p))).map(singular);
  if (!buscadas.length) return [];
  const res = [];
  const cocinables = new Set(['Aves', 'Carnes rojas', 'Pescados y mariscos', 'Pastas', 'Legumbres', 'Tubérculos y raíces']);
  for (const a of todos()) {
    const nombre = palabrasDe(a.nombre).map(singular);
    const co = buscadas.filter((b) => nombre.some((w) => w.startsWith(b)));
    if (!co.length) continue;
    const n = a._n;
    let p = co.length / buscadas.length * 10;
    if (co.length === buscadas.length) p += 4;
    if (nombre[0] && nombre[0].startsWith(buscadas[0])) p += 2;
    p -= nombre.length * 0.4;
    if (/cocid|plancha|asad|horno|hervid|natural|fresc|entero/.test(n)) p += 3;
    if (/pechuga|arroz blanco|leche entera|huevo entero|de molde/.test(n)) p += 3;
    if (/molleja|higado|salvaje|evaporad|condensad|ahumad|japones|pita/.test(n)) p -= 3;
    if (/frit|empaniz|nugget|rebozad|sopa|pastel|dulce|jugo|mermelada|helado|galleta|torta|pie |almibar|salsa|pure/.test(n)) p -= 5;
    if (n.includes('crud') && (cocinables.has(a.categoria) || (a.categoria === 'Cereales y granos' && !n.includes('avena')))) p -= 4;
    if (['Comidas preparadas', 'Comida panameña y latina', 'Dulces y snacks', 'Bebidas'].includes(a.categoria)) p -= 3;
    p += Math.min(uso(a.codigo).vecesUsado, 10) * 0.2;
    res.push([a, p]);
  }
  return res.sort((x, y) => y[1] - x[1]).slice(0, 5).map((x) => x[0]);
}

const ingredientes = () => S.despensa.map(alimento).filter(Boolean);
const nombreCorto = (a) => {
  let n = a.nombre.replace(/\(.*$/, '');
  for (const q of [' a la plancha', ' cocidos', ' cocidas', ' cocido', ' cocida', ' crudos', ' crudas', ' crudo', ' cruda', ' hervidos', ' hervido', ' hervida', ' sin piel', ' al horno', ' en hojuelas']) {
    n = n.replace(new RegExp(q, 'i'), '');
  }
  return n.trim().toLowerCase();
};
const PARTE_KCAL = { desayuno: 0.25, almuerzo: 0.35, cena: 0.28, merienda: 0.12 };
const PARTE_PROT = { desayuno: 0.25, almuerzo: 0.35, cena: 0.30, merienda: 0.10 };
const redondearA = (v, paso) => Math.max(Math.round(v / paso) * paso, paso);
const esDeDesayuno = (a) => /avena|pan|tortilla|arepa|cereal|granola|galleta|hojaldra|bollo|tostada/.test(a._n);

function gramosProteina(a, objetivo) {
  let g = objetivo / Math.max(a.proteina / 100, 0.01);
  if (a.categoria === 'Huevos') { const u = Math.max(a.porcion_gramos, 40); return clamp(Math.round(g / u), 1, 3) * u; }
  if (a.categoria === 'Lácteos y alternativas') g = clamp(g, 100, 250);
  else if (a.categoria === 'Suplementos') g = clamp(g, 20, 40);
  else g = clamp(g, 60, 220);
  return redondearA(g, 10);
}

function consejo(tipo, p) {
  if (tipo === 'merienda') return 'Fácil de llevar: déjala lista desde la noche anterior.';
  switch (p && p.categoria) {
    case 'Huevos': return 'Revuelve los huevos con la verdura picada en una sartén con unas gotas de aceite.';
    case 'Aves': case 'Carnes rojas': return 'Sazona con ajo, sal, limón y orégano; cocina a la plancha o al horno. La verdura, salteada o en ensalada.';
    case 'Pescados y mariscos': return 'A la plancha o al horno con limón y ajo, unos 10–15 minutos. Acompaña con la verdura fresca.';
    case 'Legumbres': return 'Sofríe cebolla y ajo, agrega los granos ya cocidos y deja que se mezclen los sabores 5 minutos.';
    case 'Lácteos y alternativas': return 'Sírvelo en un bol con la fruta picada; si tienes avena o granola, agrégala por encima.';
    default: return 'Cocina con poco aceite y prefiere la plancha, el horno o el vapor.';
  }
}

function generarPlatos(tipo, semilla) {
  const lista = ingredientes();
  if (!lista.length) return [];
  const por = { proteina: [], lacteo: [], base: [], verdura: [], fruta: [], grasa: [], otro: [] };
  for (const a of lista) por[rol(a)].push(a);
  const m = metas(), kcal = Math.max(m.calorias, 1200) * PARTE_KCAL[tipo], prot = Math.max(m.proteinaG, 60) * PARTE_PROT[tipo];
  const elegir = (l, k, salto = 1) => (l.length ? l[(semilla + k * salto) % l.length] : null);
  const platos = [], vistos = new Set();
  for (let k = 0; k < 9 && platos.length < 3; k++) {
    let principal = null, base = null, grasa = null, aviso = null;
    const extras = [];
    if (tipo === 'desayuno') {
      const hl = por.proteina.filter((a) => a.categoria === 'Huevos').concat(por.lacteo);
      principal = elegir(hl.length ? hl : por.proteina, k);
      const bd = por.base.filter(esDeDesayuno);
      base = elegir(bd.length ? bd : por.base, k, 2);
      const f = elegir(por.fruta, k); if (f) extras.push(f);
      if (principal && principal.categoria === 'Huevos') { const v = elegir(por.verdura, k); if (v) extras.push(v); }
      if (!principal) aviso = 'Para un desayuno más completo suma huevos, yogur o queso.';
    } else if (tipo === 'almuerzo' || tipo === 'cena') {
      principal = elegir(por.proteina, k) || elegir(por.lacteo, k);
      if (tipo === 'almuerzo' || k % 2 === 0) { const nb = por.base.filter((a) => !esDeDesayuno(a)); base = elegir(nb.length ? nb : por.base, k, 2); }
      if (por.verdura.length) { extras.push(por.verdura[(semilla + k) % por.verdura.length]); if (por.verdura.length > 1) extras.push(por.verdura[(semilla + k + 1) % por.verdura.length]); }
      grasa = elegir(por.grasa, k);
      if (!principal) aviso = 'Te falta una proteína: huevos, pollo, atún, carne, queso o frijoles.';
      else if (!por.verdura.length) aviso = 'Suma alguna verdura (tomate, lechuga, pepino, zanahoria) para más fibra.';
    } else {
      const f = elegir(por.fruta, k); if (f) extras.push(f);
      principal = elegir(por.lacteo, k) || (!extras.length ? elegir(por.proteina.filter((a) => a.categoria === 'Huevos'), k) : null);
      if (!principal) grasa = elegir(por.grasa.filter((a) => a.categoria === 'Frutos secos y semillas'), k);
      if (!extras.length && !principal && !grasa) base = elegir(por.base, k);
    }
    const clave = [principal, base, grasa].map((a) => (a ? a.codigo : '-')).join('|') + extras.map((a) => a.codigo).join(',');
    if ((!principal && !base && !extras.length && !grasa) || vistos.has(clave)) continue;
    vistos.add(clave);
    const items = [];
    if (principal) items.push({ a: principal, g: gramosProteina(principal, tipo === 'merienda' ? prot * 1.5 : prot) });
    for (const e of extras) items.push({ a: e, g: redondearA(rol(e) === 'verdura' ? 100 : clamp(e.porcion_gramos, 80, 180), 10) });
    if (grasa) items.push({ a: grasa, g: redondearA(Math.max(Math.min(grasa.porcion_gramos, 90 * 100 / Math.max(grasa.calorias, 1)), 5), 5) });
    if (base) {
      const usadas = items.reduce((s, it) => s + valores(it.a, it.g).calorias, 0), resto = kcal - usadas;
      const min = Math.max(base.porcion_gramos * 0.5, 20), max = Math.max(Math.min(base.porcion_gramos * 2, 350), min);
      items.push({ a: base, g: redondearA(clamp(resto > 40 ? resto * 100 / Math.max(base.calorias, 1) : min, min, max), 10) });
    }
    const partes = [];
    if (principal) partes.push(nombreCorto(principal));
    if (base) partes.push(nombreCorto(base));
    partes.push(...extras.map(nombreCorto));
    if (grasa && grasa.categoria !== 'Grasas y aceites') partes.push(nombreCorto(grasa));
    const [primero, ...resto] = partes;
    let nombre = primero ? primero[0].toUpperCase() + primero.slice(1) : 'Plato sencillo';
    if (resto.length === 1) nombre += ' con ' + resto[0];
    if (resto.length > 1) nombre += ' con ' + resto.slice(0, -1).join(', ') + ' y ' + resto[resto.length - 1];
    platos.push({ nombre, consejo: consejo(tipo, principal), aviso, items });
  }
  return platos;
}

function faltantes() {
  const roles = new Set(ingredientes().map(rol)), g = [];
  if (!roles.has('proteina') && !roles.has('lacteo')) g.push(['una proteína', ['Huevos', 'Pechuga de pollo', 'Atún en lata', 'Frijoles']]);
  if (!roles.has('verdura')) g.push(['verduras', ['Tomate', 'Lechuga', 'Pepino', 'Zanahoria']]);
  if (!roles.has('fruta')) g.push(['fruta', ['Guineo', 'Papaya', 'Manzana']]);
  return g;
}

let cacheRapidos = {};
function codigoRapido(nombre) {
  if (!(nombre in cacheRapidos)) { const a = mejoresIngredientes(nombre)[0]; cacheRapidos[nombre] = a ? a.codigo : ''; }
  return cacheRapidos[nombre];
}

VISTAS_EXTRA.cocina = function (h) {
  h.tipoPlato = h.tipoPlato || h.tipoComida || 'almuerzo';
  h.semilla = h.semilla || 0;
  const lista = ingredientes(), platos = generarPlatos(h.tipoPlato, h.semilla), pendientes = S.compras.filter((c) => !c.comprado).length;
  const der = `🛒 ${pendientes || ''}`;
  return cabecera('¿Qué cocino?', '‹ Atrás', der, 'abrir-compras') + `<div class="hoja-cuerpo pila">
    <div class="portada fila" style="background:linear-gradient(135deg,#22C47A,#2F8CFF)"><span style="font-size:38px">🧊</span>
      <div><div class="negrita" style="font-size:18px">Cocina con lo que tienes</div><div class="peq" style="opacity:.92">Dime qué hay en tu nevera y alacena; armo platos con la porción justa para tu meta.</div></div></div>
    <div class="tarjeta pila">
      <div class="fila entre"><span class="negrita" style="color:var(--verde)">🧺 Mi despensa (${lista.length})</span>${lista.length ? '<button class="peq" style="color:var(--coral)" data-a="vaciar-despensa">Vaciar</button>' : ''}</div>
      <textarea id="despensa-texto" rows="2" placeholder="Escribe o dicta: pollo, arroz, tomate, huevos…"></textarea>
      <div class="fila entre">${botonDictar('despensa-texto')}<button class="boton chico" data-a="agregar-despensa">＋ Agregar</button></div>
      ${h.noEncontrados && h.noEncontrados.length ? `<div class="mini" style="color:var(--naranja)">No encontré: ${esc(h.noEncontrados.join(', '))}.</div>` : ''}
      ${lista.length ? `<div class="chips">${lista.map((a) => `<button class="chip" style="background:${(COLOR_CATEGORIA[a.categoria] || '#9B5CFF')}22" data-a="quitar-despensa" data-codigo="${a.codigo}">${ICONO_CATEGORIA[a.categoria] || '🍽️'} ${esc(nombreCorto(a))} ✕</button>`).join('')}</div>`
        : '<div class="mini suave">Tu despensa está vacía. Escribe lo que tienes o toca los botones de abajo. Se recuerda para la próxima vez.</div>'}
    </div>
    <div class="tarjeta pila"><div class="peq negrita suave">Agregar rápido</div>
      <div class="chips">${RAPIDOS.map((n) => { const c = codigoRapido(n), tiene = c && S.despensa.includes(c);
        return `<button class="chip ${tiene ? 'sel' : ''}" style="${tiene ? 'background:var(--verde)' : ''}" data-a="rapido-despensa" data-nombre="${esc(n)}">${tiene ? '✓' : '＋'} ${esc(n)}</button>`; }).join('')}</div></div>
    ${lista.length ? faltantes().map(([que, ops]) => `<div class="tarjeta pila" style="gap:8px"><div class="peq"><b style="color:var(--naranja)">🛒 No tienes ${que}.</b> Agrégala a la lista de compras:</div>
      <div class="chips">${ops.map((o) => { const ya = S.compras.some((c) => !c.comprado && c.nombre === o);
        return `<button class="chip" style="${ya ? 'background:var(--naranja);color:#fff' : ''}" data-a="comprar" data-nombre="${esc(o)}">${ya ? '✓' : '🛒'} ${esc(o)}</button>`; }).join('')}</div></div>`).join('') : ''}
    <div class="segmentos">${TIPOS.map((x) => `<button class="${x.id === h.tipoPlato ? 'sel' : ''}" data-a="tipo-plato" data-tipo="${x.id}">${x.nombre}</button>`).join('')}</div>
    ${platos.length ? `<div class="fila entre"><span class="subtitulo" style="margin:0">Ideas para ${tipoInfo(h.tipoPlato).nombre.toLowerCase()}</span><button class="enlace" data-a="otros-platos">🔀 Otras</button></div>
      ${platos.map((p, i) => { const tot = p.items.reduce((s, it) => { const v = valores(it.a, it.g); s.k += v.calorias; s.p += v.proteina; return s; }, { k: 0, p: 0 });
        return `<div class="tarjeta pila" style="gap:8px"><div class="fila entre" style="align-items:flex-start"><span class="negrita">${esc(p.nombre)}</span>
          <span style="text-align:right"><b style="color:var(--verde)">${r0(tot.k)} kcal</b><div class="mini" style="color:var(--proteina)">${r0(tot.p)} g proteína</div></span></div>
          ${p.items.map((it) => `<div class="fila entre peq"><span>${ICONO_CATEGORIA[it.a.categoria] || '🍽️'} ${esc(it.a.nombre)}</span><span class="suave num">${fmt(it.g)} g · ${r0(valores(it.a, it.g).calorias)}</span></div>`).join('')}
          <div class="mini suave">🍳 ${esc(p.consejo)}</div>${p.aviso ? `<div class="mini" style="color:var(--naranja)">💡 ${esc(p.aviso)}</div>` : ''}
          <button class="boton" style="background:${tipoInfo(h.tipoPlato).g}" data-a="registrar-plato" data-i="${i}">Añadir a ${tipoInfo(h.tipoPlato).nombre}</button></div>`; }).join('')}
      <div class="mini tenue">Porciones calculadas para tu meta diaria (${metas().calorias} kcal). Después puedes ajustar los gramos en «Hoy».</div>`
      : `<div class="vacio peq">Agrega ingredientes para ver ideas de ${tipoInfo(h.tipoPlato).nombre.toLowerCase()}.</div>`}
  </div>`;
};

function agregarADespensa(texto) {
  const no = [];
  for (const parte of partesDeFrase(texto.replace(/\./g, ','))) {
    const a = mejoresIngredientes(parte)[0];
    if (!a) { no.push(parte); continue; }
    if (!S.despensa.includes(a.codigo)) S.despensa.push(a.codigo);
  }
  guardar();
  return no;
}

// ───────────────────────── Lista de compras ─────────────────────────

function agregarCompra(nombre) {
  nombre = nombre.trim();
  if (!nombre || S.compras.some((c) => !c.comprado && normalizar(c.nombre) === normalizar(nombre))) return;
  const a = mejoresIngredientes(nombre)[0];
  S.compras.push({ nombre: nombre[0].toUpperCase() + nombre.slice(1), codigoAlimento: a ? a.codigo : '', comprado: false, fecha: iso(new Date()) });
}

VISTAS_EXTRA.compras = function () {
  const pend = S.compras.filter((c) => !c.comprado), comp = S.compras.filter((c) => c.comprado);
  const fila = (c) => { const i = S.compras.indexOf(c); return `<div class="item"><button class="crece fila" style="text-align:left" data-a="marcar-compra" data-i="${i}">
    <span style="font-size:20px">${c.comprado ? '✅' : '⚪️'}</span><span class="nombre" style="${c.comprado ? 'text-decoration:line-through;opacity:.6' : ''}">${esc(c.nombre)}</span></button>
    <button class="tenue" data-a="borrar-compra" data-i="${i}" aria-label="Eliminar">✕</button></div>`; };
  return cabecera('Lista de compras', '‹ Atrás') + `<div class="hoja-cuerpo pila">
    <div class="tarjeta pila"><div class="fila"><input type="text" id="compra-texto" placeholder="Agregar: pollo, tomate, avena…" class="crece"><button class="boton chico" data-a="agregar-compra">＋</button></div>
      <div class="mini suave">Separa varios con comas. Al marcar algo como comprado, pasa a tu despensa de «¿Qué cocino?».</div></div>
    <div class="seccion-t">Por comprar (${pend.length})</div>
    <div class="lista">${pend.length ? pend.map(fila).join('') : '<div class="vacio peq">Nada pendiente 🎉</div>'}</div>
    ${comp.length ? `<div class="seccion-t">Comprado (${comp.length})</div><div class="lista">${comp.map(fila).join('')}</div>
      <button class="boton peligro" data-a="borrar-comprados">Borrar los comprados</button>` : ''}
  </div>`;
};

// ───────────────────────── Accesos en el buscador ─────────────────────────

EXTRA_BUSCADOR.push(
  { a: 'abrir-voz', t: '🎤 Por voz', d: '«2 huevos y una taza de arroz»', g: 'linear-gradient(135deg,#FF4F8B,#9B5CFF)' },
  { a: 'abrir-escaner', t: '🏷️ Escanear', d: 'Código de barras o tabla nutricional', g: 'linear-gradient(135deg,#2F8CFF,#5B5CE6)' },
  { a: 'abrir-cocina', t: '🧊 ¿Qué cocino?', d: 'Ideas con lo que tienes', g: 'linear-gradient(135deg,#22C47A,#16A6A0)' },
  { a: 'abrir-compras', t: '🛒 Compras', d: 'Tu lista del súper', g: 'linear-gradient(135deg,#FF8A3D,#FF5E62)' }
);

// ───────────────────────── Acciones ─────────────────────────

const tipoDeBuscador = () => { const h = hojaActual(); return (h && h.tipoComida) || 'almuerzo'; };

Object.assign(acciones, {
  dictar: (b) => alternarDictado(b),
  'abrir-voz': () => abrir({ tipo: 'voz', tipoComida: tipoDeBuscador(), texto: '', lineas: [] }),
  'interpretar-voz': () => {
    const h = hojaActual(); h.texto = $('#voz-texto').value;
    if (dictadoActivo) dictadoActivo.stop();
    h.lineas = interpretarFrase(h.texto);
    if (!h.lineas.length) aviso('Escribe o dicta lo que comiste');
    pintarHoja();
  },
  'voz-gramos': (b) => { const h = hojaActual(), l = h.lineas[Number(b.dataset.i)]; l.gramos = Math.max(l.gramos + Number(b.dataset.n), 5); pintarHoja(); },
  'voz-agregar': () => {
    const h = hojaActual(); let n = 0;
    for (const l of h.lineas) if (l.incluir && l.elegido) { agregarEntrada(alimento(l.elegido), l.gramos, h.tipoComida, ui.fecha); n++; }
    guardar(); cerrarTodo(); aviso(`${n} ${n === 1 ? 'alimento añadido' : 'alimentos añadidos'}`);
  },

  'abrir-escaner': () => abrir({ tipo: 'escaner', tipoComida: tipoDeBuscador(), alCrear(a) { this.estado = { tipo: 'encontrado', codigo: a.codigo, nuevo: true }; this.gramos = null; } }),
  'escaner-modo': (b) => { const h = hojaActual(); h.modo = b.dataset.v; h.estado = null; pintarHoja(); },
  'escaner-manual': () => abrirFormularioProducto(hojaActual(), null),
  'escaner-gramos': (b) => {
    const h = hojaActual(), a = alimento(h.estado.codigo), g = Math.max((leerNum($('#escaner-g').value) ?? a.porcion_gramos) + Number(b.dataset.n), 1);
    h.gramos = fmt(g); $('#escaner-g').value = h.gramos; $('#escaner-kcal').textContent = r0(valores(a, g).calorias);
  },
  'escaner-agregar': () => {
    const h = hojaActual(), a = alimento(h.estado.codigo), g = leerNum($('#escaner-g').value) ?? a.porcion_gramos;
    if (!(g > 0)) return aviso('Escribe los gramos');
    agregarEntrada(a, g, h.tipoComida, ui.fecha); guardar(); cerrarTodo(); aviso(`Añadido a ${tipoInfo(h.tipoComida).nombre}`);
  },

  'abrir-cocina': () => abrir({ tipo: 'cocina', tipoComida: tipoDeBuscador() }),
  'agregar-despensa': () => {
    const h = hojaActual(), t = $('#despensa-texto').value;
    if (dictadoActivo) dictadoActivo.stop();
    if (!t.trim()) return aviso('Escribe lo que tienes');
    h.noEncontrados = agregarADespensa(t); pintarHoja();
  },
  'rapido-despensa': (b) => {
    const c = codigoRapido(b.dataset.nombre);
    if (!c) return aviso('No lo encontré');
    if (S.despensa.includes(c)) S.despensa = S.despensa.filter((x) => x !== c); else S.despensa.push(c);
    guardar(); pintarHoja();
  },
  'quitar-despensa': (b) => { S.despensa = S.despensa.filter((x) => x !== b.dataset.codigo); guardar(); pintarHoja(); },
  'vaciar-despensa': () => { if (!confirm('¿Vaciar tu despensa?')) return; S.despensa = []; guardar(); pintarHoja(); },
  'tipo-plato': (b) => { hojaActual().tipoPlato = b.dataset.tipo; pintarHoja(); },
  'otros-platos': () => { hojaActual().semilla++; pintarHoja(); },
  'registrar-plato': (b) => {
    const h = hojaActual(), p = generarPlatos(h.tipoPlato, h.semilla)[Number(b.dataset.i)];
    for (const it of p.items) agregarEntrada(it.a, it.g, h.tipoPlato, ui.fecha);
    guardar(); cerrarTodo(); aviso(`«${p.nombre}» añadido a ${tipoInfo(h.tipoPlato).nombre}`);
  },
  comprar: (b) => { agregarCompra(b.dataset.nombre); guardar(); pintarHoja(); },

  'abrir-compras': () => abrir({ tipo: 'compras' }),
  'agregar-compra': () => {
    const t = $('#compra-texto').value;
    for (const p of t.split(/[,\n]/)) agregarCompra(p);
    guardar(); pintarHoja();
    setTimeout(() => { const i = $('#compra-texto'); if (i) i.focus(); }, 50);
  },
  'marcar-compra': (b) => {
    const c = S.compras[Number(b.dataset.i)]; c.comprado = !c.comprado;
    if (c.comprado && c.codigoAlimento && !S.despensa.includes(c.codigoAlimento)) S.despensa.push(c.codigoAlimento);
    guardar(); pintarHoja();
  },
  'borrar-compra': (b) => { S.compras.splice(Number(b.dataset.i), 1); guardar(); pintarHoja(); },
  'borrar-comprados': () => { S.compras = S.compras.filter((c) => !c.comprado); guardar(); pintarHoja(); }
});

document.addEventListener('change', (ev) => {
  const el = ev.target, h = hojaActual();
  if (!h) return;
  if (el.id === 'escaner-foto' && el.files && el.files[0]) { const f = el.files[0]; el.value = ''; procesarEscaneo(f); }
  if (el.dataset.vozElegir != null) {
    const l = h.lineas[Number(el.dataset.vozElegir)]; l.elegido = el.value;
    if (l.gramosFijos == null) l.gramos = r0(l.cantidad * alimento(l.elegido).porcion_gramos);
    pintarHoja();
  }
  if (el.dataset.vozIncluir != null) { h.lineas[Number(el.dataset.vozIncluir)].incluir = el.checked; pintarHoja(); }
});
document.addEventListener('input', (ev) => {
  const h = hojaActual();
  if (h && h.tipo === 'voz' && ev.target.id === 'voz-texto') h.texto = ev.target.value;
  if (h && h.tipo === 'escaner' && ev.target.id === 'escaner-g' && h.estado) {
    h.gramos = ev.target.value; const a = alimento(h.estado.codigo), g = leerNum(h.gramos) || 0;
    $('#escaner-kcal').textContent = r0(valores(a, g).calorias);
  }
});
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter' && ev.target.id === 'compra-texto') { ev.preventDefault(); acciones['agregar-compra'](); }
});
