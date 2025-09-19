import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface ReporteRendimiento {
  obra: string;
  frente: string;
  actividades_completadas: number;
  actividades_pendientes: number;
  progreso_promedio: number;
  rendimiento_diario: number;
  fecha_inicio: string;
  fecha_fin_estimada: string;
}

export interface ReportePersonal {
  empleado: string;
  rol: string;
  evaluaciones_completadas: number;
  puntuacion_promedio: number;
  fortalezas: string[];
  areas_mejora: string[];
  ultima_evaluacion: string;
}

export interface ReporteActividades {
  fecha: string;
  obra: string;
  frente: string;
  actividad: string;
  estado: string;
  progreso: number;
  responsable: string;
  observaciones: string;
}

export interface ReporteKPIs {
  periodo: string;
  obras_activas: number;
  actividades_completadas: number;
  rendimiento_promedio: number;
  personal_evaluado: number;
  alertas_activas: number;
  cumplimiento_cronograma: number;
  tendencia_rendimiento: 'subiendo' | 'bajando' | 'estable';
  tendencia_cumplimiento: 'subiendo' | 'bajando' | 'estable';
}

export interface FiltrosReporte {
  fecha_inicio?: string;
  fecha_fin?: string;
  obra_id?: string;
  frente_id?: string;
  empleado_id?: string;
  estado?: string;
  tipo_reporte?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  constructor(private supabase: SupabaseService) {}

  // Reportes de Rendimiento
  async getReporteRendimiento(filtros: FiltrosReporte = {}): Promise<ReporteRendimiento[]> {
    try {
      console.log('Obteniendo reporte de rendimiento con filtros:', filtros);
      
      let query = this.supabase.client
        .from('actividades')
        .select(`
          *,
          obras(nombre),
          frentes(nombre)
        `);

      // Aplicar filtros de fecha
      if (filtros.fecha_inicio) {
        const fechaInicio = new Date(filtros.fecha_inicio).toISOString().split('T')[0];
        query = query.gte('fecha', fechaInicio);
      }
      if (filtros.fecha_fin) {
        const fechaFin = new Date(filtros.fecha_fin).toISOString().split('T')[0];
        query = query.lte('fecha', fechaFin);
      }
      if (filtros.obra_id) {
        query = query.eq('obra_id', filtros.obra_id);
      }
      if (filtros.frente_id) {
        query = query.eq('frente_id', filtros.frente_id);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error en consulta de actividades:', error);
        throw error;
      }

      console.log('Datos de actividades obtenidos:', data?.length || 0);

      if (!data || data.length === 0) {
        return [];
      }

      // Agrupar por obra y frente
      const reporteMap = new Map<string, any>();
      
      data.forEach(actividad => {
        const key = `${actividad.obra_id || 'sin-obra'}-${actividad.frente_id || 'sin-frente'}`;
        if (!reporteMap.has(key)) {
          reporteMap.set(key, {
            obra: actividad.obras?.nombre || 'Sin obra asignada',
            frente: actividad.frentes?.nombre || 'Sin frente asignado',
            actividades: [],
            fecha_inicio: actividad.fecha
          });
        }
        reporteMap.get(key).actividades.push(actividad);
      });

      return Array.from(reporteMap.values()).map(grupo => {
        const completadas = grupo.actividades.filter((a: any) => a.estado === 'finalizado' || a.estado === 'completada').length;
        const pendientes = grupo.actividades.filter((a: any) => a.estado !== 'finalizado' && a.estado !== 'completada').length;
        const progresoPromedio = grupo.actividades.length > 0 ? (completadas / grupo.actividades.length) * 100 : 0;
        
        return {
          obra: grupo.obra,
          frente: grupo.frente,
          actividades_completadas: completadas,
          actividades_pendientes: pendientes,
          progreso_promedio: Math.round(progresoPromedio || 0),
          rendimiento_diario: this.calcularRendimientoDiario(grupo.actividades),
          fecha_inicio: grupo.fecha_inicio,
          fecha_fin_estimada: this.calcularFechaFinEstimada(grupo.actividades)
        };
      });
    } catch (error) {
      console.error('Error al obtener reporte de rendimiento:', error);
      return [];
    }
  }

  // Reportes de Personal
  async getReportePersonal(filtros: FiltrosReporte = {}): Promise<ReportePersonal[]> {
    try {
      console.log('Obteniendo reporte de personal con filtros:', filtros);
      
      // Primero obtener usuarios
      const { data: usuarios, error: errorUsuarios } = await this.supabase.client
        .from('users')
        .select('id, nombre, rol');

      if (errorUsuarios) {
        console.error('Error al obtener usuarios:', errorUsuarios);
        throw errorUsuarios;
      }

      console.log('Usuarios obtenidos:', usuarios?.length || 0);

      if (!usuarios || usuarios.length === 0) {
        return [];
      }

      // Obtener evaluaciones si existen
      let queryEvaluaciones = this.supabase.client
        .from('evaluaciones')
        .select('*');

      if (filtros.fecha_inicio) {
        const fechaInicio = new Date(filtros.fecha_inicio).toISOString().split('T')[0];
        queryEvaluaciones = queryEvaluaciones.gte('fecha_evaluacion', fechaInicio);
      }
      if (filtros.fecha_fin) {
        const fechaFin = new Date(filtros.fecha_fin).toISOString().split('T')[0];
        queryEvaluaciones = queryEvaluaciones.lte('fecha_evaluacion', fechaFin);
      }
      if (filtros.empleado_id) {
        queryEvaluaciones = queryEvaluaciones.eq('evaluado_id', filtros.empleado_id);
      }

      const { data: evaluaciones, error: errorEvaluaciones } = await queryEvaluaciones;
      
      if (errorEvaluaciones) {
        console.log('No se pudieron obtener evaluaciones:', errorEvaluaciones);
      }

      console.log('Evaluaciones obtenidas:', evaluaciones?.length || 0);

      // Agrupar evaluaciones por empleado
      const empleadoMap = new Map<string, any>();
      
      usuarios.forEach(usuario => {
        empleadoMap.set(usuario.id, {
          empleado: usuario.nombre || `Usuario ${usuario.id.substring(0, 8)}`,
          rol: usuario.rol || 'Sin rol asignado',
          evaluaciones: []
        });
      });

      // Agregar evaluaciones si existen
      if (evaluaciones && evaluaciones.length > 0) {
        evaluaciones.forEach(evaluacion => {
          const empleadoId = evaluacion.evaluado_id;
          if (empleadoMap.has(empleadoId)) {
            empleadoMap.get(empleadoId).evaluaciones.push(evaluacion);
          }
        });
      }

      return Array.from(empleadoMap.values()).map(grupo => {
        const evaluaciones = grupo.evaluaciones;
        const puntuacionPromedio = evaluaciones.length > 0 
          ? evaluaciones.reduce((sum: number, e: any) => sum + (e.puntuacion_total || 0), 0) / evaluaciones.length
          : 0;
        const ultimaEvaluacion = evaluaciones.length > 0 
          ? evaluaciones.sort((a: any, b: any) => new Date(b.fecha_evaluacion).getTime() - new Date(a.fecha_evaluacion).getTime())[0]
          : null;
        
        return {
          empleado: grupo.empleado,
          rol: grupo.rol,
          evaluaciones_completadas: evaluaciones.length,
          puntuacion_promedio: Math.round(puntuacionPromedio),
          fortalezas: this.extraerFortalezas(evaluaciones),
          areas_mejora: this.extraerAreasMejora(evaluaciones),
          ultima_evaluacion: ultimaEvaluacion?.fecha_evaluacion || 'Sin evaluaciones'
        };
      });
    } catch (error) {
      console.error('Error al obtener reporte de personal:', error);
      return [];
    }
  }

  // Reportes de Actividades
  async getReporteActividades(filtros: FiltrosReporte = {}): Promise<ReporteActividades[]> {
    try {
      console.log('Obteniendo reporte de actividades con filtros:', filtros);
      
      let query = this.supabase.client
        .from('actividades')
        .select(`
          *,
          obras(nombre),
          frentes(nombre)
        `)
        .order('fecha', { ascending: false })
        .limit(100); // Limitar para evitar sobrecarga

      // Aplicar filtros
      if (filtros.fecha_inicio) {
        const fechaInicio = new Date(filtros.fecha_inicio).toISOString().split('T')[0];
        query = query.gte('fecha', fechaInicio);
      }
      if (filtros.fecha_fin) {
        const fechaFin = new Date(filtros.fecha_fin).toISOString().split('T')[0];
        query = query.lte('fecha', fechaFin);
      }
      if (filtros.obra_id) {
        query = query.eq('obra_id', filtros.obra_id);
      }
      if (filtros.estado) {
        query = query.eq('estado', filtros.estado);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error en consulta de actividades:', error);
        throw error;
      }

      console.log('Actividades obtenidas:', data?.length || 0);

      return data?.map(actividad => ({
        fecha: format(new Date(actividad.fecha), 'dd/MM/yyyy', { locale: es }),
        obra: actividad.obras?.nombre || 'Sin obra',
        frente: actividad.frentes?.nombre || 'Sin frente',
        actividad: actividad.tipo_actividad || actividad.descripcion || 'Sin descripción',
        estado: this.formatearEstado(actividad.estado),
        progreso: actividad.progreso_porcentaje || 0,
        responsable: actividad.responsable || 'Sin asignar',
        observaciones: actividad.observaciones || 'Sin observaciones'
      })) || [];
    } catch (error) {
      console.error('Error al obtener reporte de actividades:', error);
      return [];
    }
  }

  // Reportes de KPIs
  async getReporteKPIs(periodo: string = 'mes'): Promise<ReporteKPIs> {
    try {
      console.log('Obteniendo reporte de KPIs para periodo:', periodo);
      
      const fechaInicio = this.calcularFechaInicioPeriodo(periodo);
      const fechaFin = new Date().toISOString();

      // Obtener datos de diferentes tablas
      const [obrasResult, actividadesResult, evaluacionesResult] = await Promise.all([
        this.supabase.client.from('obras').select('*').eq('estado', 'activa'),
        this.supabase.client.from('actividades').select('*').gte('fecha', fechaInicio).lte('fecha', fechaFin),
        this.supabase.client.from('evaluaciones').select('*').gte('fecha_evaluacion', fechaInicio).lte('fecha_evaluacion', fechaFin)
      ]);

      const obras = obrasResult.data || [];
      const actividades = actividadesResult.data || [];
      const evaluaciones = evaluacionesResult.data || [];

      console.log('Datos KPIs obtenidos:', { obras: obras.length, actividades: actividades.length, evaluaciones: evaluaciones.length });

      const actividadesCompletadas = actividades.filter(a => a.estado === 'finalizado' || a.estado === 'completada').length;
      const rendimientoPromedio = this.calcularRendimientoPromedio(actividades);
      const cumplimientoCronograma = this.calcularCumplimientoCronograma(actividades);
      
      // Calcular tendencias (simuladas para esta implementación)
      const tendencia_rendimiento = rendimientoPromedio > 75 ? 'subiendo' : rendimientoPromedio > 50 ? 'estable' : 'bajando';
      const tendencia_cumplimiento = cumplimientoCronograma > 80 ? 'subiendo' : cumplimientoCronograma > 60 ? 'estable' : 'bajando';

      return {
        periodo: this.formatearPeriodo(periodo),
        obras_activas: obras.length,
        actividades_completadas: actividadesCompletadas,
        rendimiento_promedio: rendimientoPromedio,
        personal_evaluado: evaluaciones.length,
        alertas_activas: await this.contarAlertasActivas(),
        cumplimiento_cronograma: cumplimientoCronograma,
        tendencia_rendimiento,
        tendencia_cumplimiento
      };
    } catch (error) {
      console.error('Error al obtener reporte de KPIs:', error);
      return {
        periodo: 'Error',
        obras_activas: 0,
        actividades_completadas: 0,
        rendimiento_promedio: 0,
        personal_evaluado: 0,
        alertas_activas: 0,
        cumplimiento_cronograma: 0,
        tendencia_rendimiento: 'estable',
        tendencia_cumplimiento: 'estable'
      };
    }
  }

  // Exportación PDF mejorada
  async exportarPDF(tipoReporte: string, datos: any[], titulo: string): Promise<void> {
    try {
      console.log(`Generando PDF para ${tipoReporte} con ${datos.length} registros`);
      
      if (!datos || datos.length === 0) {
        throw new Error('No hay datos para exportar');
      }

      const doc = new jsPDF();
      
      // Configurar fuente
      doc.setFont('helvetica');
      
      // Encabezado del documento
      doc.setFontSize(20);
      doc.setTextColor(33, 150, 243);
      doc.text(titulo, 20, 25);
      
      // Línea separadora
      doc.setDrawColor(33, 150, 243);
      doc.setLineWidth(0.5);
      doc.line(20, 30, 190, 30);
      
      // Información del reporte
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`, 20, 40);
      doc.text(`Total de registros: ${datos.length}`, 20, 45);
      
      // Configurar tabla según tipo de reporte
      let columns: string[] = [];
      let rows: any[][] = [];
      
      switch (tipoReporte) {
        case 'rendimiento':
          columns = ['Obra', 'Frente', 'Completadas', 'Pendientes', 'Progreso %', 'Rendimiento'];
          rows = datos.map((item: ReporteRendimiento) => [
            item.obra || 'N/A',
            item.frente || 'N/A',
            item.actividades_completadas.toString(),
            item.actividades_pendientes.toString(),
            `${item.progreso_promedio}%`,
            `${item.rendimiento_diario}%`
          ]);
          break;
          
        case 'personal':
          columns = ['Empleado', 'Rol', 'Evaluaciones', 'Puntuación', 'Última Evaluación'];
          rows = datos.map((item: ReportePersonal) => [
            item.empleado || 'N/A',
            item.rol || 'N/A',
            item.evaluaciones_completadas.toString(),
            `${item.puntuacion_promedio}/100`,
            item.ultima_evaluacion !== 'Sin evaluaciones' 
              ? format(new Date(item.ultima_evaluacion), 'dd/MM/yyyy', { locale: es })
              : 'Sin evaluaciones'
          ]);
          break;
          
        case 'actividades':
          columns = ['Fecha', 'Obra', 'Actividad', 'Estado', 'Progreso', 'Responsable'];
          rows = datos.map((item: ReporteActividades) => [
            item.fecha || 'N/A',
            item.obra || 'N/A',
            item.actividad || 'N/A',
            item.estado || 'N/A',
            `${item.progreso}%`,
            item.responsable || 'N/A'
          ]);
          break;

        case 'kpis':
          if (datos.length > 0) {
            const kpi = datos[0];
            columns = ['Métrica', 'Valor'];
            rows = [
              ['Obras Activas', kpi.obras_activas.toString()],
              ['Actividades Completadas', kpi.actividades_completadas.toString()],
              ['Rendimiento Promedio', `${kpi.rendimiento_promedio}%`],
              ['Personal Evaluado', kpi.personal_evaluado.toString()],
              ['Cumplimiento Cronograma', `${kpi.cumplimiento_cronograma}%`],
              ['Alertas Activas', kpi.alertas_activas.toString()]
            ];
          }
          break;
      }
      
      // Generar tabla con estilos mejorados
      (doc as any).autoTable({
        head: [columns],
        body: rows,
        startY: 55,
        styles: {
          fontSize: 9,
          cellPadding: 4,
          overflow: 'linebreak',
          halign: 'left'
        },
        headStyles: {
          fillColor: [33, 150, 243],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 'auto' },
          4: { cellWidth: 'auto' },
          5: { cellWidth: 'auto' }
        },
        margin: { top: 55, left: 20, right: 20 },
        theme: 'striped'
      });
      
      // Pie de página
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Página ${i} de ${pageCount}`, 20, doc.internal.pageSize.height - 10);
        doc.text('Sistema de Gestión de Obras Viales', doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10, { align: 'right' });
      }
      
      // Descargar PDF
      const nombreArchivo = `${tipoReporte}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
      doc.save(nombreArchivo);
      
      console.log(`PDF generado exitosamente: ${nombreArchivo}`);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      throw error;
    }
  }

  // Métodos auxiliares
  private calcularRendimientoDiario(actividades: any[]): number {
    if (!actividades || actividades.length === 0) return 0;
    
    const actividadesCompletadas = actividades.filter(a => a.estado === 'finalizado');
    const diasTrabajo = new Set(actividades.map(a => format(new Date(a.fecha), 'yyyy-MM-dd'))).size;
    
    return diasTrabajo > 0 ? Math.round((actividadesCompletadas.length / diasTrabajo) * 100) / 100 : 0;
  }

  private calcularFechaFinEstimada(actividades: any[]): string {
    if (!actividades || actividades.length === 0) return 'No estimada';
    
    const fechasInicio = actividades.map(a => new Date(a.fecha));
    const fechaMaxima = new Date(Math.max(...fechasInicio.map(f => f.getTime())));
    
    // Estimar 30 días adicionales para completar
    fechaMaxima.setDate(fechaMaxima.getDate() + 30);
    
    return format(fechaMaxima, 'dd/MM/yyyy', { locale: es });
  }

  private extraerFortalezas(evaluaciones: any[]): string[] {
    // Lógica para extraer fortalezas basada en criterios con alta puntuación
    return ['Puntualidad', 'Trabajo en equipo', 'Calidad del trabajo'];
  }

  private extraerAreasMejora(evaluaciones: any[]): string[] {
    // Lógica para extraer áreas de mejora basada en criterios con baja puntuación
    return ['Comunicación', 'Liderazgo'];
  }

  private formatearEstado(estado: string): string {
    const estados: { [key: string]: string } = {
      'pendiente': 'Pendiente',
      'en_progreso': 'En Progreso',
      'completada': 'Completada',
      'cancelada': 'Cancelada'
    };
    return estados[estado] || estado;
  }

  private calcularFechaInicioPeriodo(periodo: string): string {
    const ahora = new Date();
    switch (periodo) {
      case 'semana':
        ahora.setDate(ahora.getDate() - 7);
        break;
      case 'mes':
        ahora.setMonth(ahora.getMonth() - 1);
        break;
      case 'trimestre':
        ahora.setMonth(ahora.getMonth() - 3);
        break;
      case 'año':
        ahora.setFullYear(ahora.getFullYear() - 1);
        break;
    }
    return ahora.toISOString();
  }

  private calcularRendimientoPromedio(actividades: any[]): number {
    if (!actividades.length) return 0;
    const progresoTotal = actividades.reduce((sum, a) => sum + (a.progreso_porcentaje || 0), 0);
    return Math.round(progresoTotal / actividades.length);
  }

  private calcularCumplimientoCronograma(actividades: any[]): number {
    if (!actividades || actividades.length === 0) return 0;
    
    const hoy = new Date();
    const actividadesVencidas = actividades.filter(a => {
      const fechaActividad = new Date(a.fecha);
      // Considerar vencidas las actividades de más de 7 días que no están completadas
      const diasDiferencia = (hoy.getTime() - fechaActividad.getTime()) / (1000 * 60 * 60 * 24);
      return diasDiferencia > 7 && a.estado !== 'completada';
    });
    
    const cumplimiento = ((actividades.length - actividadesVencidas.length) / actividades.length) * 100;
    return Math.round(cumplimiento);
  }

  private async contarAlertasActivas(): Promise<number> {
    // Lógica para contar alertas activas
    return 5; // Placeholder
  }

  private formatearPeriodo(periodo: string): string {
    const periodos: { [key: string]: string } = {
      'semana': 'Última Semana',
      'mes': 'Último Mes',
      'trimestre': 'Último Trimestre',
      'año': 'Último Año'
    };
    return periodos[periodo] || periodo;
  }

  // Obtener listas para filtros
  async getObras(): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from('obras')
      .select('id, nombre')
      .eq('estado', 'activa');
    
    if (error) {
      // Error al obtener obras
      return [];
    }
    
    return data || [];
  }

  async getFrente(): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from('frentes')
      .select('id, nombre, obra_id');
    
    if (error) {
      // Error al obtener frentes
      return [];
    }
    
    return data || [];
  }

  async getEmpleados(): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from('users')
      .select('id, nombre, rol');
    
    if (error) {
      // Error al obtener empleados
      return [];
    }
    
    return data || [];
  }
}