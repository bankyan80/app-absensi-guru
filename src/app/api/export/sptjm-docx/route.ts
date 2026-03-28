import { NextRequest, NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, HeadingLevel, Separator, convertInchesToTwip } from 'docx';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sptjmData, korwilData } = body;

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: {
              width: convertInchesToTwip(8.5),
              height: convertInchesToTwip(13)
            },
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1)
            }
          }
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'SURAT PERNYATAAN TANGGUNG JAWAB MUTLAK',
                bold: true,
                size: 28
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({
                text: sptjmData.status === 'PNS' 
                  ? 'PENERIMA TUNJANGAN PROFESI GURU'
                  : 'PENERIMA TUNJANGAN PROFESI GURU NON PNS',
                bold: true,
                size: 24
              })
            ]
          }),
          ...(sptjmData.status === 'HONORER' ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
              children: [new TextRun({ text: '(Honorer)', size: 22 })]
            })
          ] : []),
          new Paragraph({
            border: {
              bottom: { color: '000000', space: 1, style: BorderStyle.SINGLE, size: 6 }
            },
            spacing: { after: 400 }
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: 'Yang bertanda tangan di bawah ini, saya :', size: 22 })]
          }),
          // Identity Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: sptjmData.status === 'PNS' ? [
              createTableRow('Nama', sptjmData.nama || '________________'),
              createTableRow('NIP', sptjmData.nip || '________________'),
              createTableRow('Tempat / Tanggal Lahir', sptjmData.ttl || '________________'),
              createTableRow('NUPTK', sptjmData.nuptk || '________________'),
              createTableRow('No Peserta Sertifikasi', sptjmData.nopes || '________________'),
              createTableRow('NRG', sptjmData.nrg || '________________'),
              createTableRow('Unit Kerja', sptjmData.sekolah || '________________'),
            ] : [
              createTableRow('Nama', sptjmData.nama || '________________'),
              createTableRow('Tempat / Tanggal Lahir', sptjmData.ttl || '________________'),
              createTableRow('NUPTK', sptjmData.nuptk || '________________'),
              createTableRow('NPSN Sekolah', sptjmData.nopes || '________________'),
              createTableRow('Nama Sekolah', sptjmData.sekolah || '________________'),
              createTableRow('Alamat Sekolah', sptjmData.alamat || '________________'),
              createTableRow('Kecamatan', korwilData?.kecamatan || '________________'),
              createTableRow('Kabupaten/Kota', 'Cirebon'),
            ]
          }),
          new Paragraph({
            spacing: { before: 300, after: 200 },
            children: [new TextRun({ text: 'Dengan ini menyatakan hal-hal sebagai berikut :', size: 22 })]
          }),
          // Statements
          ...(sptjmData.status === 'PNS' ? [
            createNumberedParagraph(1, `Bahwa saya masih berstatus PNS aktif di ${sptjmData.sekolah || '________________'} Kecamatan ${korwilData?.kecamatan || '________________'} Kabupaten Cirebon.`),
            createNumberedParagraph(2, `Bahwa besaran gaji pokok yang tertera pada leger gaji bulan ${sptjmData.bulan || '___'} adalah Rp. ${sptjmData.gaji || '_______'} dibayarkan sesuai pangkat golongan ${sptjmData.gol || '___'} dengan masa kerja ${sptjmData.mth || '___'} tahun ${sptjmData.mtb || '___'} bulan.`),
            createNumberedParagraph(3, 'Bahwa untuk pembayaran tunjangan profesi guru triwulan 1 tahun 2026, dibayarkan berdasarkan gaji bulan ' + (sptjmData.bulan || '___') + ' 2026.'),
          ] : [
            createNumberedParagraph(1, `Bahwa saya adalah Guru Non PNS (Honorer) yang masih aktif mengajar di ${sptjmData.sekolah || '________________'} Kecamatan ${korwilData?.kecamatan || '________________'} Kabupaten Cirebon.`),
            createNumberedParagraph(2, 'Bahwa saya memiliki kualifikasi akademik Sarjana (S1) atau Diploma IV (D4) dan memiliki sertifikat pendidik.'),
            createNumberedParagraph(3, `Bahwa jumlah jam mengajar saya pada bulan ${sptjmData.bulan || '___'} adalah ${sptjmData.gaji || '___'} jam per minggu.`),
            createNumberedParagraph(4, 'Bahwa untuk pembayaran tunjangan profesi guru non PNS, akan ditransfer ke rekening bank dengan keterangan sebagai berikut:'),
            new Table({
              width: { size: 50, type: WidthType.PERCENTAGE },
              rows: [
                createTableRow('Nama Bank', sptjmData.namaBank || '________________'),
                createTableRow('No. Rekening', sptjmData.noRekening || '________________'),
                createTableRow('Atas Nama', sptjmData.namaPemilikRekening || '________________'),
              ]
            }),
          ]),
          new Paragraph({
            spacing: { before: 300 },
            children: [new TextRun({ 
              text: 'Demikian pernyataan ini saya buat dengan sebenarnya untuk dapat dipergunakan sebagai bahan acuan guna memperoleh tunjangan profesi guru ' + (sptjmData.status === 'PNS' ? 'triwulan 1 ' : 'non PNS ') + 'tahun 2026.',
              size: 22 
            })]
          }),
          // Signature section
          new Paragraph({ spacing: { before: 800 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: sptjmData.status === 'PNS' ? [
              new TableRow({
                children: [
                  new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, children: [] }),
                  new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Cirebon, ${sptjmData.tanggal || '________________'}`, size: 22 })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Yang Membuat Pernyataan,', size: 22 })] }),
                      new Paragraph({ spacing: { before: 800 } }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: sptjmData.nama || '________________', bold: true, size: 22 })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `NIP. ${sptjmData.nip || '________________'}`, size: 22 })] }),
                    ]
                  })
                ]
              })
            ] : [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Mengetahui,', size: 22 })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Kepala Sekolah', size: 22 })] }),
                      new Paragraph({ spacing: { before: 600 } }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '________________', bold: true, size: 22 })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'NIP. ________________', size: 22 })] }),
                    ]
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Cirebon, ${sptjmData.tanggal || '________________'}`, size: 22 })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Yang Membuat Pernyataan,', size: 22 })] }),
                      new Paragraph({ spacing: { before: 600 } }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: sptjmData.nama || '________________', bold: true, size: 22 })] }),
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
        'Content-Disposition': `attachment; filename="SPTJM_${sptjmData.nama || 'Guru'}_${sptjmData.bulan || ''}.docx"`
      }
    });
  } catch (error) {
    console.error('SPTJM export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

function createTableRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 35, type: WidthType.PERCENTAGE },
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        children: [new Paragraph({ children: [new TextRun({ text: label, size: 22 })] })]
      }),
      new TableCell({
        width: { size: 65, type: WidthType.PERCENTAGE },
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        children: [new Paragraph({ children: [new TextRun({ text: `: ${value}`, size: 22 })] })]
      })
    ]
  });
}

function createNumberedParagraph(num: number, text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 150 },
    indent: { left: convertInchesToTwip(0.5) },
    children: [new TextRun({ text: `${num}. ${text}`, size: 22 })]
  });
}
