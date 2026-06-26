import { Injectable } from '@angular/core';

export type PrioridadRecomendacion = 'alta' | 'media' | 'baja';

export interface RecomendacionInput {
  codigo_finca: string;
  nombre_finca: string;
  codigo_cultivo: string;
  nombre_cultivo: string;
  etapa: string;
  humedad: string;
  condicion_suelo: string;
  vigor: string;
  plaga_visible: boolean;
}

export interface RecomendacionAccion {
  id: string;
  titulo: string;
  detalle: string;
  categoria: string;
  prioridad: PrioridadRecomendacion;
  plazo: string;
  icono: string;
}

@Injectable({
  providedIn: 'root'
})
export class RecomendacionesService {
  generarRecomendaciones(input: RecomendacionInput): RecomendacionAccion[] {
    return this.predecirAcciones(input);
  }

  private predecirAcciones(input: RecomendacionInput): RecomendacionAccion[] {
    const acciones: RecomendacionAccion[] = [];

    if (input.plaga_visible) {
      acciones.push({
        id: 'control-plagas',
        titulo: 'Revisar focos de plaga',
        detalle: 'Inspecciona hojas, tallos y frutos; registra zonas afectadas y aplica control integrado segun el cultivo.',
        categoria: 'Sanidad',
        prioridad: 'alta',
        plazo: 'Hoy',
        icono: 'bug-outline'
      });
    }

    if (input.humedad === 'baja') {
      acciones.push({
        id: 'riego-refuerzo',
        titulo: 'Programar riego de refuerzo',
        detalle: 'Aumenta la frecuencia de riego y verifica humedad en la zona de raices antes de fertilizar.',
        categoria: 'Agua',
        prioridad: 'alta',
        plazo: '24 horas',
        icono: 'water-outline'
      });
    }

    if (input.humedad === 'alta') {
      acciones.push({
        id: 'drenaje',
        titulo: 'Mejorar drenaje del lote',
        detalle: 'Abre salidas de agua, evita labores pesadas y revisa signos de pudricion o amarillamiento.',
        categoria: 'Suelo',
        prioridad: 'media',
        plazo: '48 horas',
        icono: 'trail-sign-outline'
      });
    }

    if (input.condicion_suelo === 'compactado') {
      acciones.push({
        id: 'descompactacion',
        titulo: 'Aflojar zonas compactadas',
        detalle: 'Realiza aireacion superficial o labranza localizada sin afectar raices principales.',
        categoria: 'Suelo',
        prioridad: 'media',
        plazo: 'Esta semana',
        icono: 'construct-outline'
      });
    }

    if (input.vigor === 'bajo') {
      acciones.push({
        id: 'nutricion',
        titulo: 'Evaluar nutricion del cultivo',
        detalle: 'Revisa color, crecimiento y antecedentes de fertilizacion; prioriza analisis de suelo o enmiendas.',
        categoria: 'Nutricion',
        prioridad: 'media',
        plazo: '3 dias',
        icono: 'leaf-outline'
      });
    }

    if (input.etapa === 'Germinacion' || input.etapa === 'Crecimiento vegetativo') {
      acciones.push({
        id: 'control-malezas',
        titulo: 'Controlar malezas tempranas',
        detalle: 'Mantiene libre la linea de siembra para reducir competencia por luz, agua y nutrientes.',
        categoria: 'Manejo',
        prioridad: 'media',
        plazo: 'Esta semana',
        icono: 'cut-outline'
      });
    }

    if (input.etapa === 'Floracion' || input.etapa === 'Fructificacion') {
      acciones.push({
        id: 'seguimiento-productivo',
        titulo: 'Monitorear carga productiva',
        detalle: 'Registra floracion, cuaje y estado de frutos para ajustar riego, nutricion y proteccion sanitaria.',
        categoria: 'Produccion',
        prioridad: 'media',
        plazo: '2 dias',
        icono: 'analytics-outline'
      });
    }

    if (acciones.length === 0) {
      acciones.push({
        id: 'monitoreo',
        titulo: 'Mantener monitoreo semanal',
        detalle: 'Toma nuevas fotos, mide humedad del suelo y actualiza la etapa para detectar cambios a tiempo.',
        categoria: 'Seguimiento',
        prioridad: 'baja',
        plazo: '7 dias',
        icono: 'clipboard-outline'
      });
    }

    return acciones;
  }
}
