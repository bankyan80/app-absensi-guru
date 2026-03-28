import { NextRequest, NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, convertInchesToTwip, VerticalAlign, HeadingLevel } from 'docx';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sekolah, npsn, kepsek, nipKepsek, monitoringTanggal, guruList, monitoringData, temuanMasalah, kecamatan } = body;

    const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    // Parse tanggal to get hari
    let hariNama = '....................';
    if (monitoringTanggal) {
      try {
        const namaBulan: { [key: string]: number } = {
          'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
          'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11
        };
        const parts = monitoringTanggal.toLowerCase().split(' ');
        if (parts.length >= 2) {
          const tanggal = parseInt(parts[0]);
          const bulan = namaBulan[parts[1]] ?? 0;
          const tahun = parts[2] ? parseInt(parts[2]) : 2026;
          const date = new Date(tahun, bulan, tanggal);
          hariNama = namaHari[date.getDay()];
        }
      } catch {
        // keep default
      }
    }

    // Create table rows for guru data
    const guruRows = (guruList || []).map((guru: { id: string; nama: string; ket: string; nuptk: string }, idx: number) => {
      const mData = monitoringData?.[guru.id] || {
        sktpJan: false, sktpFeb: false, sktpMar: false,
        tpgJan: false, tpgFeb: false, tpgMar: false
      };
      const isAsn = guru.ket === 'PNS' || guru.ket === 'PPPK';

      return new TableRow({
        children: [
          createCell((idx + 1).toString(), true),
          createCell(guru.nama),
          createCell(guru.nuptk || '-', true),
          createCell(isAsn ? 'ASN' : 'Non ASN', true),
          createCell(mData.sktpJan ? '✓' : '', true),
          createCell(mData.sktpFeb ? '✓' : '', true),
          createCell(mData.sktpMar ? '✓' : '', true),
          createCell(mData.tpgJan ? '✓' : '', true),
          createCell(mData.tpgFeb ? '✓' : '', true),
          createCell(mData.tpgMar ? '✓' : '', true),
          createCell('', true),
        ]
      });
    });

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: {
              width: convertInchesToTwip(8.5),
              height: convertInchesToTwip(13)
            },
            margin: {
              top: convertInchesToTwip(0.8),
              right: convertInchesToTwip(0.8),
              bottom: convertInchesToTwip(0.8),
              left: convertInchesToTwip(0.8)
            }
          }
        },
        children: [
          // Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [new TextRun({ text: 'INSTRUMEN MONITORING', bold: true, size: 28 })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [new TextRun({ text: 'TUNJANGAN PROFESI GURU', bold: true, size: 24 })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [new TextRun({ text: 'TAHUN 2026', bold: true, size: 22 })]
          }),
          // Info Section - Using Table for proper alignment
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              createInfoRow('Hari', hariNama),
              createInfoRow('Tanggal', monitoringTanggal || '............................................'),
              createInfoRow('Nama Sekolah', sekolah || '............................................'),
              createInfoRow('NPSN', npsn || '............................................'),
              createInfoRow('Nama Kepala Sekolah', kepsek || '............................................'),
            ]
          }),
          new Paragraph({ spacing: { after: 200 } }),
          // Main Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              // Header Row 1
              new TableRow({
                children: [
                  createHeaderCell('No', 1, 2),
                  createHeaderCell('Nama Guru Yang Serdik', 1, 2),
                  createHeaderCell('NUPTK', 1, 2),
                  createHeaderCell('ASN /\nNon ASN', 1, 2),
                  createHeaderCell('SKTP TERBIT *', 3, 1, 'E8F5E9'),
                  createHeaderCell('PENCAIRAN TPG *', 3, 1, 'E3F2FD'),
                  createHeaderCell('Ket.', 1, 2),
                ]
              }),
              // Header Row 2
              new TableRow({
                children: [
                  createHeaderCell('Jan', 1, 1, 'E8F5E9'),
                  createHeaderCell('Feb', 1, 1, 'E8F5E9'),
                  createHeaderCell('Mar', 1, 1, 'E8F5E9'),
                  createHeaderCell('Jan', 1, 1, 'E3F2FD'),
                  createHeaderCell('Feb', 1, 1, 'E3F2FD'),
                  createHeaderCell('Mar', 1, 1, 'E3F2FD'),
                ]
              }),
              // Data Rows
              ...guruRows
            ]
          }),
          // Note
          new Paragraph({
            spacing: { before: 100, after: 200 },
            children: [new TextRun({ text: '*) Centang kolom SKTP Terbit dan Pencairan TPG sesuai status masing-masing bulan', size: 18, italics: true })]
          }),
          // Temuan Masalah
          new Paragraph({
            spacing: { after: 100 },
            children: [new TextRun({ text: 'TEMUAN MASALAH', bold: true, size: 22 })]
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [new TextRun({ text: temuanMasalah || '', size: 20 })]
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [new TextRun({ text: '________________________________________________________________', size: 20 })]
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [new TextRun({ text: '________________________________________________________________', size: 20 })]
          }),
          // Signature
          new Paragraph({ spacing: { before: 400 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, children: [] }),
                  new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: `${kecamatan || '....................'}, ${monitoringTanggal || '....................'}`, size: 20 })]
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: 'Mengetahui,', size: 20 })]
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: `Kepala ${sekolah || '....................'}`, size: 20 })]
                      }),
                      new Paragraph({ spacing: { before: 600 } }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: kepsek || '...........................', bold: true, size: 20 })]
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: `NIP. ${nipKepsek || '....................'}`, size: 20 })]
                      }),
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }]
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="Instrumen_Monitoring_${sekolah || 'Sekolah'}.docx"`
      }
    });
  } catch (error) {
    console.error('Monitoring export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

function createInfoRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 35, type: WidthType.PERCENTAGE },
        borders: noBorders(),
        children: [new Paragraph({ children: [new TextRun({ text: label, size: 20 })] })]
      }),
      new TableCell({
        width: { size: 5, type: WidthType.PERCENTAGE },
        borders: noBorders(),
        children: [new Paragraph({ children: [new TextRun({ text: ':', size: 20 })] })]
      }),
      new TableCell({
        width: { size: 60, type: WidthType.PERCENTAGE },
        borders: noBorders(),
        children: [new Paragraph({ children: [new TextRun({ text: value, size: 20, bold: label === 'Hari' })] })]
      }),
    ]
  });
}

function noBorders() {
  return {
    top: { style: BorderStyle.NONE },
    bottom: { style: BorderStyle.NONE },
    left: { style: BorderStyle.NONE },
    right: { style: BorderStyle.NONE }
  };
}

function createCell(text: string, center: boolean = false): TableCell {
  return new TableCell({
    verticalAlign: VerticalAlign.CENTER,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 1, color: '000000' }
    },
    children: [
      new Paragraph({
        alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
        children: [new TextRun({ text, size: 18 })]
      })
    ]
  });
}

function createHeaderCell(text: string, colSpan: number = 1, rowSpan: number = 1, bgColor: string = 'F5F5F5'): TableCell {
  return new TableCell({
    columnSpan: colSpan,
    rowSpan: rowSpan,
    verticalAlign: VerticalAlign.CENTER,
    shading: { fill: bgColor },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 1, color: '000000' }
    },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, bold: true, size: 18 })]
      })
    ]
  });
}
