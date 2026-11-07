/* FitApp Web — fase 2: entrenamiento
 * Rutinas, sesión guiada (figura animada, sonidos y voz), pesos por serie,
 * plan semanal y progreso de fuerza.
 */
'use strict';

let RUTINAS = [];

const CATEGORIAS = {
  peso_corporal: { nombre: 'Peso corporal', icono: '🤸‍♀️', g: 'linear-gradient(135deg,#FF8A3D,#FF4F8B)' },
  mancuernas: { nombre: 'Mancuernas', icono: '🏋️‍♀️', g: 'linear-gradient(135deg,#2F8CFF,#5B5CE6)' },
  barra: { nombre: 'Barra', icono: '🏋️', g: 'linear-gradient(135deg,#5B5CE6,#9B5CFF)' },
  bajo_impacto: { nombre: 'Bajo impacto / articular', icono: '🧘‍♀️', g: 'linear-gradient(135deg,#22C47A,#16A6A0)' },
  bandas: { nombre: 'Bandas elásticas', icono: '🎗️', g: 'linear-gradient(135deg,#FF4F8B,#9B5CFF)' },
  suspension: { nombre: 'Suspensión (TRX)', icono: '🪢', g: 'linear-gradient(135deg,#F5A524,#FF5E62)' },
  isometria: { nombre: 'Isometría funcional', icono: '🧱', g: 'linear-gradient(135deg,#16A6A0,#2F8CFF)' }
};
const catInfo = (id) => CATEGORIAS[id] || CATEGORIAS.peso_corporal;

const ZONAS = { gluteos: 'Glúteos', piernas: 'Piernas', brazos: 'Brazos', hombros: 'Hombros', pecho: 'Pecho',
  espalda: 'Espalda', abdomen: 'Abdomen', cuerpo_completo: 'Cuerpo completo', cardio: 'Cardio' };
const OBJETIVOS_RUTINA = { bajar_peso: '🔥 Bajar de peso', gluteos: '🍑 Crecer glúteos', tonificar: '✨ Tonificar',
  fuerza: '⚡ Fuerza', movilidad: '🧘 Movilidad', resistencia: '🫁 Resistencia' };
const NIVELES = { principiante: 'Principiante', intermedio: 'Intermedio', avanzado: 'Avanzado' };

const DIAS_ORDEN = [2, 3, 4, 5, 6, 7, 1];   // lunes primero (1 = domingo)
const NOMBRE_DIA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const CORTO_DIA = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const ACTIVIDADES_LIBRES = ['Descanso', 'Caminata 30 min', 'Cardio suave o escaleras 20 min', 'Estiramientos 15 min'];

const filtros = { objetivo: '', zona: '', categoria: '', duracion: 0, texto: '' };

window.cargarEntrenar = async function () {
  try { RUTINAS = await (await fetch('rutinas.json')).json(); } catch (e) { console.error(e); RUTINAS = []; }
};

const rutina = (codigo) => RUTINAS.find((r) => r.codigo === codigo);
const formatoTiempo = (s) => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const kcalEstimadas = (r, peso) => {
  const met = r.ejercicios.reduce((a, e) => a + (e.met || 3.5), 0) / Math.max(r.ejercicios.length, 1);
  return r0(met * 3.5 * peso / 200 * r.duracion_minutos);
};

// ───────────────────────── Figura animada ─────────────────────────

const P = (x, y) => ({ x, y });
function pose(o) { return o; }
const PARTES = ['cabeza', 'cuello', 'cadera', 'codoA', 'manoA', 'codoB', 'manoB', 'rodillaA', 'pieA', 'rodillaB', 'pieB'];
const con = (base, cambios) => Object.assign({}, base, cambios);
const elevada = (base, dy) => Object.fromEntries(PARTES.map((k) => [k, P(base[k].x, base[k].y + dy)]));
const mezcla = (a, b, t) => Object.fromEntries(PARTES.map((k) => [k, P(a[k].x + (b[k].x - a[k].x) * t, a[k].y + (b[k].y - a[k].y) * t)]));

const POSES = {};
POSES.depieLado = pose({ cabeza: P(0, 0.92), cuello: P(0, 0.82), cadera: P(0, 0.52), codoA: P(0.02, 0.66), manoA: P(0.04, 0.50),
  codoB: P(-0.02, 0.66), manoB: P(-0.03, 0.50), rodillaA: P(0.02, 0.27), pieA: P(0.04, 0), rodillaB: P(-0.01, 0.27), pieB: P(-0.02, 0) });
POSES.depieBrazosAdelante = con(POSES.depieLado, { codoA: P(0.13, 0.75), manoA: P(0.29, 0.76), codoB: P(0.12, 0.74), manoB: P(0.28, 0.75) });
POSES.depieBrazosArriba = con(POSES.depieLado, { codoA: P(0.06, 0.97), manoA: P(0.08, 1.13), codoB: P(0.04, 0.97), manoB: P(0.05, 1.13) });
POSES.sentadillaAbajo = { cabeza: P(0.07, 0.65), cuello: P(0.02, 0.56), cadera: P(-0.18, 0.30), codoA: P(0.16, 0.50), manoA: P(0.31, 0.53),
  codoB: P(0.15, 0.49), manoB: P(0.30, 0.52), rodillaA: P(0.08, 0.25), pieA: P(0.03, 0), rodillaB: P(0.06, 0.25), pieB: P(0, 0) };
POSES.zancadaAbajo = { cabeza: P(0.03, 0.73), cuello: P(0.02, 0.63), cadera: P(0.02, 0.33), codoA: P(0.03, 0.47), manoA: P(0.05, 0.31),
  codoB: P(0, 0.47), manoB: P(0, 0.31), rodillaA: P(0.24, 0.28), pieA: P(0.25, 0), rodillaB: P(-0.13, 0.07), pieB: P(-0.40, 0.02) };
POSES.flexionArriba = { cabeza: P(0.38, 0.36), cuello: P(0.30, 0.30), cadera: P(0, 0.20), codoA: P(0.30, 0.15), manoA: P(0.30, 0),
  codoB: P(0.28, 0.15), manoB: P(0.28, 0), rodillaA: P(-0.25, 0.11), pieA: P(-0.51, 0.02), rodillaB: P(-0.25, 0.11), pieB: P(-0.51, 0.02) };
POSES.flexionAbajo = { cabeza: P(0.39, 0.15), cuello: P(0.30, 0.12), cadera: P(0, 0.08), codoA: P(0.17, 0.10), manoA: P(0.30, 0),
  codoB: P(0.15, 0.10), manoB: P(0.28, 0), rodillaA: P(-0.25, 0.05), pieA: P(-0.51, 0.02), rodillaB: P(-0.25, 0.05), pieB: P(-0.51, 0.02) };
POSES.plancha = { cabeza: P(0.37, 0.21), cuello: P(0.28, 0.17), cadera: P(-0.01, 0.13), codoA: P(0.28, 0.01), manoA: P(0.43, 0.01),
  codoB: P(0.26, 0.01), manoB: P(0.41, 0.01), rodillaA: P(-0.26, 0.07), pieA: P(-0.52, 0.01), rodillaB: P(-0.26, 0.07), pieB: P(-0.52, 0.01) };
POSES.supermanAbajo = { cabeza: P(0.42, 0.05), cuello: P(0.32, 0.04), cadera: P(0, 0.04), codoA: P(0.46, 0.04), manoA: P(0.62, 0.05),
  codoB: P(0.45, 0.04), manoB: P(0.61, 0.05), rodillaA: P(-0.25, 0.03), pieA: P(-0.52, 0.02), rodillaB: P(-0.25, 0.03), pieB: P(-0.52, 0.02) };
POSES.supermanArriba = con(POSES.supermanAbajo, { cabeza: P(0.41, 0.12), cuello: P(0.31, 0.09), codoA: P(0.46, 0.13), manoA: P(0.61, 0.18),
  codoB: P(0.45, 0.13), manoB: P(0.60, 0.18), rodillaA: P(-0.25, 0.07), pieA: P(-0.51, 0.12), rodillaB: P(-0.25, 0.07), pieB: P(-0.51, 0.12) });
POSES.cuatroApoyos = { cabeza: P(0.33, 0.35), cuello: P(0.24, 0.30), cadera: P(-0.06, 0.28), codoA: P(0.24, 0.14), manoA: P(0.24, 0),
  codoB: P(0.22, 0.14), manoB: P(0.22, 0), rodillaA: P(-0.06, 0.03), pieA: P(-0.32, 0.01), rodillaB: P(-0.08, 0.03), pieB: P(-0.34, 0.01) };
POSES.patadaGluteoArriba = con(POSES.cuatroApoyos, { rodillaA: P(-0.30, 0.36), pieA: P(-0.33, 0.62) });
POSES.birdDog = con(POSES.cuatroApoyos, { codoA: P(0.39, 0.33), manoA: P(0.55, 0.35), rodillaB: P(-0.31, 0.29), pieB: P(-0.58, 0.31) });
POSES.bocaArribaRodillas = { cabeza: P(-0.42, 0.07), cuello: P(-0.32, 0.05), cadera: P(-0.02, 0.05), codoA: P(-0.17, 0.02), manoA: P(-0.02, 0.02),
  codoB: P(-0.18, 0.02), manoB: P(-0.03, 0.02), rodillaA: P(0.17, 0.22), pieA: P(0.30, 0), rodillaB: P(0.15, 0.22), pieB: P(0.28, 0) };
POSES.puenteArriba = con(POSES.bocaArribaRodillas, { cabeza: P(-0.40, 0.08), cuello: P(-0.30, 0.07), cadera: P(0, 0.21), rodillaA: P(0.23, 0.30), rodillaB: P(0.21, 0.30) });
POSES.crunchAbajo = con(POSES.bocaArribaRodillas, { codoA: P(-0.28, 0.16), manoA: P(-0.40, 0.13), codoB: P(-0.29, 0.16), manoB: P(-0.41, 0.13) });
POSES.crunchArriba = con(POSES.crunchAbajo, { cuello: P(-0.25, 0.18), cabeza: P(-0.32, 0.26), codoA: P(-0.19, 0.29), manoA: P(-0.30, 0.27), codoB: P(-0.20, 0.29), manoB: P(-0.31, 0.27) });
POSES.piernaRectaAbajo = con(POSES.bocaArribaRodillas, { rodillaA: P(0.25, 0.05), pieA: P(0.52, 0.05) });
POSES.piernaRectaArriba = con(POSES.piernaRectaAbajo, { rodillaA: P(0.18, 0.22), pieA: P(0.37, 0.40) });
POSES.pressPechoAbajo = con(POSES.bocaArribaRodillas, { codoA: P(-0.22, 0.02), manoA: P(-0.27, 0.17), codoB: P(-0.24, 0.02), manoB: P(-0.29, 0.17) });
POSES.pressPechoArriba = con(POSES.bocaArribaRodillas, { codoA: P(-0.31, 0.22), manoA: P(-0.31, 0.38), codoB: P(-0.33, 0.22), manoB: P(-0.33, 0.38) });
POSES.depieFrente = { cabeza: P(0, 0.92), cuello: P(0, 0.82), cadera: P(0, 0.52), codoA: P(0.10, 0.67), manoA: P(0.12, 0.51),
  codoB: P(-0.10, 0.67), manoB: P(-0.12, 0.51), rodillaA: P(0.06, 0.27), pieA: P(0.07, 0), rodillaB: P(-0.06, 0.27), pieB: P(-0.07, 0) };
POSES.jumpingAbierto = { cabeza: P(0, 0.97), cuello: P(0, 0.87), cadera: P(0, 0.57), codoA: P(0.14, 1.0), manoA: P(0.20, 1.15),
  codoB: P(-0.14, 1.0), manoB: P(-0.20, 1.15), rodillaA: P(0.13, 0.33), pieA: P(0.24, 0.08), rodillaB: P(-0.13, 0.33), pieB: P(-0.24, 0.08) };
POSES.pressHombrosAbajo = con(POSES.depieFrente, { codoA: P(0.16, 0.80), manoA: P(0.16, 0.95), codoB: P(-0.16, 0.80), manoB: P(-0.16, 0.95) });
POSES.pressHombrosArriba = con(POSES.depieFrente, { codoA: P(0.09, 0.97), manoA: P(0.07, 1.13), codoB: P(-0.09, 0.97), manoB: P(-0.07, 1.13) });
POSES.abduccionPieAfuera = con(POSES.depieFrente, { rodillaA: P(0.15, 0.29), pieA: P(0.27, 0.04), cuello: P(-0.02, 0.82), cabeza: P(-0.03, 0.92) });
POSES.lateralArriba = con(POSES.depieFrente, { codoA: P(0.16, 0.81), manoA: P(0.32, 0.82), codoB: P(-0.16, 0.81), manoB: P(-0.32, 0.82) });
POSES.brazosArriba = con(POSES.depieFrente, { codoA: P(0.08, 0.98), manoA: P(0.05, 1.13), codoB: P(-0.08, 0.98), manoB: P(-0.05, 1.13) });
POSES.inclinacionLateral = con(POSES.brazosArriba, { cuello: P(0.05, 0.81), cabeza: P(0.10, 0.90), codoA: P(0.16, 0.95), manoA: P(0.18, 1.10), codoB: P(0.0, 0.98), manoB: P(0.08, 1.12) });
POSES.curlArriba = con(POSES.depieLado, { manoA: P(0.14, 0.76), manoB: P(0.10, 0.77) });
POSES.remoBrazosAbajo = { cabeza: P(0.27, 0.71), cuello: P(0.18, 0.66), cadera: P(-0.10, 0.50), codoA: P(0.19, 0.50), manoA: P(0.20, 0.34),
  codoB: P(0.17, 0.50), manoB: P(0.18, 0.34), rodillaA: P(0.03, 0.27), pieA: P(0, 0), rodillaB: P(0.01, 0.27), pieB: P(-0.02, 0) };
POSES.remoArriba = con(POSES.remoBrazosAbajo, { codoA: P(0.04, 0.62), manoA: P(0.12, 0.50), codoB: P(0.02, 0.62), manoB: P(0.10, 0.50) });
POSES.bisagraAbajo = { cabeza: P(0.25, 0.69), cuello: P(0.16, 0.64), cadera: P(-0.14, 0.49), codoA: P(0.17, 0.48), manoA: P(0.18, 0.32),
  codoB: P(0.15, 0.48), manoB: P(0.16, 0.32), rodillaA: P(0.02, 0.26), pieA: P(0.03, 0), rodillaB: P(0, 0.26), pieB: P(0, 0) };
POSES.marchaA = con(POSES.depieLado, { rodillaA: P(0.20, 0.40), pieA: P(0.15, 0.14), codoA: P(-0.07, 0.67), manoA: P(-0.12, 0.52), codoB: P(0.07, 0.67), manoB: P(0.17, 0.76) });
POSES.marchaB = con(POSES.depieLado, { rodillaB: P(0.18, 0.40), pieB: P(0.13, 0.14), codoB: P(-0.07, 0.67), manoB: P(-0.12, 0.52), codoA: P(0.07, 0.67), manoA: P(0.17, 0.76) });
POSES.boxeoA = con(POSES.depieLado, { rodillaA: P(0.08, 0.27), pieA: P(0.13, 0), rodillaB: P(-0.06, 0.27), pieB: P(-0.12, 0),
  codoA: P(0.14, 0.79), manoA: P(0.30, 0.80), codoB: P(0.05, 0.68), manoB: P(0.10, 0.82) });
POSES.boxeoB = con(POSES.boxeoA, { codoA: P(0.06, 0.68), manoA: P(0.11, 0.82), codoB: P(0.13, 0.79), manoB: P(0.29, 0.80) });
POSES.colgado = { cabeza: P(0, 1.0), cuello: P(0, 0.90), cadera: P(0, 0.60), codoA: P(0.15, 1.06), manoA: P(0.15, 1.22),
  codoB: P(-0.15, 1.06), manoB: P(-0.15, 1.22), rodillaA: P(0.04, 0.35), pieA: P(0.04, 0.10), rodillaB: P(-0.04, 0.35), pieB: P(-0.04, 0.10) };
POSES.dominadaArriba = { cabeza: P(0, 1.24), cuello: P(0, 1.12), cadera: P(0, 0.82), codoA: P(0.22, 1.04), manoA: P(0.15, 1.22),
  codoB: P(-0.22, 1.04), manoB: P(-0.15, 1.22), rodillaA: P(0.04, 0.57), pieA: P(0.04, 0.32), rodillaB: P(-0.04, 0.57), pieB: P(-0.04, 0.32) };

const PATRONES = {
  sentadilla: [POSES.depieBrazosAdelante, POSES.sentadillaAbajo],
  salto: [POSES.sentadillaAbajo, elevada(POSES.depieBrazosArriba, 0.10)],
  zancada: [POSES.depieLado, POSES.zancadaAbajo],
  flexion: [POSES.flexionArriba, POSES.flexionAbajo],
  plancha: [POSES.plancha, con(POSES.plancha, { cadera: P(-0.01, 0.145), rodillaA: P(-0.26, 0.08), rodillaB: P(-0.26, 0.08) })],
  escaladores: [con(POSES.flexionArriba, { rodillaA: P(0.17, 0.05), pieA: P(-0.08, 0.03) }),
    con(POSES.flexionArriba, { rodillaB: P(0.15, 0.05), pieB: P(-0.10, 0.03), rodillaA: P(-0.25, 0.11), pieA: P(-0.51, 0.02) })],
  puente: [POSES.bocaArribaRodillas, POSES.puenteArriba],
  crunch: [POSES.crunchAbajo, POSES.crunchArriba],
  cuatroApoyos: [POSES.cuatroApoyos, POSES.birdDog],
  superman: [POSES.supermanAbajo, POSES.supermanArriba],
  piernaRecta: [POSES.piernaRectaAbajo, POSES.piernaRectaArriba],
  jumpingJack: [POSES.depieFrente, POSES.jumpingAbierto],
  curl: [POSES.depieLado, POSES.curlArriba],
  pressHombros: [POSES.pressHombrosAbajo, POSES.pressHombrosArriba],
  pressPecho: [POSES.pressPechoAbajo, POSES.pressPechoArriba],
  remo: [POSES.remoBrazosAbajo, POSES.remoArriba],
  lateral: [POSES.depieFrente, POSES.lateralArriba],
  bisagra: [POSES.depieLado, POSES.bisagraAbajo],
  talones: [POSES.depieLado, con(elevada(POSES.depieLado, 0.045), { pieA: P(0.07, 0.01), pieB: P(0.03, 0.01) })],
  marcha: [POSES.marchaA, POSES.marchaB],
  boxeo: [POSES.boxeoA, POSES.boxeoB],
  dominada: [POSES.colgado, POSES.dominadaArriba],
  estiramiento: [POSES.brazosArriba, POSES.inclinacionLateral],
  generico: [POSES.depieFrente, con(elevada(POSES.depieFrente, -0.03), { pieA: P(0.07, 0), pieB: P(-0.07, 0) })],
  patadaGluteo: [POSES.cuatroApoyos, POSES.patadaGluteoArriba],
  abduccionPie: [POSES.depieFrente, POSES.abduccionPieAfuera]
};
const PERIODO = { jumpingJack: 1, escaladores: 1, boxeo: 1, marcha: 1, plancha: 3, estiramiento: 4, salto: 1.4 };
const FRONTAL = new Set(['jumpingJack', 'pressHombros', 'lateral', 'dominada', 'estiramiento', 'generico', 'abduccionPie']);

function patronPara(nombre) {
  const n = normalizar(nombre);
  const t = (...c) => c.some((x) => n.includes(x));
  if (t('colgad', 'colgarse', 'dominada')) return 'dominada';
  if (t('talones elevados')) return 'sentadilla';
  if (t('monster', 'abduccion de pie')) return 'abduccionPie';
  if (t('apertura de banda', 'elevacion frontal', 'brazos en cruz')) return 'lateral';
  if (t('jalon')) return 'remo';
  if (t('tiron entre')) return 'bisagra';
  if (t('despliegue')) return 'plancha';
  if (t('contraccion de cuadriceps')) return 'piernaRecta';
  if (t('barquito')) return 'crunch';
  if (t('patada trasera')) return 'marcha';
  if (t('femoral')) return 'superman';
  if (t('almeja', 'aduccion', 'extension de pierna')) return 'piernaRecta';
  if (t('hidrante')) return 'cuatroApoyos';
  if (t('saltos de tobillo')) return 'talones';
  if (t('patada de gluteo')) return 'patadaGluteo';
  if (t('abduccion de cadera de pie')) return 'abduccionPie';
  if (t('flexion', 'fondos')) return 'flexion';
  if (t('plancha')) return 'plancha';
  if (t('escalador')) return 'escaladores';
  if (t('burpee', 'con salto')) return 'salto';
  if (t('jumping')) return 'jumpingJack';
  if (t('puente', 'hip thrust')) return 'puente';
  if (t('zancada', 'bulgara', 'step-up', 'subida al banco', 'escalon')) return 'zancada';
  if (t('curl')) return 'curl';
  if (t('press de hombros', 'press militar', 'extension de triceps', 'press frances')) return 'pressHombros';
  if (t('press de pecho', 'press de banca', 'aperturas')) return 'pressPecho';
  if (t('remo', 'pajaro', 'patada de triceps')) return 'remo';
  if (t('laterales')) return 'lateral';
  if (t('peso muerto', 'swing', 'buenos dias')) return 'bisagra';
  if (t('crunch', 'bicho muerto', 'giro ruso')) return 'crunch';
  if (t('bird dog', 'gato')) return 'cuatroApoyos';
  if (t('superman')) return 'superman';
  if (t('talones a gluteos')) return 'marcha';
  if (t('talones')) return 'talones';
  if (t('pierna recta', 'abduccion', 'elevacion de piernas')) return 'piernaRecta';
  if (t('boxeo')) return 'boxeo';
  if (t('marcha', 'rodillas al pecho', 'paso lateral', 'caminata', 'granjero')) return 'marcha';
  if (t('sentadilla', 'thruster')) return 'sentadilla';
  if (t('circulos', 'rotacion', 'estiramiento', 'postura del nino', 'angeles', 'retraccion')) return 'estiramiento';
  return 'generico';
}
const esIsometrico = (nombre) => /isometric|barquito|sostenid/.test(normalizar(nombre));

/** Dibuja la figura en un canvas. fase: 0..1 */
function dibujarFigura(canvas, patron, fase, conPeso, color = '#fff') {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const [a, b] = PATRONES[patron] || PATRONES.generico;
  const p = mezcla(a, b, fase);
  const esc = Math.min(w / 1.35, h / 1.38), ox = w / 2, suelo = h - 0.05 * esc;
  const pt = (q) => [ox + q.x * esc, suelo - q.y * esc];
  const grosor = Math.max(0.055 * esc, 2), lejano = FRONTAL.has(patron) ? 0.95 : 0.45;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const linea = (puntos, alfa, ancho) => {
    ctx.globalAlpha = alfa; ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.beginPath();
    puntos.forEach((q, i) => { const [x, y] = pt(q); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
    ctx.stroke();
  };
  // Sombra
  ctx.globalAlpha = 0.18; ctx.fillStyle = color; ctx.beginPath();
  ctx.ellipse(ox + ((p.pieA.x + p.pieB.x) / 2) * esc, suelo, 0.32 * esc, 0.02 * esc, 0, 0, Math.PI * 2); ctx.fill();
  if (patron === 'dominada') linea([P(-0.35, 1.22), P(0.35, 1.22)], 0.7, grosor * 0.7);
  linea([p.cadera, p.rodillaB, p.pieB], lejano, grosor);
  linea([p.cuello, p.codoB, p.manoB], lejano, grosor * 0.85);
  linea([p.cuello, p.cadera], 1, grosor * 1.35);
  linea([p.cadera, p.rodillaA, p.pieA], 1, grosor);
  linea([p.cuello, p.codoA, p.manoA], 1, grosor * 0.85);
  ctx.globalAlpha = 1; ctx.fillStyle = color; ctx.beginPath();
  const [cx, cy] = pt(p.cabeza); ctx.arc(cx, cy, 0.068 * esc, 0, Math.PI * 2); ctx.fill();
  if (conPeso) {
    [[p.manoB, lejano], [p.manoA, 1]].forEach(([m, alfa]) => {
      const [x, y] = pt(m); ctx.globalAlpha = alfa;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - 0.065 * esc, y - 0.03 * esc, 0.13 * esc, 0.06 * esc, 0.02 * esc) : ctx.rect(x - 0.065 * esc, y - 0.03 * esc, 0.13 * esc, 0.06 * esc);
      ctx.fill();
    });
  }
  ctx.globalAlpha = 1;
}

// Bucle de animación: anima todos los canvas con data-patron visibles.
(function animar() {
  const ahora = performance.now() / 1000;
  document.querySelectorAll('canvas[data-patron]').forEach((c) => {
    const patron = c.dataset.patron, periodo = PERIODO[patron] || 2;
    const quieto = c.dataset.quieto === '1', fija = c.dataset.fija;
    const fase = fija != null && fija !== '' ? Number(fija) : quieto ? 0 : (1 - Math.cos(2 * Math.PI * ahora / periodo)) / 2;
    dibujarFigura(c, patron, fase, c.dataset.peso === '1', c.dataset.color || '#fff');
  });
  requestAnimationFrame(animar);
})();

// ───────────────────────── Sonido y voz ─────────────────────────

const avisos = {
  ctx: null,
  activo: localStorage.getItem('fitapp.sonido') !== '0',
  voz: null,
  desbloquear() {
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch (e) { /* sin audio */ }
    if ('speechSynthesis' in window && !this.voz) {
      const elegir = () => {
        const voces = speechSynthesis.getVoices();
        this.voz = voces.find((v) => v.lang === 'es-MX') || voces.find((v) => v.lang === 'es-US') || voces.find((v) => v.lang.startsWith('es')) || null;
      };
      elegir();
      speechSynthesis.onvoiceschanged = elegir;
      // iOS necesita una primera frase dentro del toque del usuario.
      const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u);
    }
  },
  tono(notas) {
    if (!this.activo || !this.ctx) return;
    let t = this.ctx.currentTime;
    for (const [f, d] of notas) {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.4, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(this.ctx.destination); o.start(t); o.stop(t + d + 0.02);
      t += d;
    }
  },
  decir(texto) {
    if (!this.activo || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = this.voz ? this.voz.lang : 'es-MX'; if (this.voz) u.voice = this.voz; u.rate = 1.0;
    speechSynthesis.speak(u);
  },
  inicioSerie(ej, serie, total, detalle, primera) {
    this.tono([[660, 0.12], [880, 0.12], [1320, 0.28]]);
    this.decir(`${primera ? '¡Empezamos! ' : ''}${ej}. Serie ${serie} de ${total}. ${detalle}.`);
  },
  tic() { this.tono([[880, 0.09]]); },
  descanso(seg, sigue) { this.tono([[784, 0.14], [523, 0.24]]); this.decir(`Descanso, ${seg} segundos.${sigue ? ' Sigue: ' + sigue + '.' : ''}`); },
  fin() { this.tono([[523, 0.15], [659, 0.15], [784, 0.15], [1047, 0.45]]); this.decir('¡Rutina terminada! Excelente trabajo.'); },
  detener() { if ('speechSynthesis' in window) speechSynthesis.cancel(); }
};

// ───────────────────────── Pesos por serie ─────────────────────────

function usaCarga(r, ej) {
  if (r.categoria === 'mancuernas' || r.categoria === 'barra') return true;
  const n = normalizar(ej.nombre);
  return /mancuerna|barra|kettlebell|pesa|disco/.test(n) && !/barra fija|dominada/.test(n);
}
const pasoKg = (r, ej) => (r.categoria === 'barra' || normalizar(ej.nombre).includes('barra') ? 2.5 : 1);

function ultimaVez(nombre) {
  const lista = S.series.filter((s) => s.ejercicio === nombre);
  if (!lista.length) return [];
  const ultima = lista.reduce((a, b) => (a.fecha > b.fecha ? a : b));
  const k = claveFecha(new Date(ultima.fecha));
  return lista.filter((s) => claveFecha(new Date(s.fecha)) === k).sort((a, b) => a.serie - b.serie);
}
function cumplioTodo(ej) {
  const s = ultimaVez(ej.nombre);
  return s.length >= ej.series && s.every((x) => x.repeticiones >= Math.max(x.repeticionesMeta, 1));
}

// ───────────────────────── Plan semanal ─────────────────────────

const diaPlan = (n) => S.plan.find((d) => d.diaSemana === n);
const esDescanso = (d) => !d || (!d.codigoRutina && d.actividad === 'Descanso');
const tituloDia = (d) => (d && d.codigoRutina && rutina(d.codigoRutina) ? rutina(d.codigoRutina).nombre : d ? d.actividad : 'Sin plan');
const hoyNumero = () => new Date().getDay() + 1;

function fechaDelDia(n) {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const iHoy = DIAS_ORDEN.indexOf(hoyNumero()), iDia = DIAS_ORDEN.indexOf(n);
  hoy.setDate(hoy.getDate() + iDia - iHoy);
  return claveFecha(hoy);
}
function hechoEn(k) { return sesionesDe(k).length > 0; }
function estadoDia(n) {
  const k = fechaDelDia(n), d = diaPlan(n), hoy = claveFecha();
  if (hechoEn(k)) return 'hecho';
  if (esDescanso(d)) return 'descanso';
  if (k > hoy) return 'futuro';
  if (k === hoy) return 'pendiente';
  return 'fallado';
}
const ICONO_ESTADO = { hecho: '✅', pendiente: '⏳', fallado: '❌', descanso: '😴', futuro: '⚪️' };

function asignarDia(n, codigoRutina, actividad) {
  let d = diaPlan(n);
  if (!d) { d = { diaSemana: n, codigoRutina: '', actividad: 'Descanso' }; S.plan.push(d); }
  d.codigoRutina = codigoRutina || '';
  d.actividad = codigoRutina ? '' : (actividad || 'Descanso');
}

function crearPlanSugerido() {
  const semana = Math.floor(Date.now() / (7 * 864e5));
  const elegir = (f, evitar = '') => {
    const ops = RUTINAS.filter((r) => f(r) && r.duracion_minutos <= 35 && r.nivel !== 'avanzado' && r.codigo !== evitar)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
    return ops.length ? ops[semana % ops.length] : null;
  };
  const gluteo = elegir((r) => r.zonas.includes('gluteos'));
  const piernas = elegir((r) => r.zonas.includes('piernas'), gluteo && gluteo.codigo);
  const completo = elegir((r) => r.zonas.includes('cuerpo_completo') || r.objetivo === 'bajar_peso');
  const resistencia = elegir((r) => r.objetivo === 'resistencia' || r.categoria === 'bajo_impacto');
  const movilidad = elegir((r) => r.objetivo === 'movilidad');
  const plan = [[2, gluteo, 'Caminata 30 min'], [3, null, 'Caminata 30 min'], [4, piernas, 'Caminata 30 min'],
    [5, movilidad, 'Estiramientos 15 min'], [6, completo, 'Caminata 30 min'], [7, resistencia, 'Cardio suave o escaleras 20 min'], [1, null, 'Descanso']];
  for (const [n, r, alt] of plan) asignarDia(n, r ? r.codigo : '', alt);
}

// ───────────────────────── Pantalla Entrenar ─────────────────────────

window.pantallaEntrenar = function () {
  if (!RUTINAS.length) return `<div class="pantalla"><div class="titulo-grande">Entrenar</div><div class="vacio">No se pudieron cargar las rutinas. Abre la app con internet una vez.</div></div>`;
  return `<div class="pantalla pila">
    <div class="titulo-grande">Entrenar</div>
    ${tarjetaPlan()}
    <div class="subtitulo" style="margin-top:8px">Rutinas</div>
    <input type="search" id="buscar-rutina" placeholder="Buscar: glúteo medio, 20 min, banda…" value="${esc(filtros.texto)}" autocomplete="off">
    <div class="chips" style="flex-wrap:nowrap;overflow-x:auto;padding-bottom:4px">
      <button class="chip ${!filtros.objetivo ? 'sel' : ''}" data-a="f-objetivo" data-v="">Todas</button>
      ${Object.entries(OBJETIVOS_RUTINA).map(([k, v]) => `<button class="chip ${filtros.objetivo === k ? 'sel' : ''}" style="white-space:nowrap" data-a="f-objetivo" data-v="${k}">${v}</button>`).join('')}
    </div>
    <div class="cuadricula">
      <select id="f-zona" aria-label="Zona"><option value="">Todas las zonas</option>${Object.entries(ZONAS).map(([k, v]) => `<option value="${k}" ${filtros.zona === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
      <select id="f-cat" aria-label="Tipo"><option value="">Todo el equipo</option>${Object.entries(CATEGORIAS).map(([k, v]) => `<option value="${k}" ${filtros.categoria === k ? 'selected' : ''}>${v.icono} ${v.nombre}</option>`).join('')}</select>
    </div>
    <div class="segmentos">${[[0, 'Todas'], [15, '≤ 15 min'], [20, '≤ 20 min'], [30, '≤ 30 min']].map(([v, t]) =>
      `<button class="${filtros.duracion === v ? 'sel' : ''}" data-a="f-duracion" data-v="${v}">${t}</button>`).join('')}</div>
    <div id="lista-rutinas" class="pila">${listaRutinas()}</div>
    ${sesionesRecientes()}
  </div>`;
};

function rutinasFiltradas() {
  const palabras = normalizar(filtros.texto).split(/\s+/).filter(Boolean);
  return RUTINAS.filter((r) => {
    if (filtros.objetivo && r.objetivo !== filtros.objetivo) return false;
    if (filtros.zona && !r.zonas.includes(filtros.zona)) return false;
    if (filtros.categoria && r.categoria !== filtros.categoria) return false;
    if (filtros.duracion && r.duracion_minutos > filtros.duracion) return false;
    if (palabras.length) {
      const texto = normalizar(`${r.nombre} ${r.descripcion} ${r.zonas.map((z) => ZONAS[z]).join(' ')} ${catInfo(r.categoria).nombre} ${r.duracion_minutos} min ${r.ejercicios.map((e) => e.grupo_muscular + ' ' + e.nombre).join(' ')}`);
      return palabras.every((p) => texto.includes(p));
    }
    return true;
  });
}

function listaRutinas() {
  const lista = rutinasFiltradas();
  if (!lista.length) return '<div class="vacio">No hay rutinas con esos filtros.</div>';
  return `<div class="mini suave">${lista.length} rutinas</div>` + lista.map(tarjetaRutina).join('');
}

function tarjetaRutina(r) {
  const c = catInfo(r.categoria);
  return `<button class="tarjeta fila" style="text-align:left;align-items:flex-start" data-a="abrir-rutina" data-codigo="${r.codigo}">
    <div class="icono-caja" style="background:${c.g}">${c.icono}</div>
    <div class="crece"><div class="negrita">${esc(r.nombre)}</div>
      <div class="peq suave">${r.duracion_minutos} min · ${NIVELES[r.nivel] || r.nivel} · ${r.ejercicios.length} ejercicios</div>
      <div class="mini" style="margin-top:4px;color:var(--violeta)">${r.zonas.map((z) => ZONAS[z]).join(' · ')}</div></div>
    <span class="tenue">›</span></button>`;
}

function sesionesRecientes() {
  const lista = S.sesiones.slice().sort((a, b) => (a.fecha < b.fecha ? 1 : -1)).slice(0, 5);
  if (!lista.length) return '';
  return `<div class="subtitulo">Últimos entrenamientos</div><div class="lista">${lista.map((s) =>
    `<div class="item"><span class="punto" style="background:rgba(34,196,122,.15)">🔥</span><span class="crece"><div class="nombre">${esc(s.nombre)}</div>
      <div class="mini suave">${new Date(s.fecha).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })} · ${r0(s.minutos)} min · ${r0(s.calorias)} kcal</div></span></div>`).join('')}</div>`;
}

function tarjetaPlan() {
  if (!S.plan.length) {
    return `<button class="tarjeta fila" style="text-align:left" data-a="abrir-plan">
      <div class="icono-caja" style="background:linear-gradient(135deg,#2F8CFF,#9B5CFF)">📅</div>
      <div class="crece"><div class="negrita">Arma tu plan semanal</div><div class="peq suave">Te digo qué toca cada día y te aviso si te saltaste uno.</div></div><span class="tenue">›</span></button>`;
  }
  const hoy = diaPlan(hoyNumero()), r = hoy && hoy.codigoRutina ? rutina(hoy.codigoRutina) : null;
  const hecho = hechoEn(claveFecha());
  const activos = DIAS_ORDEN.filter((n) => !esDescanso(diaPlan(n)));
  const cumplidos = activos.filter((n) => estadoDia(n) === 'hecho').length;
  const ayerN = ((hoyNumero() + 5) % 7) + 1, ayer = diaPlan(ayerN);
  const avisoAyer = !esDescanso(ayer) && !hechoEn(sumarDias(claveFecha(), -1)) ? `Ayer te tocaba «${esc(tituloDia(ayer))}». No pasa nada: hazla hoy o sigue con el plan.` : '';
  return `<div class="portada" style="background:linear-gradient(135deg,#2F8CFF,#9B5CFF)">
    <div class="fila entre"><span class="peq negrita" style="opacity:.9">📅 Hoy toca</span><button class="peq negrita" style="color:#fff" data-a="abrir-plan">Editar plan</button></div>
    <div style="font-size:22px;font-weight:800;margin:6px 0 10px">${esc(tituloDia(hoy))}</div>
    ${hecho ? '<div class="negrita">✅ ¡Hecho por hoy!</div>'
      : r ? `<button class="boton blanco" data-a="abrir-rutina" data-codigo="${r.codigo}">▶ Empezar · ${r.duracion_minutos} min</button>`
        : !esDescanso(hoy) ? '<button class="boton blanco" data-a="abrir-actividad">＋ Registrar actividad</button>' : '<div class="peq">Día de descanso: recupérate 😴</div>'}
    <div class="fila" style="margin-top:14px;justify-content:space-between">${DIAS_ORDEN.map((n) =>
      `<div class="centro" style="flex:1"><div class="mini negrita" style="opacity:${n === hoyNumero() ? 1 : 0.75}">${CORTO_DIA[n - 1]}</div>
        <div style="margin-top:4px;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.92);display:inline-flex;align-items:center;justify-content:center;font-size:16px">${ICONO_ESTADO[estadoDia(n)]}</div></div>`).join('')}</div>
    <div class="peq negrita" style="margin-top:10px;opacity:.92">Esta semana: ${cumplidos} de ${activos.length} días cumplidos</div>
    ${avisoAyer ? `<div class="peq" style="margin-top:10px;padding:10px;border-radius:12px;background:rgba(255,255,255,.18)">💬 ${avisoAyer}</div>` : ''}
  </div>`;
}

// ───────────────────────── Hoja: detalle de rutina ─────────────────────────

VISTAS_EXTRA.rutina = function (h) {
  const r = rutina(h.codigo), c = catInfo(r.categoria), peso = S.perfil.pesoActualKg;
  return cabecera(r.nombre, '‹ Atrás') + `<div class="hoja-cuerpo pila">
    <div class="portada" style="background:${c.g}">
      <div class="fila"><span style="font-size:34px">${c.icono}</span><div class="crece"><div class="negrita" style="font-size:20px">${esc(r.nombre)}</div>
        <div class="peq" style="opacity:.92">${c.nombre} · ${NIVELES[r.nivel] || r.nivel}</div></div></div>
      <div class="peq" style="margin-top:10px;opacity:.95">${esc(r.descripcion)}</div>
      <div class="macros"><div class="macro"><div class="mini">Duración</div><b>${r.duracion_minutos}</b> <span class="mini">min</span></div>
        <div class="macro"><div class="mini">Ejercicios</div><b>${r.ejercicios.length}</b></div>
        <div class="macro"><div class="mini">Quemarás ≈</div><b>${kcalEstimadas(r, peso)}</b> <span class="mini">kcal</span></div></div>
    </div>
    <button class="boton" style="background:${c.g}" data-a="empezar-rutina" data-codigo="${r.codigo}">▶ Empezar rutina</button>
    <div class="subtitulo">Ejercicios</div>
    ${r.ejercicios.map((e, i) => {
      const patron = patronPara(e.nombre), u = ultimaVez(e.nombre);
      return `<details class="tarjeta">
        <summary class="fila" style="list-style:none;cursor:pointer">
          <div class="icono-caja" style="background:${c.g};font-size:16px;font-weight:800">${i + 1}</div>
          <div class="crece"><div class="negrita">${esc(e.nombre)}</div>
            <div class="peq suave">${e.series} × ${e.duracion_segundos > 0 ? e.duracion_segundos + ' s' : e.repeticiones + ' reps'} · descanso ${e.descanso_segundos} s</div>
            <div class="mini" style="color:var(--violeta)">${esc(e.grupo_muscular)}</div></div><span class="tenue">⌄</span></summary>
        <div class="pila" style="margin-top:10px">
          <div style="background:${c.g};border-radius:16px;height:170px"><canvas data-patron="${patron}" ${esIsometrico(e.nombre) ? 'data-fija="1"' : ''} data-peso="${usaCarga(r, e) && patron !== 'dominada' ? 1 : 0}" style="width:100%;height:100%"></canvas></div>
          <div class="peq">${esc(e.instrucciones)}</div>
          ${u.length ? `<div class="mini suave">La vez pasada: ${u.some((s) => s.kg > 0) ? fmt(Math.max(...u.map((s) => s.kg))) + ' kg × ' : ''}${u.map((s) => s.repeticiones).join(', ')}</div>` : ''}
        </div></details>`;
    }).join('')}
  </div>`;
};

// ───────────────────────── Sesión guiada ─────────────────────────

let SES = null;      // estado de la sesión en curso
let relojSesion = null;
let candado = null;  // pantalla siempre encendida

function iniciarSesion(r) {
  avisos.desbloquear();
  SES = { r, i: 0, serie: 1, fase: 'trabajando', restantes: 0, total: 0, entrenados: 0, pausado: false, hechas: [], completadas: 0,
    kg: 0, reps: 0, ultimo: Date.now(), guardado: false };
  prepararTrabajo();
  anunciar(true);
  abrir({ tipo: 'sesion', clase: 'hoja-sesion', alPintar: () => {} });
  clearInterval(relojSesion);
  relojSesion = setInterval(tick, 250);
  if (navigator.wakeLock) navigator.wakeLock.request('screen').then((c) => { candado = c; }).catch(() => {});
}

const ejActual = () => SES && SES.r.ejercicios[SES.i];
const totalSeries = () => SES.r.ejercicios.reduce((a, e) => a + e.series, 0);

function prepararTrabajo() {
  const e = ejActual();
  if (!e) return;
  if (e.duracion_segundos > 0) { SES.restantes = e.duracion_segundos; SES.total = e.duracion_segundos; }
  else {
    SES.restantes = 0; SES.total = 0; SES.reps = e.repeticiones;
    if (SES.serie === 1) {
      const u = ultimaVez(e.nombre), ant = u.length ? Math.max(...u.map((s) => s.kg)) : 0;
      SES.kg = cumplioTodo(e) && ant > 0 ? ant + pasoKg(SES.r, e) : ant;
    }
  }
}

function anunciar(primera) {
  const e = ejActual();
  avisos.inicioSerie(e.nombre, SES.serie, e.series, e.duracion_segundos > 0 ? `${e.duracion_segundos} segundos` : `${e.repeticiones} repeticiones`, primera);
}

function siguienteNombre() {
  const e = ejActual();
  if (!e) return '';
  if (SES.serie < e.series) return e.nombre;
  const s = SES.r.ejercicios[SES.i + 1];
  return s ? s.nombre : '';
}

function tick() {
  if (!SES) return;
  const ahora = Date.now();
  if (ahora - SES.ultimo < 1000) return;
  const pasos = Math.floor((ahora - SES.ultimo) / 1000);
  SES.ultimo += pasos * 1000;
  if (SES.pausado || SES.fase === 'terminado') return;
  for (let k = 0; k < pasos; k++) {
    SES.entrenados++;
    const e = ejActual();
    if (SES.fase === 'trabajando' && e && e.duracion_segundos > 0) {
      SES.restantes--;
      if (SES.restantes >= 1 && SES.restantes <= 3) avisos.tic();
      if (SES.restantes <= 0) { completarSerie(); return; }
    } else if (SES.fase === 'descansando') {
      SES.restantes--;
      if (SES.restantes >= 1 && SES.restantes <= 3) avisos.tic();
      if (SES.restantes <= 0) { terminarDescanso(); return; }
    }
  }
  actualizarReloj();
}

function completarSerie() {
  const e = ejActual();
  if (!e || SES.fase !== 'trabajando') return;
  SES.completadas++;
  if (!(e.duracion_segundos > 0)) {
    SES.hechas.push({ ejercicio: e.nombre, serie: SES.serie, kg: usaCarga(SES.r, e) ? SES.kg : 0, repeticiones: SES.reps, repeticionesMeta: e.repeticiones });
  }
  const ultimaSerie = SES.serie >= e.series, ultimoEj = SES.i >= SES.r.ejercicios.length - 1;
  if (ultimaSerie && ultimoEj) return terminarSesion();
  if (e.descanso_segundos > 0) {
    SES.fase = 'descansando'; SES.restantes = e.descanso_segundos; SES.total = e.descanso_segundos;
    avisos.descanso(e.descanso_segundos, siguienteNombre());
    pintarHoja();
  } else terminarDescanso();
}

function terminarDescanso() {
  const e = ejActual();
  if (SES.serie >= e.series) { SES.i++; SES.serie = 1; } else SES.serie++;
  if (!ejActual()) return terminarSesion();
  SES.fase = 'trabajando';
  prepararTrabajo(); anunciar(false); pintarHoja();
}

function saltarEjercicio() {
  const e = ejActual();
  SES.completadas += Math.max(e.series - SES.serie + 1, 0);
  if (SES.i >= SES.r.ejercicios.length - 1) return terminarSesion();
  SES.i++; SES.serie = 1; SES.fase = 'trabajando';
  prepararTrabajo(); anunciar(false); pintarHoja();
}

function terminarSesion() {
  if (SES.fase !== 'terminado') avisos.fin();
  SES.fase = 'terminado'; SES.pausado = false;
  pintarHoja();
}

function minutosSesion() {
  return clamp(SES.entrenados / 60, 1, Math.max(SES.r.duracion_minutos, 1) * 1.5);
}
function kcalSesion() {
  const met = SES.r.ejercicios.reduce((a, e) => a + (e.met || 3.5), 0) / SES.r.ejercicios.length;
  return r0(met * 3.5 * S.perfil.pesoActualKg / 200 * minutosSesion());
}

function guardarSesion() {
  if (SES.guardado) return;
  const ahora = iso(new Date()), kcal = kcalSesion();
  for (const h of SES.hechas) S.series.push(Object.assign({ fecha: ahora, codigoRutina: SES.r.codigo }, h));
  S.sesiones.push({ fecha: ahora, nombre: SES.r.nombre, categoria: catInfo(SES.r.categoria).nombre, minutos: Math.round(minutosSesion()),
    calorias: kcal, codigoRutina: SES.r.codigo });
  const d = dia(claveFecha(), true);
  d.caloriasEntrenamiento = r1((d.caloriasEntrenamiento || 0) + kcal);
  SES.guardado = true;
  guardar();
}

function cerrarSesion() {
  clearInterval(relojSesion); relojSesion = null;
  avisos.detener();
  if (candado) { candado.release().catch(() => {}); candado = null; }
  SES = null;
  cerrarTodo();
}

function actualizarReloj() {
  const el = $('#reloj'), barra = $('#reloj-anillo');
  if (el) el.textContent = formatoTiempo(SES.restantes);
  if (barra && SES.total > 0) {
    const c = Number(barra.dataset.c);
    barra.setAttribute('stroke-dashoffset', String(c * (1 - SES.restantes / SES.total)));
  }
  const t = $('#tiempo-total');
  if (t) t.textContent = formatoTiempo(SES.entrenados);
}

function anilloReloj(tam = 170) {
  const g = 12, r = (tam - g) / 2, c = 2 * Math.PI * r, f = SES.total ? SES.restantes / SES.total : 0;
  return `<div style="position:relative;width:${tam}px;height:${tam}px;margin:0 auto"><svg width="${tam}" height="${tam}" style="transform:rotate(-90deg)">
    <circle cx="${tam / 2}" cy="${tam / 2}" r="${r}" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="${g}"/>
    <circle id="reloj-anillo" data-c="${c}" cx="${tam / 2}" cy="${tam / 2}" r="${r}" fill="none" stroke="#fff" stroke-width="${g}" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - f)}" style="transition:stroke-dashoffset .25s linear"/></svg>
    <div id="reloj" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:44px;font-weight:800" class="num">${formatoTiempo(SES.restantes)}</div></div>`;
}

VISTAS_EXTRA.sesion = function () {
  if (!SES) return '';
  const r = SES.r, c = catInfo(r.categoria), e = ejActual();
  const progreso = SES.fase === 'terminado' ? 1 : SES.completadas / totalSeries();
  const cab = `<div class="hoja-cab" style="background:transparent;color:#fff">
    <button style="color:#fff" data-a="salir-sesion">✕ Salir</button>
    <h2 style="color:#fff">${esc(r.nombre)}</h2>
    <button style="color:#fff" data-a="sonido">${avisos.activo ? '🔊' : '🔇'}</button></div>
    <div class="hoja-cuerpo" style="padding-top:0"><div class="barra" style="margin:0 0 6px"><i style="width:${progreso * 100}%"></i></div>
    <div class="mini" style="opacity:.85">⏱ <span id="tiempo-total">${formatoTiempo(SES.entrenados)}</span> · ${SES.completadas}/${totalSeries()} series</div></div>`;

  let cuerpo;
  if (SES.fase === 'terminado') {
    cuerpo = `<div class="pila centro" style="padding-top:20px">
      <div style="font-size:64px">🏆</div><div style="font-size:28px;font-weight:800">¡Rutina terminada!</div>
      <div class="macros" style="text-align:left"><div class="macro"><div class="mini">Tiempo</div><b>${formatoTiempo(SES.entrenados)}</b></div>
        <div class="macro"><div class="mini">Calorías</div><b>${kcalSesion()}</b> <span class="mini">kcal</span></div>
        <div class="macro"><div class="mini">Series</div><b>${SES.completadas}</b></div></div>
      ${SES.hechas.length ? `<div class="peq" style="opacity:.9">${SES.hechas.length} series con peso y repeticiones se guardarán en «Progreso de fuerza».</div>` : ''}
      <button class="boton blanco" data-a="guardar-sesion">💾 Guardar entrenamiento</button>
      <button class="boton" style="background:rgba(255,255,255,.18);box-shadow:none" data-a="descartar-sesion">Salir sin guardar</button></div>`;
  } else if (SES.fase === 'descansando') {
    const sig = siguienteNombre();
    cuerpo = `<div class="pila centro" style="padding-top:10px">
      <div style="font-size:15px;font-weight:700;opacity:.9">😮‍💨 DESCANSO</div>${anilloReloj(190)}
      ${sig ? `<div><div class="mini" style="opacity:.85">Sigue</div><div class="negrita" style="font-size:18px">${esc(sig)}</div></div>
        <div style="height:150px"><canvas data-patron="${patronPara(sig)}" data-quieto="0" ${esIsometrico(sig) ? 'data-fija="1"' : ''} style="width:100%;height:100%"></canvas></div>` : ''}
      <div class="fila"><button class="boton" style="background:rgba(255,255,255,.18);box-shadow:none" data-a="mas-descanso">+15 s</button>
        <button class="boton blanco" data-a="saltar-descanso">Saltar descanso ›</button></div></div>`;
  } else {
    const porTiempo = e.duracion_segundos > 0, patron = patronPara(e.nombre), carga = usaCarga(r, e);
    const u = ultimaVez(e.nombre), kgAnt = u.length ? Math.max(...u.map((s) => s.kg)) : 0;
    const sugerencia = cumplioTodo(e) ? (carga && kgAnt > 0 ? `¡Hiciste todo la vez pasada! Hoy prueba con ${fmt(kgAnt + pasoKg(r, e))} kg.` : '¡Hiciste todo la vez pasada! Hoy suma 2 repeticiones o hazlo más lento.') : '';
    cuerpo = `<div class="pila" style="padding-top:4px">
      <div style="height:${porTiempo ? 190 : 220}px"><canvas data-patron="${patron}" ${esIsometrico(e.nombre) ? 'data-fija="1"' : ''} data-peso="${carga && patron !== 'dominada' ? 1 : 0}" style="width:100%;height:100%"></canvas></div>
      <div class="centro"><div class="mini negrita" style="opacity:.85">EJERCICIO ${SES.i + 1} DE ${r.ejercicios.length} · ${esc(e.grupo_muscular)}</div>
        <div style="font-size:24px;font-weight:800;margin:4px 0">${esc(e.nombre)}</div>
        <div class="negrita">Serie ${SES.serie} de ${e.series}</div></div>
      ${porTiempo ? anilloReloj(150) : `<div class="centro" style="font-size:52px;font-weight:800">${e.repeticiones} <span style="font-size:20px">reps</span></div>`}
      <div class="peq" style="opacity:.92;background:rgba(255,255,255,.14);padding:10px 12px;border-radius:14px">${esc(e.instrucciones)}</div>
      ${!porTiempo ? `<div class="pila" style="background:rgba(255,255,255,.15);padding:12px;border-radius:18px;gap:10px">
        ${u.length ? `<div class="peq negrita">🕘 La vez pasada: ${u.some((s) => s.kg > 0) ? fmt(kgAnt) + ' kg × ' : ''}${u.map((s) => s.repeticiones).join(', ')}</div>` : ''}
        ${sugerencia ? `<div class="peq negrita">⬆️ ${sugerencia}</div>` : ''}
        ${carga ? `<div class="fila entre"><span class="negrita">Peso</span><span class="fila"><button class="circulo" style="background:rgba(255,255,255,.22)" data-a="kg" data-n="${-pasoKg(r, e)}">−</button>
          <b class="num" id="kg-ses" style="min-width:70px;text-align:center;font-size:20px">${fmt(SES.kg)} kg</b><button class="circulo" style="background:rgba(255,255,255,.22)" data-a="kg" data-n="${pasoKg(r, e)}">+</button></span></div>` : ''}
        <div class="fila entre"><span class="negrita">Repeticiones hechas</span><span class="fila"><button class="circulo" style="background:rgba(255,255,255,.22)" data-a="reps" data-n="-1">−</button>
          <b class="num" id="reps-ses" style="min-width:70px;text-align:center;font-size:20px">${SES.reps}</b><button class="circulo" style="background:rgba(255,255,255,.22)" data-a="reps" data-n="1">+</button></span></div>
      </div>` : ''}
      ${SES.pausado ? '<div class="centro negrita">⏸ En pausa</div>' : ''}
      ${porTiempo ? '' : '<button class="boton blanco" data-a="serie-hecha">✓ Serie completada</button>'}
      <div class="fila"><button class="boton" style="background:rgba(255,255,255,.18);box-shadow:none" data-a="pausa">${SES.pausado ? '▶ Seguir' : '⏸ Pausa'}</button>
        <button class="boton" style="background:rgba(255,255,255,.18);box-shadow:none" data-a="saltar-ej">Saltar ›</button></div></div>`;
  }
  return `<div style="min-height:100%;background:${c.g};color:#fff">${cab}<div class="hoja-cuerpo">${cuerpo}</div></div>`;
};

// ───────────────────────── Hoja: plan semanal ─────────────────────────

VISTAS_EXTRA.plan = function () {
  const opciones = (n) => {
    const d = diaPlan(n), actual = d ? (d.codigoRutina || 'act:' + d.actividad) : 'act:Descanso';
    let html = `<optgroup label="Sin rutina">${ACTIVIDADES_LIBRES.map((a) => `<option value="act:${a}" ${actual === 'act:' + a ? 'selected' : ''}>${a}</option>`).join('')}</optgroup>`;
    for (const [k, c] of Object.entries(CATEGORIAS)) {
      const rs = RUTINAS.filter((r) => r.categoria === k);
      html += `<optgroup label="${c.nombre}">${rs.map((r) => `<option value="${r.codigo}" ${actual === r.codigo ? 'selected' : ''}>${esc(r.nombre)} · ${r.duracion_minutos} min</option>`).join('')}</optgroup>`;
    }
    return html;
  };
  return cabecera('Plan semanal', 'Listo') + `<div class="hoja-cuerpo pila">
    <button class="boton" style="background:linear-gradient(135deg,#9B5CFF,#FF4F8B)" data-a="plan-sugerido">🪄 Crear plan sugerido</button>
    <div class="peq suave">3 días de fuerza (glúteo, piernas y cuerpo completo), caminatas, cardio suave, movilidad y un día de descanso. Cambia cualquier día abajo.</div>
    ${DIAS_ORDEN.map((n) => `<div class="tarjeta pila" style="gap:8px">
      <div class="fila entre"><span class="negrita">${NOMBRE_DIA[n - 1]}${n === hoyNumero() ? ' · hoy' : ''}</span><span>${ICONO_ESTADO[estadoDia(n)]}</span></div>
      <select data-plan="${n}">${opciones(n)}</select></div>`).join('')}
    ${S.plan.length ? '<button class="boton peligro" data-a="borrar-plan">Borrar plan</button>' : ''}
  </div>`;
};

// ───────────────────────── Progreso de fuerza ─────────────────────────

EXTRA_PROGRESO.push(function () {
  if (!S.series.length) return '';
  const porEj = {};
  for (const s of S.series) (porEj[s.ejercicio] = porEj[s.ejercicio] || []).push(s);
  const lista = Object.entries(porEj).map(([nombre, regs]) => {
    const ultima = regs.reduce((a, b) => (a.fecha > b.fecha ? a : b));
    return { nombre, regs, ultima, mejor: Math.max(...regs.map((r) => r.kg)) };
  }).sort((a, b) => (a.ultima.fecha < b.ultima.fecha ? 1 : -1));
  return `<div class="tarjeta"><h3>💪 Progreso de fuerza</h3><div class="lista" style="box-shadow:none">${lista.map((x) => {
    const u = ultimaVez(x.nombre);
    return `<button class="item" style="padding-left:0;padding-right:0" data-a="abrir-fuerza" data-nombre="${esc(x.nombre)}"><span class="crece"><div class="nombre">${esc(x.nombre)}</div>
      <div class="mini suave">Última: ${x.mejor > 0 ? fmt(Math.max(...u.map((s) => s.kg))) + ' kg × ' : ''}${u.map((s) => s.repeticiones).join(', ')}${x.mejor > 0 ? ' · mejor ' + fmt(x.mejor) + ' kg' : ''}</div></span><span class="tenue">›</span></button>`;
  }).join('')}</div><div class="mini suave">Cuando completes todas las repeticiones de todas las series, sube un poco el peso la próxima vez.</div></div>`;
});

VISTAS_EXTRA.fuerza = function (h) {
  const regs = S.series.filter((s) => s.ejercicio === h.nombre);
  const usaPeso = regs.some((r) => r.kg > 0);
  const porDia = {};
  for (const r of regs) { const k = claveFecha(new Date(r.fecha)); (porDia[k] = porDia[k] || []).push(r); }
  const dias = Object.keys(porDia).sort();
  const puntos = dias.map((k) => ({ y: usaPeso ? Math.max(...porDia[k].map((r) => r.kg)) : Math.max(...porDia[k].map((r) => r.repeticiones)) }));
  return cabecera(h.nombre, '‹ Atrás') + `<div class="hoja-cuerpo pila">
    <div class="tarjeta"><h3>${usaPeso ? 'Peso máximo por sesión (kg)' : 'Repeticiones máximas por sesión'}</h3>
      ${puntos.length >= 2 ? grafica(puntos, { color: '#22C47A', etiquetas: dias.map((k) => fechaDeClave(k).toLocaleDateString('es', { day: 'numeric', month: 'short' })) }) : '<div class="vacio peq">Con 2 o más sesiones verás la gráfica.</div>'}</div>
    <div class="lista">${dias.slice().reverse().map((k) => `<div class="item"><span class="crece"><div class="nombre">${esc(textoFecha(k))}</div>
      <div class="mini suave">${porDia[k].sort((a, b) => a.serie - b.serie).map((s) => (s.kg > 0 ? fmt(s.kg) + '×' : '') + s.repeticiones).join(' · ')}</div></span></div>`).join('')}</div>
  </div>`;
};

// ───────────────────────── Acciones ─────────────────────────

Object.assign(acciones, {
  'abrir-rutina': (b) => abrir({ tipo: 'rutina', codigo: b.dataset.codigo }),
  'empezar-rutina': (b) => iniciarSesion(rutina(b.dataset.codigo)),
  'f-objetivo': (b) => { filtros.objetivo = b.dataset.v; pintar(); },
  'f-duracion': (b) => { filtros.duracion = Number(b.dataset.v); pintar(); },
  'abrir-plan': () => abrir({ tipo: 'plan' }),
  'plan-sugerido': () => {
    if (S.plan.length && !confirm('¿Reemplazar tu plan actual por el sugerido?')) return;
    crearPlanSugerido(); guardar(); pintarHoja(); pintar(); aviso('Plan creado');
  },
  'borrar-plan': () => { if (!confirm('¿Borrar el plan semanal?')) return; S.plan = []; guardar(); pintarHoja(); pintar(); },
  'abrir-fuerza': (b) => abrir({ tipo: 'fuerza', nombre: b.dataset.nombre }),

  // Sesión
  'serie-hecha': () => completarSerie(),
  'saltar-descanso': () => { if (SES && SES.fase === 'descansando') terminarDescanso(); },
  'mas-descanso': () => { SES.restantes += 15; SES.total += 15; actualizarReloj(); },
  'saltar-ej': () => { if (confirm('¿Saltar este ejercicio?')) saltarEjercicio(); },
  pausa: () => { SES.pausado = !SES.pausado; pintarHoja(); },
  sonido: () => { avisos.activo = !avisos.activo; localStorage.setItem('fitapp.sonido', avisos.activo ? '1' : '0'); if (!avisos.activo) avisos.detener(); pintarHoja(); },
  kg: (b) => { SES.kg = clamp(r1(SES.kg + Number(b.dataset.n)), 0, 300); $('#kg-ses').textContent = fmt(SES.kg) + ' kg'; },
  reps: (b) => { SES.reps = clamp(SES.reps + Number(b.dataset.n), 0, 100); $('#reps-ses').textContent = SES.reps; },
  'salir-sesion': () => {
    if (SES.fase === 'terminado') return cerrarSesion();
    if (!confirm('¿Terminar la rutina ahora?')) return;
    terminarSesion();
  },
  'guardar-sesion': () => { const kcal = kcalSesion(); guardarSesion(); cerrarSesion(); ui.tab = 'entrenar'; pintar(); aviso(`Entrenamiento guardado: ${kcal} kcal`); },
  'descartar-sesion': () => { if (confirm('¿Salir sin guardar este entrenamiento?')) cerrarSesion(); }
});

// Filtros y plan (inputs)
document.addEventListener('input', (ev) => {
  if (ev.target.id === 'buscar-rutina') {
    filtros.texto = ev.target.value;
    const l = $('#lista-rutinas'); if (l) l.innerHTML = listaRutinas();
  }
});
document.addEventListener('change', (ev) => {
  const el = ev.target;
  if (el.id === 'f-zona') { filtros.zona = el.value; pintar(); }
  if (el.id === 'f-cat') { filtros.categoria = el.value; pintar(); }
  if (el.dataset.plan) {
    const v = el.value;
    if (v.startsWith('act:')) asignarDia(Number(el.dataset.plan), '', v.slice(4)); else asignarDia(Number(el.dataset.plan), v, '');
    guardar(); pintarHoja(); pintar();
  }
});

// Si la pantalla se apaga y vuelve, recuperar el candado.
document.addEventListener('visibilitychange', () => {
  if (SES && document.visibilityState === 'visible' && navigator.wakeLock && !candado) {
    navigator.wakeLock.request('screen').then((c) => { candado = c; }).catch(() => {});
  }
});
