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

  // Función utilitaria para dividir texto largo en múltiples líneas para PDF
  private splitTextForPDF(doc: jsPDF, text: string, maxWidth: number, fontSize: number = 16): string[] {
    doc.setFontSize(fontSize);
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = doc.getTextWidth(testLine);
      
      if (textWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }

  // Función utilitaria para dividir texto largo para Word
  private splitTextForWord(text: string, maxLength: number = 80): string[] {
    if (text.length <= maxLength) {
      return [text];
    }

    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      
      if (testLine.length > maxLength && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }

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
    
    // Dividir el nombre del proyecto en múltiples líneas si es necesario
    const projectName = report.project?.name || 'Proyecto';
    const maxWidth = pageWidth - 40; // Margen de 20px a cada lado
    const projectNameLines = this.splitTextForPDF(doc, projectName, maxWidth, 16);
    
    projectNameLines.forEach((line, index) => {
      doc.text(line, pageWidth / 2, yPosition, { align: 'center' });
      if (index < projectNameLines.length - 1) {
        yPosition += 12; // Espaciado entre líneas
      }
    });
    
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
      const locationText = `Ubicación: ${report.project.location}`;
      const locationLines = this.splitTextForPDF(doc, locationText, pageWidth - 40, 10);
      
      locationLines.forEach((line, index) => {
        doc.text(line, 20, yPosition);
        if (index < locationLines.length - 1) {
          yPosition += 8;
        }
      });
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
      doc.text(`${itemName}`, 20, yPosition);
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
      yPosition += 8;
      
      const metrado = item.item?.metrado || item.metrado || 0;
      doc.text(`METRADO: ${metrado.toString()}`, 25, yPosition);
      yPosition += 8;
      
      const saldo = metrado - (item.accumulated_quantity || 0);
      doc.text(`SALDO: ${saldo.toString()}`, 25, yPosition);
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
            // Dividir el nombre del proyecto en múltiples líneas si es necesario
            ...(() => {
              const projectName = report.project?.name || 'Proyecto';
              const projectNameLines = this.splitTextForWord(projectName, 60); // Límite de caracteres por línea
              
              return projectNameLines.map((line, index) => 
                new Paragraph({
                  children: [
                    new TextRun({
                      text: line,
                      bold: true,
                      size: 24
                    })
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { 
                    after: index === projectNameLines.length - 1 ? 300 : 100 
                  }
                })
              );
            })(),
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
            
            // Dividir la ubicación en múltiples líneas si es necesario
            ...(() => {
              if (!report.project?.location) return [];
              
              const locationText = `Ubicación: ${report.project.location}`;
              const locationLines = this.splitTextForWord(locationText, 80); // Límite de caracteres por línea
              
              return locationLines.map((line, index) => 
                new Paragraph({
                  children: [
                    new TextRun({
                      text: line,
                      size: 20
                    })
                  ],
                  spacing: { 
                    after: index === locationLines.length - 1 ? 200 : 100 
                  }
                })
              );
            })(),
            
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
                      text: `${itemName}`,
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
                spacing: { after: 100 }
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `METRADO: ${(item.item?.metrado || item.metrado || 0).toString()}`,
                    size: 20
                  })
                ],
                spacing: { after: 100 }
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `SALDO: ${((item.item?.metrado || item.metrado || 0) - (item.accumulated_quantity || 0)).toString()}`,
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