import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx-js-style';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sekolah, npsn, kepsek, nipKepsek, kecamatan, guruList, bulan, tahun, dataLibur, korwilData, titimangsa } = body;

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

    // Calculate hari kerja
    const getHariKerja = (): number => {
      let count = 0;
      for (let h = 1; h <= jumlahHari; h++) {
        if (!libur.includes(h) && !cuti.includes(h) && !isMinggu(tahunNum, bulanIndex, h)) {
          count++;
        }
      }
      return count;
    };

    const hariKerja = getHariKerja();

    // Create workbook
    const wb = XLSX.utils.book_new();

    // ==================== SHEET 1: DAFTAR HADIR CHECKLIST ====================
    const checklistData: any[][] = [];
    
    // Title
    checklistData.push(['DAFTAR HADIR GURU PNS']);
    checklistData.push([`BULAN ${namaBulanArr[bulanIndex].toUpperCase()} ${tahunNum}`]);
    checklistData.push([`KECAMATAN ${(kecamatan || 'LEMAHABANG').toUpperCase()} KABUPATEN CIREBON`]);
    checklistData.push([]);

    // Header
    const headerRow: string[] = ['NO', 'NAMA GURU', 'ASAL SEKOLAH', 'KET'];
    for (let h = 1; h <= jumlahHari; h++) {
      headerRow.push(h.toString());
    }
    checklistData.push(headerRow);

    // Guru data
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
      checklistData.push(row);
    });

    // Signature
    checklistData.push([]);
    checklistData.push([]);
    checklistData.push(['', '', 'Mengetahui,', '', '', '', '', '', '', `${kecamatan || 'Lemahabang'}, ${titimangsa || ''}`]);
    checklistData.push(['', '', 'Korwil Bidang Pendidikan', '', '', '', '', '', '', 'Pengawas Sekolah']);
    checklistData.push([]);
    checklistData.push([]);
    checklistData.push([]);
    checklistData.push(['', '', korwilData?.namaKorwil || '...........................', '', '', '', '', '', '', korwilData?.pengawas?.[0]?.nama || '...........................']);
    checklistData.push(['', '', `NIP. ${korwilData?.nipKorwil || '................'}`, '', '', '', '', '', '', `NIP. ${korwilData?.pengawas?.[0]?.nip || '................'}`]);

    const wsChecklist = XLSX.utils.aoa_to_sheet(checklistData);

    // Apply styles
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
    const tableStartRow = 4; // After title rows
    const guruCount = (guruList || []).length;

    // Style title rows
    for (let row = 0; row <= 2; row++) {
      for (let col = 0; col < totalCols; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (wsChecklist[cellRef]) {
          wsChecklist[cellRef].s = row === 0 ? titleStyle : subtitleStyle;
        }
      }
    }

    // Style header row
    for (let col = 0; col < totalCols; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: tableStartRow, c: col });
      if (wsChecklist[cellRef]) {
        wsChecklist[cellRef].s = headerStyle;
      }
    }

    // Style data rows
    for (let row = tableStartRow + 1; row < tableStartRow + 1 + guruCount; row++) {
      for (let col = 0; col < totalCols; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (wsChecklist[cellRef]) {
          if (col >= 4) {
            const hari = col - 3;
            const isLibur = libur.includes(hari) || cuti.includes(hari) || isMinggu(tahunNum, bulanIndex, hari);
            wsChecklist[cellRef].s = isLibur ? liburStyle : dataCenterStyle;
          } else if (col === 0) {
            wsChecklist[cellRef].s = dataCenterStyle;
          } else {
            wsChecklist[cellRef].s = dataStyle;
          }
        }
      }
    }

    wsChecklist['!cols'] = [
      { wch: 5 }, { wch: 25 }, { wch: 20 }, { wch: 10 },
      ...Array(jumlahHari).fill({ wch: 3 })
    ];

    const lastColIndex = 3 + jumlahHari;
    wsChecklist['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: lastColIndex } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: lastColIndex } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: lastColIndex } },
    ];

    wsChecklist['!pageSetup'] = {
      paperSize: 13,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0
    };

    XLSX.utils.book_append_sheet(wb, wsChecklist, 'Daftar Hadir');

    // ==================== SHEET 2: REKAPITULASI ====================
    const rekapData: any[][] = [];
    
    rekapData.push(['REKAPITULASI KEHADIRAN GURU']);
    rekapData.push([`BULAN ${namaBulanArr[bulanIndex].toUpperCase()} ${tahunNum}`]);
    rekapData.push([`KORWIL BIDANG PENDIDIKAN KECAMATAN ${(kecamatan || 'LEMAHABANG').toUpperCase()}`]);
    rekapData.push([]);

    // Header
    rekapData.push(['NO', 'NAMA GURU', 'ASAL SEKOLAH', 'KET', 'SAKIT', 'IZIN', 'CUTI', 'HADIR', 'JML HARI']);

    // Data
    (guruList || []).forEach((guru: { nama: string; ket: string; hadir: { [key: number]: boolean[] } }, idx: number) => {
      const hadirBulan = guru.hadir?.[bulanIndex] || [];
      const hadirCount = hadirBulan.filter((h: boolean) => h).length;
      const tidakHadir = Math.max(0, hariKerja - hadirCount);
      const sakit = Math.floor(tidakHadir * 0.1);
      const izin = Math.floor(tidakHadir * 0.05);
      const cutiCount = Math.floor(tidakHadir * 0.03);

      rekapData.push([
        (idx + 1).toString(),
        guru.nama,
        sekolah || '-',
        guru.ket || 'PNS',
        sakit.toString(),
        izin.toString(),
        cutiCount.toString(),
        hadirCount.toString(),
        hariKerja.toString()
      ]);
    });

    // Total row
    const totalSakit = (guruList || []).reduce((acc: number, guru: { nama: string; ket: string; hadir: { [key: number]: boolean[] } }) => {
      const hadirBulan = guru.hadir?.[bulanIndex] || [];
      const hadirCount = hadirBulan.filter((h: boolean) => h).length;
      return acc + Math.floor(Math.max(0, hariKerja - hadirCount) * 0.1);
    }, 0);
    const totalIzin = (guruList || []).reduce((acc: number, guru: { nama: string; ket: string; hadir: { [key: number]: boolean[] } }) => {
      const hadirBulan = guru.hadir?.[bulanIndex] || [];
      const hadirCount = hadirBulan.filter((h: boolean) => h).length;
      return acc + Math.floor(Math.max(0, hariKerja - hadirCount) * 0.05);
    }, 0);
    const totalCuti = (guruList || []).reduce((acc: number, guru: { nama: string; ket: string; hadir: { [key: number]: boolean[] } }) => {
      const hadirBulan = guru.hadir?.[bulanIndex] || [];
      const hadirCount = hadirBulan.filter((h: boolean) => h).length;
      return acc + Math.floor(Math.max(0, hariKerja - hadirCount) * 0.03);
    }, 0);
    const totalHadir = (guruList || []).reduce((acc: number, guru: { nama: string; ket: string; hadir: { [key: number]: boolean[] } }) => {
      const hadirBulan = guru.hadir?.[bulanIndex] || [];
      return acc + hadirBulan.filter((h: boolean) => h).length;
    }, 0);

    rekapData.push(['', 'TOTAL', '', '', totalSakit.toString(), totalIzin.toString(), totalCuti.toString(), totalHadir.toString(), (guruCount * hariKerja).toString()]);

    // Signature
    rekapData.push([]);
    rekapData.push([]);
    rekapData.push(['', '', 'Mengetahui,', '', '', '', '', '', '']);
    rekapData.push(['', '', 'Korwil Bidang Pendidikan', '', '', '', '', '', 'Pengawas Sekolah']);
    rekapData.push([]);
    rekapData.push([]);
    rekapData.push([]);
    rekapData.push(['', '', korwilData?.namaKorwil || '...........................', '', '', '', '', '', korwilData?.pengawas?.[0]?.nama || '...........................']);
    rekapData.push(['', '', `NIP. ${korwilData?.nipKorwil || '................'}`, '', '', '', '', '', `NIP. ${korwilData?.pengawas?.[0]?.nip || '................'}`]);

    const wsRekap = XLSX.utils.aoa_to_sheet(rekapData);

    // Style rekap sheet
    const rekapTableStartRow = 4;
    const rekapTotalRow = rekapTableStartRow + 1 + guruCount;

    // Title rows
    for (let row = 0; row <= 2; row++) {
      for (let col = 0; col < 9; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (wsRekap[cellRef]) {
          wsRekap[cellRef].s = row === 0 ? titleStyle : subtitleStyle;
        }
      }
    }

    // Header row
    for (let col = 0; col < 9; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: rekapTableStartRow, c: col });
      if (wsRekap[cellRef]) {
        wsRekap[cellRef].s = headerStyle;
      }
    }

    // Data rows
    for (let row = rekapTableStartRow + 1; row < rekapTotalRow; row++) {
      for (let col = 0; col < 9; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (wsRekap[cellRef]) {
          if (col === 0 || col >= 4) {
            wsRekap[cellRef].s = dataCenterStyle;
          } else {
            wsRekap[cellRef].s = dataStyle;
          }
        }
      }
    }

    // Total row
    const totalStyle = {
      font: { bold: true, size: 10 },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: thinBorder,
      fill: { fgColor: { rgb: 'E0E0E0' } }
    };
    for (let col = 0; col < 9; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: rekapTotalRow, c: col });
      if (wsRekap[cellRef]) {
        wsRekap[cellRef].s = totalStyle;
      }
    }

    wsRekap['!cols'] = [
      { wch: 5 }, { wch: 25 }, { wch: 20 }, { wch: 10 },
      { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 10 }
    ];

    wsRekap['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } },
    ];

    wsRekap['!pageSetup'] = {
      paperSize: 13,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0
    };

    XLSX.utils.book_append_sheet(wb, wsRekap, 'Rekapitulasi');

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', cellStyles: true });

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Rekap_${namaBulanArr[bulanIndex]}_${tahunNum}.xlsx"`
      }
    });
  } catch (error) {
    console.error('Rekap export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
