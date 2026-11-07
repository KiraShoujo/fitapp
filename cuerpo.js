/* FitApp Web — fase 4: mapa del cuerpo. Toca un músculo y ve sus ejercicios y rutinas. */
'use strict';

const MUSCULOS = {
  pectorales: { nombre: 'Pectorales', claves: ['pecho'], zona: 'pecho', atras: false,
    desc: 'Músculo del pecho. Empuja los brazos hacia adelante (flexiones, press de pecho).' },
  deltoides: { nombre: 'Deltoides (hombros)', claves: ['hombro'], zona: 'hombros', atras: false,
    desc: 'Cubre el hombro. Levanta los brazos al frente, a los lados y por encima de la cabeza.' },
  trapecio: { nombre: 'Trapecio', claves: ['trapecio', 'espalda alta', 'cuello'], zona: 'espalda', atras: true,
    desc: 'Parte alta de la espalda y cuello. Sube los hombros y mejora la postura.' },
  dorsales: { nombre: 'Dorsales', claves: ['espalda'], zona: 'espalda', atras: true,
    desc: 'Los músculos más grandes de la espalda. Jalan los brazos hacia el cuerpo (remos, dominadas).' },
  lumbares: { nombre: 'Lumbares', claves: ['espalda baja', 'columna', 'lumbar'], zona: 'espalda', atras: true,
    desc: 'Espalda baja. Mantienen la columna recta; fuertes evitan dolor de espalda.' },
  biceps: { nombre: 'Bíceps', claves: ['biceps'], zona: 'brazos', atras: false, desc: 'Parte delantera del brazo. Dobla el codo (curl).' },
  triceps: { nombre: 'Tríceps', claves: ['triceps'], zona: 'brazos', atras: true,
    desc: 'Parte trasera del brazo. Estira el codo; firme evita la flacidez del brazo.' },
  antebrazos: { nombre: 'Antebrazos', claves: ['antebrazo', 'agarre'], zona: 'brazos', atras: false,
    desc: 'Controlan muñeca y agarre. Te ayudan a cargar bolsas y pesas.' },
  abdominales: { nombre: 'Abdominales', claves: ['abdomen', 'core'], zona: 'abdomen', atras: false,
    desc: 'El «six pack». Estabiliza el tronco y protege la espalda.' },
  oblicuos: { nombre: 'Oblicuos', claves: ['oblicuo'], zona: 'abdomen', atras: false,
    desc: 'A los lados del abdomen. Giran e inclinan el tronco y marcan la cintura.' },
  gluteoMayor: { nombre: 'Glúteo mayor', claves: ['gluteo mayor', 'gluteos'], zona: 'gluteos', atras: true,
    desc: 'El músculo más grande del cuerpo. Da forma y volumen al glúteo y te impulsa al caminar y subir escaleras.' },
  gluteoMedio: { nombre: 'Glúteo medio', claves: ['gluteo medio', 'cadera'], zona: 'gluteos', atras: true,
    desc: 'Parte lateral de la cadera. Redondea el glúteo y estabiliza la rodilla al caminar.' },
  gluteoMenor: { nombre: 'Glúteo menor', claves: ['gluteo menor'], zona: 'gluteos', atras: true,
    desc: 'El más pequeño y profundo, debajo del glúteo medio (aquí se dibuja encima para poder tocarlo). Estabiliza la cadera al apoyarte en una pierna.' },
  cuadriceps: { nombre: 'Cuádriceps (muslo delantero)', claves: ['cuadriceps', 'piernas'], zona: 'piernas', atras: false,
    desc: 'Parte delantera del muslo. Estira la rodilla: clave para levantarte, caminar y subir escaleras.' },
  isquiotibiales: { nombre: 'Isquiotibiales (muslo trasero)', claves: ['isquio', 'trasera del muslo'], zona: 'piernas', atras: true,
    desc: 'Parte trasera del muslo. Doblan la rodilla y ayudan al glúteo a extender la cadera.' },
  aductores: { nombre: 'Aductores (entrepierna)', claves: ['aductor'], zona: 'piernas', atras: false,
    desc: 'Cara interna del muslo. Juntan las piernas y dan estabilidad.' },
  gemelos: { nombre: 'Gemelos (pantorrillas)', claves: ['pantorrilla', 'tobillo', 'soleo'], zona: 'piernas', atras: true,
    desc: 'Pantorrillas. Te impulsan en cada paso; fuertes reducen el cansancio al caminar.' }
};

const enLado = (k, lado) => (lado === 'atras' ? MUSCULOS[k].atras || k === 'deltoides' || k === 'antebrazos' : !MUSCULOS[k].atras);
const trabaja = (m, e) => MUSCULOS[m].claves.some((c) => normalizar(e.grupo_muscular).includes(c));

function ejerciciosDe(m) {
  const vistos = new Set(), lista = [];
  for (const r of RUTINAS) for (const e of r.ejercicios) {
    if (!trabaja(m, e)) continue;
    const k = normalizar(e.nombre);
    if (vistos.has(k)) continue;
    vistos.add(k); lista.push({ e, r });
  }
  return lista.slice(0, 12);
}

function rutinasDe(m) {
  return RUTINAS.map((r) => [r, r.ejercicios.filter((e) => trabaja(m, e)).length]).filter((x) => x[1] > 0)
    .sort((a, b) => b[1] - a[1] || a[0].duracion_minutos - b[0].duracion_minutos).map((x) => x[0]);
}

// ───────────────────────── Dibujo ─────────────────────────
// viewBox 200 × 440. Las formas se dibujan del lado izquierdo y se reflejan.

const PIEL = 'var(--piel)';
function silueta() {
  return `<g fill="${PIEL}" stroke="${PIEL}" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="100" cy="34" r="22"/><rect x="90" y="50" width="20" height="24" rx="6"/>
    <path d="M56,84 Q100,70 144,84 L141,140 Q135,188 137,218 L143,248 L57,248 L63,218 Q65,188 59,140 Z"/>
    <polyline points="46,88 37,168 29,244" fill="none" stroke-width="22"/><polyline points="154,88 163,168 171,244" fill="none" stroke-width="22"/>
    <circle cx="27" cy="256" r="10"/><circle cx="173" cy="256" r="10"/>
    <polyline points="81,244 83,340 84,418" fill="none" stroke-width="33"/><polyline points="119,244 117,340 116,418" fill="none" stroke-width="33"/>
    <ellipse cx="80" cy="428" rx="14" ry="7"/><ellipse cx="120" cy="428" rx="14" ry="7"/></g>`;
}

const FORMAS = {
  frente: {
    deltoides: '<ellipse cx="47" cy="93" rx="14" ry="17"/>',
    pectorales: '<path d="M99,88 C82,84 62,87 59,99 C58,116 72,128 99,124 Z"/>',
    biceps: '<ellipse cx="41" cy="131" rx="9" ry="23" transform="rotate(7 41 131)"/>',
    antebrazos: '<ellipse cx="33" cy="204" rx="8" ry="30" transform="rotate(6 33 204)"/>',
    oblicuos: '<path d="M83,134 L66,141 C64,170 66,198 74,214 L84,214 Z"/>',
    cuadriceps: '<ellipse cx="81" cy="291" rx="15" ry="43"/>',
    aductores: '<path d="M99,252 L92,254 C88,278 91,298 99,308 Z"/>',
    gemelos: '<ellipse cx="83" cy="377" rx="9" ry="30"/>'
  },
  atras: {
    deltoides: '<ellipse cx="47" cy="93" rx="14" ry="17"/>',
    dorsales: '<path d="M80,102 C63,112 62,150 80,190 L99,196 L99,142 Z"/>',
    triceps: '<ellipse cx="41" cy="131" rx="9" ry="23" transform="rotate(7 41 131)"/>',
    antebrazos: '<ellipse cx="33" cy="204" rx="8" ry="30" transform="rotate(6 33 204)"/>',
    gluteoMedio: '<ellipse cx="71" cy="234" rx="13" ry="12"/>',
    gluteoMayor: '<ellipse cx="85" cy="258" rx="18" ry="21"/>',
    gluteoMenor: '<ellipse cx="79" cy="224" rx="8" ry="5.5"/>',
    isquiotibiales: '<ellipse cx="82" cy="318" rx="13" ry="33"/>',
    gemelos: '<ellipse cx="83" cy="376" rx="11" ry="25"/>'
  }
};
const CENTRALES = {
  frente: { abdominales: '<rect x="85" y="131" width="30" height="84" rx="9"/>' },
  atras: { trapecio: '<path d="M100,58 L76,86 L100,140 L124,86 Z"/>', lumbares: '<rect x="86" y="194" width="28" height="30" rx="8"/>' }
};

function mapaSVG(lado, sel) {
  const color = (m) => (m === sel ? '#FF4F8B' : 'var(--musculo)');
  const borde = (m) => (m === sel ? 'stroke="#fff" stroke-width="2"' : 'stroke="var(--musculo-borde)" stroke-width="1"');
  let s = `<svg viewBox="0 0 200 440" style="width:100%;max-width:300px;display:block;margin:0 auto" role="img" aria-label="Cuerpo ${lado}">${silueta()}`;
  for (const [m, forma] of Object.entries(FORMAS[lado])) {
    s += `<g data-a="musculo" data-m="${m}" fill="${color(m)}" ${borde(m)} style="cursor:pointer">${forma}<g transform="translate(200,0) scale(-1,1)">${forma}</g></g>`;
  }
  for (const [m, forma] of Object.entries(CENTRALES[lado])) {
    s += `<g data-a="musculo" data-m="${m}" fill="${color(m)}" ${borde(m)} style="cursor:pointer">${forma}</g>`;
  }
  if (lado === 'frente') {
    s += '<g stroke="rgba(0,0,0,.18)" stroke-width="1.2" pointer-events="none"><line x1="100" y1="133" x2="100" y2="213"/><line x1="86" y1="157" x2="114" y2="157"/><line x1="86" y1="180" x2="114" y2="180"/></g>';
  }
  return s + '</svg>';
}

VISTAS_EXTRA.cuerpo = function (h) {
  h.lado = h.lado || 'frente';
  const m = h.musculo ? MUSCULOS[h.musculo] : null;
  const lista = Object.entries(MUSCULOS).filter(([k]) => enLado(k, h.lado));
  let detalle = '<div class="vacio peq">Toca un músculo del cuerpo (o un nombre de abajo) para ver sus ejercicios y rutinas.</div>';
  if (m) {
    const ejs = ejerciciosDe(h.musculo), rs = rutinasDe(h.musculo);
    detalle = `<div class="tarjeta pila" style="gap:8px"><div class="negrita" style="font-size:19px;color:#FF4F8B">${esc(m.nombre)}</div>
      <div class="peq">${esc(m.desc)}</div></div>
      ${ejs.length ? `<div class="subtitulo">Ejercicios (${ejs.length})</div><div class="pila">${ejs.map(({ e, r }) => {
        const c = catInfo(r.categoria), patron = patronPara(e.nombre);
        return `<details class="tarjeta"><summary class="fila" style="list-style:none;cursor:pointer">
          <div style="width:56px;height:56px;border-radius:14px;background:${c.g};flex:none"><canvas data-patron="${patron}" ${esIsometrico(e.nombre) ? 'data-fija="1"' : ''} style="width:100%;height:100%"></canvas></div>
          <div class="crece"><div class="negrita">${esc(e.nombre)}</div><div class="mini suave">${e.series} × ${e.duracion_segundos > 0 ? e.duracion_segundos + ' s' : e.repeticiones + ' reps'} · ${c.icono} ${esc(c.nombre)}</div></div><span class="tenue">⌄</span></summary>
          <div class="peq" style="margin-top:8px">${esc(e.instrucciones)}</div>
          <button class="enlace peq" style="margin-top:6px" data-a="abrir-rutina" data-codigo="${r.codigo}">Está en: ${esc(r.nombre)} ›</button></details>`;
      }).join('')}</div>` : '<div class="vacio peq">Aún no hay ejercicios para este músculo.</div>'}
      ${rs.length ? `<div class="subtitulo">Rutinas que lo trabajan (${rs.length})</div><div class="pila">${rs.slice(0, 15).map(tarjetaRutina).join('')}</div>` : ''}`;
  }
  return cabecera('Mapa del cuerpo', '‹ Atrás') + `<div class="hoja-cuerpo pila">
    <div class="segmentos"><button class="${h.lado === 'frente' ? 'sel' : ''}" data-a="lado-cuerpo" data-v="frente">Frente</button><button class="${h.lado === 'atras' ? 'sel' : ''}" data-a="lado-cuerpo" data-v="atras">Espalda</button></div>
    <div class="tarjeta" style="padding:12px">${mapaSVG(h.lado, h.musculo)}</div>
    <div class="chips">${lista.map(([k, v]) => `<button class="chip ${h.musculo === k ? 'sel' : ''}" style="${h.musculo === k ? 'background:#FF4F8B' : ''}" data-a="musculo" data-m="${k}">${esc(v.nombre.replace(/ \(.*\)/, ''))}</button>`).join('')}</div>
    <div id="detalle-musculo" class="pila" style="scroll-margin-top:110px">${detalle}</div>
  </div>`;
};

Object.assign(acciones, {
  'abrir-cuerpo': () => abrir({ tipo: 'cuerpo' }),
  'lado-cuerpo': (b) => { const h = hojaActual(); h.lado = b.dataset.v; if (h.musculo && !enLado(h.musculo, h.lado)) h.musculo = null; pintarHoja(); },
  musculo: (b) => {
    const h = hojaActual(), m = b.dataset.m;
    h.musculo = m;
    if (!enLado(m, h.lado)) h.lado = MUSCULOS[m].atras ? 'atras' : 'frente';
    pintarHoja();
    setTimeout(() => { const d = $('#detalle-musculo'); if (d) d.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
  }
});

// Acceso desde Entrenar (debajo del plan).
const pantallaEntrenarOriginal = window.pantallaEntrenar;
window.pantallaEntrenar = function () {
  const html = pantallaEntrenarOriginal();
  const acceso = `<button class="tarjeta fila" style="text-align:left;background:linear-gradient(135deg,#FF4F8B,#FF8A3D);color:#fff" data-a="abrir-cuerpo">
    <div class="icono-caja" style="background:rgba(255,255,255,.22)">🧍‍♀️</div>
    <div class="crece"><div class="negrita">Mapa del cuerpo</div><div class="mini" style="opacity:.92">Toca un músculo: glúteo mayor, medio, menor, cuádriceps… y ve sus ejercicios</div></div><span>›</span></button>`;
  return html.replace('<div class="subtitulo" style="margin-top:8px">Rutinas</div>', acceso + '<div class="subtitulo" style="margin-top:8px">Rutinas</div>');
};
