import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx-js-style';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sekolah, npsn, kepsek, nipKepsek, kecamatan, guruList, bulan, tahun, dataLibur, korwilData } = body;

    const namaBulanArr = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const bulanIndex = parseInt(bulan) || 0;
    const tahunNum = tahun || 2026;
    const jumlahHari = new Date(tahunNum, bulanIndex + 1, 0).getDate();

    // Helper functions
    const getLibur = (b: number): number[] => {
      const liburBulan = dataLibur?.[b] || [];
      return liburBulan.filter((l: { jenis: string }) => l.jenis === 'libur').map((l: { hari: number }) => l.hari);
    };
    const getCuti = (b: number): number[] => {
      const liburBulan = dataLibur?.[b] || [];
      return liburBulan.filter((l: { jenis: string }) => l.jenis === 'cuti').map((l: { hari: number }) => l.hari);
    };
    const isMinggu = (t: number, b: number, h: number): boolean => {
      return new Date(t, b, h).getDay() === 0;
    };

    const libur = getLibur(bulanIndex);
    const cuti = getCuti(bulanIndex);

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Define styles
    const thinBorder = {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } }
    };

    const titleStyle = {
      font: { bold: true, size: 14 },
      alignment: { horizontal: 'center', vertical: 'center' }
    };

    const subtitleStyle = {
      font: { bold: true, size: 12 },
      alignment: { horizontal: 'center', vertical: 'center' }
    };

    const headerStyle = {
      font: { bold: true, size: 10 },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: thinBorder,
      fill: { fgColor: { rgb: 'E0E0E0' } }
    };

    const dataStyle = {
      font: { size: 10 },
      alignment: { vertical: 'center' },
      border: thinBorder
    };

    const dataCenterStyle = {
      font: { size: 10 },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: thinBorder
    };

    const liburStyle = {
      font: { size: 10, color: { rgb: 'FF0000' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: thinBorder,
      fill: { fgColor: { rgb: 'FFEEEE' } }
    };

    const totalCols = 4 + jumlahHari;
    const lastColIndex = 3 + jumlahHari;
    const guruCount = (guruList || []).length;

    // ==================== SHEET 1: DAFTAR HADIR (dengan centang) ====================
    const tableData1: any[][] = [];

    // Title rows
    tableData1.push(['DAFTAR HADIR GURU PNS']);
    tableData1.push([`BULAN ${namaBulanArr[bulanIndex].toUpperCase()} ${tahunNum}`]);
    tableData1.push([`KECAMATAN ${(kecamatan || 'LEMAHABANG').toUpperCase()} KABUPATEN CIREBON`]);
    tableData1.push([]);

    // Info section
    tableData1.push(['Nama Sekolah', ':', sekolah || '-']);
    tableData1.push(['NPSN', ':', npsn || '-']);
    tableData1.push(['Kepala Sekolah', ':', kepsek || '-']);
    tableData1.push(['NIP Kepala Sekolah', ':', nipKepsek || '-']);
    tableData1.push([]);

    // Table header row
    const headerRow: string[] = ['NO', 'NAMA GURU', 'ASAL SEKOLAH', 'KET'];
    for (let h = 1; h <= jumlahHari; h++) {
      headerRow.push(h.toString());
    }
    tableData1.push(headerRow);

    // Guru data rows
    (guruList || []).forEach((guru: { nama: string; ket: string; hadir: { [key: number]: boolean[] } }, idx: number) => {
      const hadirBulan = guru.hadir?.[bulanIndex] || Array(jumlahHari).fill(false);
      const row: string[] = [
        (idx + 1).toString(),
        guru.nama,
        sekolah || '-',
        guru.ket || 'PNS'
      ];
      for (let h = 1; h <= jumlahHari; h++) {
        const isLibur = libur.includes(h) || cuti.includes(h) || isMinggu(tahunNum, bulanIndex, h);
        if (isLibur) {
          row.push('-');
        } else {
          row.push(hadirBulan[h - 1] ? '✓' : '');
        }
      }
      tableData1.push(row);
    });

    // Signature section
    tableData1.push([]);
    tableData1.push([]);
    tableData1.push(['', '', 'Mengetahui,', '', '', '', '', '', '', 'Lemahabang, ...']);
    tableData1.push(['', '', 'Pengawas Sekolah', '', '', '', '', '', '', 'Kepala Sekolah']);
    tableData1.push([]);
    tableData1.push([]);
    tableData1.push([]);
    tableData1.push(['', '', korwilData?.pengawas?.[0]?.nama || '...........................', '', '', '', '', '', '', kepsek || '...........................']);
    tableData1.push(['', '', `NIP. ${korwilData?.pengawas?.[0]?.nip || '................'}`, '', '', '', '', '', '', `NIP. ${nipKepsek || '................'}`]);

    const ws1 = XLSX.utils.aoa_to_sheet(tableData1);

    // Apply styles to sheet 1
    const tableStartRow = 9;

    // Style title rows
    for (let row = 0; row <= 2; row++) {
      for (let col = 0; col < totalCols; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (ws1[cellRef]) {
          ws1[cellRef].s = row === 0 ? titleStyle : subtitleStyle;
        }
      }
    }

    // Style header row
    for (let col = 0; col < totalCols; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: tableStartRow, c: col });
      if (ws1[cellRef]) {
        ws1[cellRef].s = headerStyle;
      }
    }

    // Style data rows
    for (let row = tableStartRow + 1; row < tableStartRow + 1 + guruCount; row++) {
      for (let col = 0; col < totalCols; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (ws1[cellRef]) {
          if (col >= 4) {
            const hari = col - 3;
            const isLibur = libur.includes(hari) || cuti.includes(hari) || isMinggu(tahunNum, bulanIndex, hari);
            ws1[cellRef].s = isLibur ? liburStyle : dataCenterStyle;
          } else if (col === 0) {
            ws1[cellRef].s = dataCenterStyle;
          } else {
            ws1[cellRef].s = dataStyle;
          }
        }
      }
    }

    ws1['!cols'] = [
      { wch: 5 }, { wch: 25 }, { wch: 20 }, { wch: 10 },
      ...Array(jumlahHari).fill({ wch: 3 })
    ];

    ws1['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: lastColIndex } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: lastColIndex } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: lastColIndex } },
    ];

    ws1['!pageSetup'] = {
      paperSize: 13,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0
    };

    XLSX.utils.book_append_sheet(wb, ws1, 'Daftar Hadir');

    // ==================== SHEET 2: DAFTAR HADIR PARAF MANUAL ====================
    const tableData2: any[][] = [];

    // Title rows
    tableData2.push(['DAFTAR HADIR GURU PNS']);
    tableData2.push([`BULAN ${namaBulanArr[bulanIndex].toUpperCase()} ${tahunNum}`]);
    tableData2.push([`KECAMATAN ${(kecamatan || 'LEMAHABANG').toUpperCase()} KABUPATEN CIREBON`]);
    tableData2.push(['(Paraf Manual)']);
    tableData2.push([]);

    // Info section
    tableData2.push(['Nama Sekolah', ':', sekolah || '-']);
    tableData2.push(['NPSN', ':', npsn || '-']);
    tableData2.push(['Kepala Sekolah', ':', kepsek || '-']);
    tableData2.push(['NIP Kepala Sekolah', ':', nipKepsek || '-']);
    tableData2.push([]);

    // Table header row
    tableData2.push(headerRow);

    // Guru data rows (kosong untuk paraf manual)
    (guruList || []).forEach((guru: { nama: string; ket: string }, idx: number) => {
      const row: string[] = [
        (idx + 1).toString(),
        guru.nama,
        sekolah || '-',
        guru.ket || 'PNS'
      ];
      for (let h = 1; h <= jumlahHari; h++) {
        const isLibur = libur.includes(h) || cuti.includes(h) || isMinggu(tahunNum, bulanIndex, h);
        row.push(isLibur ? '-' : '');
      }
      tableData2.push(row);
    });

    // Signature section
    tableData2.push([]);
    tableData2.push([]);
    tableData2.push(['', '', 'Mengetahui,', '', '', '', '', '', '', 'Lemahabang, ...']);
    tableData2.push(['', '', 'Pengawas Sekolah', '', '', '', '', '', '', 'Kepala Sekolah']);
    tableData2.push([]);
    tableData2.push([]);
    tableData2.push([]);
    tableData2.push(['', '', korwilData?.pengawas?.[0]?.nama || '...........................', '', '', '', '', '', '', kepsek || '...........................']);
    tableData2.push(['', '', `NIP. ${korwilData?.pengawas?.[0]?.nip || '................'}`, '', '', '', '', '', '', `NIP. ${nipKepsek || '................'}`]);

    const ws2 = XLSX.utils.aoa_to_sheet(tableData2);

    // Apply styles to sheet 2
    const tableStartRow2 = 10;

    // Style title rows
    for (let row = 0; row <= 3; row++) {
      for (let col = 0; col < totalCols; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (ws2[cellRef]) {
          ws2[cellRef].s = row === 0 ? titleStyle : subtitleStyle;
        }
      }
    }

    // Style header row
    for (let col = 0; col < totalCols; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: tableStartRow2, c: col });
      if (ws2[cellRef]) {
        ws2[cellRef].s = headerStyle;
      }
    }

    // Style data rows
    for (let row = tableStartRow2 + 1; row < tableStartRow2 + 1 + guruCount; row++) {
      for (let col = 0; col < totalCols; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (ws2[cellRef]) {
          if (col >= 4) {
            const hari = col - 3;
            const isLibur = libur.includes(hari) || cuti.includes(hari) || isMinggu(tahunNum, bulanIndex, hari);
            ws2[cellRef].s = isLibur ? liburStyle : dataCenterStyle;
          } else if (col === 0) {
            ws2[cellRef].s = dataCenterStyle;
          } else {
            ws2[cellRef].s = dataStyle;
          }
        }
      }
    }

    ws2['!cols'] = [
      { wch: 5 }, { wch: 25 }, { wch: 20 }, { wch: 10 },
      ...Array(jumlahHari).fill({ wch: 3 })
    ];

    ws2['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: lastColIndex } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: lastColIndex } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: lastColIndex } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: lastColIndex } },
    ];

    ws2['!pageSetup'] = {
      paperSize: 13,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0
    };

    XLSX.utils.book_append_sheet(wb, ws2, 'Paraf Manual');

    // Generate buffer with cell styles
    const buf = XLSX.write(wb, { 
      type: 'buffer', 
      bookType: 'xlsx',
      cellStyles: true 
    });

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Daftar_Hadir_${namaBulanArr[bulanIndex]}_${tahunNum}.xlsx"`
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
