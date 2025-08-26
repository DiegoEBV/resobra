import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import { Report, ReportItem, Project } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() { }

  // Exportar a PDF
  async exportToPDF(report: Report, reportItems: any[]): Promise<void> {
    console.log('🔍 Export Service - exportToPDF iniciado');
    console.log('📋 Report recibido:', report);
    console.log('📊 ReportItems recibidos:', reportItems);
    console.log('📈 Cantidad de items:', reportItems?.length || 0);
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Portada
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORME DE AVANCE DE OBRA', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 20;
    doc.setFontSize(16);
    doc.text(report.project?.name || 'Proyecto', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Número de Informe: ${report.report_number}`, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 10;
    doc.text(`Fecha: ${new Date(report.report_date).toLocaleDateString('es-ES')}`, pageWidth / 2, yPosition, { align: 'center' });
    
    if (report.period_start && report.period_end) {
      yPosition += 10;
      doc.text(`Período: ${new Date(report.period_start).toLocaleDateString('es-ES')} - ${new Date(report.period_end).toLocaleDateString('es-ES')}`, pageWidth / 2, yPosition, { align: 'center' });
    }

    // Información del proyecto
    yPosition += 30;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DEL PROYECTO', 20, yPosition);
    
    yPosition += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    if (report.project?.location) {
      doc.text(`Ubicación: ${report.project.location}`, 20, yPosition);
      yPosition += 8;
    }
    
    if (report.project?.contractor) {
      doc.text(`Contratista: ${report.project.contractor}`, 20, yPosition);
      yPosition += 8;
    }
    
    if (report.project?.supervisor) {
      doc.text(`Supervisor: ${report.project.supervisor}`, 20, yPosition);
      yPosition += 8;
    }

    // Nueva página para el contenido
    doc.addPage();
    yPosition = 20;

    // Índice
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ÍNDICE', 20, yPosition);
    
    yPosition += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('1. Información del Proyecto ........................... 1', 20, yPosition);
    yPosition += 8;
    doc.text('2. Partidas Ejecutadas ................................. 2', 20, yPosition);
    yPosition += 8;
    doc.text('3. Resumen de Avance .................................. 3', 20, yPosition);

    // Nueva página para partidas
    doc.addPage();
    yPosition = 20;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PARTIDAS EJECUTADAS', 20, yPosition);
    
    yPosition += 20;

    // Tabla de partidas con formato detallado
    reportItems.forEach((item, index) => {
      console.log(`🔍 Procesando item ${index + 1}:`, item);
      console.log('📝 Estructura del item:', {
        hasItem: !!item.item,
        itemName: item.item?.name,
        directName: item.name,
        fullItem: item
      });
      
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      // Título de la partida
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const itemName = item.item?.name || item.name || 'Sin nombre';
      console.log('📋 Nombre usado para el item:', itemName);
      doc.text(`${index + 1}. ${itemName}`, 20, yPosition);
      yPosition += 15;

      // Información detallada
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const description = item.item?.description || item.description || 'Sin descripción';
      const unit = item.item?.unit || item.unit || 'Sin unidad';
      const materials = item.item?.materials || item.materials || 'Sin materiales especificados';
      
      doc.text(`DESCRIPCIÓN: ${description}`, 25, yPosition);
      yPosition += 8;
      
      doc.text(`UNIDAD: ${unit}`, 25, yPosition);
      yPosition += 8;
      
      doc.text(`MATERIALES: ${materials}`, 25, yPosition);
      yPosition += 8;
      
      doc.text(`AVANCE ACTUAL: ${(item.current_quantity || 0).toString()}`, 25, yPosition);
      yPosition += 8;
      
      doc.text(`AVANCE ACUMULADO: ${(item.accumulated_quantity || 0).toString()}`, 25, yPosition);
      yPosition += 15;
      
      // Línea separadora
      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPosition, pageWidth - 20, yPosition);
      yPosition += 10;
    });

    // Guardar PDF
    doc.save(`${report.report_number}.pdf`);
  }

  // Exportar a Word
  async exportToWord(report: Report, reportItems: any[]): Promise<void> {
    console.log('🔍 Export Service - exportToWord iniciado');
    console.log('📋 Report recibido:', report);
    console.log('📊 ReportItems recibidos:', reportItems);
    console.log('📈 Cantidad de items:', reportItems?.length || 0);
    
    const doc = new Document({
      sections: [
        {
          children: [
            // Portada
            new Paragraph({
              children: [
                new TextRun({
                  text: 'INFORME DE AVANCE DE OBRA',
                  bold: true,
                  size: 32
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: report.project?.name || 'Proyecto',
                  bold: true,
                  size: 24
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 300 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Número de Informe: ${report.report_number}`,
                  size: 20
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Fecha: ${new Date(report.report_date).toLocaleDateString('es-ES')}`,
                  size: 20
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 }
            }),
            
            // Información del proyecto
            new Paragraph({
              children: [
                new TextRun({
                  text: 'INFORMACIÓN DEL PROYECTO',
                  bold: true,
                  size: 24
                })
              ],
              spacing: { before: 600, after: 300 }
            }),
            
            ...(report.project?.location ? [new Paragraph({
              children: [
                new TextRun({
                  text: `Ubicación: ${report.project.location}`,
                  size: 20
                })
              ],
              spacing: { after: 200 }
            })] : []),
            
            ...(report.project?.contractor ? [new Paragraph({
              children: [
                new TextRun({
                  text: `Contratista: ${report.project.contractor}`,
                  size: 20
                })
              ],
              spacing: { after: 200 }
            })] : []),
            
            ...(report.project?.supervisor ? [new Paragraph({
              children: [
                new TextRun({
                  text: `Supervisor: ${report.project.supervisor}`,
                  size: 20
                })
              ],
              spacing: { after: 200 }
            })] : []),

            // Partidas ejecutadas
            new Paragraph({
              children: [
                new TextRun({
                  text: 'PARTIDAS EJECUTADAS',
                  bold: true,
                  size: 24
                })
              ],
              spacing: { before: 600, after: 300 }
            }),

            // Partidas detalladas
            ...reportItems.map((item, index) => {
              console.log(`🔍 Word - Procesando item ${index + 1}:`, item);
              const itemName = item.item?.name || item.name || 'Sin nombre';
              const description = item.item?.description || item.description || 'Sin descripción';
              const unit = item.item?.unit || item.unit || 'Sin unidad';
              const materials = item.item?.materials || item.materials || 'Sin materiales especificados';
              
              return [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${index + 1}. ${itemName}`,
                      bold: true,
                      size: 24
                    })
                  ],
                  spacing: { before: 400, after: 200 }
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `DESCRIPCIÓN: ${description}`,
                      size: 20
                    })
                  ],
                  spacing: { after: 100 }
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `UNIDAD: ${unit}`,
                      size: 20
                    })
                  ],
                  spacing: { after: 100 }
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `MATERIALES: ${materials}`,
                      size: 20
                    })
                  ],
                  spacing: { after: 100 }
                }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `AVANCE ACTUAL: ${(item.current_quantity || 0).toString()}`,
                    size: 20
                  })
                ],
                spacing: { after: 100 }
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `AVANCE ACUMULADO: ${(item.accumulated_quantity || 0).toString()}`,
                    size: 20
                  })
                ],
                spacing: { after: 200 }
              })
            ];
            }).flat()
          ]
        }
      ]
    });

    // Generar y guardar documento
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${report.report_number}.docx`);
  }
}