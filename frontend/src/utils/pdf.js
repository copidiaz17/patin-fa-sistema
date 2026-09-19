import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const PINK      = [233, 30, 140]   // #E91E8C
const PINK_SOFT = [253, 244, 248]  // #fdf4f8
const DARK      = [40, 40, 60]
const GRAY      = [120, 120, 140]

// Convierte logo a base64 para embeber en el PDF
async function logoBase64() {
  try {
    const res  = await fetch('/logo.webp')
    const blob = await res.blob()
    return await new Promise(resolve => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

// Encabezado común: logo + título + subtítulo + línea
async function header(doc, titulo, subtitulo) {
  const W = doc.internal.pageSize.getWidth()

  // Fondo rosa superior
  doc.setFillColor(...PINK_SOFT)
  doc.rect(0, 0, W, 38, 'F')

  // Logo
  const logo = await logoBase64()
  if (logo) {
    doc.addImage(logo, 'WEBP', 10, 4, 28, 28)
  }

  // Nombre del sistema
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...PINK)
  doc.text('Escuela Patín Artístico F.A.', 42, 16)

  // Título del informe
  doc.setFontSize(10)
  doc.setTextColor(...DARK)
  doc.text(titulo, 42, 24)

  // Subtítulo / filtros
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...GRAY)
  doc.text(subtitulo, 42, 30)

  // Fecha de generación
  const fecha = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
  doc.text(`Generado el ${fecha}`, W - 12, 30, { align: 'right' })

  // Línea separadora
  doc.setDrawColor(...PINK)
  doc.setLineWidth(0.6)
  doc.line(10, 38, W - 10, 38)
}

// Pie de página con número
function footer(doc) {
  const W     = doc.internal.pageSize.getWidth()
  const H     = doc.internal.pageSize.getHeight()
  const pages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setDrawColor(220, 220, 230)
    doc.setLineWidth(0.3)
    doc.line(10, H - 12, W - 10, H - 12)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...GRAY)
    doc.text('Escuela Patín Artístico F.A. — Sistema de gestión', 12, H - 7)
    doc.text(`Página ${i} de ${pages}`, W - 12, H - 7, { align: 'right' })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INFORME DE ALUMNAS
// ─────────────────────────────────────────────────────────────────────────────
export async function exportarAlumnasPDF({ alumnas, cuotasPagadas, filtroEstado }) {
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const subtitulo = [
    filtroEstado ? `Estado: ${filtroEstado}` : 'Todos los estados',
    `${alumnas.length} alumnas`,
  ].join('  ·  ')

  await header(doc, 'Listado de Alumnas', subtitulo)

  const rows = alumnas.map(a => [
    `${a.apellido}, ${a.nombre}`,
    a.documento || '—',
    a.telefono || '—',
    a.actividades?.map(x => x.nombre).join(', ') || '—',
    a.estado,
    cuotasPagadas.includes(a.id) ? 'Al día' : 'Debe',
  ])

  autoTable(doc, {
    startY: 44,
    head: [['Alumna', 'Documento', 'Teléfono', 'Grupos', 'Estado', 'Cuota']],
    body: rows,
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 3,
      textColor: DARK,
    },
    headStyles: {
      fillColor: PINK,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: PINK_SOFT },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 22 },
      2: { cellWidth: 28 },
      3: { cellWidth: 55 },
      4: { cellWidth: 18 },
      5: { cellWidth: 18, halign: 'center' },
    },
    didDrawCell(data) {
      // Colorear badge de cuota
      if (data.section === 'body' && data.column.index === 5) {
        const val   = data.cell.raw
        const color = val === 'Al día' ? [16, 185, 129] : [239, 68, 68]
        doc.setTextColor(...color)
        doc.setFont('helvetica', 'bold')
        doc.text(val, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, { align: 'center' })
        doc.setTextColor(...DARK)
        doc.setFont('helvetica', 'normal')
      }
    },
    margin: { left: 10, right: 10 },
  })

  footer(doc)

  const fecha = new Date().toISOString().slice(0, 10)
  doc.save(`alumnas_${fecha}.pdf`)
}

// ─────────────────────────────────────────────────────────────────────────────
// INFORME DE CUOTAS / PAGOS
// ─────────────────────────────────────────────────────────────────────────────
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export async function exportarCuotasPDF({ cuotas, mes, anio }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W   = doc.internal.pageSize.getWidth()

  const total     = cuotas.reduce((s, c) => s + Number(c.monto), 0)
  const subtitulo = `${MESES[mes - 1]} ${anio}  ·  ${cuotas.length} pagos`

  await header(doc, 'Informe de Cuotas Cobradas', subtitulo)

  // KPI total
  doc.setFillColor(...PINK)
  doc.roundedRect(W - 68, 40, 58, 14, 3, 3, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  doc.text('TOTAL COBRADO', W - 61, 47)
  doc.setFontSize(11)
  doc.text(`$${total.toLocaleString('es-AR')}`, W - 61, 53)

  const rows = cuotas.map(c => [
    `${c.alumna?.apellido || ''}, ${c.alumna?.nombre || ''}`,
    `${MESES[c.mes - 1]} ${c.anio}`,
    c.fecha_pago || '—',
    c.medio_pago || '—',
    `$${Number(c.monto).toLocaleString('es-AR')}`,
  ])

  autoTable(doc, {
    startY: 58,
    head: [['Alumna', 'Período', 'Fecha pago', 'Medio', 'Monto']],
    body: rows,
    foot: [['', '', '', 'Total', `$${total.toLocaleString('es-AR')}`]],
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 3,
      textColor: DARK,
    },
    headStyles: {
      fillColor: PINK,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    footStyles: {
      fillColor: PINK_SOFT,
      textColor: PINK,
      fontStyle: 'bold',
      fontSize: 9,
    },
    alternateRowStyles: { fillColor: PINK_SOFT },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 28 },
      2: { cellWidth: 25 },
      3: { cellWidth: 30 },
      4: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 10, right: 10 },
  })

  footer(doc)

  doc.save(`cuotas_${MESES[mes - 1].toLowerCase()}_${anio}.pdf`)
}
