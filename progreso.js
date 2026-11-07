/* FitApp Web — fase 3a: revisión semanal, medidas corporales y fotos de progreso. */
'use strict';

// ───────────────────────── Revisión semanal ─────────────────────────

function diasAtras(desde, cantidad) {
  const hoy = claveFecha();
  return Array.from({ length: cantidad }, (_, i) => sumarDias(hoy, -(desde + cantidad - 1 - i)));
}

function resumenSemana(dias) {
  const m = metas();
  const conComida = dias.map((k) => [k, dia(k)]).filter(([, d]) => d && d.entradas.length);
  const r = { diasRegistrados: conComida.length, caloriasPromedio: 0, metaPromedio: m.calorias, diasEnMeta: 0, proteinaPromedio: 0,
    aguaPromedio: 0, entrenamientos: 0, minutos: 0, kcalEjercicio: 0, suenoPromedio: 0, diasConSueno: 0 };
  if (conComida.length) {
    let cal = 0, prot = 0, metasSuma = 0;
    for (const [, d] of conComida) {
      const t = totales(d), meta = d.metaDelDia > 0 ? d.metaDelDia : m.calorias, neto = t.calorias - quemadas(d);
      cal += t.calorias; prot += t.proteina; metasSuma += meta;
      if (neto <= meta + 100 && neto >= meta * 0.7) r.diasEnMeta++;
    }
    r.caloriasPromedio = r0(cal / conComida.length);
    r.proteinaPromedio = r0(prot / conComida.length);
    r.metaPromedio = r0(metasSuma / conComida.length);
  }
  const agua = dias.map(dia).filter((d) => d && d.aguaMl > 0);
  r.aguaPromedio = agua.length ? r0(agua.reduce((s, d) => s + d.aguaMl, 0) / agua.length) : 0;
  const sueno = dias.map(dia).filter((d) => d && d.horasSueno > 0);
  r.diasConSueno = sueno.length;
  r.suenoPromedio = sueno.length ? sueno.reduce((s, d) => s + d.horasSueno, 0) / sueno.length : 0;
  const set = new Set(dias);
  for (const s of S.sesiones) {
    if (!set.has(claveFecha(new Date(s.fecha)))) continue;
    r.entrenamientos++; r.minutos += Number(s.minutos) || 0; r.kcalEjercicio += Number(s.calorias) || 0;
  }
  r.minutos = r0(r.minutos); r.kcalEjercicio = r0(r.kcalEjercicio);
  return r;
}

function areasSemana(a, b) {
  const m = metas(), metaProt = Math.max(m.proteinaG, 1), metaAgua = Math.max(m.aguaMl, 1);
  const alim = (r) => (r.diasRegistrados ? r0(r.diasEnMeta / 7 * 60 + Math.min(r.proteinaPromedio / metaProt, 1) * 40) : 0);
  const ejer = (r) => r0(Math.min(r.minutos / 150, 1) * 100);
  const desc = (r) => (r.diasConSueno ? r0((r.suenoPromedio >= 7 && r.suenoPromedio <= 9 ? 1 : r.suenoPromedio >= 6 ? 0.7 : 0.4) * r.diasConSueno / 7 * 100) : 0);
  const habi = (r) => r0(r.diasRegistrados / 7 * 60 + Math.min(r.aguaPromedio / metaAgua, 1) * 40);
  const tend = (x, y) => (x > y + 5 ? 1 : x < y - 5 ? -1 : 0);
  return [
    { nombre: 'Alimentación', icono: '🍽️', p: alim(a), t: tend(alim(a), alim(b)), detalle: `${a.diasEnMeta} de 7 días en tu meta · proteína ${a.proteinaPromedio}/${metaProt} g` },
    { nombre: 'Ejercicio', icono: '🏃‍♀️', p: ejer(a), t: tend(ejer(a), ejer(b)), detalle: `${a.entrenamientos} sesiones · ${a.minutos} de 150 min` },
    { nombre: 'Descanso', icono: '😴', p: desc(a), t: tend(desc(a), desc(b)), detalle: a.diasConSueno ? `Promedio ${fmt(a.suenoPromedio)} h por noche` : 'Sin registros de sueño' },
    { nombre: 'Hábitos', icono: '✅', p: habi(a), t: tend(habi(a), habi(b)), detalle: `${a.diasRegistrados} días registrados · agua ${a.aguaPromedio}/${metaAgua} ml` }
  ];
}

function tendenciaPeso() {
  const desde = sumarDias(claveFecha(), -28), base = fechaDeClave(desde).getTime();
  const puntos = [];
  for (const [k, d] of Object.entries(S.dias)) if (k >= desde && d.pesoKg) puntos.push([(fechaDeClave(k).getTime() - base) / 864e5, d.pesoKg]);
  for (const m of S.medidas) { const k = claveFecha(new Date(m.fecha)); if (k >= desde && m.pesoKg) puntos.push([(new Date(m.fecha).getTime() - base) / 864e5, m.pesoKg]); }
  if (puntos.length < 2) return null;
  const n = puntos.length, sx = puntos.reduce((s, p) => s + p[0], 0), sy = puntos.reduce((s, p) => s + p[1], 0);
  const sxy = puntos.reduce((s, p) => s + p[0] * p[1], 0), sxx = puntos.reduce((s, p) => s + p[0] * p[0], 0);
  const den = n * sxx - sx * sx;
  if (Math.abs(den) < 1e-4) return null;
  return (n * sxy - sx * sy) / den * 7;
}

function textoTendencia(kg) {
  if (kg == null) return 'Registra tu peso al menos 2 veces para ver la tendencia.';
  const c = (kg > 0 ? '+' : '') + fmt(kg);
  if (S.perfil.objetivo === 'perderPeso') {
    if (kg < -1) return `${c} kg/semana: bajas rápido; asegúrate de comer suficiente proteína.`;
    if (kg <= -0.2) return `${c} kg/semana: ¡ritmo ideal para perder grasa!`;
    return `${c} kg/semana: estable. Puede ser retención de líquidos; mira la cintura.`;
  }
  if (S.perfil.objetivo === 'ganarMasa') return kg > 0 ? `${c} kg/semana: vas subiendo.` : `${c} kg/semana: aún no subes; come un poco más.`;
  return Math.abs(kg) < 0.3 ? `${c} kg/semana: peso estable.` : `${c} kg/semana.`;
}

function cambioCintura() {
  const l = S.medidas.filter((m) => m.cinturaCm).sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  return l.length >= 2 ? l[l.length - 1].cinturaCm - l[0].cinturaCm : null;
}

function ajustesSemana(a, kg) {
  const m = metas(), lista = [];
  if (a.diasRegistrados < 5) lista.push(['📝', 'Registra al menos 5 días', `Registraste ${a.diasRegistrados} de 7. Usa «Repetir de ayer», tus comidas frecuentes o la voz para hacerlo en segundos.`]);
  if (a.diasRegistrados && a.caloriasPromedio > a.metaPromedio + 150) lista.push(['➖', 'Recorta unas 150 kcal al día', `Promediaste ${a.caloriasPromedio} kcal y tu meta es ${a.metaPromedio}. Cambia una merienda o una bebida azucarada.`]);
  if (a.diasRegistrados && a.metaPromedio && a.caloriasPromedio < a.metaPromedio * 0.75) lista.push(['⚠️', 'Estás comiendo muy poco', `Promediaste ${a.caloriasPromedio} kcal. Comer muy por debajo de la meta te quita energía y masa muscular.`]);
  if (m.proteinaG && a.diasRegistrados && a.proteinaPromedio < m.proteinaG * 0.8) lista.push(['🐟', 'Más proteína en el desayuno', `Llegaste a ${a.proteinaPromedio} de ${m.proteinaG} g. Suma huevos, yogur griego o queso blanco por la mañana.`]);
  if (a.minutos < 90) lista.push(['🚶‍♀️', 'Suma 3 rutinas cortas', `Hiciste ${a.minutos} min. Tres rutinas de 20 min (o caminatas) te acercan a los 150 min recomendados.`]);
  if (a.diasConSueno && a.suenoPromedio < 7) lista.push(['🛏️', 'Acuéstate 30 minutos antes', `Dormiste ${fmt(a.suenoPromedio)} h en promedio. Dormir poco aumenta el hambre y el antojo de dulce.`]);
  if (!a.diasConSueno) lista.push(['🌙', 'Registra tu descanso', 'En «Hoy» anota cuántas horas dormiste para analizar tu descanso.']);
  if (a.aguaPromedio < m.aguaMl * 0.7) lista.push(['💧', 'Un vaso de agua con cada comida', `Promediaste ${a.aguaPromedio} ml de ${m.aguaMl}.`]);
  if (S.perfil.objetivo === 'perderPeso' && kg != null && kg > -0.1 && a.diasEnMeta >= 5) lista.push(['🎚️', 'Pequeño ajuste de meta', 'Cumples tu meta pero el peso no baja. Prueba bajar 100 kcal o sumar 2.000 pasos diarios por 2 semanas.']);
  if (!lista.length) lista.push(['⭐', '¡Sigue así!', 'Todo va en buen camino. Si quieres un reto, sube un poco el peso en tus rutinas de glúteo.']);
  return lista.slice(0, 4);
}

VISTAS_EXTRA.revision = function () {
  const actual = resumenSemana(diasAtras(0, 7)), anterior = resumenSemana(diasAtras(7, 7));
  const areas = areasSemana(actual, anterior), puntaje = r0(areas.reduce((s, x) => s + x.p, 0) / areas.length);
  const kg = tendenciaPeso(), cintura = cambioCintura();
  const mensaje = puntaje >= 80 ? '¡Semana excelente! Mantén lo que estás haciendo.' : puntaje >= 60 ? 'Buena semana. Con un par de ajustes llegas al siguiente nivel.'
    : puntaje >= 40 ? 'Vas avanzando. Enfócate en uno o dos ajustes esta semana.' : 'Empecemos de a poco: elige un solo ajuste para esta semana.';
  const dias = diasAtras(0, 7), m = metas();
  const barras = dias.map((k) => { const d = dia(k), c = r0(totales(d).calorias); return { y: c, color: c > m.calorias + 100 ? '#FF5E62' : '#F5A524' }; });
  const color = (p) => (p >= 70 ? '#22C47A' : p >= 40 ? '#FF8A3D' : '#FF5E62');
  return cabecera('Revisión semanal', '‹ Atrás') + `<div class="hoja-cuerpo pila">
    <div class="portada fila" style="background:linear-gradient(135deg,#9B5CFF,#FF4F8B);gap:18px">
      <div class="anillo" style="width:110px;height:110px">${anillo(puntaje / 100, 110, 11)}<div class="centro-anillo"><span class="grande" style="font-size:30px">${puntaje}</span><span class="mini">de 100</span></div></div>
      <div><div style="font-size:20px;font-weight:800">Tu semana</div><div class="peq" style="opacity:.95">${mensaje}</div></div></div>
    ${areas.map((x) => `<div class="tarjeta pila" style="gap:8px">
      <div class="fila entre"><span class="negrita">${x.icono} ${x.nombre}</span><b style="font-size:22px;color:${color(x.p)}">${x.p}</b></div>
      <div class="barra clara"><i style="width:${x.p}%;background:${color(x.p)}"></i></div>
      <div class="mini suave">${x.detalle}</div>
      <div class="mini negrita" style="color:${x.t >= 0 ? 'var(--verde)' : 'var(--coral)'}">${x.t > 0 ? '↗︎ Mejor' : x.t < 0 ? '↘︎ Peor' : '→ Igual'} que la semana pasada</div></div>`).join('')}
    <div class="tarjeta"><h3>🔥 Calorías de la semana</h3>${grafica(barras, { barras: true, meta: m.calorias, etiquetas: dias.map((k) => fechaDeClave(k).toLocaleDateString('es', { weekday: 'narrow' })) })}
      <div class="mini suave">Promedio ${actual.caloriasPromedio} kcal en ${actual.diasRegistrados} días · ejercicio ${actual.kcalEjercicio} kcal</div></div>
    <div class="tarjeta"><h3>📉 Tendencia (4 semanas)</h3><div class="peq">${textoTendencia(kg)}</div>
      ${cintura != null ? `<div class="peq suave" style="margin-top:6px">Cintura: ${cintura > 0 ? '+' : ''}${fmt(cintura)} cm desde tu primera medida.</div>` : ''}</div>
    <div class="subtitulo">Pequeños ajustes para esta semana</div>
    ${ajustesSemana(actual, kg).map(([e, t, d]) => `<div class="tarjeta fila" style="align-items:flex-start"><div class="icono-caja" style="background:var(--principal)">${e}</div><div><div class="negrita">${t}</div><div class="peq suave">${d}</div></div></div>`).join('')}
    <div class="mini tenue">Se compara con los 7 días anteriores. Son sugerencias generales; ante dudas de salud consulta a un profesional.</div>
  </div>`;
};

// ───────────────────────── Medidas corporales ─────────────────────────

const TIPOS_MEDIDA = [
  { id: 'pesoKg', nombre: 'Peso', u: 'kg', paso: 0.1, min: 30, max: 300, ayuda: 'En ayunas, después de ir al baño.' },
  { id: 'cinturaCm', nombre: 'Cintura', u: 'cm', paso: 0.5, min: 10, max: 250, ayuda: 'A la altura del ombligo, sin apretar.' },
  { id: 'caderaCm', nombre: 'Cadera', u: 'cm', paso: 0.5, min: 10, max: 250, ayuda: 'En la parte más ancha de los glúteos.' },
  { id: 'brazoCm', nombre: 'Brazo', u: 'cm', paso: 0.5, min: 10, max: 250, ayuda: 'A mitad del brazo, relajado.' },
  { id: 'musloCm', nombre: 'Muslo', u: 'cm', paso: 0.5, min: 10, max: 250, ayuda: 'En la parte más ancha del muslo.' },
  { id: 'cuelloCm', nombre: 'Cuello', u: 'cm', paso: 0.5, min: 10, max: 250, ayuda: 'Debajo de la manzana de Adán.' }
];

function ultimaMedida(tipo) {
  const l = S.medidas.filter((m) => m[tipo] != null).sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  return l.length ? l[l.length - 1][tipo] : null;
}

VISTAS_EXTRA.medidas = function (h) {
  if (!h.valores) {
    h.valores = {};
    for (const t of TIPOS_MEDIDA) { const v = ultimaMedida(t.id) ?? (t.id === 'pesoKg' ? S.perfil.pesoActualKg : null); h.valores[t.id] = v != null ? fmt(v) : ''; }
    h.sel = h.sel || 'cinturaCm';
  }
  const tipo = TIPOS_MEDIDA.find((t) => t.id === h.sel);
  const puntos = S.medidas.filter((m) => m[h.sel] != null).sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  const cintura = ultimaMedida('cinturaCm'), cadera = ultimaMedida('caderaCm');
  const icc = cintura && cadera ? cintura / cadera : null, ica = cintura && S.perfil.alturaCm ? cintura / S.perfil.alturaCm : null;
  const [bajo, alto] = S.perfil.sexo === 'masculino' ? [0.9, 1.0] : [0.8, 0.85];
  const historial = S.medidas.slice().sort((a, b) => (a.fecha < b.fecha ? 1 : -1)).slice(0, 12);
  return cabecera('Medidas corporales', '‹ Atrás') + `<div class="hoja-cuerpo pila">
    <div class="tarjeta pila">
      <h3>📏 Medidas de hoy</h3><div class="mini suave">Mídete cada 1–2 semanas, a la misma hora. Usa − y + para ajustar.</div>
      ${TIPOS_MEDIDA.map((t) => `<div class="pila" style="gap:4px">
        <div class="fila entre"><span class="negrita">${t.nombre}</span>
          <span class="numerico" style="width:200px"><button class="circulo" data-a="medida-paso" data-t="${t.id}" data-n="${-t.paso}">−</button>
          <input type="text" inputmode="decimal" data-medida="${t.id}" value="${esc(h.valores[t.id])}" placeholder="—" style="padding:9px 6px;font-size:17px">
          <button class="circulo" data-a="medida-paso" data-t="${t.id}" data-n="${t.paso}">+</button></span></div>
        <div class="mini tenue">${t.ayuda} (${t.u})</div></div>`).join('')}
      <button class="boton" style="background:linear-gradient(135deg,#2F8CFF,#5B5CE6)" data-a="guardar-medidas">✓ Guardar medidas</button>
    </div>
    ${S.medidas.length ? `<div class="tarjeta pila">
      <div class="fila entre"><h3 style="margin:0">📈 Evolución</h3>
        <select id="medida-sel" style="width:auto;padding:8px 34px 8px 12px">${TIPOS_MEDIDA.map((t) => `<option value="${t.id}" ${t.id === h.sel ? 'selected' : ''}>${t.nombre}</option>`).join('')}</select></div>
      ${puntos.length >= 2 ? grafica(puntos.map((p) => ({ y: p[h.sel] })), { color: '#2F8CFF', etiquetas: puntos.map((p) => new Date(p.fecha).toLocaleDateString('es', { day: 'numeric', month: 'short' })) })
        : `<div class="vacio peq">Necesitas al menos 2 registros de ${tipo.nombre.toLowerCase()} para ver la tendencia.</div>`}
      ${puntos.length >= 2 ? `<div class="fila entre peq"><span class="suave">Cambio total</span><b>${(() => { const c = puntos[puntos.length - 1][h.sel] - puntos[0][h.sel]; return (c > 0 ? '+' : '') + fmt(c) + ' ' + tipo.u; })()}</b></div>` : ''}
    </div>` : ''}
    ${icc || ica ? `<div class="tarjeta pila" style="gap:6px"><h3>❤️ Indicadores de salud</h3>
      ${icc ? `<div class="fila entre"><span>Cintura / cadera</span><b>${icc.toFixed(2)}</b></div><div class="mini suave">${icc < bajo ? 'Riesgo bajo' : icc <= alto ? 'Riesgo moderado' : 'Riesgo alto: reducir cintura ayuda a tu salud'}</div>` : ''}
      ${ica ? `<div class="fila entre"><span>Cintura / altura</span><b>${ica.toFixed(2)}</b></div><div class="mini suave">${ica < 0.5 ? 'Saludable (menor a 0.5)' : 'Por encima de 0.5: meta, cintura < media altura'}</div>` : ''}
      <div class="mini tenue">Son referencias generales, no un diagnóstico.</div></div>` : ''}
    ${historial.length ? `<div class="subtitulo">Historial</div><div class="lista">${historial.map((m) => `<div class="item"><span class="crece">
      <div class="nombre">${new Date(m.fecha).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
      <div class="mini suave">${TIPOS_MEDIDA.filter((t) => m[t.id] != null).map((t) => `${t.nombre} ${fmt(m[t.id])}`).join(' · ')}</div></span>
      <button class="tenue" data-a="borrar-medida" data-fecha="${esc(m.fecha)}" aria-label="Eliminar">✕</button></div>`).join('')}</div>` : ''}
  </div>`;
};

// ───────────────────────── Fotos de progreso (IndexedDB) ─────────────────────────

const VISTAS_FOTO = { frente: 'Frente', lado: 'Lado', espalda: 'Espalda' };
let bdFotos = null;

function abrirBD() {
  if (bdFotos) return Promise.resolve(bdFotos);
  return new Promise((ok, mal) => {
    const req = indexedDB.open('fitapp-fotos', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('fotos', { keyPath: 'id' });
    req.onsuccess = () => { bdFotos = req.result; ok(bdFotos); };
    req.onerror = () => mal(req.error);
  });
}
async function tx(modo, fn) {
  const bd = await abrirBD();
  return new Promise((ok, mal) => {
    const t = bd.transaction('fotos', modo), store = t.objectStore('fotos');
    const r = fn(store);
    t.oncomplete = () => ok(r && 'result' in r ? r.result : undefined);
    t.onerror = () => mal(t.error);
  });
}
const todasLasFotos = () => tx('readonly', (s) => s.getAll()).then((l) => (l || []).sort((a, b) => (a.fecha < b.fecha ? 1 : -1)));
const guardarFoto = (f) => tx('readwrite', (s) => s.put(f));
const borrarFoto = (id) => tx('readwrite', (s) => s.delete(id));

function comprimir(archivo, maximo = 1400) {
  return new Promise((ok, mal) => {
    const img = new Image(), url = URL.createObjectURL(archivo);
    img.onload = () => {
      const esc = Math.min(1, maximo / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * esc); c.height = Math.round(img.height * esc);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? ok(b) : mal(new Error('No se pudo leer la foto'))), 'image/jpeg', 0.78);
    };
    img.onerror = () => { URL.revokeObjectURL(url); mal(new Error('No se pudo leer la foto')); };
    img.src = url;
  });
}

const blobABase64 = (b) => new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.readAsDataURL(b); });
const base64ABlob = (t) => { const bin = atob(t), arr = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i); return new Blob([arr], { type: 'image/jpeg' }); };

window.fotosParaRespaldo = async function () {
  try {
    const fotos = await todasLasFotos();
    return Promise.all(fotos.map(async (f) => ({ fecha: f.fecha, vista: f.vista, imagen: await blobABase64(f.blob) })));
  } catch (e) { return []; }
};
window.importarFotos = async function (lista) {
  try {
    await tx('readwrite', (s) => s.clear());
    for (const f of lista) await guardarFoto({ id: uid(), fecha: f.fecha, vista: f.vista || 'frente', blob: base64ABlob(f.imagen) });
  } catch (e) { console.warn('fotos', e); }
};

let urlsFotos = [];
VISTAS_EXTRA.fotos = function (h) {
  h.vista = h.vista || 'frente';
  return cabecera('Fotos de progreso', '‹ Atrás') + `<div class="hoja-cuerpo pila">
    <div class="segmentos">${Object.entries(VISTAS_FOTO).map(([k, v]) => `<button class="${h.vista === k ? 'sel' : ''}" data-a="vista-foto" data-v="${k}">${v}</button>`).join('')}</div>
    <div class="tarjeta pila"><h3>📸 Nueva foto de ${VISTAS_FOTO[h.vista].toLowerCase()}</h3>
      <div class="peq suave">Cada 2–4 semanas, misma luz, misma ropa y misma distancia. Las fotos y las medidas muestran el cambio aunque la balanza no se mueva.</div>
      <label class="boton" style="background:linear-gradient(135deg,#FF4F8B,#9B5CFF)">📷 Tomar o elegir foto<input type="file" accept="image/*" id="foto-progreso" hidden></label>
      <div class="mini tenue">🔒 Privadas: se guardan solo en este teléfono (y en tu respaldo si lo eliges).</div></div>
    <div id="fotos-contenido"><div class="vacio peq">Cargando…</div></div></div>`;
};

async function pintarFotos() {
  const h = hojaActual();
  const cont = $('#fotos-contenido');
  if (!h || h.tipo !== 'fotos' || !cont) return;
  urlsFotos.forEach((u) => URL.revokeObjectURL(u)); urlsFotos = [];
  let lista = [];
  try { lista = (await todasLasFotos()).filter((f) => f.vista === h.vista); } catch (e) { cont.innerHTML = '<div class="vacio peq">Este navegador no permite guardar fotos.</div>'; return; }
  const url = (f) => { const u = URL.createObjectURL(f.blob); urlsFotos.push(u); return u; };
  const fecha = (f) => new Date(f.fecha).toLocaleDateString('es', { day: 'numeric', month: 'short', year: '2-digit' });
  let html = '';
  if (lista.length >= 2) {
    const antes = lista.find((f) => f.id === h.antes) || lista[lista.length - 1], despues = lista.find((f) => f.id === h.despues) || lista[0];
    const sel = (campo, actual) => `<select data-comparar="${campo}" style="padding:8px 30px 8px 10px;font-size:13px">${lista.map((f) => `<option value="${f.id}" ${f.id === actual.id ? 'selected' : ''}>${fecha(f)}</option>`).join('')}</select>`;
    const dias = Math.abs(Math.round((new Date(despues.fecha) - new Date(antes.fecha)) / 864e5));
    html += `<div class="tarjeta pila"><h3>↔️ Antes y después</h3><div class="cuadricula">
      <div class="pila" style="gap:6px"><img src="${url(antes)}" style="width:100%;border-radius:14px;object-fit:cover;aspect-ratio:3/4">${sel('antes', antes)}</div>
      <div class="pila" style="gap:6px"><img src="${url(despues)}" style="width:100%;border-radius:14px;object-fit:cover;aspect-ratio:3/4">${sel('despues', despues)}</div></div>
      <div class="mini suave">${dias} días de diferencia</div></div>`;
  }
  html += `<div class="subtitulo">Todas (${lista.length})</div>`;
  html += lista.length ? `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${lista.map((f) => `<div class="pila" style="gap:4px">
      <img src="${url(f)}" style="width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:12px">
      <div class="fila entre mini"><span class="suave">${fecha(f)}</span><button class="tenue" data-a="borrar-foto" data-id="${f.id}" aria-label="Eliminar">✕</button></div></div>`).join('')}</div>`
    : `<div class="vacio peq">Aún no tienes fotos de ${VISTAS_FOTO[h.vista].toLowerCase()}.</div>`;
  cont.innerHTML = html;
}

// ───────────────────────── Entradas en Progreso ─────────────────────────

EXTRA_PROGRESO.unshift(function () {
  const acceso = (a, icono, titulo, detalle, g) => `<button class="tarjeta fila" style="text-align:left;background:${g};color:#fff" data-a="${a}">
    <div class="icono-caja" style="background:rgba(255,255,255,.22)">${icono}</div>
    <div class="crece"><div class="negrita">${titulo}</div><div class="mini" style="opacity:.92">${detalle}</div></div><span>›</span></button>`;
  return `<div class="pila">
    ${acceso('abrir-revision', '✨', 'Revisión semanal', 'Cómo vas y pequeños ajustes', 'linear-gradient(135deg,#9B5CFF,#FF4F8B)')}
    ${acceso('abrir-medidas', '📏', 'Medidas corporales', 'Cintura, cadera, brazos, muslos, cuello', 'linear-gradient(135deg,#2F8CFF,#5B5CE6)')}
    ${acceso('abrir-fotos', '📸', 'Fotos de progreso', 'Antes y después: frente, lado y espalda', 'linear-gradient(135deg,#FF8A3D,#FF4F8B)')}
  </div>`;
});

// ───────────────────────── Acciones ─────────────────────────

Object.assign(acciones, {
  'abrir-revision': () => abrir({ tipo: 'revision' }),
  'abrir-medidas': () => abrir({ tipo: 'medidas' }),
  'abrir-fotos': () => abrir({ tipo: 'fotos', alPintar: pintarFotos }),
  'medida-paso': (b) => {
    const h = hojaActual(), t = TIPOS_MEDIDA.find((x) => x.id === b.dataset.t);
    const actual = leerNum(h.valores[t.id]) ?? (t.id === 'pesoKg' ? S.perfil.pesoActualKg : t.id === 'cuelloCm' ? 33 : t.id === 'brazoCm' ? 28 : t.id === 'musloCm' ? 55 : 80);
    h.valores[t.id] = fmt(clamp(actual + Number(b.dataset.n), t.min, t.max));
    const input = document.querySelector(`[data-medida="${t.id}"]`); if (input) input.value = h.valores[t.id];
  },
  'guardar-medidas': () => {
    const h = hojaActual(), m = { fecha: iso(new Date()) };
    let alguna = false;
    for (const t of TIPOS_MEDIDA) {
      const v = leerNum(h.valores[t.id]);
      m[t.id] = v != null && v >= t.min && v <= t.max ? r1(v) : null;
      if (m[t.id] != null) alguna = true;
    }
    if (!alguna) return aviso('Escribe al menos una medida');
    S.medidas.push(m);
    if (m.pesoKg) { S.perfil.pesoActualKg = m.pesoKg; dia(claveFecha(), true).pesoKg = m.pesoKg; aplicarMetas(); }
    guardar(); pintarHoja(); aviso('Medidas guardadas');
  },
  'borrar-medida': (b) => {
    if (!confirm('¿Eliminar este registro?')) return;
    S.medidas = S.medidas.filter((m) => m.fecha !== b.dataset.fecha); guardar(); pintarHoja();
  },
  'vista-foto': (b) => { const h = hojaActual(); h.vista = b.dataset.v; h.antes = h.despues = null; pintarHoja(); },
  'borrar-foto': async (b) => { if (!confirm('¿Eliminar esta foto?')) return; await borrarFoto(b.dataset.id); pintarFotos(); }
});

document.addEventListener('input', (ev) => {
  const el = ev.target, h = hojaActual();
  if (h && h.tipo === 'medidas' && el.dataset.medida) h.valores[el.dataset.medida] = el.value;
});
document.addEventListener('change', async (ev) => {
  const el = ev.target, h = hojaActual();
  if (!h) return;
  if (el.id === 'medida-sel') { h.sel = el.value; pintarHoja(); }
  if (el.dataset.comparar) { h[el.dataset.comparar] = el.value; pintarFotos(); }
  if (el.id === 'foto-progreso' && el.files && el.files[0]) {
    try {
      const blob = await comprimir(el.files[0]);
      await guardarFoto({ id: uid(), fecha: iso(new Date()), vista: h.vista, blob });
      aviso('Foto guardada'); pintarFotos();
    } catch (e) { alert(e.message); }
    el.value = '';
  }
});
