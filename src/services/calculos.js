import {
  BPC,
  APORTES_JUBILATORIOS,
  TOPE_APORTES_JUBILATORIOS,
  APORTES_FONASA_HASTA25BPC,
  APORTES_FONASA_DESDE25BPC,
  APORTE_FRL,
  IRPF_FRANJAS,
  INCREMENTO_INGRESOS_GRAVADOS,
  ADICIONAL_FONDO_SOLIDARIDAD,
  TASA_DEDUCCIONES_DESDE15BPC,
  TASA_DEDUCCIONES_HASTA15BPC,
  DEDUCCION_HIJO_SIN_DISCAPACIDAD,
  DEDUCCION_HIJO_CON_DISCAPACIDAD,
} from "../data/constants";

/**
 * @typedef {Object} AportesBPS
 * @property {number} aportesJubilatorios - Aportes jubilatorios.
 * @property {number} aportesFONASA - Aportes FONASA.
 * @property {number} aporteFRL - Aportes FRL.
 *
 * @typedef {Object} DetalleIRPF
 * @property {Array<number>} impuestoFranja - Arreglo que en la posición i tiene el impuesto a pagar correpondiente a
 *  la i-ésima franja de IRPF.
 * @property {number} deducciones - Cantidad de monto a deducir (antes de aplicar la tasa de 8 o 10%).
 * @property {number} tasaDeducciones - Tasa de deducciones IRPF.
 *
 * @typedef {Object} ImpuestoIRPF
 * @property {DetalleIRPF} detalleIRPF - Detalle del IRPF a pagar.
 * @property {number} totalIRPF - Total del IRPF a pagar.
 */

/**
 * Funcion que calcula los aportes al BPS.
 * @param {number} salarioNominal - Salario nominal en pesos.
 * @param {boolean} tieneHijos - True si tiene hijos a cargo, false en caso contrario.
 * @param {boolean} tieneConyuge - True si tiene conyuge a cargo, false en caso contrario.
 *
 * @returns {AportesBPS} - Un objeto que tiene los aportes jubilatorios, FONASA y FRL calculados.
 */
export const calcularAportesBPS = (salarioNominal, tieneHijos, tieneConyuge) => {
  // Calcular que valores usar en base al salario nominal en BPC
  const salarioEnBPC = salarioNominal / BPC;
  let valoresFonasa = null;
  if (salarioEnBPC > 2.5) valoresFonasa = APORTES_FONASA_DESDE25BPC;
  else valoresFonasa = APORTES_FONASA_HASTA25BPC;
  const calculusBehaviour = 'Different'
  // Calcular porcentaje fonasa
  let porcentajeFonasa = valoresFonasa.base;
  if (tieneHijos) porcentajeFonasa += valoresFonasa.hijos;
  if (tieneConyuge) porcentajeFonasa += valoresFonasa.conyuge;

  // Calcular valores de retorno
  const aportesJubilatorios = Math.min(TOPE_APORTES_JUBILATORIOS, salarioNominal) * APORTES_JUBILATORIOS * 0.01;
  const aportesFONASA = salarioNominal * porcentajeFonasa * 0.01;
  const aporteFRL = salarioNominal * APORTE_FRL * 0.01;
  return { aportesJubilatorios, aportesFONASA, aporteFRL };
};

/**
 *
 * @param {number} salarioNominal - Salario nominal.
 * @param {number} factorDeduccionPersonasACargo - Factor por el que se multiplica la deduccion correspondiente a
 *   las personas a cargo.
 * @param {number} cantHijosSinDiscapacidad - Cantida de hijos sin discapacidad.
 * @param {number} cantHijosConDiscapacidad - Cantida de hijos con discapacidad.
 * @param {number} aportesJubilatorios - Aportes jubilatorios.
 * @param {number} aportesFONASA - Aportes FONASA.
 * @param {number} aporteFRL - Aporte FRL.
 * @param {number} aportesFondoSolidaridad - Cantidad de BPC que se aportan al Fondo de Solidaridad.
 * @param {boolean} adicionalFondoSolidaridad - True si corresponde aportar adicional al Fondo de Solidaridad.
 * @param {number} aportesCJPPU - Aportes a la Caja de Profesionales Universitarios.
 * @param {number} otrasDeducciones - Otras deducciones.
 *
 * @returns {ImpuestoIRPF} - El monto total de IRPF y los detalles de las distintas franjas y deducciones.
 */
export const calcularIPRF = (
  salarioNominal,
  factorDeduccionPersonasACargo,
  cantHijosSinDiscapacidad,
  cantHijosConDiscapacidad,
  aportesJubilatorios,
  aportesFONASA,
  aporteFRL,
  aportesFondoSolidaridad,
  adicionalFondoSolidaridad,
  aportesCJPPU,
  otrasDeducciones
) => {
  // info sobre deducciones
  // https://www.dgi.gub.uy/wdgi/page?2,rentas-de-trabajo-160,preguntas-frecuentes-ampliacion,O,es,0,PAG;CONC;1017;8;D;cuales-son-las-deducciones-personales-admitidas-en-la-liquidacion-del-irpf-33486;3;PAG;
  const salarioEnBPC = salarioNominal / BPC;
  let tasaDeducciones = null;
  if (salarioEnBPC > 15) tasaDeducciones = TASA_DEDUCCIONES_DESDE15BPC;
  else tasaDeducciones = TASA_DEDUCCIONES_HASTA15BPC;

  // Calcular si hay que aplicar el aumento a ingresos gravados Seguridad Social
  if (salarioEnBPC > 10) salarioNominal *= 1 + INCREMENTO_INGRESOS_GRAVADOS * 0.01;

  // Cantidad deducida del IRPF por los hijos
  const deduccionesHijos =
    factorDeduccionPersonasACargo *
    (cantHijosSinDiscapacidad * DEDUCCION_HIJO_SIN_DISCAPACIDAD +
      cantHijosConDiscapacidad * DEDUCCION_HIJO_CON_DISCAPACIDAD);

  const aporteAdicionalFondoSolidaridad = adicionalFondoSolidaridad ? ADICIONAL_FONDO_SOLIDARIDAD : 0;

  const deducciones =
    deduccionesHijos +
    aportesJubilatorios +
    aportesFONASA +
    aporteFRL +
    (aportesFondoSolidaridad * BPC) / 12 +
    aporteAdicionalFondoSolidaridad +
    aportesCJPPU +
    otrasDeducciones;

  // Cantidad de impuesto de IRPF de cada franja
  const detalleIRPF = { impuestoFranja: [], deducciones, tasaDeducciones };

  IRPF_FRANJAS.forEach((franja) => {
    const hasta = franja.hasta !== 0 ? franja.hasta : 999;
    if (salarioNominal > franja.desde * BPC) {
      const impuesto = (Math.min(hasta * BPC, salarioNominal) - franja.desde * BPC) * franja.tasa * 0.01;
      detalleIRPF.impuestoFranja.push(impuesto);
    } else {
      detalleIRPF.impuestoFranja.push(0);
    }
  });

  const totalIRPF = Math.max(
    0,
    detalleIRPF.impuestoFranja.reduce((a, b) => a + b, 0) - deducciones * tasaDeducciones * 0.01
  );

  return { detalleIRPF, totalIRPF };
};

/**
 * Calcular los impuestos de BPS e IRPF. Los resultados devueltos tienen a lo sumo 2 decimales.
 *
 * @param {number} salarioNominal - Salario nominal en pesos.
 * @param {boolean} tieneHijos - True si tiene hijos a cargo, false en caso contrario.
 * @param {boolean} tieneConyuge - True si tiene conyuge a cargo, false en caso contrario.
 * @param {number} factorDeduccionPersonasACargo - Factor por el que se multiplica la deduccion correspondiente a
 *   las personas a cargo.
 * @param {number} cantHijosSinDiscapacidad - Cantida de hijos sin discapacidad.
 * @param {number} cantHijosConDiscapacidad - Cantida de hijos con discapacidad.
 * @param {number} aportesFondoSolidaridad - Cantidad de BPC que se aportan al Fondo de Solidaridad.
 * @param {boolean} adicionalFondoSolidaridad - True si corresponde aportar adicional al Fondo de Solidaridad.
 * @param {number} aportesCJPPU - Aportes a la Caja de Profesionales Universitarios.
 * @param {number} otrasDeducciones - Otras deducciones.
 *
 */
const calcularImpuestos = (
  salarioNominal,
  tieneHijos,
  tieneConyuge,
  factorDeduccionPersonasACargo,
  cantHijosSinDiscapacidad,
  cantHijosConDiscapacidad,
  aportesFondoSolidaridad,
  adicionalFondoSolidaridad,
  aportesCJPPU,
  otrasDeducciones
) => {
  const { aportesJubilatorios, aportesFONASA, aporteFRL } = calcularAportesBPS(
    salarioNominal,
    tieneHijos,
    tieneConyuge
  );

  const { detalleIRPF, totalIRPF } = calcularIPRF(
    salarioNominal,
    factorDeduccionPersonasACargo,
    cantHijosSinDiscapacidad,
    cantHijosConDiscapacidad,
    aportesJubilatorios,
    aportesFONASA,
    aporteFRL,
    aportesFondoSolidaridad,
    adicionalFondoSolidaridad,
    aportesCJPPU,
    otrasDeducciones
  );
  const salarioLiquido = salarioNominal - aportesJubilatorios - aportesFONASA - aporteFRL - totalIRPF;

  // Redondear todos los valores a dos numeros decimales, dejandolos como numeros.
  const salarioLiquidoRedondeado = Number(salarioLiquido.toFixed(2));
  const aportesJubilatoriosRedondeado = Number(aportesJubilatorios.toFixed(2));
  const aportesFONASARedondeado = Number(aportesFONASA.toFixed(2));
  const aporteFRLRedondeado = Number(aporteFRL.toFixed(2));

  const detalleIRPFRedondeado = {
    impuestoFranja: detalleIRPF.impuestoFranja.map((n) => Number(n.toFixed(2))),
    deducciones: Number(detalleIRPF.deducciones.toFixed(2)),
    tasaDeducciones: detalleIRPF.tasaDeducciones,
  };
  const totalIRPFRedondeado = Number(totalIRPF.toFixed(2));

  return {
    salarioLiquido: salarioLiquidoRedondeado,
    aportesJubilatorios: aportesJubilatoriosRedondeado,
    aportesFONASA: aportesFONASARedondeado,
    aporteFRL: aporteFRLRedondeado,
    detalleIRPF: detalleIRPFRedondeado,
    totalIRPF: totalIRPFRedondeado,
  };
};

export default calcularImpuestos;
