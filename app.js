/* FitApp Web — fase 1
 * Nutrición diaria, agua, sueño, peso, actividad y respaldo compatible con la app del iPad.
 * Todo se guarda en este teléfono (localStorage). Sin servidores ni cuentas.
 */
'use strict';

// ───────────────────────── Constantes ─────────────────────────

const CLAVE = 'fitapp.datos.v1';

const TIPOS = [
  { id: 'desayuno', nombre: 'Desayuno', articulo: 'el desayuno', icono: '🌅', g: 'linear-gradient(135deg,#FFC233,#FF8A3D)', c: '#FF8A3D' },
  { id: 'almuerzo', nombre: 'Almuerzo', articulo: 'el almuerzo', icono: '☀️', g: 'linear-gradient(135deg,#22C47A,#16A6A0)', c: '#16A97A' },
  { id: 'cena', nombre: 'Cena', articulo: 'la cena', icono: '🌙', g: 'linear-gradient(135deg,#5B5CE6,#9B5CFF)', c: '#7A5CF0' },
  { id: 'merienda', nombre: 'Merienda', articulo: 'la merienda', icono: '🍎', g: 'linear-gradient(135deg,#FF4F8B,#FF8A3D)', c: '#FF4F8B' }
];
const tipoInfo = (id) => TIPOS.find((t) => t.id === id) || TIPOS[1];

const ACTIVIDAD = [
  { id: 'sedentario', nombre: 'Sedentario', f: 1.2 },
  { id: 'ligero', nombre: 'Ligero (1-3 días/semana)', f: 1.375 },
  { id: 'moderado', nombre: 'Moderado (3-5 días/semana)', f: 1.55 },
  { id: 'activo', nombre: 'Activo (6-7 días/semana)', f: 1.725 },
  { id: 'muyActivo', nombre: 'Muy activo (2 veces al día)', f: 1.9 }
];
const OBJETIVOS = [
  { id: 'perderPeso', nombre: 'Perder peso', aj: -500 },
  { id: 'mantener', nombre: 'Mantener peso', aj: 0 },
  { id: 'ganarMasa', nombre: 'Ganar masa', aj: 300 }
];

const ACTIVIDADES_FISICAS = [
  { id: 'caminar', nombre: 'Caminar', icono: '🚶‍♀️', met: 3.5, cat: 'bajo_impacto' },
  { id: 'caminar_rapido', nombre: 'Caminar rápido', icono: '🚶‍♀️', met: 4.8, cat: 'bajo_impacto' },
  { id: 'escaleras', nombre: 'Subir escaleras', icono: '🪜', met: 8.0, cat: 'bajo_impacto' },
  { id: 'correr', nombre: 'Correr / trotar', icono: '🏃‍♀️', met: 8.0, cat: 'peso_corporal' },
  { id: 'bici', nombre: 'Bicicleta', icono: '🚴‍♀️', met: 6.8, cat: 'bajo_impacto' },
  { id: 'fuerza', nombre: 'Pesas / fuerza', icono: '🏋️‍♀️', met: 5.0, cat: 'mancuernas' },
  { id: 'baile', nombre: 'Baile / zumba', icono: '💃', met: 6.5, cat: 'peso_corporal' },
  { id: 'yoga', nombre: 'Yoga / estiramientos', icono: '🧘‍♀️', met: 2.5, cat: 'bajo_impacto' },
  { id: 'natacion', nombre: 'Natación', icono: '🏊‍♀️', met: 6.0, cat: 'bajo_impacto' }
];

const COLOR_CATEGORIA = {
  'Frutas': '#FF4F8B', 'Verduras': '#22C47A', 'Cereales y granos': '#F5A524', 'Panes y panadería': '#E8913A',
  'Pastas': '#F5A524', 'Tubérculos y raíces': '#C98A3B', 'Legumbres': '#B7791F', 'Aves': '#FF8A3D',
  'Carnes rojas': '#FF5E62', 'Pescados y mariscos': '#2F8CFF', 'Huevos': '#FFC233', 'Lácteos y alternativas': '#5BA8FF',
  'Frutos secos y semillas': '#B0793F', 'Grasas y aceites': '#FFC233', 'Bebidas': '#2FB5E8', 'Dulces y snacks': '#FF4F8B',
  'Comidas preparadas': '#9B5CFF', 'Comida panameña y latina': '#FF8A3D', 'Salsas y condimentos': '#E0A100',
  'Suplementos': '#5B5CE6', 'Productos escaneados': '#5B5CE6', 'Mis recetas': '#FF8A3D', 'Personalizados': '#9B5CFF'
};
const ICONO_CATEGORIA = {
  'Frutas': '🍎', 'Verduras': '🥦', 'Cereales y granos': '🌾', 'Panes y panadería': '🍞', 'Pastas': '🍝',
  'Tubérculos y raíces': '🥔', 'Legumbres': '🫘', 'Aves': '🍗', 'Carnes rojas': '🥩', 'Pescados y mariscos': '🐟',
  'Huevos': '🥚', 'Lácteos y alternativas': '🥛', 'Frutos secos y semillas': '🥜', 'Grasas y aceites': '🫒',
  'Bebidas': '🥤', 'Dulces y snacks': '🍪', 'Comidas preparadas': '🍲', 'Comida panameña y latina': '🍛',
  'Salsas y condimentos': '🧂', 'Suplementos': '💪', 'Productos escaneados': '🏷️', 'Mis recetas': '📖', 'Personalizados': '⭐'
};
const CATEGORIAS_NUEVO = ['Personalizados', 'Comidas preparadas', 'Comida panameña y latina', 'Lácteos y alternativas',
  'Cereales y granos', 'Panes y panadería', 'Frutas', 'Verduras', 'Aves', 'Carnes rojas', 'Pescados y mariscos',
  'Dulces y snacks', 'Bebidas', 'Suplementos', 'Productos escaneados'];

// ───────────────────────── Utilidades ─────────────────────────

const $ = (s, r = document) => r.querySelector(s);
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const r0 = (n) => Math.round(Number(n) || 0);
const r1 = (n) => Math.round((Number(n) || 0) * 10) / 10;
const fmt = (n) => { const v = r1(n); return Number.isInteger(v) ? String(v) : String(v).replace('.', ','); };
const leerNum = (t) => { const v = parseFloat(String(t ?? '').replace(',', '.')); return Number.isFinite(v) ? v : null; };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const normalizar = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

function claveFecha(d = new Date()) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
function fechaDeClave(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); }
function sumarDias(k, n) { const d = fechaDeClave(k); d.setDate(d.getDate() + n); return claveFecha(d); }
/** ISO 8601 sin milisegundos (lo que entiende la app del iPad). */
const iso = (d) => new Date(d).toISOString().replace(/\.\d{3}Z$/, 'Z');
function textoFecha(k) {
  const hoy = claveFecha();
  if (k === hoy) return 'Hoy';
  if (k === sumarDias(hoy, -1)) return 'Ayer';
  if (k === sumarDias(hoy, 1)) return 'Mañana';
  return fechaDeClave(k).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'short' });
}

let temporizadorAviso;
function aviso(t) {
  const el = $('#aviso');
  el.textContent = t;
  el.hidden = false;
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => { el.hidden = true; }, 2600);
}

// ───────────────────────── Datos ─────────────────────────

function estadoVacio() {
  return {
    version: 1, perfil: null, dias: {}, alimentosPersonalizados: [], uso: {}, comidasGuardadas: [],
    medidas: [], sesiones: [], series: [], plan: [], compras: [], recordatorios: [], despensa: []
  };
}

function cargar() {
  try {
    const t = localStorage.getItem(CLAVE);
    if (!t) return estadoVacio();
    return Object.assign(estadoVacio(), JSON.parse(t));
  } catch (e) {
    console.error(e);
    return estadoVacio();
  }
}

let S = cargar();
let ALIMENTOS = [];

function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(S));
  } catch (e) {
    aviso('No se pudo guardar: el almacenamiento está lleno.');
  }
}

function dia(k, crear = false) {
  let d = S.dias[k];
  if (!d && crear) {
    d = { pesoKg: null, aguaMl: 0, pasos: 0, caloriasActivas: 0, caloriasEntrenamiento: 0, horasSueno: 0,
      metaDelDia: metas().calorias, notas: '', entradas: [] };
    S.dias[k] = d;
  }
  return d;
}

// ───────────────────────── Motor calórico (Mifflin-St Jeor) ─────────────────────────

function edad(p) {
  const n = new Date(p.fechaNacimiento), h = new Date();
  let e = h.getFullYear() - n.getFullYear();
  if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) e--;
  return e;
}
const minimas = (sexo) => (sexo === 'masculino' ? 1500 : 1200);

function calcularMetas(p) {
  if (!p || !(p.pesoActualKg > 0) || !(p.alturaCm > 0)) {
    return { tmb: 0, tdee: 0, calorias: 1800, proteinaG: 100, carbohidratosG: 200, grasaG: 55, aguaMl: 2000 };
  }
  const base = 10 * p.pesoActualKg + 6.25 * p.alturaCm - 5 * edad(p);
  const tmb = p.sexo === 'masculino' ? base + 5 : base - 161;
  const tdee = tmb * (ACTIVIDAD.find((a) => a.id === p.nivelActividad) || ACTIVIDAD[0]).f;
  let ajuste = 0;
  if (p.objetivo === 'perderPeso') ajuste = -Math.min(500, tdee * 0.25);
  if (p.objetivo === 'ganarMasa') ajuste = 300;
  const recomendadas = Math.max(Math.round((tdee + ajuste) / 10) * 10, minimas(p.sexo));
  const calorias = p.metaManual > 0 ? p.metaManual : recomendadas;
  const gkg = p.objetivo === 'mantener' ? 1.4 : 1.8;
  const proteinaG = Math.min(p.pesoActualKg * gkg, calorias * 0.35 / 4);
  const grasaG = calorias * 0.27 / 9;
  const carbohidratosG = Math.max((calorias - proteinaG * 4 - grasaG * 9) / 4, 0);
  return {
    tmb: r0(tmb), tdee: r0(tdee), recomendadas, calorias,
    proteinaG: r0(proteinaG), carbohidratosG: r0(carbohidratosG), grasaG: r0(grasaG),
    aguaMl: Math.round(p.pesoActualKg * 35 / 50) * 50
  };
}
const metas = () => calcularMetas(S.perfil);

function aplicarMetas() {
  if (!S.perfil) return;
  const m = calcularMetas(S.perfil);
  Object.assign(S.perfil, {
    metaCaloricaDiaria: m.calorias, metaProteinaG: m.proteinaG, metaCarbohidratosG: m.carbohidratosG,
    metaGrasaG: m.grasaG, metaAguaMl: m.aguaMl
  });
  const hoy = dia(claveFecha());
  if (hoy) hoy.metaDelDia = m.calorias;
}

// ───────────────────────── Alimentos ─────────────────────────

function personalizadoABase(a) {
  return {
    codigo: a.codigo, nombre: a.nombre, categoria: a.categoria || 'Personalizados',
    porcion_gramos: a.porcionGramos || 100, descripcion_porcion: a.descripcionPorcion || '100 g',
    calorias: a.calorias100g || 0, proteina: a.proteina100g || 0, carbohidratos: a.carbohidratos100g || 0,
    grasa: a.grasa100g || 0, fibra: a.fibra100g || 0, personal: true, codigoBarras: a.codigoBarras || ''
  };
}

let cacheTodos = null;
function todos() {
  if (!cacheTodos) {
    cacheTodos = S.alimentosPersonalizados.map(personalizadoABase).concat(ALIMENTOS);
    for (const a of cacheTodos) a._n = normalizar(a.nombre);
  }
  return cacheTodos;
}
const alimento = (codigo) => todos().find((a) => a.codigo === codigo);
const uso = (codigo) => S.uso[codigo] || { esFavorito: false, vecesUsado: 0 };

function valores(a, gramos) {
  const f = (Number(gramos) || 0) / 100;
  return { calorias: a.calorias * f, proteina: a.proteina * f, carbohidratos: a.carbohidratos * f, grasa: a.grasa * f };
}

function buscar(texto) {
  const palabras = normalizar(texto).split(/[^a-z0-9ñ]+/).filter(Boolean);
  if (!palabras.length) return [];
  const resultado = [];
  for (const a of todos()) {
    const nombre = a._n.split(/[^a-z0-9ñ]+/);
    let ok = true;
    for (const p of palabras) {
      const sing = p.length > 3 && p.endsWith('s') ? p.slice(0, -1) : p;
      if (!nombre.some((w) => w.startsWith(sing)) && !a._n.includes(p)) { ok = false; break; }
    }
    if (!ok) continue;
    let puntos = 0;
    if (a._n.startsWith(palabras[0])) puntos += 5;
    if (nombre[0] && nombre[0].startsWith(palabras[0])) puntos += 3;
    puntos -= nombre.length * 0.3;
    puntos += Math.min(uso(a.codigo).vecesUsado, 20) * 0.4;
    if (uso(a.codigo).esFavorito) puntos += 3;
    if (a.personal) puntos += 1;
    if (/frit|empaniz|nugget|rebozad/.test(a._n)) puntos -= 2;
    if (/cocid|hervid|plancha|entero|natural/.test(a._n)) puntos += 1;
    resultado.push([a, puntos]);
  }
  return resultado.sort((x, y) => y[1] - x[1]).slice(0, 60).map((x) => x[0]);
}

/** Tipo de ingrediente, para las medidas con la mano. */
function rol(a) {
  const cal = Math.max(a.calorias, 1);
  const pP = a.proteina * 4 / cal, pC = a.carbohidratos * 4 / cal, pG = a.grasa * 9 / cal;
  switch (a.categoria) {
    case 'Huevos': case 'Aves': case 'Carnes rojas': case 'Pescados y mariscos': case 'Legumbres': return 'proteina';
    case 'Lácteos y alternativas': return 'lacteo';
    case 'Cereales y granos': case 'Panes y panadería': case 'Pastas': case 'Tubérculos y raíces': return 'base';
    case 'Verduras': return 'verdura';
    case 'Frutas': return pG > 0.6 ? 'grasa' : 'fruta';
    case 'Grasas y aceites': case 'Frutos secos y semillas': return 'grasa';
    default:
      if (pP >= 0.35 && a.proteina >= 8) return 'proteina';
      if (pC >= 0.6) return 'base';
      if (pG >= 0.6) return 'grasa';
      return 'otro';
  }
}

function medidasMano(a) {
  const n = normalizar(a.nombre);
  const M = (e, nombre, g) => ({ e, nombre, g });
  switch (rol(a)) {
    case 'proteina':
      if (a.categoria === 'Huevos') return [];
      if (a.categoria === 'Legumbres') return [M('✊', '½ puño', 75), M('✊', '1 puño', 150)];
      return [M('✋', '1 palma', 100), M('✋', '1½ palma', 150), M('✋', '2 palmas', 200)];
    case 'lacteo':
      return n.includes('queso') ? [M('👍', '2 pulgares', 30), M('👍', '4 pulgares', 60)] : [M('✊', '1 puño', 200)];
    case 'base':
      if (n.includes('crud') || n.includes('hojuela')) return [M('🤲', '1 puñado', 40)];
      if (a.categoria === 'Panes y panadería') return [];
      return [M('✊', '½ puño', 75), M('✊', '1 puño', 150)];
    case 'verdura': return [M('✊', '1 puño', 80), M('✊', '2 puños', 160)];
    case 'fruta': return [M('✊', '1 puño', 150)];
    case 'grasa':
      if (a.categoria === 'Frutos secos y semillas') return [M('🤲', '1 puñado', 30)];
      if (a.categoria === 'Frutas') return [M('👍', '2 pulgares', 50)];
      return [M('👍', '½ pulgar', 7), M('👍', '1 pulgar', 14)];
    default: return [];
  }
}

// ───────────────────────── Registro de comidas ─────────────────────────

function horaPara(k) {
  if (k === claveFecha()) return iso(new Date());
  const d = fechaDeClave(k); d.setHours(12); return iso(d);
}

function agregarEntrada(a, gramos, tipo, k) {
  const v = valores(a, gramos);
  dia(k, true).entradas.push({
    id: uid(), codigoAlimento: a.codigo, nombre: a.nombre, gramos: r1(gramos), tipo, fechaHora: horaPara(k),
    calorias: r1(v.calorias), proteina: r1(v.proteina), carbohidratos: r1(v.carbohidratos), grasa: r1(v.grasa)
  });
  const u = uso(a.codigo);
  S.uso[a.codigo] = { esFavorito: u.esFavorito, vecesUsado: u.vecesUsado + 1 };
}

function copiarEntrada(e, k) {
  const a = e.codigoAlimento ? alimento(e.codigoAlimento) : null;
  if (a) return agregarEntrada(a, e.gramos, e.tipo, k);
  dia(k, true).entradas.push(Object.assign({}, e, { id: uid(), fechaHora: horaPara(k) }));
}

function totales(d) {
  const t = { calorias: 0, proteina: 0, carbohidratos: 0, grasa: 0 };
  if (!d) return t;
  for (const e of d.entradas) { t.calorias += e.calorias; t.proteina += e.proteina; t.carbohidratos += e.carbohidratos; t.grasa += e.grasa; }
  return t;
}
const quemadas = (d) => (d ? (d.caloriasEntrenamiento || 0) + (d.caloriasActivas || 0) : 0);
const entradasDe = (d, tipo) => (d ? d.entradas.filter((e) => e.tipo === tipo) : []);

// ───────────────────────── Estado de pantalla ─────────────────────────

const ui = { tab: 'hoy', fecha: claveFecha() };
const VISTAS_EXTRA = {};   // hojas que agregan otros módulos (entrenar.js)
const EXTRA_PROGRESO = [];  // tarjetas extra en Progreso
const EXTRA_BUSCADOR = [];   // acciones rápidas extra en el buscador
let pila = [];   // hojas abiertas (la última es la visible)

function abrir(hoja) { pila.push(hoja); pintarHoja(); }
function cerrar() { pila.pop(); pintarHoja(); pintar(); }
function cerrarTodo() { pila = []; pintarHoja(); pintar(); }
const hojaActual = () => pila[pila.length - 1];

// ───────────────────────── Componentes ─────────────────────────

function anillo(progreso, tam = 140, grosor = 13, color = '#fff', fondo = 'rgba(255,255,255,0.25)') {
  const r = (tam - grosor) / 2, c = 2 * Math.PI * r, p = clamp(progreso, 0, 1);
  return `<svg width="${tam}" height="${tam}" viewBox="0 0 ${tam} ${tam}">
    <circle cx="${tam / 2}" cy="${tam / 2}" r="${r}" fill="none" stroke="${fondo}" stroke-width="${grosor}"/>
    <circle cx="${tam / 2}" cy="${tam / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${grosor}"
      stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p)}"/></svg>`;
}

function bloques(v) {
  const b = (valor, t, color) => `<div class="bloque" style="background:${color}22;color:${color}"><b>${valor}</b><span>${t}</span></div>`;
  return `<div class="bloques">${b(r0(v.calorias), 'kcal', '#22C47A')}${b(fmt(v.proteina), 'proteína', '#FF5E7E')}${b(fmt(v.carbohidratos), 'carbos', '#F5A524')}${b(fmt(v.grasa), 'grasa', '#3DA5FF')}</div>`;
}

function filaAlimento(a, accion = 'detalle', extra = '') {
  const color = COLOR_CATEGORIA[a.categoria] || '#9B5CFF';
  const fav = uso(a.codigo).esFavorito ? ' ⭐' : '';
  return `<button class="item" data-a="${accion}" data-codigo="${esc(a.codigo)}" ${extra}>
    <span class="punto" style="background:${color}22">${ICONO_CATEGORIA[a.categoria] || '🍽️'}</span>
    <span class="crece"><div class="nombre">${esc(a.nombre)}${fav}</div>
      <div class="mini suave">${r0(a.calorias * a.porcion_gramos / 100)} kcal · ${esc(a.descripcion_porcion)} · P ${fmt(a.proteina * a.porcion_gramos / 100)} g</div></span>
    <span class="tenue">›</span></button>`;
}

function grafica(puntos, { alto = 160, color = '#2F8CFF', meta = null, barras = false, etiquetas = [] } = {}) {
  if (!puntos.length) return '<div class="vacio peq">Sin datos todavía</div>';
  const W = 320, H = alto, pad = { l: 40, r: 8, t: 12, b: 22 };
  const vals = puntos.map((p) => p.y).concat(meta != null ? [meta] : []);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (barras) min = 0;
  if (max - min < 1) { max += 1; min -= barras ? 0 : 1; }
  const rango = max - min; min -= barras ? 0 : rango * 0.1; max += rango * 0.1;
  const X = (i) => pad.l + (puntos.length === 1 ? (W - pad.l - pad.r) / 2 : i * (W - pad.l - pad.r) / (puntos.length - 1));
  const Y = (v) => pad.t + (1 - (v - min) / (max - min)) * (H - pad.t - pad.b);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
  for (let i = 0; i <= 3; i++) {
    const v = min + (max - min) * i / 3, y = Y(v);
    s += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y}" y2="${y}" stroke="currentColor" stroke-opacity="0.08"/>`;
    s += `<text x="${pad.l - 6}" y="${y + 3}" text-anchor="end">${max - min > 20 ? r0(v) : fmt(v)}</text>`;
  }
  if (barras) {
    const ancho = Math.max((W - pad.l - pad.r) / puntos.length - 8, 6);
    const xb = (i) => pad.l + i * (W - pad.l - pad.r) / puntos.length + 4;
    puntos.forEach((p, i) => {
      s += `<rect x="${xb(i)}" y="${Y(p.y)}" width="${ancho}" height="${Math.max(Y(min) - Y(p.y), 0)}" rx="5" fill="${p.color || color}"/>`;
      if (etiquetas[i]) s += `<text x="${xb(i) + ancho / 2}" y="${H - 6}" text-anchor="middle">${esc(etiquetas[i])}</text>`;
    });
  } else {
    const d = puntos.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ');
    s += `<path d="${d}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
    puntos.forEach((p, i) => { s += `<circle cx="${X(i)}" cy="${Y(p.y)}" r="3.5" fill="${color}"/>`; });
    if (etiquetas.length) {
      [0, puntos.length - 1].forEach((i) => { if (etiquetas[i]) s += `<text x="${X(i)}" y="${H - 6}" text-anchor="${i ? 'end' : 'start'}">${esc(etiquetas[i])}</text>`; });
    }
  }
  if (meta != null) {
    s += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${Y(meta)}" y2="${Y(meta)}" stroke="#22C47A" stroke-width="1.5" stroke-dasharray="5 4"/>`;
  }
  return `<div class="grafica">${s}</svg></div>`;
}

// ───────────────────────── Pantallas principales ─────────────────────────

function pintar() {
  const app = $('#app');
  if (!S.perfil) { app.innerHTML = pantallaBienvenida(); return; }
  const pantallas = { hoy: pantallaHoy, entrenar: () => (window.pantallaEntrenar ? window.pantallaEntrenar() : ''), progreso: pantallaProgreso, perfil: pantallaPerfil };
  const contenido = (pantallas[ui.tab] || pantallaHoy)();
  app.innerHTML = contenido + barraTabs();
}

function barraTabs() {
  const t = (id, ico, nombre) => `<button class="tab ${ui.tab === id ? 'activa' : ''}" data-a="tab" data-tab="${id}"><span class="ico">${ico}</span>${nombre}</button>`;
  return `<nav class="tabs">${t('hoy', '🍽️', 'Hoy')}${t('entrenar', '🏋️', 'Entrenar')}${t('progreso', '📈', 'Progreso')}${t('perfil', '👤', 'Perfil')}</nav>`;
}

function pantallaBienvenida() {
  return `<div class="pantalla pila">
    <div class="portada" style="margin-top:20px">
      <div style="font-size:44px">💪🥗</div>
      <div class="titulo-grande" style="margin:8px 0 6px">FitApp</div>
      <div>Tu diario de comidas, agua, sueño, peso y ejercicio. Funciona sin internet y tus datos se quedan en tu teléfono.</div>
    </div>
    <button class="boton" data-a="abrir-perfil">Crear mi perfil</button>
    <button class="boton secundario" data-a="importar">📥 Importar respaldo de la app del iPad</button>
    <p class="peq suave centro">Si ya usas FitApp en el iPad: allá ve a Perfil → Copia de seguridad, guárdala en iCloud Drive y luego impórtala aquí.</p>
  </div>`;
}

function pantallaHoy() {
  const k = ui.fecha, d = dia(k), m = metas();
  const meta = d && d.metaDelDia > 0 ? d.metaDelDia : m.calorias;
  const t = totales(d), q = quemadas(d);
  const restantes = r0(meta + q - t.calorias);
  const progreso = (meta + q) > 0 ? t.calorias / (meta + q) : 0;
  const ayer = dia(sumarDias(k, -1));
  const macro = (nombre, valor, objetivo) => `<div class="macro"><div class="mini">${nombre}</div>
    <div class="num"><b>${r0(valor)}</b><span class="mini"> / ${objetivo} g</span></div>
    <div class="barra"><i style="width:${clamp(objetivo ? valor / objetivo * 100 : 0, 0, 100)}%"></i></div></div>`;

  let html = `<div class="pantalla pila">
    <div class="portada">
      <div class="navfecha">
        <button data-a="dia" data-n="-1" aria-label="Día anterior">‹</button>
        <span class="fecha">${esc(textoFecha(k))}</span>
        <button data-a="dia" data-n="1" aria-label="Día siguiente">›</button>
      </div>
      <div class="anillo-wrap">
        <div class="anillo">${anillo(progreso)}
          <div class="centro-anillo"><span class="grande num">${Math.abs(restantes)}</span>
          <span class="mini">${restantes >= 0 ? 'kcal restantes' : 'kcal de más'}</span></div></div>
        <div class="datos-portada">
          <div class="dato"><div class="mini">Meta</div><b class="num">${meta}</b> <span class="mini">kcal</span></div>
          <div class="dato"><div class="mini">Comidas</div><b class="num">${r0(t.calorias)}</b> <span class="mini">kcal</span></div>
          <div class="dato"><div class="mini">Ejercicio</div><b class="num">${r0(q)}</b> <span class="mini">kcal</span></div>
        </div>
      </div>
      <div class="macros">${macro('Proteína', t.proteina, m.proteinaG)}${macro('Carbos', t.carbohidratos, m.carbohidratosG)}${macro('Grasa', t.grasa, m.grasaG)}</div>
    </div>`;

  if ((!d || !d.entradas.length) && ayer && ayer.entradas.length) {
    html += `<button class="boton" style="background:linear-gradient(135deg,#FF8A3D,#FF4F8B)" data-a="copiar-ayer">📋 Copiar todas las comidas de ayer (${r0(totales(ayer).calorias)} kcal)</button>`;
  }

  for (const tipo of TIPOS) {
    const lista = entradasDe(d, tipo.id);
    const kcal = lista.reduce((s, e) => s + e.calorias, 0);
    const delAyer = entradasDe(ayer, tipo.id);
    html += `<div class="tarjeta">
      <div class="comida-cab">
        <div class="icono-caja" style="background:${tipo.g}">${tipo.icono}</div>
        <div class="crece"><div class="negrita">${tipo.nombre}</div>
          <div class="peq suave">${lista.length ? `${r0(kcal)} kcal · ${lista.length} ${lista.length === 1 ? 'alimento' : 'alimentos'}` : 'Sin registrar'}</div></div>
        ${lista.length ? `<button class="circulo" style="font-size:16px" data-a="guardar-comida" data-tipo="${tipo.id}" aria-label="Guardar como comida frecuente">🔖</button>` : ''}
        <button class="circulo" style="background:${tipo.g};color:#fff" data-a="buscador" data-tipo="${tipo.id}" aria-label="Añadir">+</button>
      </div>`;
    if (lista.length) {
      html += '<div style="margin-top:8px">';
      for (const e of lista) {
        html += `<div class="entrada"><button class="crece" style="text-align:left" data-a="editar-entrada" data-id="${e.id}">
          <div class="nombre">${esc(e.nombre)}</div><div class="mini suave">${fmt(e.gramos)} g · P ${fmt(e.proteina)} · C ${fmt(e.carbohidratos)} · G ${fmt(e.grasa)}</div></button>
          <span class="num negrita">${r0(e.calorias)}</span>
          <button class="circulo" style="width:32px;height:32px;font-size:15px" data-a="borrar-entrada" data-id="${e.id}" aria-label="Eliminar">✕</button></div>`;
      }
      html += '</div>';
    } else if (delAyer.length) {
      const kAyer = r0(delAyer.reduce((s, e) => s + e.calorias, 0));
      html += `<button class="chip-accion" style="margin-top:10px;background:${tipo.c}1f;color:${tipo.c}" data-a="repetir" data-tipo="${tipo.id}">↩︎ Repetir ${tipo.nombre.toLowerCase()} de ayer · ${kAyer} kcal</button>`;
    }
    html += '</div>';
  }

  const agua = d ? d.aguaMl : 0, sueno = d ? d.horasSueno : 0;
  html += `<div class="cuadricula">
    <div class="mini-tarjeta"><div class="fila entre"><span class="negrita">💧 Agua</span><span class="mini suave">${m.aguaMl} ml</span></div>
      <div class="valor num">${agua} <span class="peq suave">ml</span></div>
      <div class="barra clara"><i style="background:#2FB5E8;width:${clamp(agua / m.aguaMl * 100, 0, 100)}%"></i></div>
      <div class="controles"><button class="circulo" data-a="agua" data-n="-250">−</button><button class="boton chico crece" style="background:linear-gradient(135deg,#2FB5E8,#2F8CFF)" data-a="agua" data-n="250">+ 1 vaso</button></div></div>
    <div class="mini-tarjeta"><div class="fila entre"><span class="negrita">😴 Sueño</span><span class="mini suave">meta 7–9 h</span></div>
      <div class="valor num">${fmt(sueno)} <span class="peq suave">h</span></div>
      <div class="barra clara"><i style="background:#7A5CF0;width:${clamp(sueno / 8 * 100, 0, 100)}%"></i></div>
      <div class="controles"><button class="circulo" data-a="sueno" data-n="-0.5">−</button><button class="boton chico crece" style="background:linear-gradient(135deg,#5B5CE6,#9B5CFF)" data-a="sueno" data-n="0.5">${sueno ? '+ 30 min' : 'Dormí 7 h'}</button></div></div>
    <div class="mini-tarjeta"><div class="negrita">⚖️ Peso</div>
      <div class="valor num">${d && d.pesoKg ? fmt(d.pesoKg) : fmt(S.perfil.pesoActualKg)} <span class="peq suave">kg</span></div>
      <div class="mini suave">${d && d.pesoKg ? 'Registrado este día' : 'Último registrado'}</div>
      <button class="boton chico" style="background:linear-gradient(135deg,#FF8A3D,#FF4F8B)" data-a="abrir-peso">Registrar peso</button></div>
    <div class="mini-tarjeta"><div class="negrita">🔥 Ejercicio</div>
      <div class="valor num">${r0(q)} <span class="peq suave">kcal</span></div>
      <div class="mini suave">${sesionesDe(k).length ? sesionesDe(k).map((s) => esc(s.nombre)).join(', ') : 'Nada registrado'}</div>
      <button class="boton chico" data-a="abrir-actividad">Registrar actividad</button></div>
  </div>`;
  return html + '</div>';
}

function sesionesDe(k) {
  return S.sesiones.filter((s) => claveFecha(new Date(s.fecha)) === k);
}

function pantallaProgreso() {
  const hoy = claveFecha(), m = metas();
  // Peso: últimos 30 días (días con peso + medidas)
  const pesos = [];
  for (let i = 29; i >= 0; i--) {
    const k = sumarDias(hoy, -i), d = dia(k);
    if (d && d.pesoKg) pesos.push({ k, y: d.pesoKg });
  }
  // Calorías: últimos 7 días
  const semana = [], etiquetas = [];
  for (let i = 6; i >= 0; i--) {
    const k = sumarDias(hoy, -i), d = dia(k), kcal = totales(d).calorias;
    const meta = d && d.metaDelDia > 0 ? d.metaDelDia : m.calorias;
    semana.push({ y: r0(kcal), color: kcal > meta + 100 ? '#FF5E62' : '#F5A524', meta, registrado: !!(d && d.entradas.length) });
    etiquetas.push(fechaDeClave(k).toLocaleDateString('es', { weekday: 'narrow' }));
  }
  const conComida = semana.filter((x) => x.registrado);
  const promedio = conComida.length ? r0(conComida.reduce((s, x) => s + x.y, 0) / conComida.length) : 0;
  const enMeta = conComida.filter((x) => x.y <= x.meta + 100 && x.y >= x.meta * 0.7).length;
  // Racha de días registrados
  let racha = 0;
  for (let i = 0; i < 365; i++) {
    const d = dia(sumarDias(hoy, -i));
    if (d && d.entradas.length) racha++; else if (i > 0) break;
  }
  let suenoTotal = 0, suenoDias = 0, aguaTotal = 0, aguaDias = 0;
  for (let i = 0; i < 7; i++) {
    const d = dia(sumarDias(hoy, -i));
    if (d && d.horasSueno > 0) { suenoTotal += d.horasSueno; suenoDias++; }
    if (d && d.aguaMl > 0) { aguaTotal += d.aguaMl; aguaDias++; }
  }
  const cambio = pesos.length >= 2 ? pesos[pesos.length - 1].y - pesos[0].y : null;

  return `<div class="pantalla pila">
    <div class="titulo-grande">Progreso</div>
    <div class="cuadricula">
      <div class="mini-tarjeta"><span class="mini suave">Racha</span><span class="valor">🔥 ${racha}</span><span class="mini suave">días registrando</span></div>
      <div class="mini-tarjeta"><span class="mini suave">Días en meta (7)</span><span class="valor">🎯 ${enMeta}/7</span><span class="mini suave">promedio ${promedio} kcal</span></div>
      <div class="mini-tarjeta"><span class="mini suave">Sueño promedio</span><span class="valor">😴 ${suenoDias ? fmt(suenoTotal / suenoDias) : '—'} h</span></div>
      <div class="mini-tarjeta"><span class="mini suave">Agua promedio</span><span class="valor">💧 ${aguaDias ? r0(aguaTotal / aguaDias) : '—'}</span><span class="mini suave">de ${m.aguaMl} ml</span></div>
    </div>
    <div class="tarjeta"><h3>⚖️ Peso · 30 días</h3>
      ${pesos.length >= 2 ? grafica(pesos, { color: '#2F8CFF', etiquetas: pesos.map((p) => fechaDeClave(p.k).toLocaleDateString('es', { day: 'numeric', month: 'short' })) }) : '<div class="vacio peq">Registra tu peso al menos 2 veces para ver la gráfica.</div>'}
      ${cambio != null ? `<div class="fila entre peq"><span class="suave">Cambio</span><b>${cambio > 0 ? '+' : ''}${fmt(cambio)} kg</b></div>` : ''}
      ${S.perfil.pesoObjetivoKg ? `<div class="fila entre peq"><span class="suave">Objetivo</span><b>${fmt(S.perfil.pesoObjetivoKg)} kg</b></div>` : ''}
    </div>
    <div class="tarjeta"><h3>🔥 Calorías · 7 días</h3>
      ${grafica(semana, { barras: true, meta: m.calorias, etiquetas })}
      <div class="mini suave">Línea verde: tu meta (${m.calorias} kcal). Barras rojas: días por encima de la meta.</div>
    </div>
    ${EXTRA_PROGRESO.map((f) => f()).join('')}
    ${consejosSemana(promedio, conComida.length, suenoDias ? suenoTotal / suenoDias : 0, aguaDias ? aguaTotal / aguaDias : 0, m)}
  </div>`;
}

function consejosSemana(promedio, diasReg, sueno, agua, m) {
  const lista = [];
  if (diasReg < 5) lista.push(['📝', 'Registra al menos 5 días', `Llevas ${diasReg} de 7. Usa «Repetir de ayer» o tus comidas frecuentes para hacerlo en segundos.`]);
  if (diasReg && promedio > m.calorias + 150) lista.push(['➖', 'Recorta unas 150 kcal al día', `Promediaste ${promedio} kcal y tu meta es ${m.calorias}. Cambia una merienda o una bebida azucarada.`]);
  if (diasReg && promedio < m.calorias * 0.75) lista.push(['⚠️', 'Estás comiendo muy poco', 'Comer muy por debajo de la meta quita energía y masa muscular.']);
  if (sueno && sueno < 7) lista.push(['🛏️', 'Acuéstate 30 minutos antes', `Dormiste ${fmt(sueno)} h en promedio. Dormir poco aumenta el hambre.`]);
  if (agua < m.aguaMl * 0.7) lista.push(['💧', 'Un vaso de agua con cada comida', `Promedias ${r0(agua)} ml de ${m.aguaMl}.`]);
  if (!lista.length) lista.push(['⭐', '¡Vas muy bien!', 'Sigue así esta semana.']);
  return `<div class="subtitulo">Pequeños ajustes</div>` + lista.slice(0, 4).map(([e, t, d]) =>
    `<div class="tarjeta fila" style="align-items:flex-start"><div class="icono-caja" style="background:var(--principal)">${e}</div><div><div class="negrita">${t}</div><div class="peq suave">${d}</div></div></div>`).join('');
}

function pantallaPerfil() {
  const p = S.perfil, m = metas();
  const ultimo = localStorage.getItem('fitapp.ultimoRespaldo');
  return `<div class="pantalla pila">
    <div class="titulo-grande">Perfil</div>
    <div class="portada">
      <div style="font-size:22px;font-weight:800">${esc(p.nombre || 'Mi perfil')}</div>
      <div class="peq" style="opacity:.92">${edad(p)} años · ${fmt(p.alturaCm)} cm · ${fmt(p.pesoActualKg)} kg · ${esc((OBJETIVOS.find((o) => o.id === p.objetivo) || OBJETIVOS[0]).nombre)}</div>
      <div class="macros"><div class="macro"><div class="mini">Meta diaria</div><b>${m.calorias}</b> <span class="mini">kcal</span></div>
        <div class="macro"><div class="mini">TMB</div><b>${m.tmb}</b></div><div class="macro"><div class="mini">Gasto (TDEE)</div><b>${m.tdee}</b></div></div>
    </div>
    <button class="boton" data-a="abrir-perfil">✏️ Editar perfil y metas</button>
    <div class="tarjeta pila">
      <h3>💾 Copia de seguridad</h3>
      <div class="peq suave">Tus datos viven solo en este teléfono. Guarda una copia en Archivos / iCloud Drive cada semana. El archivo es el mismo formato que la app del iPad: puedes pasar tus datos de uno a otro.</div>
      <div class="peq negrita" style="color:${ultimo ? 'var(--verde)' : 'var(--naranja)'}">${ultimo ? 'Último respaldo: ' + new Date(Number(ultimo)).toLocaleString('es') : 'Aún no has hecho ningún respaldo.'}</div>
      <label class="fila peq"><input type="checkbox" id="respaldo-fotos" ${localStorage.getItem('fitapp.respaldoFotos') !== '0' ? 'checked' : ''}> Incluir fotos de progreso</label>
      <button class="boton" style="background:linear-gradient(135deg,#2F8CFF,#5B5CE6)" data-a="exportar">⬆️ Guardar respaldo</button>
      <button class="boton secundario" data-a="importar">⬇️ Restaurar / importar desde archivo</button>
    </div>
    <div class="tarjeta pila">
      <h3>📲 Usar como app</h3>
      <div class="peq suave">En Safari toca <b>Compartir</b> → <b>Añadir a pantalla de inicio</b>. Se abre a pantalla completa y funciona sin internet.</div>
    </div>
    <button class="boton peligro" data-a="borrar-todo">Borrar todos mis datos de este teléfono</button>
    <div class="mini tenue centro">FitApp Web · v1.4 · sin anuncios, sin cuentas</div>
  </div>`;
}

// ───────────────────────── Hojas ─────────────────────────

function pintarHoja() {
  const cont = $('#modal');
  const h = hojaActual();
  document.body.style.overflow = h ? 'hidden' : '';
  if (!h) { cont.innerHTML = ''; return; }
  const vistas = { ...VISTAS_EXTRA, buscador: hojaBuscador, detalle: hojaDetalle, nuevo: hojaNuevo, perfil: hojaPerfil, peso: hojaPeso,
    actividad: hojaActividad, guardarComida: hojaGuardarComida };
  const animar = !h._visto; h._visto = true;
  const scroll = cont.firstElementChild && !animar ? cont.firstElementChild.scrollTop : 0;
  cont.innerHTML = `<div class="hoja ${h.clase || ''} ${animar ? 'animar' : ''}">${vistas[h.tipo](h)}</div>`;
  if (scroll) cont.firstElementChild.scrollTop = scroll;
  if (h.alPintar) h.alPintar();
  if (h.tipo === 'buscador') { pintarResultados(); }
  const enfocar = cont.querySelector('[data-enfocar]');
  if (enfocar && h.tipo !== 'buscador') setTimeout(() => enfocar.focus(), 50);
}

function cabecera(titulo, izq = 'Cerrar', der = '', accionDer = '') {
  return `<div class="hoja-cab"><button data-a="cerrar">${izq}</button><h2>${esc(titulo)}</h2>
    ${der ? `<button data-a="${accionDer}" class="negrita">${der}</button>` : '<span style="min-width:64px"></span>'}</div>`;
}

// Buscador
function hojaBuscador(h) {
  const t = tipoInfo(h.tipoComida);
  return `<div class="cab-buscador">${cabecera('Añadir a ' + t.nombre)}
    <div class="buscar"><input type="search" id="q" placeholder="Buscar alimento (ej. arroz, pollo, guineo)" value="${esc(h.texto || '')}" autocomplete="off" autocorrect="off" spellcheck="false"></div></div>
    <div class="hoja-cuerpo" style="padding-top:8px"><div id="resultados"></div></div>`;
}

function habituales(tipo) {
  const conteo = {};
  const desde = sumarDias(claveFecha(), -60);
  for (const [k, d] of Object.entries(S.dias)) {
    if (k < desde) continue;
    for (const e of d.entradas) if (e.tipo === tipo && e.codigoAlimento) conteo[e.codigoAlimento] = (conteo[e.codigoAlimento] || 0) + 1;
  }
  return Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([c]) => alimento(c)).filter(Boolean);
}

function pintarResultados() {
  const h = hojaActual();
  if (!h || h.tipo !== 'buscador') return;
  const cont = $('#resultados');
  const texto = h.texto || '';
  let html = '';
  if (texto.trim()) {
    const lista = buscar(texto);
    html += lista.length ? `<div class="lista">${lista.map((a) => filaAlimento(a)).join('')}</div>`
      : `<div class="vacio">No encontré «${esc(texto)}».</div>`;
    html += `<button class="boton secundario" style="margin-top:12px" data-a="abrir-nuevo">➕ Crear «${esc(texto)}» como alimento</button>`;
  } else {
    html += `<div class="acciones-rapidas" style="margin-top:4px">
      <button class="accion-r" style="background:linear-gradient(135deg,#9B5CFF,#FF4F8B)" data-a="abrir-nuevo"><b>➕ Nuevo alimento</b><span>Con los datos de la etiqueta</span></button>
      ${EXTRA_BUSCADOR.map((x) => `<button class="accion-r" style="background:${x.g}" data-a="${x.a}"><b>${x.t}</b><span>${x.d}</span></button>`).join('')}
    </div>`;
    const frecuentes = S.comidasGuardadas.filter((c) => c.items && c.items.length)
      .sort((a, b) => (b.vecesUsada || 0) - (a.vecesUsada || 0));
    if (frecuentes.length) {
      html += `<div class="seccion-t">Mis comidas frecuentes</div><div class="lista">` + frecuentes.map((c, i) =>
        `<div class="item"><button class="crece fila" style="text-align:left" data-a="usar-comida" data-i="${S.comidasGuardadas.indexOf(c)}">
          <span class="punto" style="background:${tipoInfo(c.tipo).c}22">🔖</span>
          <span class="crece"><div class="nombre">${esc(c.nombre)}</div><div class="mini suave">${r0(c.calorias)} kcal · ${c.items.length} alimentos</div></span></button>
          <button class="tenue" data-a="borrar-comida" data-i="${S.comidasGuardadas.indexOf(c)}" aria-label="Eliminar">✕</button></div>`).join('') + '</div>';
    }
    const hab = habituales(h.tipoComida);
    if (hab.length) html += `<div class="seccion-t">Lo que sueles comer en ${tipoInfo(h.tipoComida).articulo}</div><div class="lista">${hab.map((a) => filaAlimento(a)).join('')}</div>`;
    const favs = todos().filter((a) => uso(a.codigo).esFavorito);
    if (favs.length) html += `<div class="seccion-t">Favoritos</div><div class="lista">${favs.map((a) => filaAlimento(a)).join('')}</div>`;
    const mios = todos().filter((a) => a.personal);
    if (mios.length) html += `<div class="seccion-t">Mis alimentos</div><div class="lista">${mios.map((a) => filaAlimento(a)).join('')}</div>`;
    if (!frecuentes.length && !hab.length && !favs.length) {
      html += `<div class="vacio peq">Escribe arriba para buscar. Lo que más uses aparecerá aquí.</div>`;
    }
  }
  cont.innerHTML = html;
}

// Detalle de un alimento (añadir o editar)
function hojaDetalle(h) {
  const a = alimento(h.codigo) || h.alimentoSuelto;
  const t = tipoInfo(h.tipoComida);
  const g = leerNum(h.gramos) ?? 0;
  const manos = medidasMano(a);
  return cabecera(h.entradaId ? 'Editar' : 'Añadir', h.entradaId ? 'Cancelar' : '‹ Atrás') + `<div class="hoja-cuerpo pila">
    <div class="tarjeta">
      <div class="fila"><span class="punto" style="background:${(COLOR_CATEGORIA[a.categoria] || '#9B5CFF')}22;width:46px;height:46px;font-size:24px">${ICONO_CATEGORIA[a.categoria] || '🍽️'}</span>
        <div class="crece"><div class="negrita" style="font-size:18px">${esc(a.nombre)}</div><div class="peq suave">${esc(a.categoria)} · ${esc(a.descripcion_porcion)} = ${fmt(a.porcion_gramos)} g</div></div>
        ${h.codigo ? `<button class="circulo" data-a="favorito" data-codigo="${esc(a.codigo)}" aria-label="Favorito">${uso(a.codigo).esFavorito ? '⭐' : '☆'}</button>` : ''}</div>
    </div>
    <div class="tarjeta pila">
      <div class="etiqueta">¿Cuánto?</div>
      <div class="numerico"><button class="circulo" data-a="gramos" data-n="-10">−</button>
        <input type="text" inputmode="decimal" id="gramos" value="${esc(h.gramos)}" data-enfocar>
        <span class="unidad">g</span><button class="circulo" data-a="gramos" data-n="10">+</button></div>
      <div class="chips">${[0.5, 1, 1.5, 2].map((n) => `<button class="chip" data-a="porciones" data-n="${n}">${fmt(n)} × ${esc(a.descripcion_porcion)}</button>`).join('')}</div>
      ${manos.length ? `<div class="etiqueta">Sin balanza, con tu mano:</div><div class="manos">${manos.map((x) =>
        `<button class="mano" data-a="mano" data-g="${x.g}"><div class="e">${x.e}</div><div class="mini negrita">${x.nombre}</div><div class="mini suave">${x.g} g</div></button>`).join('')}</div>` : ''}
      <div id="vista-valores">${bloques(valores(a, g))}</div>
    </div>
    <div class="tarjeta pila"><div class="etiqueta">Comida</div>
      <div class="segmentos rejilla">${TIPOS.map((x) => `<button class="${x.id === h.tipoComida ? 'sel' : ''}" data-a="tipo-detalle" data-tipo="${x.id}">${x.icono} ${x.nombre}</button>`).join('')}</div></div>
    <button class="boton" style="background:${t.g}" data-a="confirmar-detalle" id="btn-confirmar">${h.entradaId ? 'Guardar cambios' : 'Añadir a ' + t.nombre} · <span id="kcal-btn">${r0(valores(a, g).calorias)}</span> kcal</button>
  </div>`;
}

function refrescarDetalle() {
  const h = hojaActual();
  const a = alimento(h.codigo) || h.alimentoSuelto;
  const g = leerNum(h.gramos) ?? 0;
  const v = valores(a, g);
  $('#vista-valores').innerHTML = bloques(v);
  $('#kcal-btn').textContent = r0(v.calorias);
  $('#btn-confirmar').disabled = !(g > 0);
}

// Nuevo alimento
function hojaNuevo(h) {
  const f = h.f;
  const campo = (id, titulo, unidad, ph = '0') => `<div class="campo"><label for="n-${id}">${titulo}</label>
    <div class="numerico"><input type="text" inputmode="decimal" id="n-${id}" data-campo="${id}" value="${esc(f[id])}" placeholder="${ph}"><span class="unidad">${unidad}</span></div></div>`;
  return cabecera('Nuevo alimento', 'Cancelar', 'Guardar', 'guardar-nuevo') + `<div class="hoja-cuerpo pila">
    ${f.deEtiqueta ? '<div class="tarjeta peq negrita" style="color:var(--violeta)">🔎 Valores leídos de la etiqueta. Revísalos con el empaque antes de guardar.</div>' : ''}
    ${f.codigoBarras ? `<div class="mini suave">🏷️ Código ${esc(f.codigoBarras)}: la próxima vez se reconocerá al escanearlo.</div>` : ''}
    <div class="tarjeta pila">
      <div class="campo"><label for="n-nombre">Nombre</label><input type="text" id="n-nombre" data-campo="nombre" value="${esc(f.nombre)}" placeholder="Ej.: Yogur griego de la tienda" data-enfocar></div>
      <div class="campo"><label for="n-cat">Categoría</label><select id="n-cat" data-campo="categoria">${CATEGORIAS_NUEVO.map((c) => `<option ${c === f.categoria ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
    </div>
    <div class="tarjeta pila">
      <div class="etiqueta">Los valores de la etiqueta son</div>
      <div class="segmentos"><button class="${f.modo === 'porcion' ? 'sel' : ''}" data-a="modo-nuevo" data-modo="porcion">Por porción</button><button class="${f.modo === '100' ? 'sel' : ''}" data-a="modo-nuevo" data-modo="100">Por 100 g</button></div>
      ${campo('porcion', 'Tamaño de la porción', 'g', '100')}
      <div class="campo"><label for="n-desc">Descripción de la porción</label><input type="text" id="n-desc" data-campo="descripcion" value="${esc(f.descripcion)}" placeholder="1 taza, 1 unidad, 2 galletas…"></div>
    </div>
    <div class="tarjeta pila">
      ${campo('calorias', 'Calorías', 'kcal')}${campo('proteina', 'Proteína', 'g')}${campo('carbohidratos', 'Carbohidratos', 'g')}${campo('grasa', 'Grasa', 'g')}${campo('fibra', 'Fibra (opcional)', 'g')}
    </div>
    <div id="error-nuevo" class="peq negrita" style="color:var(--coral)"></div>
    <button class="boton" data-a="guardar-nuevo">Guardar alimento</button>
  </div>`;
}

function validarNuevo(f) {
  const nombre = (f.nombre || '').trim();
  if (!nombre) return 'Escribe el nombre del alimento.';
  const porcion = leerNum(f.porcion) ?? 100;
  if (!(porcion > 0 && porcion <= 2000)) return 'La porción debe estar entre 1 y 2000 g.';
  const kcal = leerNum(f.calorias);
  if (kcal == null || kcal < 0) return 'Escribe las calorías.';
  const base = f.modo === '100' ? 100 : porcion;
  const macros = (leerNum(f.proteina) || 0) + (leerNum(f.carbohidratos) || 0) + (leerNum(f.grasa) || 0);
  if (macros > base * 1.05) return 'Proteína + carbohidratos + grasa pesan más que la porción. Revisa los números.';
  if (kcal * 100 / base > 950) return 'Las calorías son demasiado altas para esa cantidad. Revisa los números.';
  return null;
}

// Perfil
function hojaPerfil(h) {
  const f = h.f, m = calcularMetas(perfilDesdeFormulario(f) || S.perfil);
  return cabecera(S.perfil ? 'Editar perfil' : 'Crear perfil', S.perfil ? 'Cancelar' : '‹ Atrás', 'Guardar', 'guardar-perfil') + `<div class="hoja-cuerpo pila">
    <div class="tarjeta pila">
      <div class="campo"><label for="p-nombre">Nombre</label><input type="text" id="p-nombre" data-campo="nombre" value="${esc(f.nombre)}" placeholder="Tu nombre"></div>
      <div class="campo"><span class="etiqueta">Sexo (para la fórmula)</span><div class="segmentos">
        <button class="${f.sexo === 'femenino' ? 'sel' : ''}" data-a="campo-perfil" data-campo="sexo" data-v="femenino">Mujer</button>
        <button class="${f.sexo === 'masculino' ? 'sel' : ''}" data-a="campo-perfil" data-campo="sexo" data-v="masculino">Hombre</button></div></div>
      <div class="campo"><label for="p-nac">Fecha de nacimiento</label><input type="date" id="p-nac" data-campo="nacimiento" value="${esc(f.nacimiento)}"></div>
      <div class="cuadricula">
        <div class="campo"><label for="p-alt">Altura (cm)</label><input type="text" inputmode="decimal" id="p-alt" data-campo="altura" value="${esc(f.altura)}" placeholder="165"></div>
        <div class="campo"><label for="p-peso">Peso actual (kg)</label><input type="text" inputmode="decimal" id="p-peso" data-campo="peso" value="${esc(f.peso)}" placeholder="70"></div>
        <div class="campo"><label for="p-obj">Peso objetivo (kg)</label><input type="text" inputmode="decimal" id="p-obj" data-campo="objetivoKg" value="${esc(f.objetivoKg)}" placeholder="62"></div>
      </div>
    </div>
    <div class="tarjeta pila">
      <div class="campo"><label for="p-act">Actividad</label><select id="p-act" data-campo="actividad">${ACTIVIDAD.map((a) => `<option value="${a.id}" ${a.id === f.actividad ? 'selected' : ''}>${esc(a.nombre)}</option>`).join('')}</select></div>
      <div class="campo"><span class="etiqueta">Objetivo</span><div class="segmentos">${OBJETIVOS.map((o) =>
        `<button class="${o.id === f.objetivo ? 'sel' : ''}" data-a="campo-perfil" data-campo="objetivo" data-v="${o.id}">${o.nombre.replace(' peso', '')}</button>`).join('')}</div></div>
    </div>
    <div class="tarjeta pila">
      <h3>🎯 Meta de calorías</h3>
      <div class="peq suave">Recomendada: <b id="p-recomendada">${m.recomendadas || m.calorias}</b> kcal (Mifflin-St Jeor). Puedes poner la tuya.</div>
      <div class="segmentos"><button class="${!f.manual ? 'sel' : ''}" data-a="campo-perfil" data-campo="manual" data-v="">Recomendada</button><button class="${f.manual ? 'sel' : ''}" data-a="campo-perfil" data-campo="manual" data-v="1">Elegir la mía</button></div>
      ${f.manual ? `<div class="numerico"><button class="circulo" data-a="meta-manual" data-n="-50">−</button><input type="text" inputmode="numeric" id="p-meta" data-campo="metaManual" value="${esc(f.metaManual)}"><span class="unidad">kcal</span><button class="circulo" data-a="meta-manual" data-n="50">+</button></div>` : ''}
    </div>
    <div id="error-perfil" class="peq negrita" style="color:var(--coral)"></div>
    <button class="boton" data-a="guardar-perfil">Guardar</button>
  </div>`;
}

function formularioPerfil() {
  const p = S.perfil;
  if (!p) return { nombre: '', sexo: 'femenino', nacimiento: '1990-01-01', altura: '', peso: '', objetivoKg: '', actividad: 'ligero', objetivo: 'perderPeso', manual: false, metaManual: '' };
  return { nombre: p.nombre, sexo: p.sexo, nacimiento: claveFecha(new Date(p.fechaNacimiento)), altura: fmt(p.alturaCm), peso: fmt(p.pesoActualKg),
    objetivoKg: p.pesoObjetivoKg ? fmt(p.pesoObjetivoKg) : '', actividad: p.nivelActividad, objetivo: p.objetivo,
    manual: p.metaManual > 0, metaManual: p.metaManual > 0 ? String(p.metaManual) : String(calcularMetas(Object.assign({}, p, { metaManual: 0 })).calorias) };
}

function perfilDesdeFormulario(f) {
  const altura = leerNum(f.altura), peso = leerNum(f.peso);
  if (!(altura > 0) || !(peso > 0) || !f.nacimiento) return null;
  return {
    nombre: (f.nombre || '').trim(), sexo: f.sexo, fechaNacimiento: iso(fechaDeClave(f.nacimiento)), alturaCm: altura,
    pesoActualKg: peso, pesoObjetivoKg: leerNum(f.objetivoKg) || peso, nivelActividad: f.actividad, objetivo: f.objetivo,
    metaManual: f.manual ? r0(leerNum(f.metaManual) || 0) : 0
  };
}

// Peso
function hojaPeso(h) {
  return cabecera('Registrar peso', 'Cancelar', 'Guardar', 'guardar-peso') + `<div class="hoja-cuerpo pila">
    <div class="tarjeta pila"><div class="etiqueta">${esc(textoFecha(ui.fecha))}</div>
      <div class="numerico"><button class="circulo" data-a="ajustar-peso" data-n="-0.1">−</button>
        <input type="text" inputmode="decimal" id="peso" value="${esc(h.valor)}" data-enfocar><span class="unidad">kg</span>
        <button class="circulo" data-a="ajustar-peso" data-n="0.1">+</button></div>
      <div class="peq suave">En ayunas, después de ir al baño. Tu meta de calorías se recalcula con el peso nuevo.</div></div>
    <button class="boton" data-a="guardar-peso">Guardar peso</button></div>`;
}

// Actividad
function hojaActividad(h) {
  const act = ACTIVIDADES_FISICAS.find((a) => a.id === h.act) || ACTIVIDADES_FISICAS[0];
  const min = leerNum(h.minutos) || 0;
  const kcal = r0(act.met * S.perfil.pesoActualKg * min / 60);
  return cabecera('Registrar actividad', 'Cancelar') + `<div class="hoja-cuerpo pila">
    <div class="tarjeta pila"><div class="etiqueta">¿Qué hiciste?</div>
      <div class="chips">${ACTIVIDADES_FISICAS.map((a) => `<button class="chip ${a.id === act.id ? 'sel' : ''}" data-a="elegir-actividad" data-id="${a.id}">${a.icono} ${a.nombre}</button>`).join('')}</div></div>
    <div class="tarjeta pila"><div class="etiqueta">Minutos</div>
      <div class="numerico"><button class="circulo" data-a="minutos" data-n="-5">−</button>
        <input type="text" inputmode="numeric" id="minutos" value="${esc(h.minutos)}"><span class="unidad">min</span>
        <button class="circulo" data-a="minutos" data-n="5">+</button></div>
      <div class="peq suave">≈ <b id="kcal-act">${kcal}</b> kcal quemadas (según tu peso).</div></div>
    <button class="boton" data-a="guardar-actividad">Guardar actividad</button>
    ${sesionesDe(ui.fecha).length ? `<div class="seccion-t">Registradas este día</div><div class="lista">${sesionesDe(ui.fecha).map((s) =>
      `<div class="item"><span class="crece"><div class="nombre">${esc(s.nombre)}</div><div class="mini suave">${r0(s.minutos)} min · ${r0(s.calorias)} kcal</div></span>
       <button class="tenue" data-a="borrar-sesion" data-fecha="${esc(s.fecha)}" data-nombre="${esc(s.nombre)}">✕</button></div>`).join('')}</div>` : ''}
  </div>`;
}

function hojaGuardarComida(h) {
  const t = tipoInfo(h.tipoComida);
  return cabecera('Comida frecuente', 'Cancelar', 'Guardar', 'confirmar-guardar-comida') + `<div class="hoja-cuerpo pila">
    <div class="tarjeta pila"><div class="peq suave">Guarda tu ${t.nombre.toLowerCase()} de este día para añadirlo con un toque la próxima vez.</div>
      <div class="campo"><label for="nombre-comida">Nombre</label><input type="text" id="nombre-comida" value="${esc(h.nombre)}" data-enfocar></div></div>
    <button class="boton" data-a="confirmar-guardar-comida">Guardar</button></div>`;
}

// ───────────────────────── Respaldo (compatible con la app del iPad) ─────────────────────────

function crearRespaldo() {
  const p = S.perfil, m = metas();
  const registros = Object.entries(S.dias).map(([k, d]) => ({
    fecha: iso(fechaDeClave(k)), pesoKg: d.pesoKg ?? null, aguaMl: r0(d.aguaMl), pasos: r0(d.pasos),
    caloriasActivas: Number(d.caloriasActivas) || 0, caloriasEntrenamiento: Number(d.caloriasEntrenamiento) || 0,
    horasSueno: Number(d.horasSueno) || 0, metaDelDia: r0(d.metaDelDia), notas: d.notas || '',
    entradas: d.entradas.map((e) => ({ codigoAlimento: e.codigoAlimento || null, nombre: e.nombre, gramos: Number(e.gramos) || 0,
      tipo: e.tipo, fechaHora: e.fechaHora, calorias: Number(e.calorias) || 0, proteina: Number(e.proteina) || 0,
      carbohidratos: Number(e.carbohidratos) || 0, grasa: Number(e.grasa) || 0 }))
  }));
  return {
    version: 1, fecha: iso(new Date()),
    perfil: p ? {
      nombre: p.nombre || '', fechaNacimiento: p.fechaNacimiento, sexo: p.sexo, alturaCm: Number(p.alturaCm), pesoActualKg: Number(p.pesoActualKg),
      pesoObjetivoKg: Number(p.pesoObjetivoKg || p.pesoActualKg), nivelActividad: p.nivelActividad, objetivo: p.objetivo,
      metaCaloricaDiaria: m.calorias, metaProteinaG: m.proteinaG, metaCarbohidratosG: m.carbohidratosG, metaGrasaG: m.grasaG,
      metaAguaMl: m.aguaMl, metaManual: r0(p.metaManual), fechaCreacion: p.fechaCreacion || iso(new Date())
    } : null,
    registros,
    alimentosPersonalizados: S.alimentosPersonalizados.map((a) => Object.assign({}, a, {
      esFavorito: uso(a.codigo).esFavorito, vecesUsado: r0(uso(a.codigo).vecesUsado), codigoBarras: a.codigoBarras || '' })),
    usoAlimentos: Object.entries(S.uso).filter(([c]) => !S.alimentosPersonalizados.some((a) => a.codigo === c))
      .map(([codigo, u]) => ({ codigo, esFavorito: !!u.esFavorito, vecesUsado: r0(u.vecesUsado) })),
    comidasGuardadas: S.comidasGuardadas.map((c) => ({ nombre: c.nombre, tipo: c.tipo, items: c.items, calorias: Number(c.calorias) || 0, vecesUsada: r0(c.vecesUsada) })),
    medidas: S.medidas, sesiones: S.sesiones, series: S.series, plan: S.plan, compras: S.compras,
    recordatorios: S.recordatorios, fotos: [], despensa: S.despensa
  };
}

function leerRespaldo(r) {
  if (!r || !Array.isArray(r.registros)) throw new Error('Este archivo no es un respaldo de FitApp.');
  const nuevo = estadoVacio();
  if (r.perfil) {
    const p = r.perfil;
    nuevo.perfil = { nombre: p.nombre, fechaNacimiento: p.fechaNacimiento, sexo: p.sexo, alturaCm: p.alturaCm,
      pesoActualKg: p.pesoActualKg, pesoObjetivoKg: p.pesoObjetivoKg, nivelActividad: p.nivelActividad, objetivo: p.objetivo,
      metaManual: p.metaManual || 0, fechaCreacion: p.fechaCreacion };
  }
  for (const d of r.registros) {
    const k = claveFecha(new Date(d.fecha));
    nuevo.dias[k] = { pesoKg: d.pesoKg ?? null, aguaMl: d.aguaMl || 0, pasos: d.pasos || 0, caloriasActivas: d.caloriasActivas || 0,
      caloriasEntrenamiento: d.caloriasEntrenamiento || 0, horasSueno: d.horasSueno || 0, metaDelDia: d.metaDelDia || 0, notas: d.notas || '',
      entradas: (d.entradas || []).map((e) => Object.assign({ id: uid() }, e)) };
  }
  nuevo.alimentosPersonalizados = (r.alimentosPersonalizados || []).map((a) => {
    nuevo.uso[a.codigo] = { esFavorito: !!a.esFavorito, vecesUsado: a.vecesUsado || 0 };
    return a;
  });
  for (const u of r.usoAlimentos || []) nuevo.uso[u.codigo] = { esFavorito: !!u.esFavorito, vecesUsado: u.vecesUsado || 0 };
  for (const campo of ['comidasGuardadas', 'medidas', 'sesiones', 'series', 'plan', 'compras', 'recordatorios', 'despensa']) {
    nuevo[campo] = Array.isArray(r[campo]) ? r[campo] : [];
  }
  return nuevo;
}

async function exportar() {
  const respaldo = crearRespaldo();
  if (window.fotosParaRespaldo && localStorage.getItem('fitapp.respaldoFotos') !== '0') respaldo.fotos = await window.fotosParaRespaldo();
  const datos = JSON.stringify(respaldo);
  const nombre = `FitApp-respaldo-${claveFecha()}.json`;
  const archivo = new File([datos], nombre, { type: 'application/json' });
  localStorage.setItem('fitapp.ultimoRespaldo', String(Date.now()));
  try {
    if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
      await navigator.share({ files: [archivo], title: 'Respaldo FitApp' });
      aviso('Elige «Guardar en Archivos» para conservarlo.');
      pintar();
      return;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return;
  }
  const url = URL.createObjectURL(archivo);
  const a = document.createElement('a');
  a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  aviso('Respaldo descargado.');
  pintar();
}

// ───────────────────────── Acciones ─────────────────────────

const acciones = {
  tab: (b) => { ui.tab = b.dataset.tab; window.scrollTo(0, 0); pintar(); },
  dia: (b) => { ui.fecha = sumarDias(ui.fecha, Number(b.dataset.n)); pintar(); },
  cerrar: () => cerrar(),

  buscador: (b) => abrir({ tipo: 'buscador', texto: '', tipoComida: b.dataset.tipo }),
  'enfocar-busqueda': () => $('#q') && $('#q').focus(),
  detalle: (b) => {
    const a = alimento(b.dataset.codigo);
    const h = hojaActual();
    abrir({ tipo: 'detalle', codigo: a.codigo, tipoComida: h.tipoComida, gramos: fmt(a.porcion_gramos) });
  },
  favorito: (b) => {
    const u = uso(b.dataset.codigo);
    S.uso[b.dataset.codigo] = { esFavorito: !u.esFavorito, vecesUsado: u.vecesUsado };
    guardar(); cacheTodos = null; pintarHoja();
  },
  gramos: (b) => { const h = hojaActual(); h.gramos = fmt(Math.max((leerNum(h.gramos) || 0) + Number(b.dataset.n), 0)); $('#gramos').value = h.gramos; refrescarDetalle(); },
  porciones: (b) => { const h = hojaActual(); const a = alimento(h.codigo) || h.alimentoSuelto; h.gramos = fmt(a.porcion_gramos * Number(b.dataset.n)); $('#gramos').value = h.gramos; refrescarDetalle(); },
  mano: (b) => { const h = hojaActual(); h.gramos = b.dataset.g; $('#gramos').value = h.gramos; refrescarDetalle(); },
  'tipo-detalle': (b) => { hojaActual().tipoComida = b.dataset.tipo; pintarHoja(); },
  'confirmar-detalle': () => {
    const h = hojaActual(), g = leerNum(h.gramos);
    if (!(g > 0)) return;
    const a = alimento(h.codigo) || h.alimentoSuelto;
    if (h.entradaId) {
      const d = dia(ui.fecha), e = d.entradas.find((x) => x.id === h.entradaId);
      if (e) {
        const v = a.calorias != null ? valores(a, g) : null;
        e.gramos = r1(g); e.tipo = h.tipoComida;
        if (v) Object.assign(e, { calorias: r1(v.calorias), proteina: r1(v.proteina), carbohidratos: r1(v.carbohidratos), grasa: r1(v.grasa) });
      }
      guardar(); cerrarTodo(); aviso('Cambios guardados');
      return;
    }
    agregarEntrada(a, g, h.tipoComida, ui.fecha);
    guardar(); cerrarTodo(); aviso(`Añadido a ${tipoInfo(h.tipoComida).nombre}`);
  },
  'editar-entrada': (b) => {
    const e = dia(ui.fecha).entradas.find((x) => x.id === b.dataset.id);
    if (!e) return;
    let a = e.codigoAlimento ? alimento(e.codigoAlimento) : null;
    if (!a) {
      const f = 100 / Math.max(e.gramos, 1);
      a = { codigo: '', nombre: e.nombre, categoria: 'Personalizados', porcion_gramos: e.gramos, descripcion_porcion: `${fmt(e.gramos)} g`,
        calorias: e.calorias * f, proteina: e.proteina * f, carbohidratos: e.carbohidratos * f, grasa: e.grasa * f, fibra: 0 };
    }
    abrir({ tipo: 'detalle', codigo: e.codigoAlimento && alimento(e.codigoAlimento) ? e.codigoAlimento : '', alimentoSuelto: a,
      tipoComida: e.tipo, gramos: fmt(e.gramos), entradaId: e.id });
  },
  'borrar-entrada': (b) => {
    const d = dia(ui.fecha);
    d.entradas = d.entradas.filter((x) => x.id !== b.dataset.id);
    guardar(); pintar(); aviso('Eliminado');
  },
  repetir: (b) => {
    for (const e of entradasDe(dia(sumarDias(ui.fecha, -1)), b.dataset.tipo)) copiarEntrada(e, ui.fecha);
    guardar(); pintar(); aviso('Listo: copiado de ayer');
  },
  'copiar-ayer': () => {
    for (const e of dia(sumarDias(ui.fecha, -1)).entradas) copiarEntrada(e, ui.fecha);
    guardar(); pintar(); aviso('Día de ayer copiado');
  },

  // Comidas frecuentes
  'guardar-comida': (b) => abrir({ tipo: 'guardarComida', tipoComida: b.dataset.tipo, nombre: `Mi ${tipoInfo(b.dataset.tipo).nombre.toLowerCase()}` }),
  'confirmar-guardar-comida': () => {
    const h = hojaActual(), nombre = ($('#nombre-comida').value || '').trim();
    if (!nombre) return aviso('Escribe un nombre');
    const lista = entradasDe(dia(ui.fecha), h.tipoComida);
    S.comidasGuardadas.push({ nombre, tipo: h.tipoComida, items: lista.map((e) => ({ codigoAlimento: e.codigoAlimento || '', nombre: e.nombre, gramos: e.gramos })),
      calorias: r0(lista.reduce((s, e) => s + e.calorias, 0)), vecesUsada: 0 });
    guardar(); cerrar(); aviso('Comida frecuente guardada');
  },
  'usar-comida': (b) => {
    const c = S.comidasGuardadas[Number(b.dataset.i)], h = hojaActual();
    let faltan = 0;
    for (const it of c.items) {
      const a = alimento(it.codigoAlimento);
      if (a) agregarEntrada(a, it.gramos, h.tipoComida, ui.fecha); else faltan++;
    }
    c.vecesUsada = (c.vecesUsada || 0) + 1;
    guardar(); cerrarTodo(); aviso(faltan ? `Añadido (${faltan} alimento no encontrado)` : `«${c.nombre}» añadido`);
  },
  'borrar-comida': (b) => {
    if (!confirm('¿Eliminar esta comida frecuente?')) return;
    S.comidasGuardadas.splice(Number(b.dataset.i), 1); guardar(); pintarResultados();
  },

  // Nuevo alimento
  'abrir-nuevo': () => {
    const h = hojaActual();
    abrir({ tipo: 'nuevo', tipoComida: h ? h.tipoComida : 'almuerzo',
      f: { nombre: h && h.texto ? h.texto : '', categoria: 'Personalizados', modo: 'porcion', porcion: '100', descripcion: '', calorias: '', proteina: '', carbohidratos: '', grasa: '', fibra: '' } });
  },
  'modo-nuevo': (b) => { hojaActual().f.modo = b.dataset.modo; pintarHoja(); },
  'guardar-nuevo': () => {
    const h = hojaActual(), f = h.f, error = validarNuevo(f);
    if (error) { $('#error-nuevo').textContent = error; return; }
    const porcion = leerNum(f.porcion) || 100, base = f.modo === '100' ? 100 : porcion, k = 100 / base;
    let nombre = f.nombre.trim();
    if (todos().some((a) => normalizar(a.nombre) === normalizar(nombre))) nombre += ` (${new Date().toLocaleDateString('es', { day: 'numeric', month: 'short' })})`;
    const nuevo = {
      codigo: 'custom-' + uid(), nombre, categoria: f.categoria, porcionGramos: porcion,
      descripcionPorcion: (f.descripcion || '').trim() || `${fmt(porcion)} g`,
      calorias100g: r1((leerNum(f.calorias) || 0) * k), proteina100g: r1((leerNum(f.proteina) || 0) * k),
      carbohidratos100g: r1((leerNum(f.carbohidratos) || 0) * k), grasa100g: r1((leerNum(f.grasa) || 0) * k),
      fibra100g: r1((leerNum(f.fibra) || 0) * k), esFavorito: false, vecesUsado: 0, codigoBarras: f.codigoBarras || ''
    };
    S.alimentosPersonalizados.push(nuevo);
    cacheTodos = null; guardar();
    pila.pop();
    const a = alimento(nuevo.codigo);
    if (hojaActual() && hojaActual().alCrear) { hojaActual().alCrear(a); pintarHoja(); aviso('Alimento guardado'); return; }
    if (hojaActual() && hojaActual().tipo === 'buscador') {
      abrir({ tipo: 'detalle', codigo: a.codigo, tipoComida: h.tipoComida, gramos: fmt(a.porcion_gramos) });
    } else { pintarHoja(); pintar(); }
    aviso('Alimento guardado');
  },

  // Perfil
  'abrir-perfil': () => abrir({ tipo: 'perfil', f: formularioPerfil() }),
  'campo-perfil': (b) => {
    const f = hojaActual().f;
    if (b.dataset.campo === 'manual') {
      f.manual = !!b.dataset.v;
      if (f.manual && !f.metaManual) { const p = perfilDesdeFormulario(f); f.metaManual = String(calcularMetas(p ? Object.assign(p, { metaManual: 0 }) : null).calorias); }
    } else f[b.dataset.campo] = b.dataset.v;
    pintarHoja();
  },
  'meta-manual': (b) => { const f = hojaActual().f; f.metaManual = String(Math.max(r0((leerNum(f.metaManual) || 0) + Number(b.dataset.n)), 800)); $('#p-meta').value = f.metaManual; },
  'guardar-perfil': () => {
    const f = hojaActual().f, p = perfilDesdeFormulario(f);
    if (!p) { $('#error-perfil').textContent = 'Completa altura, peso y fecha de nacimiento.'; return; }
    if (p.alturaCm < 100 || p.alturaCm > 230) { $('#error-perfil').textContent = 'La altura debe estar entre 100 y 230 cm.'; return; }
    if (p.pesoActualKg < 30 || p.pesoActualKg > 300) { $('#error-perfil').textContent = 'El peso debe estar entre 30 y 300 kg.'; return; }
    if (f.manual && p.metaManual < minimas(p.sexo)) {
      if (!confirm(`${p.metaManual} kcal está por debajo del mínimo recomendado (${minimas(p.sexo)}). ¿Guardar igual?`)) return;
    }
    const nuevo = !S.perfil;
    S.perfil = Object.assign(S.perfil || { fechaCreacion: iso(new Date()) }, p);
    aplicarMetas(); guardar(); cerrarTodo();
    aviso(nuevo ? '¡Listo! Ya puedes registrar tus comidas' : 'Perfil guardado');
  },

  // Peso
  'abrir-peso': () => { const d = dia(ui.fecha); abrir({ tipo: 'peso', valor: fmt(d && d.pesoKg ? d.pesoKg : S.perfil.pesoActualKg) }); },
  'ajustar-peso': (b) => { const h = hojaActual(); h.valor = fmt(Math.max((leerNum($('#peso').value) || 0) + Number(b.dataset.n), 0)); $('#peso').value = h.valor; },
  'guardar-peso': () => {
    const v = leerNum($('#peso').value);
    if (!(v >= 30 && v <= 300)) return aviso('Escribe un peso entre 30 y 300 kg');
    dia(ui.fecha, true).pesoKg = r1(v);
    // El perfil usa el peso más reciente registrado.
    const ultimo = Object.keys(S.dias).filter((k) => S.dias[k].pesoKg).sort().pop();
    if (ultimo === ui.fecha) { S.perfil.pesoActualKg = r1(v); aplicarMetas(); }
    guardar(); cerrarTodo(); aviso('Peso guardado');
  },

  // Agua y sueño
  agua: (b) => { const d = dia(ui.fecha, true); d.aguaMl = clamp(d.aguaMl + Number(b.dataset.n), 0, 8000); guardar(); pintar(); },
  sueno: (b) => { const d = dia(ui.fecha, true), n = Number(b.dataset.n); d.horasSueno = !d.horasSueno && n > 0 ? 7 : clamp((d.horasSueno || 0) + n, 0, 14); guardar(); pintar(); },

  // Actividad
  'abrir-actividad': () => abrir({ tipo: 'actividad', act: 'caminar', minutos: '30' }),
  'elegir-actividad': (b) => { const h = hojaActual(); h.minutos = $('#minutos').value; h.act = b.dataset.id; pintarHoja(); },
  minutos: (b) => { const h = hojaActual(); h.minutos = String(Math.max(r0((leerNum($('#minutos').value) || 0) + Number(b.dataset.n)), 0)); $('#minutos').value = h.minutos; refrescarActividad(); },
  'guardar-actividad': () => {
    const h = hojaActual(), act = ACTIVIDADES_FISICAS.find((a) => a.id === h.act), min = leerNum($('#minutos').value) || 0;
    if (!(min > 0)) return aviso('Escribe los minutos');
    const kcal = r1(act.met * S.perfil.pesoActualKg * min / 60);
    const fecha = horaPara(ui.fecha);
    S.sesiones.push({ fecha, nombre: act.nombre, categoria: act.cat, minutos: min, calorias: kcal, codigoRutina: null });
    const d = dia(ui.fecha, true); d.caloriasEntrenamiento = r1((d.caloriasEntrenamiento || 0) + kcal);
    guardar(); cerrarTodo(); aviso(`${act.nombre}: ${r0(kcal)} kcal`);
  },
  'borrar-sesion': (b) => {
    const i = S.sesiones.findIndex((s) => s.fecha === b.dataset.fecha && s.nombre === b.dataset.nombre);
    if (i < 0) return;
    const [s] = S.sesiones.splice(i, 1);
    const d = dia(claveFecha(new Date(s.fecha)));
    if (d) d.caloriasEntrenamiento = Math.max(r1((d.caloriasEntrenamiento || 0) - s.calorias), 0);
    guardar(); pintarHoja(); pintar();
  },

  // Respaldo
  exportar: () => exportar(),
  importar: () => $('#archivo').click(),
  'borrar-todo': () => {
    if (!confirm('¿Borrar TODOS tus datos de este teléfono? Haz un respaldo antes.')) return;
    if (!confirm('Esto no se puede deshacer. ¿Seguro?')) return;
    S = estadoVacio(); cacheTodos = null; guardar(); ui.tab = 'hoy'; pintar();
  }
};

function refrescarActividad() {
  const h = hojaActual(), act = ACTIVIDADES_FISICAS.find((a) => a.id === h.act), min = leerNum($('#minutos').value) || 0;
  $('#kcal-act').textContent = r0(act.met * S.perfil.pesoActualKg * min / 60);
}

// ───────────────────────── Eventos ─────────────────────────

document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-a]');
  if (!b) return;
  const f = acciones[b.dataset.a];
  if (f) { ev.preventDefault(); f(b); }
});

document.addEventListener('input', (ev) => {
  const el = ev.target, h = hojaActual();
  if (!h) return;
  if (el.id === 'q') { h.texto = el.value; pintarResultados(); return; }
  if (el.id === 'gramos') { h.gramos = el.value; refrescarDetalle(); return; }
  if (el.id === 'minutos') { h.minutos = el.value; refrescarActividad(); return; }
  if (el.id === 'peso') { h.valor = el.value; return; }
  if (el.dataset.campo && h.f) {
    h.f[el.dataset.campo] = el.value;
    if (h.tipo === 'perfil') {
      const p = perfilDesdeFormulario(h.f), r = $('#p-recomendada');
      if (p && r) r.textContent = calcularMetas(Object.assign(p, { metaManual: 0 })).calorias;
    }
  }
});

document.addEventListener('change', (ev) => {
  const el = ev.target, h = hojaActual();
  if (el.id === 'respaldo-fotos') localStorage.setItem('fitapp.respaldoFotos', el.checked ? '1' : '0');
  if (h && h.f && el.dataset.campo) h.f[el.dataset.campo] = el.value;
});

$('#archivo').addEventListener('change', async (ev) => {
  const archivo = ev.target.files && ev.target.files[0];
  ev.target.value = '';
  if (!archivo) return;
  try {
    const r = JSON.parse(await archivo.text());
    const nuevo = leerRespaldo(r);
    if (window.importarFotos && Array.isArray(r.fotos) && r.fotos.length) await window.importarFotos(r.fotos);
    const dias = Object.keys(nuevo.dias).length;
    const fecha = r.fecha ? new Date(r.fecha).toLocaleString('es') : '';
    if (!confirm(`Respaldo ${fecha}: ${dias} días registrados.\nTus datos actuales de este teléfono se reemplazarán. ¿Continuar?`)) return;
    S = nuevo; cacheTodos = null;
    if (S.perfil) aplicarMetas();
    guardar(); cerrarTodo(); ui.tab = 'hoy'; pintar();
    aviso('Datos importados');
  } catch (e) {
    alert('No se pudo leer el archivo: ' + e.message);
  }
});

// ───────────────────────── Inicio ─────────────────────────

async function iniciar() {
  try {
    const resp = await fetch('alimentos.json');
    ALIMENTOS = await resp.json();
  } catch (e) {
    console.error(e);
    ALIMENTOS = [];
  }
  cacheTodos = null;
  if (window.cargarEntrenar) await window.cargarEntrenar();
  pintar();
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW', e));
  }
}

iniciar();
