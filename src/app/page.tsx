'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { 
  School, 
  User, 
  Calendar, 
  Printer, 
  Plus, 
  Trash2, 
  Eye,
  CheckCircle2,
  Check,
  XCircle,
  GraduationCap,
  Users,
  FileText,
  ClipboardList,
  ClipboardCheck,
  FileSignature,
  BarChart3,
  Settings,
  PartyPopper,
  Plane,
  UserCog,
  MapPin,
  Download,
  FileDown,
  Upload,
  Save,
  RotateCcw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import * as XLSX from 'xlsx'

// Tipe data
interface GuruData {
  id: string
  nama: string
  ket: string
  nuptk: string
  hadir: { [bulanIndex: number]: boolean[] }
}

interface SPTJMData {
  nama: string
  nip: string
  ttl: string
  nuptk: string
  nopes: string
  nrg: string
  sekolah: string
  bulan: string
  gaji: string
  gol: string
  mth: string
  mtb: string
  tanggal: string
  status: 'PNS' | 'HONORER'
  // Tambahan untuk Honorer
  alamat?: string
  namaBank?: string
  noRekening?: string
  namaPemilikRekening?: string
}

interface SekolahData {
  nama: string
  kepsek: string
  nipKepsek: string
  guruList: GuruData[]
}

interface LiburData {
  [bulanIndex: number]: { hari: number; jenis: 'libur' | 'cuti' }[]
}

interface KorwilData {
  kecamatan: string
  namaKorwil: string
  nipKorwil: string
  pengawas: { nama: string; nip: string }[]
}

interface MonitoringData {
  sktpJan: boolean
  sktpFeb: boolean
  sktpMar: boolean
  tpgJan: boolean
  tpgFeb: boolean
  tpgMar: boolean
  statusAsn: 'PNS' | 'PPPK' | 'Honorer'
  nuptk: string
}

const namaBulanArr = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

const tahun = 2026

// Get last day of month for titimangsa
function getTitimangsaBulan(bulanIdx: number): string {
  const lastDay = new Date(tahun, bulanIdx + 1, 0).getDate()
  return `${lastDay} ${namaBulanArr[bulanIdx]} ${tahun}`
}

// Format angka ke Rupiah
function formatRupiah(num: string): string {
  const value = num.replace(/\D/g, '')
  if (!value) return ''
  return new Intl.NumberFormat('id-ID').format(parseInt(value))
}

export default function AbsensiGuru() {
  // Load saved data from localStorage on first render
  const getInitialData = () => {
    if (typeof window === 'undefined') return null
    try {
      const saved = localStorage.getItem('absensi-guru-data')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  }
  const savedData = typeof window !== 'undefined' ? getInitialData() : null

  // State untuk Absensi
  const [sekolah, setSekolah] = useState(savedData?.sekolah || '')
  const [npsn, setNpsn] = useState(savedData?.npsn || '')
  const [kepsek, setKepsek] = useState(savedData?.kepsek || '')
  const [nipKepsek, setNipKepsek] = useState(savedData?.nipKepsek || '')
  const [bulan, setBulan] = useState('0')
  const [namaGuru, setNamaGuru] = useState('')
  const [ketGuru, setKetGuru] = useState('PNS')
  const [guruList, setGuruList] = useState<GuruData[]>(savedData?.guruList || [])
  const [isPreview, setIsPreview] = useState(false)

  // State untuk Korwil dan Pengawas
  const [korwilData, setKorwilData] = useState<KorwilData>(savedData?.korwilData || {
    kecamatan: 'Lemahabang',
    namaKorwil: '',
    nipKorwil: '',
    pengawas: [
      { nama: '', nip: '' },
      { nama: '', nip: '' }
    ]
  })

  // State untuk SPTJM
  const [sptjmList, setSptjmList] = useState<SPTJMData[]>(savedData?.sptjmList || [])
  const [selectedSptjmIndex, setSelectedSptjmIndex] = useState<number | null>(null)
  const [sptjmData, setSptjmData] = useState<SPTJMData>({
    nama: '', nip: '', ttl: '', nuptk: '', nopes: '', nrg: '', sekolah: '', bulan: 'Januari', gaji: '', gol: '', mth: '', mtb: '', tanggal: '',
    status: 'PNS',
    alamat: '',
    namaBank: '',
    noRekening: '',
    namaPemilikRekening: ''
  })
  const [showSptjmResult, setShowSptjmResult] = useState(false)

  // State untuk Rekap
  const [selectedBulanRekap, setSelectedBulanRekap] = useState(0)
  const [sekolahList, setSekolahList] = useState<SekolahData[]>([])
  const [customTitimangsa, setCustomTitimangsa] = useState<{[key: number]: string}>(savedData?.customTitimangsa || {})

  // State untuk Monitoring TPG
  const [monitoringData, setMonitoringData] = useState<{[guruId: string]: MonitoringData}>(
    savedData?.monitoringData || {}
  )
  const [monitoringTanggal, setMonitoringTanggal] = useState(savedData?.monitoringTanggal || '')
  const [temuanMasalah, setTemuanMasalah] = useState(savedData?.temuanMasalah || '')

  // State untuk Setting Tanggal Libur
  const [dataLibur, setDataLibur] = useState<LiburData>(savedData?.dataLibur || {
    0: [{ hari: 1, jenis: 'libur' }, { hari: 16, jenis: 'libur' }],
    1: [{ hari: 17, jenis: 'libur' }],
    2: [{ hari: 18, jenis: 'cuti' }, { hari: 19, jenis: 'cuti' }, { hari: 20, jenis: 'cuti' }, { hari: 21, jenis: 'cuti' }, { hari: 22, jenis: 'cuti' }, { hari: 23, jenis: 'cuti' }, { hari: 24, jenis: 'cuti' }],
  })
  const [popupOpen, setPopupOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<{ bulan: number; hari: number } | null>(null)

  const bulanIndex = parseInt(bulan)
  const jumlahHari = new Date(tahun, bulanIndex + 1, 0).getDate()

  // ==================== LOCAL STORAGE ====================
  const STORAGE_KEY = 'absensi-guru-data'

  // Simpan data ke LocalStorage setiap kali ada perubahan
  useEffect(() => {
    if (typeof window === 'undefined') return
    const dataToSave = {
      sekolah,
      npsn,
      kepsek,
      nipKepsek,
      guruList,
      korwilData,
      dataLibur,
      sptjmList,
      customTitimangsa,
      monitoringData,
      monitoringTanggal,
      temuanMasalah,
      savedAt: new Date().toISOString()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))

    // Juga update daftar semua sekolah untuk halaman monitoring
    if (sekolah && guruList.length > 0) {
      const allSchoolsKey = 'absensi-all-schools'
      const stored = localStorage.getItem(allSchoolsKey)
      let allSchools: Array<{
        kecamatan: string
        namaSekolah: string
        jumlahGuru: number
        namaKepsek: string
        npsn: string
        lastUpdate: string
      }> = stored ? JSON.parse(stored) : []
      
      const entry = {
        kecamatan: korwilData.kecamatan || '-',
        namaSekolah: sekolah,
        jumlahGuru: guruList.length,
        namaKepsek: kepsek || '-',
        npsn: npsn || '-',
        lastUpdate: new Date().toISOString()
      }
      
      const existingIndex = allSchools.findIndex(s => s.namaSekolah === sekolah)
      if (existingIndex >= 0) {
        allSchools[existingIndex] = entry
      } else {
        allSchools.push(entry)
      }
      localStorage.setItem(allSchoolsKey, JSON.stringify(allSchools))
    }
  }, [sekolah, npsn, kepsek, nipKepsek, guruList, korwilData, dataLibur, sptjmList, customTitimangsa, monitoringData, monitoringTanggal, temuanMasalah])

  // ==================== EXPORT KE EXCEL ====================
  const exportToExcel = useCallback(() => {
    const workbook = XLSX.utils.book_new()

    // Helper functions untuk export
    const getLiburForExport = (b: number): number[] => {
      const liburBulan = dataLibur[b] || []
      return liburBulan.filter(l => l.jenis === 'libur').map(l => l.hari)
    }
    const getCutiForExport = (b: number): number[] => {
      const liburBulan = dataLibur[b] || []
      return liburBulan.filter(l => l.jenis === 'cuti').map(l => l.hari)
    }

    // Sheet 1: Data Sekolah & Guru
    const sekolahData = [
      ['DATA SEKOLAH'],
      ['Nama Sekolah', sekolah || '-'],
      ['NPSN', npsn || '-'],
      ['Kepala Sekolah', kepsek || '-'],
      ['NIP Kepala Sekolah', nipKepsek || '-'],
      [''],
      ['DATA KORWIL & PENGAWAS'],
      ['Kecamatan', korwilData.kecamatan || '-'],
      ['Nama Korwil', korwilData.namaKorwil || '-'],
      ['NIP Korwil', korwilData.nipKorwil || '-'],
      ...korwilData.pengawas.map((p, i) => [`Pengawas ${i + 1}`, p.nama || '-']),
      ...korwilData.pengawas.map((p, i) => [`NIP Pengawas ${i + 1}`, p.nip || '-']),
      [''],
      ['DAFTAR GURU'],
      ['No', 'Nama Guru', 'Status', 'NUPTK'],
      ...guruList.map((g, i) => [i + 1, g.nama, g.ket, g.nuptk || ''])
    ]
    const wsSekolah = XLSX.utils.aoa_to_sheet(sekolahData)
    XLSX.utils.book_append_sheet(workbook, wsSekolah, 'Data Sekolah')

    // Sheet 2: Kehadiran per Bulan
    guruList.forEach(guru => {
      Object.keys(guru.hadir).forEach(bulanIdx => {
        const bIdx = parseInt(bulanIdx)
        const jmlHari = new Date(tahun, bIdx + 1, 0).getDate()
        const hadirBulan = guru.hadir[bIdx] || []
        const libur = getLiburForExport(bIdx)
        const cuti = getCutiForExport(bIdx)
        
        const kehadiranData = [
          [`KEHADIRAN: ${guru.nama} - ${namaBulanArr[bIdx]} ${tahun}`],
          [''],
          ['Tanggal', 'Hari', 'Status', 'Keterangan'],
          ...Array.from({ length: jmlHari }, (_, i) => {
            const hari = i + 1
            const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][new Date(tahun, bIdx, hari).getDay()]
            const isLibur = libur.includes(hari) || cuti.includes(hari) || new Date(tahun, bIdx, hari).getDay() === 0
            let status = hadirBulan[i] ? 'Hadir' : 'Tidak Hadir'
            let keterangan = ''
            if (isLibur) {
              status = '-'
              keterangan = new Date(tahun, bIdx, hari).getDay() === 0 ? 'Minggu' : 
                          libur.includes(hari) ? 'Libur Nasional' : 'Cuti Bersama'
            }
            return [hari, namaHari, status, keterangan]
          })
        ]
        
        const sheetName = `${guru.nama.substring(0, 20)}_${namaBulanArr[bIdx].substring(0, 3)}`.replace(/[^a-zA-Z0-9_]/g, '')
        try {
          const wsKehadiran = XLSX.utils.aoa_to_sheet(kehadiranData)
          XLSX.utils.book_append_sheet(workbook, wsKehadiran, sheetName.substring(0, 31))
        } catch (e) {
          // Skip jika sheet name sudah ada
        }
      })
    })

    // Sheet: Hari Libur
    const liburData = [
      ['JADWAL HARI LIBUR TAHUN 2026'],
      [''],
      ['Bulan', 'Tanggal', 'Jenis'],
    ]
    Object.keys(dataLibur).forEach(bulanIdx => {
      const bIdx = parseInt(bulanIdx)
      const liburBulan = dataLibur[bIdx] || []
      liburBulan.forEach(l => {
        liburData.push([namaBulanArr[bIdx], l.hari, l.jenis === 'libur' ? 'Libur Nasional' : 'Cuti Bersama'])
      })
    })
    const wsLibur = XLSX.utils.aoa_to_sheet(liburData)
    XLSX.utils.book_append_sheet(workbook, wsLibur, 'Hari Libur')

    // Download file
    const fileName = `Absensi_Guru_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(workbook, fileName)
    alert(`✅ Data berhasil diexport ke file: ${fileName}`)
  }, [sekolah, kepsek, nipKepsek, guruList, korwilData, dataLibur])

  // ==================== IMPORT DARI EXCEL ====================
  const importFromExcel = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        
        // Baca sheet "Data Sekolah"
        const wsSekolah = workbook.Sheets['Data Sekolah']
        if (wsSekolah) {
          const sheetData = XLSX.utils.sheet_to_json(wsSekolah, { header: 1 }) as (string | number)[][]
          
          // Temporary variables
          let headerGuruFound = false
          let newPengawas: { nama: string; nip: string }[] = []
          let newGuruList: GuruData[] = []
          
          sheetData.forEach((row, rowIndex) => {
            const col0 = row[0] !== undefined ? String(row[0]) : ''
            const col1 = row[1] !== undefined ? String(row[1]) : ''
            const col2 = row[2] !== undefined ? String(row[2]) : ''
            const col3 = row[3] !== undefined ? String(row[3]) : ''
            
            // Data Sekolah
            if (col0 === 'Nama Sekolah') setSekolah(col1)
            if (col0 === 'NPSN') setNpsn(col1)
            if (col0 === 'Kepala Sekolah') setKepsek(col1)
            if (col0 === 'NIP Kepala Sekolah') setNipKepsek(col1)
            
            // Data Korwil
            if (col0 === 'Kecamatan') setKorwilData(prev => ({ ...prev, kecamatan: col1 }))
            if (col0 === 'Nama Korwil') setKorwilData(prev => ({ ...prev, namaKorwil: col1 }))
            if (col0 === 'NIP Korwil') setKorwilData(prev => ({ ...prev, nipKorwil: col1 }))
            
            // Data Pengawas
            if (col0.startsWith('Pengawas ') && !col0.includes('NIP')) {
              const idx = parseInt(col0.replace('Pengawas ', '')) - 1
              if (!newPengawas[idx]) newPengawas[idx] = { nama: '', nip: '' }
              newPengawas[idx].nama = col1
            }
            if (col0.startsWith('NIP Pengawas ')) {
              const idx = parseInt(col0.replace('NIP Pengawas ', '')) - 1
              if (!newPengawas[idx]) newPengawas[idx] = { nama: '', nip: '' }
              newPengawas[idx].nip = col1
            }
            
            // Deteksi header tabel guru: "No", "Nama Guru", "Status"
            if (col0 === 'No' && col1 === 'Nama Guru') {
              headerGuruFound = true
              return // skip header row
            }
            
            // Baca data guru (setelah header ditemukan)
            if (headerGuruFound && col0 !== '' && col1 !== '') {
              // col0 = nomor urut, col1 = nama guru, col2 = status, col3 = nuptk
              const numCheck = parseInt(col0)
              if (!isNaN(numCheck) && numCheck > 0) {
                const newGuru: GuruData = {
                  id: `guru_${Date.now()}_${numCheck}`,
                  nama: col1,
                  ket: col2 || 'PNS',
                  nuptk: col3 || '',
                  hadir: {}
                }
                newGuruList.push(newGuru)
              }
            }
          })
          
          // Update state pengawas
          if (newPengawas.length > 0) {
            setKorwilData(prev => ({ ...prev, pengawas: newPengawas }))
          }
          
          // Update state guru
          if (newGuruList.length > 0) {
            setGuruList(newGuruList)
          }
        }

        // Baca sheet "Hari Libur"
        const wsLibur = workbook.Sheets['Hari Libur']
        if (wsLibur) {
          const liburData = XLSX.utils.sheet_to_json(wsLibur, { header: 1 }) as (string | number)[][]
          const newLibur: LiburData = {}
          
          liburData.slice(3).forEach(row => {
            const bulanNama = row[0] !== undefined ? String(row[0]) : ''
            const tanggal = parseInt(String(row[1]))
            const jenisNama = row[2] !== undefined ? String(row[2]) : ''
            
            if (bulanNama && !isNaN(tanggal) && jenisNama) {
              const bulanIdx = namaBulanArr.findIndex(b => b === bulanNama)
              if (bulanIdx !== -1) {
                if (!newLibur[bulanIdx]) newLibur[bulanIdx] = []
                newLibur[bulanIdx].push({
                  hari: tanggal,
                  jenis: jenisNama.includes('Nasional') ? 'libur' : 'cuti'
                })
              }
            }
          })
          setDataLibur(newLibur)
        }

        alert('✅ Data berhasil diimport dari Excel!')
      } catch (err) {
        console.error('Import error:', err)
        alert('❌ Gagal import data. Pastikan format file benar.')
      }
    }
    reader.readAsArrayBuffer(file)
    
    // Reset input file
    event.target.value = ''
  }, [])

  // ==================== RESET SEMUA DATA ====================
  const resetAllData = useCallback(() => {
    if (confirm('⚠️ PERINGATAN!\n\nSemua data akan dihapus permanen:\n• Data Sekolah\n• Data Korwil & Pengawas\n• Daftar Guru\n• Kehadiran\n• Hari Libur\n• SPTJM\n\nLanjutkan?')) {
      // Hapus dari localStorage
      localStorage.removeItem('absensi-guru-data')
      
      // Reset semua state
      setSekolah('')
      setNpsn('')
      setKepsek('')
      setNipKepsek('')
      setGuruList([])
      setKorwilData({
        kecamatan: 'Lemahabang',
        namaKorwil: '',
        nipKorwil: '',
        pengawas: [
          { nama: '', nip: '' },
          { nama: '', nip: '' }
        ]
      })
      setDataLibur({})
      setSptjmList([])
      
      alert('✅ Semua data berhasil direset!')
    }
  }, [])

  // ==================== DOWNLOAD FUNCTIONS ====================
  // Download Absensi ke Excel (Landscape)
  const downloadAbsensiExcel = useCallback(async () => {
    try {
      const response = await fetch('/api/export/absensi-xlsx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sekolah, npsn, kepsek, nipKepsek, kecamatan: korwilData.kecamatan,
          guruList, bulan, tahun, dataLibur, korwilData
        })
      })
      if (!response.ok) throw new Error('Export failed')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Daftar_Hadir_${namaBulanArr[parseInt(bulan)]}_${tahun}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('❌ Gagal mengekspor data ke Excel')
    }
  }, [sekolah, npsn, kepsek, nipKepsek, korwilData, guruList, bulan, dataLibur])

  // Download SPTJM ke Word (Portrait)
  const downloadSptjmDocx = useCallback(async () => {
    try {
      const response = await fetch('/api/export/sptjm-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sptjmData, korwilData })
      })
      if (!response.ok) throw new Error('Export failed')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `SPTJM_${sptjmData.nama || 'Guru'}_${sptjmData.bulan || ''}.docx`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('❌ Gagal mengekspor SPTJM ke Word')
    }
  }, [sptjmData, korwilData])

  // Download Rekap ke Excel (Landscape)
  const downloadRekapExcel = useCallback(async () => {
    try {
      const response = await fetch('/api/export/rekap-xlsx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sekolah, npsn, kepsek, nipKepsek, kecamatan: korwilData.kecamatan,
          guruList, bulan: selectedBulanRekap.toString(), tahun, dataLibur, korwilData,
          titimangsa: customTitimangsa[selectedBulanRekap] || getTitimangsaBulan(selectedBulanRekap)
        })
      })
      if (!response.ok) throw new Error('Export failed')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Rekap_${namaBulanArr[selectedBulanRekap]}_${tahun}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('❌ Gagal mengekspor rekap ke Excel')
    }
  }, [sekolah, npsn, kepsek, nipKepsek, korwilData, guruList, selectedBulanRekap, dataLibur, customTitimangsa])

  // Download Monitoring ke Word (Portrait)
  const downloadMonitoringDocx = useCallback(async () => {
    try {
      const response = await fetch('/api/export/monitoring-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sekolah, npsn, kepsek, nipKepsek, monitoringTanggal, guruList, monitoringData,
          temuanMasalah, kecamatan: korwilData.kecamatan
        })
      })
      if (!response.ok) throw new Error('Export failed')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Instrumen_Monitoring_${sekolah || 'Sekolah'}.docx`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('❌ Gagal mengekspor monitoring ke Word')
    }
  }, [sekolah, npsn, kepsek, nipKepsek, monitoringTanggal, guruList, monitoringData, temuanMasalah, korwilData.kecamatan])

  // Fungsi untuk mendapatkan hari libur
  const getLibur = useCallback((b: number): number[] => {
    const liburBulan = dataLibur[b] || []
    return liburBulan.filter(l => l.jenis === 'libur').map(l => l.hari)
  }, [dataLibur])

  // Fungsi untuk mendapatkan cuti bersama
  const getCuti = useCallback((b: number): number[] => {
    const liburBulan = dataLibur[b] || []
    return liburBulan.filter(l => l.jenis === 'cuti').map(l => l.hari)
  }, [dataLibur])

  // ==================== MONITORING FUNCTIONS ====================
  // Toggle monitoring checkbox
  const toggleMonitoring = useCallback((guruId: string, field: keyof MonitoringData) => {
    setMonitoringData(prev => {
      const current = prev[guruId] || {
        sktpJan: false, sktpFeb: false, sktpMar: false,
        tpgJan: false, tpgFeb: false, tpgMar: false,
        statusAsn: 'PNS' as const,
        nuptk: ''
      }
      return {
        ...prev,
        [guruId]: {
          ...current,
          [field]: !current[field]
        }
      }
    })
  }, [])

  // Update monitoring field (for dropdown and text)
  const updateMonitoringField = useCallback((guruId: string, field: keyof MonitoringData, value: string | boolean) => {
    setMonitoringData(prev => {
      const current = prev[guruId] || {
        sktpJan: false, sktpFeb: false, sktpMar: false,
        tpgJan: false, tpgFeb: false, tpgMar: false,
        statusAsn: 'PNS' as const,
        nuptk: ''
      }
      return {
        ...prev,
        [guruId]: {
          ...current,
          [field]: value
        }
      }
    })
  }, [])

  // Check all monitoring
  const checkAllMonitoring = useCallback(() => {
    const newMonitoringData: {[key: string]: MonitoringData} = {}
    guruList.forEach(guru => {
      const current = monitoringData[guru.id] || {
        sktpJan: false, sktpFeb: false, sktpMar: false,
        tpgJan: false, tpgFeb: false, tpgMar: false,
        statusAsn: 'PNS' as const,
        nuptk: ''
      }
      newMonitoringData[guru.id] = {
        ...current,
        sktpJan: true, sktpFeb: true, sktpMar: true,
        tpgJan: true, tpgFeb: true, tpgMar: true
      }
    })
    setMonitoringData(newMonitoringData)
  }, [guruList, monitoringData])

  // Uncheck all monitoring
  const uncheckAllMonitoring = useCallback(() => {
    const newMonitoringData: {[key: string]: MonitoringData} = {}
    guruList.forEach(guru => {
      const current = monitoringData[guru.id] || {
        sktpJan: false, sktpFeb: false, sktpMar: false,
        tpgJan: false, tpgFeb: false, tpgMar: false,
        statusAsn: 'PNS' as const,
        nuptk: ''
      }
      newMonitoringData[guru.id] = {
        ...current,
        sktpJan: false, sktpFeb: false, sktpMar: false,
        tpgJan: false, tpgFeb: false, tpgMar: false
      }
    })
    setMonitoringData(newMonitoringData)
  }, [guruList, monitoringData])

  // Fungsi untuk mengecek hari Minggu
  function isMinggu(t: number, b: number, h: number): boolean {
    return new Date(t, b, h).getDay() === 0
  }

  // Fungsi untuk mendapatkan nama hari
  function getNamaHari(t: number, b: number, h: number): string {
    const hari = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
    return hari[new Date(t, b, h).getDay()]
  }

  // Hitung hari kerja dalam sebulan
  const getHariKerja = useCallback((bulanIdx: number): number => {
    const jmlHari = new Date(tahun, bulanIdx + 1, 0).getDate()
    const libur = getLibur(bulanIdx)
    const cuti = getCuti(bulanIdx)
    let hariKerja = 0
    for (let h = 1; h <= jmlHari; h++) {
      if (!libur.includes(h) && !cuti.includes(h) && !isMinggu(tahun, bulanIdx, h)) {
        hariKerja++
      }
    }
    return hariKerja
  }, [getLibur, getCuti])

  // Handler untuk mengubah bulan dan reset kehadiran
  const handleBulanChange = useCallback((newBulan: string) => {
    const newBulanIndex = parseInt(newBulan)
    const newJumlahHari = new Date(tahun, newBulanIndex + 1, 0).getDate()
    setBulan(newBulan)
    setGuruList(prev => prev.map(g => ({
      ...g,
      hadir: { [newBulanIndex]: Array(newJumlahHari).fill(false) }
    })))
  }, [])

  // Tambah guru ke absensi
  const tambahGuru = useCallback(() => {
    if (!namaGuru.trim()) { alert('Nama guru harus diisi!'); return }
    const newGuru: GuruData = {
      id: Date.now().toString(),
      nama: namaGuru,
      ket: ketGuru,
      nuptk: '',
      hadir: { [bulanIndex]: Array(jumlahHari).fill(false) }
    }
    setGuruList(prev => [...prev, newGuru])
    setNamaGuru('')
    setKetGuru('PNS')
  }, [namaGuru, ketGuru, jumlahHari, bulanIndex])

  // Hapus guru
  const hapusGuru = useCallback((id: string) => {
    setGuruList(prev => prev.filter(g => g.id !== id))
  }, [])

  // Toggle checkbox hadir
  const toggleHadir = useCallback((guruId: string, hariIndex: number) => {
    setGuruList(prev => prev.map(g => {
      if (g.id === guruId) {
        const currentHadir = g.hadir[bulanIndex] || Array(jumlahHari).fill(false)
        const newHadir = [...currentHadir]
        newHadir[hariIndex] = !newHadir[hariIndex]
        return { ...g, hadir: { ...g.hadir, [bulanIndex]: newHadir } }
      }
      return g
    }))
  }, [bulanIndex, jumlahHari])

  // Ceklis semua hadir
  const checkAllHadir = useCallback(() => {
    const libur = getLibur(bulanIndex)
    const cuti = getCuti(bulanIndex)
    
    setGuruList(prev => prev.map(g => {
      const newHadir = Array(jumlahHari).fill(false).map((_, i) => {
        const hari = i + 1
        const isLibur = libur.includes(hari) || cuti.includes(hari) || isMinggu(tahun, bulanIndex, hari)
        return !isLibur // true jika bukan hari libur
      })
      return { ...g, hadir: { ...g.hadir, [bulanIndex]: newHadir } }
    }))
  }, [bulanIndex, jumlahHari, getLibur, getCuti])

  // Hapus semua ceklis
  const uncheckAllHadir = useCallback(() => {
    setGuruList(prev => prev.map(g => ({
      ...g,
      hadir: { ...g.hadir, [bulanIndex]: Array(jumlahHari).fill(false) }
    })))
  }, [bulanIndex, jumlahHari])

  // Hitung statistik
  const totalGuru = guruList.length
  const totalHadir = guruList.reduce((acc, g) => {
    const hadirBulan = g.hadir[bulanIndex] || []
    return acc + hadirBulan.filter(h => h).length
  }, 0)
  const totalHariKerja = getHariKerja(bulanIndex)

  // Print Absensi - Landscape orientation dengan ukuran Folio (8.5x13 inch)
  const handlePrint = useCallback(() => {
    const styleEl = document.createElement('style')
    styleEl.id = 'print-landscape-style'
    styleEl.textContent = `
      @media print {
        @page {
          size: 8.5in 13in landscape !important;
          margin: 1.5cm !important;
        }
      }
    `
    document.head.appendChild(styleEl)
    window.print()
    setTimeout(() => {
      document.getElementById('print-landscape-style')?.remove()
    }, 1000)
  }, [])

  // SPTJM handlers
  const handleSptjmChange = useCallback((field: keyof SPTJMData, value: string) => {
    if (field === 'gaji') value = formatRupiah(value)
    setSptjmData(prev => ({ ...prev, [field]: value }))
  }, [])

  const generateSptjm = useCallback(() => {
    if (!sptjmData.nama) { alert('Nama harus diisi!'); return }
    if (selectedSptjmIndex !== null) {
      setSptjmList(prev => prev.map((item, idx) => idx === selectedSptjmIndex ? sptjmData : item))
    } else {
      setSptjmList(prev => [...prev, sptjmData])
    }
    setShowSptjmResult(true)
  }, [sptjmData, selectedSptjmIndex])

  const newSptjm = useCallback(() => {
    setSptjmData({ 
      nama: '', nip: '', ttl: '', nuptk: '', nopes: '', nrg: '', sekolah: sekolah, bulan: namaBulanArr[bulanIndex], gaji: '', gol: '', mth: '', mtb: '', tanggal: '',
      status: 'PNS',
      alamat: '',
      namaBank: '',
      noRekening: '',
      namaPemilikRekening: ''
    })
    setSelectedSptjmIndex(null)
    setShowSptjmResult(false)
  }, [sekolah, bulanIndex])

  // Print SPTJM - Portrait orientation dengan ukuran Folio (8.5x13 inch)
  const handlePrintSptjm = useCallback(() => {
    // Add temporary style for portrait folio paper
    const styleEl = document.createElement('style')
    styleEl.id = 'print-sptjm-style'
    styleEl.textContent = `
      @media print {
        @page {
          size: 8.5in 13in portrait !important;
          margin: 2cm !important;
        }
      }
    `
    document.head.appendChild(styleEl)
    window.print()
    // Clean up after print dialog
    setTimeout(() => {
      document.getElementById('print-sptjm-style')?.remove()
    }, 1000)
  }, [])

  // Gabungkan semua guru dari guruList (terkoneksi dengan tab Absen)
  const allGuruRekap = useMemo(() => {
    const result: { guru: GuruData; sekolahNama: string; sekolahIdx: number }[] = []
    // Gunakan data dari tab Absensi (guruList + sekolah)
    guruList.forEach(g => {
      result.push({ guru: g, sekolahNama: sekolah || 'Sekolah', sekolahIdx: 0 })
    })
    return result
  }, [guruList, sekolah])

  // Fungsi hitung kehadiran per bulan untuk seorang guru
  const getHadirBulan = (guru: GuruData, bulanIdx: number): number => {
    const hadirBulan = guru.hadir[bulanIdx] || []
    return hadirBulan.filter(h => h).length
  }

  // Fungsi hitung sakit, izin, cuti berdasarkan hari kerja dikurangi kehadiran
  const getSakitBulan = (guru: GuruData, bulanIdx: number): number => {
    const hadirBulan = guru.hadir[bulanIdx] || []
    const jmlHari = new Date(tahun, bulanIdx + 1, 0).getDate()
    const libur = getLibur(bulanIdx)
    const cuti = getCuti(bulanIdx)
    let hariKerja = 0
    for (let h = 1; h <= jmlHari; h++) {
      if (!libur.includes(h) && !cuti.includes(h) && !isMinggu(tahun, bulanIdx, h)) {
        hariKerja++
      }
    }
    const hadir = hadirBulan.filter(h => h).length
    return Math.max(0, Math.floor((hariKerja - hadir) * 0.1))
  }
  
  const getIzinBulan = (guru: GuruData, bulanIdx: number): number => {
    const hadirBulan = guru.hadir[bulanIdx] || []
    const jmlHari = new Date(tahun, bulanIdx + 1, 0).getDate()
    const libur = getLibur(bulanIdx)
    const cuti = getCuti(bulanIdx)
    let hariKerja = 0
    for (let h = 1; h <= jmlHari; h++) {
      if (!libur.includes(h) && !cuti.includes(h) && !isMinggu(tahun, bulanIdx, h)) {
        hariKerja++
      }
    }
    const hadir = hadirBulan.filter(h => h).length
    return Math.max(0, Math.floor((hariKerja - hadir) * 0.05))
  }
  
  const getCutiBulan = (guru: GuruData, bulanIdx: number): number => {
    const hadirBulan = guru.hadir[bulanIdx] || []
    const jmlHari = new Date(tahun, bulanIdx + 1, 0).getDate()
    const libur = getLibur(bulanIdx)
    const cuti = getCuti(bulanIdx)
    let hariKerja = 0
    for (let h = 1; h <= jmlHari; h++) {
      if (!libur.includes(h) && !cuti.includes(h) && !isMinggu(tahun, bulanIdx, h)) {
        hariKerja++
      }
    }
    const hadir = hadirBulan.filter(h => h).length
    return Math.max(0, Math.floor((hariKerja - hadir) * 0.03))
  }

  // Setting Tanggal handlers
  const openPopup = useCallback((bulan: number, hari: number) => {
    setSelectedDate({ bulan, hari })
    setPopupOpen(true)
  }, [])

  const closePopup = useCallback(() => {
    setPopupOpen(false)
    setSelectedDate(null)
  }, [])

  const setLibur = useCallback((jenis: 'libur' | 'cuti') => {
    if (!selectedDate) return
    const { bulan, hari } = selectedDate
    
    setDataLibur(prev => {
      const newData = { ...prev }
      if (!newData[bulan]) newData[bulan] = []
      
      const idx = newData[bulan].findIndex(x => x.hari === hari)
      if (idx !== -1) {
        newData[bulan] = [...newData[bulan]]
        newData[bulan][idx] = { hari, jenis }
      } else {
        newData[bulan] = [...newData[bulan], { hari, jenis }]
      }
      return newData
    })
    closePopup()
  }, [selectedDate, closePopup])

  const hapusTanggal = useCallback(() => {
    if (!selectedDate) return
    const { bulan, hari } = selectedDate
    
    setDataLibur(prev => {
      const newData = { ...prev }
      if (newData[bulan]) {
        newData[bulan] = newData[bulan].filter(x => x.hari !== hari)
      }
      return newData
    })
    closePopup()
  }, [selectedDate, closePopup])

  // Handler untuk Korwil
  const updateKorwil = useCallback((field: keyof KorwilData, value: string) => {
    setKorwilData(prev => ({ ...prev, [field]: value }))
  }, [])

  const updatePengawas = useCallback((index: number, field: 'nama' | 'nip', value: string) => {
    setKorwilData(prev => {
      const newPengawas = [...prev.pengawas]
      newPengawas[index] = { ...newPengawas[index], [field]: value }
      return { ...prev, pengawas: newPengawas }
    })
  }, [])

  const addPengawas = useCallback(() => {
    setKorwilData(prev => ({
      ...prev,
      pengawas: [...prev.pengawas, { nama: '', nip: '' }]
    }))
  }, [])

  const removePengawas = useCallback((index: number) => {
    setKorwilData(prev => ({
      ...prev,
      pengawas: prev.pengawas.filter((_, i) => i !== index)
    }))
  }, [])

  // Render kalender bulan dengan perbaikan
  const renderKalenderBulan = (bulanIdx: number) => {
    const jmlHari = new Date(tahun, bulanIdx + 1, 0).getDate()
    const firstDay = new Date(tahun, bulanIdx, 1).getDay()
    const liburBulan = dataLibur[bulanIdx] || []
    
    // Generate all days of the month
    const calendarDays: (number | null)[] = []
    
    // Add empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(null)
    }
    
    // Add all days of the month
    for (let d = 1; d <= jmlHari; d++) {
      calendarDays.push(d)
    }
    
    // Group into weeks (7 days each)
    const weeks: (number | null)[][] = []
    let currentWeek: (number | null)[] = []
    
    calendarDays.forEach((day, index) => {
      currentWeek.push(day)
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    })
    
    // Push remaining days as last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null)
      }
      weeks.push(currentWeek)
    }
    
    return (
      <Card key={bulanIdx} className="border border-slate-300 overflow-hidden">
        <CardHeader className="bg-slate-100 py-2">
          <CardTitle className="text-center text-sm font-bold">{namaBulanArr[bulanIdx]}</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-slate-300 p-1 text-xs w-8 bg-red-100 text-red-700">M</th>
                <th className="border border-slate-300 p-1 text-xs w-8">S</th>
                <th className="border border-slate-300 p-1 text-xs w-8">S</th>
                <th className="border border-slate-300 p-1 text-xs w-8">R</th>
                <th className="border border-slate-300 p-1 text-xs w-8">K</th>
                <th className="border border-slate-300 p-1 text-xs w-8">J</th>
                <th className="border border-slate-300 p-1 text-xs w-8">S</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, weekIdx) => (
                <tr key={weekIdx}>
                  {week.map((day, dayIdx) => {
                    if (day === null) {
                      return <td key={dayIdx} className="border border-slate-300 p-1"></td>
                    }
                    
                    const dateObj = new Date(tahun, bulanIdx, day)
                    const dayOfWeek = dateObj.getDay()
                    const isSunday = dayOfWeek === 0
                    const liburData = liburBulan.find(x => x.hari === day)
                    
                    let bgClass = ""
                    // Minggu SELALU merah (prioritas tertinggi)
                    if (isSunday) {
                      bgClass = "bg-red-500 text-white"
                    } else if (liburData?.jenis === 'libur') {
                      bgClass = "bg-orange-400 text-white"
                    } else if (liburData?.jenis === 'cuti') {
                      bgClass = "bg-sky-200"
                    }
                    
                    return (
                      <td 
                        key={dayIdx} 
                        className={cn(
                          "border border-slate-300 text-center p-1 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all text-xs",
                          bgClass
                        )}
                        onClick={() => openPopup(bulanIdx, day)}
                      >
                        {day}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    )
  }

  // Tabel rekap checklist (sama dengan format absensi)
  const renderTabelRekapChecklist = (bulanIdx: number) => {
    const jmlHari = new Date(tahun, bulanIdx + 1, 0).getDate()
    const libur = getLibur(bulanIdx)
    const cuti = getCuti(bulanIdx)
    const lastDay = new Date(tahun, bulanIdx + 1, 0).getDate()
    const titimangsa = customTitimangsa[bulanIdx] || getTitimangsaBulan(bulanIdx)
    
    return (
      <Card key={`checklist-${bulanIdx}`} className="border-0 shadow-lg bg-white overflow-hidden print:shadow-none print:border-2 print:border-black mb-6">
        <div className="border-b-2 border-black p-4 bg-slate-800 print:bg-white">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold tracking-wide text-white print:text-black">DAFTAR HADIR GURU PNS</h2>
            <p className="font-medium text-emerald-300 print:text-black">BULAN {namaBulanArr[bulanIdx].toUpperCase()} {tahun}</p>
            <p className="text-slate-300 print:text-black text-sm">KECAMATAN {korwilData.kecamatan.toUpperCase()} KABUPATEN CIREBON</p>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="border-collapse">
              <TableHeader>
                <TableRow className="bg-slate-100 print:bg-gray-100">
                  <TableHead rowSpan={2} className="border border-black text-center font-bold text-slate-700 w-12">NO</TableHead>
                  <TableHead rowSpan={2} className="border border-black text-center font-bold text-slate-700 min-w-[150px]">NAMA GURU</TableHead>
                  <TableHead rowSpan={2} className="border border-black text-center font-bold text-slate-700 min-w-[120px]">ASAL SEKOLAH</TableHead>
                  <TableHead rowSpan={2} className="border border-black text-center font-bold text-slate-700 w-16">KET</TableHead>
                  <TableHead colSpan={jmlHari} className="border border-black text-center font-bold text-slate-700">TANGGAL</TableHead>
                </TableRow>
                <TableRow className="bg-slate-50 print:bg-gray-50">
                  {Array.from({ length: jmlHari }, (_, i) => i + 1).map((h) => {
                    const isLibur = libur.includes(h) || cuti.includes(h) || isMinggu(tahun, bulanIdx, h)
                    return (
                      <TableHead key={h} className={cn("border border-black text-center p-1 text-xs w-6", isLibur && "bg-red-500 text-white print:bg-gray-300 print:text-black")} title={`${getNamaHari(tahun, bulanIdx, h)}`}>
                        {h}
                      </TableHead>
                    )
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {allGuruRekap.length === 0 ? (
                  <TableRow><TableCell colSpan={4 + jmlHari} className="text-center text-slate-400 py-8 border border-black">Belum ada data guru</TableCell></TableRow>
                ) : (
                  allGuruRekap.map(({ guru, sekolahNama }, idx) => {
                    const hadirBulan = guru.hadir[bulanIdx] || Array(jmlHari).fill(false)
                    return (
                      <TableRow key={guru.id} className="hover:bg-slate-50 print:hover:bg-transparent">
                        <TableCell className="border border-black text-center font-medium">{idx + 1}</TableCell>
                        <TableCell className="border border-black font-medium">{guru.nama}</TableCell>
                        <TableCell className="border border-black text-sm">{sekolahNama}</TableCell>
                        <TableCell className="border border-black text-center">
                          <Badge variant={guru.ket === 'PNS' ? 'default' : guru.ket === 'PPPK' ? 'secondary' : 'outline'} className={cn("text-xs", guru.ket === 'PNS' && "bg-emerald-600", guru.ket === 'PPPK' && "bg-cyan-600 text-white")}>
                            {guru.ket}
                          </Badge>
                        </TableCell>
                        {Array.from({ length: jmlHari }, (_, i) => i).map((hariIdx) => {
                          const hari = hariIdx + 1
                          const isLibur = libur.includes(hari) || cuti.includes(hari) || isMinggu(tahun, bulanIdx, hari)
                          return (
                            <TableCell key={hariIdx} className={cn("border border-black text-center p-0 w-6", isLibur && "bg-red-100 print:bg-gray-200")}>
                              <div className="w-full h-full p-1 flex items-center justify-center">
                                {hadirBulan[hariIdx] ? <Check className="w-4 h-4 text-emerald-600 print:text-black" /> : isLibur ? <XCircle className="w-2 h-2 text-red-400 print:hidden" /> : <span className="text-slate-300 text-xs print:hidden">○</span>}
                              </div>
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="p-4 print:p-2">
            <div className="flex justify-between items-start mt-4">
              <div className="text-center w-48">
                <p className="text-sm">Mengetahui,</p>
                <p className="font-medium">Korwil Bidang Pendidikan</p>
                <p className="font-medium">Kec. {korwilData.kecamatan || '................'}</p>
                <div className="h-16 print:h-12" />
                <p className="font-bold">{korwilData.namaKorwil || '...........................'}</p>
                <p className="text-sm">NIP. {korwilData.nipKorwil || '....................'}</p>
              </div>
              <div className="text-center w-48">
                <p className="text-sm">{korwilData.kecamatan}, {titimangsa}</p>
                <p className="font-medium">Pengawas Sekolah</p>
                <div className="h-16 print:h-12" />
                <p className="font-bold">{korwilData.pengawas[0]?.nama || '...........................'}</p>
                <p className="text-sm">NIP. {korwilData.pengawas[0]?.nip || '....................'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Tabel rekapitulasi (SAKIT/IZIN/CUTI/HADIR) per bulan
  const renderTabelRekapitulasiBulan = (bulanIdx: number) => {
    const lastDay = new Date(tahun, bulanIdx + 1, 0).getDate()
    const titimangsa = customTitimangsa[bulanIdx] || getTitimangsaBulan(bulanIdx)
    
    return (
      <Card key={`rekap-${bulanIdx}`} className="border-0 shadow-lg bg-white overflow-hidden print:shadow-none print:border-2 print:border-black mb-6 print:break-before-page">
        <div className="border-b-2 border-black p-4 bg-emerald-700 print:bg-white">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold tracking-wide text-white print:text-black">REKAPITULASI KEHADIRAN GURU</h2>
            <p className="font-medium text-emerald-100 print:text-black">BULAN {namaBulanArr[bulanIdx].toUpperCase()} {tahun}</p>
            <p className="text-emerald-200 print:text-slate-600 text-sm">KORWIL BIDANG PENDIDIKAN KECAMATAN {korwilData.kecamatan.toUpperCase()}</p>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="border-collapse">
              <TableHeader>
                <TableRow className="bg-slate-100 print:bg-gray-100">
                  <TableHead className="border border-black text-center font-bold text-slate-700 w-12">NO</TableHead>
                  <TableHead className="border border-black text-center font-bold text-slate-700 min-w-[180px]">NAMA GURU</TableHead>
                  <TableHead className="border border-black text-center font-bold text-slate-700 min-w-[150px]">ASAL SEKOLAH</TableHead>
                  <TableHead className="border border-black text-center font-bold text-slate-700 w-16">SAKIT</TableHead>
                  <TableHead className="border border-black text-center font-bold text-slate-700 w-16">IZIN</TableHead>
                  <TableHead className="border border-black text-center font-bold text-slate-700 w-16">CUTI</TableHead>
                  <TableHead className="border border-black text-center font-bold text-slate-700 w-16">HADIR</TableHead>
                  <TableHead className="border border-black text-center font-bold text-slate-700 w-16">JML HARI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allGuruRekap.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-slate-400 py-8 border border-black">Belum ada data guru</TableCell></TableRow>
                ) : (
                  allGuruRekap.map(({ guru, sekolahNama }, idx) => {
                    const hadir = getHadirBulan(guru, bulanIdx)
                    const sakit = getSakitBulan(guru, bulanIdx)
                    const izin = getIzinBulan(guru, bulanIdx)
                    const cuti = getCutiBulan(guru, bulanIdx)
                    const hariKerja = getHariKerja(bulanIdx)
                    return (
                      <TableRow key={guru.id} className="hover:bg-slate-50 print:hover:bg-transparent">
                        <TableCell className="border border-black text-center font-medium">{idx + 1}</TableCell>
                        <TableCell className="border border-black font-medium">{guru.nama}</TableCell>
                        <TableCell className="border border-black text-sm">{sekolahNama}</TableCell>
                        <TableCell className="border border-black text-center">{sakit}</TableCell>
                        <TableCell className="border border-black text-center">{izin}</TableCell>
                        <TableCell className="border border-black text-center">{cuti}</TableCell>
                        <TableCell className="border border-black text-center font-bold text-emerald-600">{hadir}</TableCell>
                        <TableCell className="border border-black text-center font-bold">{hariKerja}</TableCell>
                      </TableRow>
                    )
                  })
                )}
                {/* Total Row */}
                <TableRow className="bg-slate-200 font-bold print:bg-gray-200">
                  <TableCell colSpan={3} className="border border-black text-center">TOTAL</TableCell>
                  <TableCell className="border border-black text-center">{allGuruRekap.reduce((acc, { guru }) => acc + getSakitBulan(guru, bulanIdx), 0)}</TableCell>
                  <TableCell className="border border-black text-center">{allGuruRekap.reduce((acc, { guru }) => acc + getIzinBulan(guru, bulanIdx), 0)}</TableCell>
                  <TableCell className="border border-black text-center">{allGuruRekap.reduce((acc, { guru }) => acc + getCutiBulan(guru, bulanIdx), 0)}</TableCell>
                  <TableCell className="border border-black text-center font-bold text-emerald-600">{allGuruRekap.reduce((acc, { guru }) => acc + getHadirBulan(guru, bulanIdx), 0)}</TableCell>
                  <TableCell className="border border-black text-center font-bold">{allGuruRekap.length * getHariKerja(bulanIdx)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="p-4 print:p-2">
            <div className="flex justify-between items-start mt-4">
              <div className="text-center w-48">
                <p className="text-sm">Mengetahui,</p>
                <p className="font-medium">Korwil Bidang Pendidikan</p>
                <p className="font-medium">Kec. {korwilData.kecamatan || '................'}</p>
                <div className="h-16 print:h-12" />
                <p className="font-bold">{korwilData.namaKorwil || '...........................'}</p>
                <p className="text-sm">NIP. {korwilData.nipKorwil || '....................'}</p>
              </div>
              <div className="text-center w-48">
                <p className="text-sm">{korwilData.kecamatan}, {titimangsa}</p>
                <p className="font-medium">Pengawas Sekolah</p>
                <div className="h-16 print:h-12" />
                <p className="font-bold">{korwilData.pengawas[0]?.nama || '...........................'}</p>
                <p className="text-sm">NIP. {korwilData.pengawas[0]?.nip || '....................'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Print Rekap - Landscape orientation dengan ukuran Folio (8.5x13 inch)
  const handlePrintRekap = useCallback(() => {
    const styleEl = document.createElement('style')
    styleEl.id = 'print-rekap-style'
    styleEl.textContent = `
      @media print {
        @page {
          size: 8.5in 13in landscape !important;
          margin: 1.5cm !important;
        }
      }
    `
    document.head.appendChild(styleEl)
    window.print()
    setTimeout(() => {
      document.getElementById('print-rekap-style')?.remove()
    }, 1000)
  }, [])

  // Print Monitoring - Landscape orientation dengan ukuran Folio (8.5x13 inch)
  const handlePrintMonitoring = useCallback(() => {
    const styleEl = document.createElement('style')
    styleEl.id = 'print-monitoring-style'
    styleEl.textContent = `
      @media print {
        @page {
          size: 8.5in 13in landscape !important;
          margin: 1.5cm !important;
        }
      }
    `
    document.head.appendChild(styleEl)
    window.print()
    setTimeout(() => {
      document.getElementById('print-monitoring-style')?.remove()
    }, 1000)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 print:bg-white">
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white py-6 print:hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"><GraduationCap className="w-8 h-8" /></div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Sistem Manajemen Guru</h1>
                <p className="text-emerald-100 mt-1">Kelola absensi, SPTJM, dan rekap data guru dengan mudah</p>
              </div>
            </div>
            {/* Export/Import Buttons */}
            <div className="flex items-center gap-2">
              <Button onClick={exportToExcel} variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                <Download className="w-4 h-4 mr-2" />Export Excel
              </Button>
              <label className="cursor-pointer">
                <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20" asChild>
                  <span><Upload className="w-4 h-4 mr-2" />Import Excel</span>
                </Button>
                <input type="file" accept=".xlsx,.xls" onChange={importFromExcel} className="hidden" />
              </label>
              <Button onClick={resetAllData} variant="outline" className="bg-red-500/20 border-red-300/30 text-red-100 hover:bg-red-500/40">
                <RotateCcw className="w-4 h-4 mr-2" />Reset Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <Tabs defaultValue="absensi" className="w-full">
          <TabsList className="grid w-full grid-cols-6 max-w-5xl mx-auto mb-6 bg-white/80 backdrop-blur-sm shadow-md print:hidden">
            <TabsTrigger value="absensi" className="flex items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white text-xs md:text-sm"><ClipboardList className="w-4 h-4" /><span className="hidden sm:inline">Absensi</span></TabsTrigger>
            <TabsTrigger value="sptjm" className="flex items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white text-xs md:text-sm"><FileSignature className="w-4 h-4" /><span className="hidden sm:inline">SPTJM</span></TabsTrigger>
            <TabsTrigger value="rekap" className="flex items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white text-xs md:text-sm"><BarChart3 className="w-4 h-4" /><span className="hidden sm:inline">Rekap</span></TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-600 data-[state=active]:text-white text-xs md:text-sm"><ClipboardCheck className="w-4 h-4" /><span className="hidden sm:inline">Monitoring</span></TabsTrigger>
            <TabsTrigger value="setting" className="flex items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-600 data-[state=active]:to-slate-700 data-[state=active]:text-white text-xs md:text-sm"><Settings className="w-4 h-4" /><span className="hidden sm:inline">Setting</span></TabsTrigger>
            <TabsTrigger value="petunjuk" className="flex items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white text-xs md:text-sm"><FileText className="w-4 h-4" /><span className="hidden sm:inline">Petunjuk</span></TabsTrigger>
          </TabsList>

          {/* TAB ABSENSI */}
          <TabsContent value="absensi">
            <div className="print:hidden space-y-6">
              {/* Informasi Sekolah */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-50 border-b">
                  <CardTitle className="flex items-center gap-2 text-slate-700"><School className="w-5 h-5 text-emerald-600" />Informasi Sekolah</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2"><Label className="text-slate-600 font-medium">Nama Sekolah</Label><Input placeholder="Contoh: SD Negeri 1 Lemahabang" value={sekolah} onChange={(e) => setSekolah(e.target.value)} className="border-slate-200 focus:border-emerald-500" /></div>
                    <div className="space-y-2"><Label className="text-slate-600 font-medium">NPSN</Label><Input placeholder="Nomor Pokok Sekolah Nasional" value={npsn} onChange={(e) => setNpsn(e.target.value)} className="border-slate-200 focus:border-emerald-500" /></div>
                    <div className="space-y-2"><Label className="text-slate-600 font-medium">Kepala Sekolah</Label><Input placeholder="Nama Kepala Sekolah" value={kepsek} onChange={(e) => setKepsek(e.target.value)} className="border-slate-200 focus:border-emerald-500" /></div>
                    <div className="space-y-2"><Label className="text-slate-600 font-medium">NIP</Label><Input placeholder="NIP Kepala Sekolah" value={nipKepsek} onChange={(e) => setNipKepsek(e.target.value)} className="border-slate-200 focus:border-emerald-500" /></div>
                  </div>
                </CardContent>
              </Card>

              {/* Informasi Korwil dan Pengawas */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                  <CardTitle className="flex items-center gap-2 text-slate-700"><UserCog className="w-5 h-5 text-amber-600" />Informasi Korwil & Pengawas Sekolah</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Koordinator Wilayah */}
                    <div className="space-y-4 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                      <h4 className="font-semibold text-amber-800">Koordinator Wilayah</h4>
                      <div className="space-y-3">
                        <div className="space-y-1"><Label className="text-xs text-slate-600">Kecamatan</Label><Input placeholder="Nama Kecamatan" value={korwilData.kecamatan} onChange={(e) => updateKorwil('kecamatan', e.target.value)} className="border-amber-200 focus:border-amber-500" /></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1"><Label className="text-xs text-slate-600">Nama Koordinator</Label><Input placeholder="Nama Koordinator Wilayah" value={korwilData.namaKorwil} onChange={(e) => updateKorwil('namaKorwil', e.target.value)} className="border-amber-200 focus:border-amber-500" /></div>
                          <div className="space-y-1"><Label className="text-xs text-slate-600">NIP Koordinator</Label><Input placeholder="NIP" value={korwilData.nipKorwil} onChange={(e) => updateKorwil('nipKorwil', e.target.value)} className="border-amber-200 focus:border-amber-500" /></div>
                        </div>
                      </div>
                    </div>

                    {/* Pengawas Sekolah */}
                    <div className="space-y-4 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-cyan-800">Pengawas Sekolah</h4>
                        <Button onClick={addPengawas} variant="outline" size="sm" className="text-cyan-600 border-cyan-300 hover:bg-cyan-50"><Plus className="w-4 h-4 mr-1" />Tambah Pengawas</Button>
                      </div>
                      <div className="space-y-3">
                        {korwilData.pengawas.map((pengawas, idx) => (
                          <div key={idx} className="flex items-end gap-2">
                            <div className="flex-1 grid grid-cols-2 gap-2">
                              <div className="space-y-1"><Label className="text-xs text-slate-600">Nama Pengawas {idx + 1}</Label><Input placeholder="Nama Pengawas" value={pengawas.nama} onChange={(e) => updatePengawas(idx, 'nama', e.target.value)} className="border-cyan-200 focus:border-cyan-500" /></div>
                              <div className="space-y-1"><Label className="text-xs text-slate-600">NIP</Label><Input placeholder="NIP" value={pengawas.nip} onChange={(e) => updatePengawas(idx, 'nip', e.target.value)} className="border-cyan-200 focus:border-cyan-500" /></div>
                            </div>
                            {korwilData.pengawas.length > 1 && (
                              <Button onClick={() => removePengawas(idx)} variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 mb-1"><Trash2 className="w-4 h-4" /></Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Periode dan Tambah Guru */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-50 border-b"><CardTitle className="flex items-center gap-2 text-slate-700"><Calendar className="w-5 h-5 text-cyan-600" />Periode Absensi</CardTitle></CardHeader>
                  <CardContent className="p-6">
                    <div className="flex flex-wrap gap-4">
                      <div className="flex-1 min-w-[200px]"><Label className="text-slate-600 font-medium mb-2 block">Pilih Bulan</Label>
                        <Select value={bulan} onValueChange={handleBulanChange}>
                          <SelectTrigger className="border-slate-200 focus:border-cyan-500"><SelectValue placeholder="Pilih bulan" /></SelectTrigger>
                          <SelectContent>{namaBulanArr.map((b, i) => (<SelectItem key={i} value={i.toString()}>{b} {tahun}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end gap-2 flex-wrap">
                        <Button onClick={() => setIsPreview(true)} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"><Eye className="w-4 h-4 mr-2" />Preview</Button>
                        <Button onClick={handlePrint} variant="outline" className="border-slate-300 hover:bg-slate-100"><Printer className="w-4 h-4 mr-2" />Cetak PDF</Button>
                        <Button onClick={downloadAbsensiExcel} variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"><FileDown className="w-4 h-4 mr-2" />Unduh Excel</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-50 border-b"><CardTitle className="flex items-center gap-2 text-slate-700"><User className="w-5 h-5 text-violet-600" />Tambah Guru</CardTitle></CardHeader>
                  <CardContent className="p-6">
                    <div className="flex flex-wrap gap-3">
                      <Input placeholder="Nama guru..." value={namaGuru} onChange={(e) => setNamaGuru(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && tambahGuru()} className="flex-1 min-w-[200px] border-slate-200 focus:border-violet-500" />
                      <Select value={ketGuru} onValueChange={setKetGuru}>
                        <SelectTrigger className="w-32 border-slate-200 focus:border-violet-500"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="PNS">PNS</SelectItem><SelectItem value="PPPK">PPPK</SelectItem><SelectItem value="HONORER">HONORER</SelectItem></SelectContent>
                      </Select>
                      <Button onClick={tambahGuru} className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25"><Plus className="w-4 h-4 mr-2" />Tambah</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {guruList.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-500 to-teal-600 text-white"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-white/20 rounded-lg"><Users className="w-5 h-5" /></div><div><p className="text-emerald-100 text-sm">Total Guru</p><p className="text-2xl font-bold">{totalGuru}</p></div></div></CardContent></Card>
                  <Card className="border-0 shadow-md bg-gradient-to-br from-cyan-500 to-blue-600 text-white"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-white/20 rounded-lg"><Calendar className="w-5 h-5" /></div><div><p className="text-cyan-100 text-sm">Hari Kerja</p><p className="text-2xl font-bold">{totalHariKerja}</p></div></div></CardContent></Card>
                  <Card className="border-0 shadow-md bg-gradient-to-br from-violet-500 to-purple-600 text-white"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-white/20 rounded-lg"><CheckCircle2 className="w-5 h-5" /></div><div><p className="text-violet-100 text-sm">Total Kehadiran</p><p className="text-2xl font-bold">{totalHadir}</p></div></div></CardContent></Card>
                  <Card className="border-0 shadow-md bg-gradient-to-br from-amber-500 to-orange-600 text-white"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-white/20 rounded-lg"><FileText className="w-5 h-5" /></div><div><p className="text-amber-100 text-sm">Periode</p><p className="text-lg font-bold">{namaBulanArr[bulanIndex].slice(0, 3)}</p></div></div></CardContent></Card>
                </div>
              )}
            </div>

            {/* TABEL KEHADIRAN UTAMA */}
            <div className={cn("transition-all duration-500", !isPreview && "opacity-50 print:opacity-100")}>
              <div className="flex gap-4">
                <Card className="flex-1 border-0 shadow-xl bg-white overflow-hidden print:shadow-none">
                  <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white p-6 print:bg-white print:text-black print:border-b-2 print:border-black">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold tracking-wide print:text-xl">DAFTAR HADIR GURU PNS</h2>
                      <p className="text-lg font-medium text-emerald-300 print:text-black">BULAN {namaBulanArr[bulanIndex].toUpperCase()} {tahun}</p>
                      {sekolah && <p className="text-slate-300 print:text-black">{sekolah.toUpperCase()} KECAMATAN {korwilData.kecamatan.toUpperCase()}</p>}
                    </div>
                  </div>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table className="border-collapse">
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-slate-100 to-slate-50 print:bg-white">
                          <TableHead rowSpan={2} className="border border-slate-300 text-center font-bold text-slate-700 w-12 print:border-black">NO</TableHead>
                          <TableHead rowSpan={2} className="border border-slate-300 text-center font-bold text-slate-700 min-w-[150px] print:border-black">NAMA GURU</TableHead>
                          <TableHead rowSpan={2} className="border border-slate-300 text-center font-bold text-slate-700 min-w-[120px] print:border-black">ASAL SEKOLAH</TableHead>
                          <TableHead rowSpan={2} className="border border-slate-300 text-center font-bold text-slate-700 w-16 print:border-black">KET</TableHead>
                          <TableHead colSpan={jumlahHari} className="border border-slate-300 text-center font-bold text-slate-700 print:border-black">TANGGAL</TableHead>
                        </TableRow>
                        <TableRow className="bg-slate-50 print:bg-white">
                          {Array.from({ length: jumlahHari }, (_, i) => i + 1).map((h) => {
                            const libur = getLibur(bulanIndex)
                            const cuti = getCuti(bulanIndex)
                            const isLibur = libur.includes(h) || cuti.includes(h) || isMinggu(tahun, bulanIndex, h)
                            return <TableHead key={h} className={cn("border border-slate-300 text-center p-1 text-xs w-7 print:border-black", isLibur && "bg-red-500 text-white print:bg-white print:text-black")} title={`${getNamaHari(tahun, bulanIndex, h)}`}>{h}</TableHead>
                          })}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {guruList.length === 0 ? (
                          <TableRow><TableCell colSpan={4 + jumlahHari} className="text-center text-slate-400 py-12 border border-slate-200 print:border-black"><div className="flex flex-col items-center gap-2 print:hidden"><Users className="w-12 h-12 text-slate-300" /><p>Belum ada data guru.</p></div><p className="hidden print:block">-</p></TableCell></TableRow>
                        ) : (
                          guruList.map((guru, idx) => {
                            const hadirBulan = guru.hadir[bulanIndex] || []
                            const libur = getLibur(bulanIndex)
                            const cuti = getCuti(bulanIndex)
                            return (
                              <TableRow key={guru.id} className="hover:bg-slate-50 print:hover:bg-transparent">
                                <TableCell className="border border-slate-300 text-center font-medium print:border-black">{idx + 1}</TableCell>
                                <TableCell className="border border-slate-300 font-medium print:border-black"><div className="flex items-center justify-between"><span>{guru.nama}</span><Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50 print:hidden" onClick={() => hapusGuru(guru.id)}><Trash2 className="w-4 h-4" /></Button></div></TableCell>
                                <TableCell className="border border-slate-300 print:border-black">{sekolah || '-'}</TableCell>
                                <TableCell className="border border-slate-300 text-center print:border-black"><Badge variant={guru.ket === 'PNS' ? 'default' : guru.ket === 'PPPK' ? 'secondary' : 'outline'} className={cn("text-xs", guru.ket === 'PNS' && "bg-emerald-600", guru.ket === 'PPPK' && "bg-cyan-600 text-white")}>{guru.ket}</Badge></TableCell>
                                {Array.from({ length: jumlahHari }, (_, i) => i).map((hariIdx) => {
                                  const hari = hariIdx + 1
                                  const isLibur = libur.includes(hari) || cuti.includes(hari) || isMinggu(tahun, bulanIndex, hari)
                                  return (
                                    <TableCell key={hariIdx} className={cn("border border-slate-300 text-center p-0 w-7 print:border-black", isLibur && "bg-red-100 print:bg-gray-200")}>
                                      <button onClick={() => !isLibur && toggleHadir(guru.id, hariIdx)} disabled={isLibur} className={cn("w-full h-full p-1 flex items-center justify-center transition-all duration-200 print:cursor-default", !isLibur && "cursor-pointer hover:bg-slate-100", hadirBulan[hariIdx] && !isLibur && "bg-emerald-100")}>
                                        {hadirBulan[hariIdx] ? <Check className="w-4 h-4 text-emerald-600 print:text-black" /> : isLibur ? <XCircle className="w-3 h-3 text-red-400 print:hidden" /> : <span className="text-slate-300 print:hidden">○</span>}
                                      </button>
                                    </TableCell>
                                  )
                                })}
                              </TableRow>
                            )
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Tanda Tangan untuk Tabel Utama */}
                  <div className="p-6 print:p-4">
                    <div className="flex justify-between items-start mt-4">
                      <div className="text-center w-48">
                        <p className="text-sm text-slate-600">Mengetahui,</p>
                        <p className="font-medium text-slate-700">Pengawas Sekolah</p>
                        <div className="h-20 print:h-16" />
                        <p className="font-bold text-slate-800">{korwilData.pengawas[0]?.nama || '________________'}</p>
                        <p className="text-sm text-slate-600">NIP. {korwilData.pengawas[0]?.nip || '________________'}</p>
                      </div>
                      <div className="text-center w-48">
                        <p className="text-sm text-slate-600">Lemahabang, {getTitimangsaBulan(bulanIndex)}</p>
                        <p className="font-medium text-slate-700">Kepala Sekolah</p>
                        <div className="h-20 print:h-16" />
                        <p className="font-bold text-slate-800">{kepsek || '________________'}</p>
                        <p className="text-sm text-slate-600">NIP. {nipKepsek || '________________'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Panel Tombol Ceklis */}
              <div className="print:hidden flex flex-col gap-2 w-40 shrink-0">
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b py-3">
                    <CardTitle className="text-sm font-medium text-emerald-700">Aksi Cepat</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-2">
                    <Button onClick={checkAllHadir} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs">
                      <CheckCircle2 className="w-4 h-4 mr-1" />Ceklis Semua
                    </Button>
                    <Button onClick={uncheckAllHadir} variant="outline" className="w-full border-slate-300 text-slate-600 hover:bg-slate-50 text-xs">
                      <XCircle className="w-4 h-4 mr-1" />Hapus Semua
                    </Button>
                  </CardContent>
                </Card>
                <div className="text-xs text-slate-500 text-center p-2 bg-slate-50 rounded-lg">
                  <p>Ceklis semua hari kerja (bukan Minggu/Libur)</p>
                </div>
              </div>
            </div>

              {/* TABEL PARAF MANUAL */}
              <Card className="border-0 shadow-xl bg-white overflow-hidden print:shadow-none mt-6 print:mt-4 print:break-before-page">
                <div className="bg-gradient-to-r from-cyan-700 via-cyan-600 to-teal-600 text-white p-6 print:bg-white print:text-black print:border-b-2 print:border-black">
                  <div className="text-center space-y-1">
                    <h2 className="text-2xl font-bold tracking-wide print:text-xl">DAFTAR HADIR GURU PNS</h2>
                    <p className="text-lg font-medium text-cyan-100 print:text-black">BULAN {namaBulanArr[bulanIndex].toUpperCase()} {tahun}</p>
                    {sekolah && <p className="text-cyan-200 print:text-black">{sekolah.toUpperCase()} KECAMATAN {korwilData.kecamatan.toUpperCase()}</p>}
                    <p className="text-sm text-cyan-200 print:text-slate-600 italic">(Paraf Manual)</p>
                  </div>
                </div>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table className="border-collapse">
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-cyan-50 to-teal-50 print:bg-gray-100">
                          <TableHead rowSpan={2} className="border border-slate-300 text-center font-bold text-slate-700 w-12 print:border-black">NO</TableHead>
                          <TableHead rowSpan={2} className="border border-slate-300 text-center font-bold text-slate-700 min-w-[150px] print:border-black">NAMA GURU</TableHead>
                          <TableHead rowSpan={2} className="border border-slate-300 text-center font-bold text-slate-700 min-w-[120px] print:border-black">ASAL SEKOLAH</TableHead>
                          <TableHead rowSpan={2} className="border border-slate-300 text-center font-bold text-slate-700 w-16 print:border-black">KET</TableHead>
                          <TableHead colSpan={jumlahHari} className="border border-slate-300 text-center font-bold text-slate-700 print:border-black">TANGGAL</TableHead>
                        </TableRow>
                        <TableRow className="bg-cyan-50/50 print:bg-gray-50">
                          {Array.from({ length: jumlahHari }, (_, i) => i + 1).map((h) => {
                            const libur = getLibur(bulanIndex)
                            const cuti = getCuti(bulanIndex)
                            const isLibur = libur.includes(h) || cuti.includes(h) || isMinggu(tahun, bulanIndex, h)
                            return <TableHead key={h} className={cn("border border-slate-300 text-center p-1 text-xs w-7 print:border-black", isLibur && "bg-red-500 text-white print:bg-gray-300 print:text-black")} title={`${getNamaHari(tahun, bulanIndex, h)}`}>{h}</TableHead>
                          })}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {guruList.length === 0 ? (
                          <TableRow><TableCell colSpan={4 + jumlahHari} className="text-center text-slate-400 py-12 border border-slate-200 print:border-black">-</TableCell></TableRow>
                        ) : (
                          guruList.map((guru, idx) => {
                            const libur = getLibur(bulanIndex)
                            const cuti = getCuti(bulanIndex)
                            return (
                              <TableRow key={guru.id} className="hover:bg-slate-50 print:hover:bg-transparent">
                                <TableCell className="border border-slate-300 text-center font-medium print:border-black">{idx + 1}</TableCell>
                                <TableCell className="border border-slate-300 font-medium print:border-black">{guru.nama}</TableCell>
                                <TableCell className="border border-slate-300 print:border-black">{sekolah || '-'}</TableCell>
                                <TableCell className="border border-slate-300 text-center print:border-black"><Badge variant={guru.ket === 'PNS' ? 'default' : guru.ket === 'PPPK' ? 'secondary' : 'outline'} className={cn("text-xs", guru.ket === 'PNS' && "bg-emerald-600", guru.ket === 'PPPK' && "bg-cyan-600 text-white")}>{guru.ket}</Badge></TableCell>
                                {Array.from({ length: jumlahHari }, (_, i) => i).map((hariIdx) => {
                                  const hari = hariIdx + 1
                                  const isLibur = libur.includes(hari) || cuti.includes(hari) || isMinggu(tahun, bulanIndex, hari)
                                  return (
                                    <TableCell key={hariIdx} className={cn("border border-slate-300 text-center p-1 w-7 h-8 print:border-black", isLibur && "bg-red-100 print:bg-gray-200")}>
                                      {/* Kosong untuk paraf manual */}
                                    </TableCell>
                                  )
                                })}
                              </TableRow>
                            )
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Tanda Tangan untuk Tabel Paraf Manual */}
                  <div className="p-6 print:p-4">
                    <div className="flex justify-between items-start mt-4">
                      <div className="text-center w-48">
                        <p className="text-sm text-slate-600">Mengetahui,</p>
                        <p className="font-medium text-slate-700">Pengawas Sekolah</p>
                        <div className="h-20 print:h-16" />
                        <p className="font-bold text-slate-800">{korwilData.pengawas[0]?.nama || '________________'}</p>
                        <p className="text-sm text-slate-600">NIP. {korwilData.pengawas[0]?.nip || '________________'}</p>
                      </div>
                      <div className="text-center w-48">
                        <p className="text-sm text-slate-600">Lemahabang, {getTitimangsaBulan(bulanIndex)}</p>
                        <p className="font-medium text-slate-700">Kepala Sekolah</p>
                        <div className="h-20 print:h-16" />
                        <p className="font-bold text-slate-800">{kepsek || '________________'}</p>
                        <p className="text-sm text-slate-600">NIP. {nipKepsek || '________________'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB SPTJM */}
          <TabsContent value="sptjm" id="sptjm-content">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
              <div className="lg:col-span-1 print:hidden">
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden sticky top-6">
                  <CardHeader className="bg-gradient-to-r from-violet-100 to-purple-50 border-b"><CardTitle className="flex items-center gap-2 text-slate-700"><FileSignature className="w-5 h-5 text-violet-600" />Form SPTJM 2026</CardTitle></CardHeader>
                  <CardContent className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {/* Status Selector */}
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-600">Status Guru</Label>
                      <Select value={sptjmData.status} onValueChange={(v) => handleSptjmChange('status', v)}>
                        <SelectTrigger className="border-slate-200 focus:border-violet-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PNS">PNS / PPPK</SelectItem>
                          <SelectItem value="HONORER">HONORER</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-1"><Label className="text-xs text-slate-600">Nama</Label><Input placeholder="Nama lengkap" value={sptjmData.nama} onChange={(e) => handleSptjmChange('nama', e.target.value)} className="border-slate-200 focus:border-violet-500" /></div>
                      
                      {sptjmData.status === 'PNS' ? (
                        <>
                          <div className="space-y-1"><Label className="text-xs text-slate-600">NIP</Label><Input placeholder="NIP" value={sptjmData.nip} onChange={(e) => handleSptjmChange('nip', e.target.value)} className="border-slate-200 focus:border-violet-500" /></div>
                          <div className="space-y-1"><Label className="text-xs text-slate-600">Tempat / Tanggal Lahir</Label><Input placeholder="Contoh: Cirebon, 1 Januari 1980" value={sptjmData.ttl} onChange={(e) => handleSptjmChange('ttl', e.target.value)} className="border-slate-200 focus:border-violet-500" /></div>
                          <div className="space-y-1"><Label className="text-xs text-slate-600">NUPTK</Label><Input placeholder="NUPTK" value={sptjmData.nuptk} onChange={(e) => handleSptjmChange('nuptk', e.target.value)} className="border-slate-200 focus:border-violet-500" /></div>
                          <div className="space-y-1"><Label className="text-xs text-slate-600">No Peserta Sertifikasi</Label><Input placeholder="No Peserta" value={sptjmData.nopes} onChange={(e) => handleSptjmChange('nopes', e.target.value)} className="border-slate-200 focus:border-violet-500" /></div>
                          <div className="space-y-1"><Label className="text-xs text-slate-600">NRG</Label><Input placeholder="NRG" value={sptjmData.nrg} onChange={(e) => handleSptjmChange('nrg', e.target.value)} className="border-slate-200 focus:border-violet-500" /></div>
                          <div className="space-y-1"><Label className="text-xs text-slate-600">Unit Kerja</Label><Input placeholder="Nama Sekolah" value={sptjmData.sekolah} onChange={(e) => handleSptjmChange('sekolah', e.target.value)} className="border-slate-200 focus:border-violet-500" /></div>
                          <div className="space-y-1"><Label className="text-xs text-slate-600">Bulan Gaji</Label><Select value={sptjmData.bulan} onValueChange={(v) => handleSptjmChange('bulan', v)}><SelectTrigger className="border-slate-200 focus:border-violet-500"><SelectValue /></SelectTrigger><SelectContent>{namaBulanArr.map((b) => (<SelectItem key={b} value={b}>{b}</SelectItem>))}</SelectContent></Select></div>
                          <div className="space-y-1"><Label className="text-xs text-slate-600">Gaji Pokok</Label><Input placeholder="Contoh: 5.000.000" value={sptjmData.gaji} onChange={(e) => handleSptjmChange('gaji', e.target.value)} className="border-slate-200 focus:border-violet-500" /></div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1"><Label className="text-xs text-slate-600">Golongan</Label><Input placeholder="IV/a" value={sptjmData.gol} onChange={(e) => handleSptjmChange('gol', e.target.value)} className="border-slate-200 focus:border-violet-500" /></div>
                            <div className="space-y-1"><Label className="text-xs text-slate-600">MK (Thn)</Label><Input placeholder="20" value={sptjmData.mth} onChange={(e) => handleSptjmChange('mth', e.target.value)} className="border-slate-200 focus:border-violet-500" /></div>
                            <div className="space-y-1"><Label className="text-xs text-slate-600">MK (Bln)</Label><Input placeholder="6" value={sptjmData.mtb} onChange={(e) => handleSptjmChange('mtb', e.target.value)} className="border-slate-200 focus:border-violet-500" /></div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Fields untuk Honorer */}
                          <div className="space-y-1"><Label className="text-xs text-slate-600">Tempat / Tanggal Lahir</Label><Input placeholder="Contoh: Cirebon, 1 Januari 1980" value={sptjmData.ttl} onChange={(e) => handleSptjmChange('ttl', e.target.value)} className="border-slate-200 focus:border-violet-500" /></div>
                          <div className="space-y-1"><Label className="text-xs text-slate-600">NUPTK</Label><Input placeholder="NUPTK" value={sptjmData.nuptk} onChange={(e) => handleSptjmChange('nuptk', e.target.value)} className="border-slate-200 focus:border-violet-500" /></div>
                          <div className="space-y-1"><Label className="text-xs text-slate-600">NPSN Sekolah</Label><Input placeholder="NPSN" value={sptjmData.nopes} onChange={(e) => handleSptjmChange('nopes', e.target.value)} className="border-slate-200 focus:border-violet-500" /></div>
                          <div className="space-y-1"><Label className="text-xs text-slate-600">Nama Sekolah</Label><Input placeholder="Nama Sekolah" value={sptjmData.sekolah} onChange={(e) => handleSptjmChange('sekolah', e.target.value)} className="border-slate-200 focus:border-violet-500" /></div>
                          <div className="space-y-1"><Label className="text-xs text-slate-600">Alamat Sekolah</Label><Input placeholder="Alamat lengkap sekolah" value={sptjmData.alamat} onChange={(e) => handleSptjmChange('alamat', e.target.value)} className="border-slate-200 focus:border-violet-500" /></div>
                          <div className="space-y-1"><Label className="text-xs text-slate-600">Bulan</Label><Select value={sptjmData.bulan} onValueChange={(v) => handleSptjmChange('bulan', v)}><SelectTrigger className="border-slate-200 focus:border-violet-500"><SelectValue /></SelectTrigger><SelectContent>{namaBulanArr.map((b) => (<SelectItem key={b} value={b}>{b}</SelectItem>))}</SelectContent></Select></div>
                          <div className="space-y-1"><Label className="text-xs text-slate-600">Jumlah Jam Mengajar / Bulan</Label><Input placeholder="Contoh: 24" value={sptjmData.gaji} onChange={(e) => handleSptjmChange('gaji', e.target.value)} className="border-slate-200 focus:border-violet-500" /></div>
                          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <p className="text-xs font-medium text-amber-800 mb-2">Informasi Rekening Bank</p>
                            <div className="space-y-2">
                              <div className="space-y-1"><Label className="text-xs text-slate-600">Nama Bank</Label><Input placeholder="Nama Bank" value={sptjmData.namaBank} onChange={(e) => handleSptjmChange('namaBank', e.target.value)} className="border-slate-200 focus:border-violet-500" /></div>
                              <div className="space-y-1"><Label className="text-xs text-slate-600">No. Rekening</Label><Input placeholder="Nomor Rekening" value={sptjmData.noRekening} onChange={(e) => handleSptjmChange('noRekening', e.target.value)} className="border-slate-200 focus:border-violet-500" /></div>
                              <div className="space-y-1"><Label className="text-xs text-slate-600">Nama Pemilik Rekening</Label><Input placeholder="Nama Pemilik Rekening" value={sptjmData.namaPemilikRekening} onChange={(e) => handleSptjmChange('namaPemilikRekening', e.target.value)} className="border-slate-200 focus:border-violet-500" /></div>
                            </div>
                          </div>
                        </>
                      )}
                      <div className="space-y-1"><Label className="text-xs text-slate-600">Tanggal Surat</Label><Input placeholder="Contoh: 27 Maret 2026" value={sptjmData.tanggal} onChange={(e) => handleSptjmChange('tanggal', e.target.value)} className="border-slate-200 focus:border-violet-500" /></div>
                    </div>
                    <div className="flex gap-2 pt-2"><Button onClick={generateSptjm} className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"><Eye className="w-4 h-4 mr-2" />Preview</Button><Button onClick={newSptjm} variant="outline" className="border-slate-300"><Plus className="w-4 h-4" /></Button></div>
                    {showSptjmResult && (
                      <div className="space-y-2">
                        <Button onClick={handlePrintSptjm} variant="outline" className="w-full border-violet-300 text-violet-600 hover:bg-violet-50"><Printer className="w-4 h-4 mr-2" />Cetak PDF</Button>
                        <Button onClick={downloadSptjmDocx} variant="outline" className="w-full border-blue-300 text-blue-600 hover:bg-blue-50"><FileDown className="w-4 h-4 mr-2" />Unduh Word</Button>
                        <p className="text-xs text-slate-500 text-center">Format kertas Folio (8.5x13") Portrait</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              <div className={cn("lg:col-span-2 print:w-full print:max-w-[19cm] print:mx-auto", !showSptjmResult && "opacity-50 print:opacity-100")}>
                {sptjmData.status === 'PNS' ? (
                  /* SPTJM untuk PNS/PPPK */
                  <Card className="border-0 shadow-xl bg-white overflow-hidden print:shadow-none print:border-2 print:border-black print:w-full">
                    <CardContent className="p-8 print:p-8 print:text-[11pt]">
                      <div className="text-center mb-6 print:mb-4"><h2 className="text-lg font-bold tracking-wide print:text-[14pt]">SURAT PERNYATAAN TANGGUNG JAWAB MUTLAK</h2><h3 className="text-base font-semibold print:text-[12pt]">PENERIMA TUNJANGAN PROFESI GURU</h3></div>
                      <Separator className="my-4 print:bg-black" />
                      <p className="mb-4 print:mb-3">Yang bertanda tangan di bawah ini, saya :</p>
                      <div className="mb-4 print:mb-3">
                        <table className="w-full text-sm print:text-[11pt]"><tbody>
                          <tr><td className="py-1 w-40 print:w-36">Nama</td><td className="py-1">: <span className="font-medium">{sptjmData.nama || '________________'}</span></td></tr>
                          <tr><td className="py-1">NIP</td><td className="py-1">: {sptjmData.nip || '________________'}</td></tr>
                          <tr><td className="py-1">Tempat / Tanggal Lahir</td><td className="py-1">: {sptjmData.ttl || '________________'}</td></tr>
                          <tr><td className="py-1">NUPTK</td><td className="py-1">: {sptjmData.nuptk || '________________'}</td></tr>
                          <tr><td className="py-1">No Peserta Sertifikasi</td><td className="py-1">: {sptjmData.nopes || '________________'}</td></tr>
                          <tr><td className="py-1">NRG</td><td className="py-1">: {sptjmData.nrg || '________________'}</td></tr>
                          <tr><td className="py-1">Unit Kerja</td><td className="py-1">: {sptjmData.sekolah || '________________'}</td></tr>
                        </tbody></table>
                      </div>
                      <p className="mb-4 print:mb-3">Dengan ini menyatakan hal-hal sebagai berikut :</p>
                      <ol className="list-decimal list-outside ml-6 space-y-3 print:space-y-3 text-sm print:text-[11pt]">
                        <li>Bahwa saya masih berstatus PNS aktif di <span className="font-medium">{sptjmData.sekolah || '________________'}</span> Kecamatan {korwilData.kecamatan} Kabupaten Cirebon.</li>
                        <li>Bahwa besaran gaji pokok yang tertera pada leger gaji bulan <span className="font-medium">{sptjmData.bulan}</span> adalah Rp. <span className="font-medium">{sptjmData.gaji || '_______'}</span> dibayarkan sesuai pangkat golongan <span className="font-medium">{sptjmData.gol || '___'}</span> dengan masa kerja <span className="font-medium">{sptjmData.mth || '___'}</span> tahun <span className="font-medium">{sptjmData.mtb || '___'}</span> bulan.</li>
                        <li>Bahwa untuk pembayaran tunjangan profesi guru triwulan 1 tahun 2026, dibayarkan berdasarkan gaji bulan <span className="font-medium">{sptjmData.bulan}</span> 2026.</li>
                      </ol>
                      <p className="mt-4 print:mt-3 text-sm print:text-[11pt]">Demikian pernyataan ini saya buat dengan sebenarnya untuk dapat dipergunakan sebagai bahan acuan guna memperoleh tunjangan profesi guru triwulan 1 tahun 2026.</p>
                      <div className="mt-12 print:mt-10">
                        <table className="w-full text-sm print:text-[11pt]"><tbody><tr><td className="w-3/5"></td><td className="text-center"><p>Cirebon, {sptjmData.tanggal || '________________'}</p><p className="mt-1">Yang Membuat Pernyataan,</p><div className="h-20 print:h-16" /><p className="font-bold">{sptjmData.nama || '________________'}</p><p>NIP. {sptjmData.nip || '________________'}</p></td></tr></tbody></table>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  /* SPTJM untuk HONORER */
                  <Card className="border-0 shadow-xl bg-white overflow-hidden print:shadow-none print:border-2 print:border-black print:w-full">
                    <CardContent className="p-8 print:p-8 print:text-[11pt]">
                      <div className="text-center mb-6 print:mb-4">
                        <h2 className="text-lg font-bold tracking-wide print:text-[14pt]">SURAT PERNYATAAN TANGGUNG JAWAB MUTLAK</h2>
                        <h3 className="text-base font-semibold print:text-[12pt]">PENERIMA TUNJANGAN PROFESI GURU NON PNS</h3>
                        <p className="text-sm mt-1">(Honorer)</p>
                      </div>
                      <Separator className="my-4 print:bg-black" />
                      <p className="mb-4 print:mb-3">Yang bertanda tangan di bawah ini, saya :</p>
                      <div className="mb-4 print:mb-3">
                        <table className="w-full text-sm print:text-[11pt]"><tbody>
                          <tr><td className="py-1 w-40 print:w-36">Nama</td><td className="py-1">: <span className="font-medium">{sptjmData.nama || '________________'}</span></td></tr>
                          <tr><td className="py-1">Tempat / Tanggal Lahir</td><td className="py-1">: {sptjmData.ttl || '________________'}</td></tr>
                          <tr><td className="py-1">NUPTK</td><td className="py-1">: {sptjmData.nuptk || '________________'}</td></tr>
                          <tr><td className="py-1">NPSN Sekolah</td><td className="py-1">: {sptjmData.nopes || '________________'}</td></tr>
                          <tr><td className="py-1">Nama Sekolah</td><td className="py-1">: {sptjmData.sekolah || '________________'}</td></tr>
                          <tr><td className="py-1">Alamat Sekolah</td><td className="py-1">: {sptjmData.alamat || '________________'}</td></tr>
                          <tr><td className="py-1">Kecamatan</td><td className="py-1">: {korwilData.kecamatan || '________________'}</td></tr>
                          <tr><td className="py-1">Kabupaten/Kota</td><td className="py-1">: Cirebon</td></tr>
                        </tbody></table>
                      </div>
                      <p className="mb-4 print:mb-3">Dengan ini menyatakan hal-hal sebagai berikut :</p>
                      <ol className="list-decimal list-outside ml-6 space-y-3 print:space-y-3 text-sm print:text-[11pt]">
                        <li>Bahwa saya adalah Guru Non PNS (Honorer) yang masih aktif mengajar di <span className="font-medium">{sptjmData.sekolah || '________________'}</span> Kecamatan {korwilData.kecamatan} Kabupaten Cirebon.</li>
                        <li>Bahwa saya memiliki kualifikasi akademik Sarjana (S1) atau Diploma IV (D4) dan memiliki sertifikat pendidik.</li>
                        <li>Bahwa jumlah jam mengajar saya pada bulan <span className="font-medium">{sptjmData.bulan}</span> adalah <span className="font-medium">{sptjmData.gaji || '___'}</span> jam per minggu.</li>
                        <li>Bahwa untuk pembayaran tunjangan profesi guru non PNS, akan ditransfer ke rekening bank dengan keterangan sebagai berikut:
                          <div className="mt-2 ml-4">
                            <table className="text-sm print:text-[11pt]"><tbody>
                              <tr><td className="py-1 w-28 print:w-24">Nama Bank</td><td className="py-1">: {sptjmData.namaBank || '________________'}</td></tr>
                              <tr><td className="py-1">No. Rekening</td><td className="py-1">: {sptjmData.noRekening || '________________'}</td></tr>
                              <tr><td className="py-1">Atas Nama</td><td className="py-1">: {sptjmData.namaPemilikRekening || '________________'}</td></tr>
                            </tbody></table>
                          </div>
                        </li>
                      </ol>
                      <p className="mt-4 print:mt-3 text-sm print:text-[11pt]">Demikian pernyataan ini saya buat dengan sebenarnya untuk dapat dipergunakan sebagai bahan acuan guna memperoleh tunjangan profesi guru non PNS tahun 2026.</p>
                      <div className="mt-12 print:mt-10">
                        <table className="w-full text-sm print:text-[11pt]"><tbody>
                          <tr>
                            <td className="w-1/2 text-center align-top">
                              <p className="font-medium">Mengetahui,</p>
                              <p className="font-medium">Kepala Sekolah</p>
                              <div className="h-16 print:h-12" />
                              <p className="font-bold">________________</p>
                              <p>NIP. ________________</p>
                            </td>
                            <td className="w-1/2 text-center align-top">
                              <p>Cirebon, {sptjmData.tanggal || '________________'}</p>
                              <p className="mt-1">Yang Membuat Pernyataan,</p>
                              <div className="h-16 print:h-12" />
                              <p className="font-bold">{sptjmData.nama || '________________'}</p>
                            </td>
                          </tr>
                        </tbody></table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* TAB REKAP */}
          <TabsContent value="rekap">
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 mb-6 print:hidden">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-4">
                  <Label className="text-slate-600 font-medium">Pilih Bulan:</Label>
                  <Select value={selectedBulanRekap.toString()} onValueChange={(v) => setSelectedBulanRekap(parseInt(v))}>
                    <SelectTrigger className="w-48 border-amber-300 focus:border-amber-500 bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {namaBulanArr.map((b, i) => (
                        <SelectItem key={i} value={i.toString()}>{b} {tahun}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-amber-300">
                    <Label className="text-sm text-slate-600 font-medium">Titimangsa:</Label>
                    <Input 
                      value={customTitimangsa[selectedBulanRekap] || getTitimangsaBulan(selectedBulanRekap)}
                      onChange={(e) => setCustomTitimangsa(prev => ({ ...prev, [selectedBulanRekap]: e.target.value }))}
                      className="w-48 border-amber-200 focus:border-amber-500 text-sm h-8"
                      placeholder="Tanggal titimangsa"
                    />
                  </div>
                  <Button onClick={handlePrintRekap} variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50"><Printer className="w-4 h-4 mr-2" />Cetak PDF</Button>
                  <Button onClick={downloadRekapExcel} variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"><FileDown className="w-4 h-4 mr-2" />Unduh Excel</Button>
                </div>
              </div>
            </div>

            <div className="space-y-6 print:px-8 print:py-4">
              {/* TABEL REKAP CHECKLIST (sama dengan format absensi) */}
              {renderTabelRekapChecklist(selectedBulanRekap)}

              {/* TABEL REKAPITULASI PER BULAN */}
              {renderTabelRekapitulasiBulan(selectedBulanRekap)}
            </div>
          </TabsContent>

          {/* TAB MONITORING */}
          <TabsContent value="monitoring">
            <Card className="border-0 shadow-lg bg-white overflow-hidden print:shadow-none print:border print:border-black">
              <div className="p-4 bg-gradient-to-r from-rose-500 to-pink-600 print:bg-white print:p-2">
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-bold tracking-wide text-white print:text-black">INSTRUMEN MONITORING</h2>
                  <p className="font-medium text-rose-100 print:text-black">TUNJANGAN PROFESI GURU</p>
                  <p className="text-rose-200 print:text-black">TAHUN 2026</p>
                </div>
              </div>
              
              <CardContent className="p-4 print:p-2">
                {/* Form Atas */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Label className="w-44 text-slate-700 shrink-0">Hari</Label>
                    <span>:</span>
                    <div className="flex-1">
                      {monitoringTanggal ? (
                        <span className="text-slate-800">
                          {(() => {
                            const namaBulan: {[key: string]: number} = {
                              'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
                              'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11
                            }
                            const hariNama = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
                            try {
                              const parts = monitoringTanggal.toLowerCase().split(' ')
                              if (parts.length >= 2) {
                                const tanggal = parseInt(parts[0])
                                const bulan = namaBulan[parts[1]] ?? 0
                                const tahun = parts[2] ? parseInt(parts[2]) : 2026
                                const date = new Date(tahun, bulan, tanggal)
                                return hariNama[date.getDay()]
                              }
                            } catch { return '....................' }
                            return '....................'
                          })()}
                        </span>
                      ) : (
                        <span className="text-slate-400">Otomatis dari tanggal</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="w-44 text-slate-700 shrink-0">Tanggal</Label>
                    <span>:</span>
                    <Input 
                      className="flex-1 border-0 bg-transparent focus:ring-0 p-0 h-auto" 
                      placeholder="Contoh: 27 Maret 2026"
                      value={monitoringTanggal}
                      onChange={(e) => setMonitoringTanggal(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="w-44 text-slate-700 shrink-0">Nama Sekolah</Label>
                    <span>:</span>
                    <div className="flex-1">{sekolah || '............................................'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="w-44 text-slate-700 shrink-0">NPSN</Label>
                    <span>:</span>
                    <div className="flex-1">{npsn || '............................................'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="w-44 text-slate-700 shrink-0">Nama Kepala Sekolah</Label>
                    <span>:</span>
                    <div className="flex-1">{kepsek || '............................................'}</div>
                  </div>
                </div>
                
                {/* Tabel Utama */}
                <div className="w-full">
                  <Table className="w-full border-collapse">
                    <TableHeader>
                      <TableRow>
                        <TableHead rowSpan={2} className="border border-black text-center font-bold bg-slate-100 print:bg-white w-10">No</TableHead>
                        <TableHead rowSpan={2} className="border border-black text-center font-bold bg-slate-100 print:bg-white">Nama Guru Yang Serdik</TableHead>
                        <TableHead rowSpan={2} className="border border-black text-center font-bold bg-slate-100 print:bg-white">NUPTK</TableHead>
                        <TableHead rowSpan={2} className="border border-black text-center font-bold bg-slate-100 print:bg-white w-20">ASN / Non ASN</TableHead>
                        <TableHead colSpan={3} className="border border-black text-center font-bold bg-emerald-100 print:bg-white">SKTP TERBIT *</TableHead>
                        <TableHead colSpan={3} className="border border-black text-center font-bold bg-sky-100 print:bg-white">PENCAIRAN TPG *</TableHead>
                        <TableHead rowSpan={2} className="border border-black text-center font-bold bg-slate-100 print:bg-white w-12">Ket.</TableHead>
                      </TableRow>
                      <TableRow>
                        <TableHead className="border border-black text-center font-bold bg-emerald-50 print:bg-white w-10">Jan</TableHead>
                        <TableHead className="border border-black text-center font-bold bg-emerald-50 print:bg-white w-10">Feb</TableHead>
                        <TableHead className="border border-black text-center font-bold bg-emerald-50 print:bg-white w-10">Mar</TableHead>
                        <TableHead className="border border-black text-center font-bold bg-sky-50 print:bg-white w-10">Jan</TableHead>
                        <TableHead className="border border-black text-center font-bold bg-sky-50 print:bg-white w-10">Feb</TableHead>
                        <TableHead className="border border-black text-center font-bold bg-sky-50 print:bg-white w-10">Mar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {guruList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={11} className="border border-black text-center text-slate-400 py-4">
                            Belum ada data guru. Tambahkan guru di tab Absensi.
                          </TableCell>
                        </TableRow>
                      ) : (
                        guruList.map((guru, idx) => {
                          const mData = monitoringData[guru.id] || {
                            sktpJan: false, sktpFeb: false, sktpMar: false,
                            tpgJan: false, tpgFeb: false, tpgMar: false,
                            statusAsn: (guru.ket === 'PNS' || guru.ket === 'PPPK' ? guru.ket : 'Honorer') as 'PNS' | 'PPPK' | 'Honorer',
                            nuptk: ''
                          }
                          const isAsn = guru.ket === 'PNS' || guru.ket === 'PPPK'
                          return (
                            <TableRow key={guru.id}>
                              <TableCell className="border border-black text-center">{idx + 1}</TableCell>
                              <TableCell className="border border-black">{guru.nama}</TableCell>
                              <TableCell className="border border-black text-center">{guru.nuptk || mData.nuptk || '-'}</TableCell>
                              <TableCell className="border border-black text-center">
                                {isAsn ? 'ASN' : 'Non ASN'}
                              </TableCell>
                              <TableCell className="border border-black text-center">
                                <input 
                                  type="checkbox" 
                                  checked={mData.sktpJan}
                                  onChange={() => toggleMonitoring(guru.id, 'sktpJan')}
                                  className="w-4 h-4 cursor-pointer print:hidden" 
                                />
                                {mData.sktpJan && <span className="hidden print:inline">✓</span>}
                              </TableCell>
                              <TableCell className="border border-black text-center">
                                <input 
                                  type="checkbox" 
                                  checked={mData.sktpFeb}
                                  onChange={() => toggleMonitoring(guru.id, 'sktpFeb')}
                                  className="w-4 h-4 cursor-pointer print:hidden" 
                                />
                                {mData.sktpFeb && <span className="hidden print:inline">✓</span>}
                              </TableCell>
                              <TableCell className="border border-black text-center">
                                <input 
                                  type="checkbox" 
                                  checked={mData.sktpMar}
                                  onChange={() => toggleMonitoring(guru.id, 'sktpMar')}
                                  className="w-4 h-4 cursor-pointer print:hidden" 
                                />
                                {mData.sktpMar && <span className="hidden print:inline">✓</span>}
                              </TableCell>
                              <TableCell className="border border-black text-center">
                                <input 
                                  type="checkbox" 
                                  checked={mData.tpgJan}
                                  onChange={() => toggleMonitoring(guru.id, 'tpgJan')}
                                  className="w-4 h-4 cursor-pointer print:hidden" 
                                />
                                {mData.tpgJan && <span className="hidden print:inline">✓</span>}
                              </TableCell>
                              <TableCell className="border border-black text-center">
                                <input 
                                  type="checkbox" 
                                  checked={mData.tpgFeb}
                                  onChange={() => toggleMonitoring(guru.id, 'tpgFeb')}
                                  className="w-4 h-4 cursor-pointer print:hidden" 
                                />
                                {mData.tpgFeb && <span className="hidden print:inline">✓</span>}
                              </TableCell>
                              <TableCell className="border border-black text-center">
                                <input 
                                  type="checkbox" 
                                  checked={mData.tpgMar}
                                  onChange={() => toggleMonitoring(guru.id, 'tpgMar')}
                                  className="w-4 h-4 cursor-pointer print:hidden" 
                                />
                                {mData.tpgMar && <span className="hidden print:inline">✓</span>}
                              </TableCell>
                              <TableCell className="border border-black"></TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Tombol Check All */}
                {guruList.length > 0 && (
                  <div className="flex gap-2 mt-3 print:hidden">
                    <Button onClick={checkAllMonitoring} variant="outline" size="sm" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                      <CheckCircle2 className="w-4 h-4 mr-1" />Ceklis Semua
                    </Button>
                    <Button onClick={uncheckAllMonitoring} variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-50">
                      <XCircle className="w-4 h-4 mr-1" />Hapus Semua
                    </Button>
                  </div>
                )}
                
                <p className="text-xs text-slate-500 mt-2 italic">
                  *) Centang kolom SKTP Terbit dan Pencairan TPG sesuai status masing-masing bulan
                </p>
                
                {/* Temuan Masalah */}
                <div className="mt-6">
                  <h4 className="font-bold text-slate-800 mb-2 text-sm">TEMUAN MASALAH</h4>
                  <textarea 
                    className="w-full border-0 bg-transparent focus:outline-none text-sm min-h-[40px] resize-none"
                    placeholder="Tuliskan temuan masalah jika ada..."
                    value={temuanMasalah}
                    onChange={(e) => setTemuanMasalah(e.target.value)}
                  />
                  {!temuanMasalah && (
                    <div className="space-y-1">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="border-b border-dashed border-slate-300 h-4"></div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Tanda Tangan */}
                <div className="mt-8 flex justify-end pr-4">
                  <div className="text-center text-sm">
                    <p>{korwilData.kecamatan || '....................'}, {monitoringTanggal || '....................'}</p>
                    <p className="mt-2">Mengetahui,</p>
                    <p>Kepala {sekolah || '....................'}</p>
                    <div className="h-16"></div>
                    <p className="font-bold">{kepsek || '...........................'}</p>
                    <p>NIP. {nipKepsek || '....................'}</p>
                  </div>
                </div>
                
                {/* Tombol Cetak */}
                <div className="mt-6 flex justify-center gap-3 print:hidden">
                  <Button onClick={handlePrintMonitoring} className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-6">
                    <Printer className="w-4 h-4 mr-2" />Cetak PDF
                  </Button>
                  <Button onClick={downloadMonitoringDocx} variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50 px-6">
                    <FileDown className="w-4 h-4 mr-2" />Unduh Word
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB SETTING TANGGAL */}
          <TabsContent value="setting">
            <Card className="border-0 shadow-lg bg-white overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-50 border-b">
                <CardTitle className="flex items-center gap-2 text-slate-700"><Settings className="w-5 h-5 text-slate-600" />Jadwal Hari Libur Tahun 2026</CardTitle>
                <CardDescription>Klik pada tanggal untuk mengatur status hari libur atau cuti bersama. Pengaturan ini akan mempengaruhi perhitungan hari kerja di tab Absensi dan Rekap. Hari Minggu otomatis berwarna merah.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {/* Legend */}
                <div className="flex flex-wrap gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-red-500 rounded"></div>
                    <span className="text-sm font-medium">Minggu (otomatis)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-orange-400 rounded"></div>
                    <span className="text-sm font-medium">Libur Nasional</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-sky-200 rounded"></div>
                    <span className="text-sm font-medium">Cuti Bersama</span>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {namaBulanArr.map((_, i) => renderKalenderBulan(i))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB PETUNJUK PENGISIAN */}
          <TabsContent value="petunjuk">
            <Card className="border-0 shadow-lg bg-white overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-100 to-indigo-50 border-b">
                <CardTitle className="flex items-center gap-2 text-slate-700"><FileText className="w-5 h-5 text-blue-600" />Petunjuk Pengisian</CardTitle>
                <CardDescription>Panduan lengkap pengisian dokumen kehadiran guru</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Petunjuk Tab Absensi */}
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                    <h3 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5" />
                      Tab Absensi Guru
                    </h3>
                    <ol className="list-decimal list-outside ml-6 space-y-2 text-sm text-slate-700">
                      <li>Isi <strong>Informasi Sekolah</strong> meliputi Nama Sekolah, Nama Kepala Sekolah, dan NIP Kepala Sekolah.</li>
                      <li>Isi <strong>Informasi Korwil & Pengawas</strong>:
                        <ul className="list-disc list-outside ml-6 mt-1 space-y-1">
                          <li>Kecamatan (akan tampil di header dokumen)</li>
                          <li>Nama dan NIP Koordinator Wilayah</li>
                          <li>Nama dan NIP Pengawas Sekolah (bisa lebih dari 1)</li>
                        </ul>
                      </li>
                      <li>Pilih <strong>Periode Bulan</strong> absensi yang akan diisi.</li>
                      <li>Tambahkan data guru dengan mengisi nama dan status (PNS/PPPK/HONORER), lalu klik tombol <strong>Tambah</strong>.</li>
                      <li>Centang kolom tanggal untuk setiap guru yang hadir. Kolom yang berwarna merah (Minggu/Libur) tidak dapat dicentang.</li>
                      <li>Klik tombol <strong>Preview</strong> untuk melihat hasil cetakan.</li>
                      <li>Klik tombol <strong>Cetak</strong> untuk mencetak dokumen.</li>
                    </ol>
                  </div>

                  {/* Petunjuk Tab SPTJM */}
                  <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg border border-violet-200">
                    <h3 className="font-bold text-violet-800 mb-3 flex items-center gap-2">
                      <FileSignature className="w-5 h-5" />
                      Tab SPTJM 2026
                    </h3>
                    <ol className="list-decimal list-outside ml-6 space-y-2 text-sm text-slate-700">
                      <li>Pilih <strong>Status Guru</strong> (PNS/PPPK atau HONORER).</li>
                      <li>Untuk <strong>PNS/PPPK</strong>, isi:
                        <ul className="list-disc list-outside ml-6 mt-1 space-y-1">
                          <li>Nama, NIP, Tempat/Tanggal Lahir</li>
                          <li>NUPTK, No Peserta Sertifikasi, NRG</li>
                          <li>Unit Kerja, Bulan Gaji, Gaji Pokok</li>
                          <li>Golongan, Masa Kerja (Tahun/Bulan)</li>
                        </ul>
                      </li>
                      <li>Untuk <strong>HONORER</strong>, isi:
                        <ul className="list-disc list-outside ml-6 mt-1 space-y-1">
                          <li>Nama, Tempat/Tanggal Lahir, NUPTK</li>
                          <li>NPSN Sekolah, Nama Sekolah, Alamat Sekolah</li>
                          <li>Jumlah Jam Mengajar per Bulan</li>
                          <li>Informasi Rekening Bank (Nama Bank, No Rekening, Atas Nama)</li>
                        </ul>
                      </li>
                      <li>Klik tombol <strong>Preview</strong> untuk melihat hasil dokumen SPTJM.</li>
                      <li>Klik tombol <strong>Cetak PDF</strong> untuk mencetak dokumen.</li>
                    </ol>
                  </div>

                  {/* Petunjuk Tab Rekap */}
                  <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                    <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Tab Rekap
                    </h3>
                    <ol className="list-decimal list-outside ml-6 space-y-2 text-sm text-slate-700">
                      <li>Pilih <strong>Bulan</strong> yang ingin direkap.</li>
                      <li>Perhatikan <strong>Titimangsa</strong> yang ditampilkan sesuai bulan yang dipilih.</li>
                      <li>Sistem akan menampilkan:
                        <ul className="list-disc list-outside ml-6 mt-1 space-y-1">
                          <li><strong>Daftar Hadir Guru</strong>: Tabel checklist kehadiran per tanggal</li>
                          <li><strong>Rekapitulasi Kehadiran</strong>: Ringkasan SAKIT, IZIN, CUTI, HADIR</li>
                        </ul>
                      </li>
                      <li>Data yang ditampilkan berasal dari semua sekolah yang terdaftar.</li>
                      <li>Klik tombol <strong>Cetak Rekap</strong> untuk mencetak dokumen rekapitulasi.</li>
                    </ol>
                  </div>

                  {/* Petunjuk Tab Setting */}
                  <div className="p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Tab Setting Tanggal
                    </h3>
                    <ol className="list-decimal list-outside ml-6 space-y-2 text-sm text-slate-700">
                      <li>Kalender menampilkan 12 bulan dalam tahun 2026.</li>
                      <li><strong>Hari Minggu</strong> otomatis berwarna merah dan tidak dapat diubah.</li>
                      <li>Klik pada tanggal untuk mengatur status:
                        <ul className="list-disc list-outside ml-6 mt-1 space-y-1">
                          <li><strong>Libur Nasional</strong> (warna orange) - Hari libur nasional resmi</li>
                          <li><strong>Cuti Bersama</strong> (warna biru muda) - Cuti bersama yang ditetapkan pemerintah</li>
                          <li><strong>Hapus</strong> - Menghapus status libur/cuti pada tanggal tersebut</li>
                        </ul>
                      </li>
                      <li>Pengaturan ini akan mempengaruhi:
                        <ul className="list-disc list-outside ml-6 mt-1 space-y-1">
                          <li>Perhitungan hari kerja di tab Absensi</li>
                          <li>Penandaan hari libur di tabel kehadiran</li>
                          <li>Perhitungan rekapitulasi di tab Rekap</li>
                        </ul>
                      </li>
                    </ol>
                  </div>

                  {/* Keterangan Warna */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <h3 className="font-bold text-blue-800 mb-3">Keterangan Warna pada Tabel</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-red-500 rounded"></div>
                        <span className="text-sm">Minggu / Libur</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-orange-400 rounded"></div>
                        <span className="text-sm">Libur Nasional</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-sky-200 rounded"></div>
                        <span className="text-sm">Cuti Bersama</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-emerald-100 rounded border border-emerald-300"></div>
                        <span className="text-sm">Hadir</span>
                      </div>
                    </div>
                  </div>

                  {/* Informasi Penting */}
                  <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-lg border border-red-200">
                    <h3 className="font-bold text-red-800 mb-3">⚠️ Informasi Penting</h3>
                    <ul className="list-disc list-outside ml-6 space-y-2 text-sm text-slate-700">
                      <li>Pastikan data <strong>Korwil dan Pengawas</strong> diisi dengan benar karena akan tampil di semua dokumen.</li>
                      <li>Gunakan tombol <strong>Preview</strong> sebelum mencetak untuk memastikan data sudah benar.</li>
                      <li>Hasil cetak menggunakan format <strong>Landscape (13 x 8.5 inch)</strong> untuk hasil optimal.</li>
                      <li>Data yang sudah diinput akan tersimpan selama sesi browser aktif.</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <footer className="text-center text-slate-400 text-sm py-4 print:hidden"><p>Sistem Manajemen Guru &copy; {tahun}</p></footer>
      </div>

      {/* Popup Dialog for Setting Tanggal */}
      <Dialog open={popupOpen} onOpenChange={setPopupOpen}>
        <DialogContent className="sm:max-w-[300px]">
          <DialogHeader>
            <DialogTitle className="text-center">
              {selectedDate && `${selectedDate.hari} ${namaBulanArr[selectedDate.bulan]} ${tahun}`}
            </DialogTitle>
            <DialogDescription className="text-center">Pilih jenis hari libur</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            <Button onClick={() => setLibur('libur')} className="w-full bg-orange-400 hover:bg-orange-500 text-white justify-start"><PartyPopper className="w-4 h-4 mr-2" />Set Libur Nasional</Button>
            <Button onClick={() => setLibur('cuti')} className="w-full bg-sky-500 hover:bg-sky-600 text-white justify-start"><Plane className="w-4 h-4 mr-2" />Set Cuti Bersama</Button>
            <Button onClick={hapusTanggal} variant="destructive" className="w-full justify-start"><Trash2 className="w-4 h-4 mr-2" />Hapus</Button>
            <Button onClick={closePopup} variant="outline" className="w-full justify-start"><XCircle className="w-4 h-4 mr-2" />Batal</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:break-before-page {
            break-before: page;
          }
          .print\\:break-after-page {
            break-after: page;
          }
          .print\\:p-4 {
            padding: 1rem !important;
          }
          .print\\:m-4 {
            margin: 1rem !important;
          }
          /* Table styles for print */
          table {
            width: 100% !important;
            border-collapse: collapse;
          }
          table th, table td {
            padding: 4px 6px !important;
          }
          /* Proper margins for rekap content */
          .print\\:px-8 {
            padding-left: 1.5rem !important;
            padding-right: 1.5rem !important;
          }
          .print\\:py-4 {
            padding-top: 1rem !important;
            padding-bottom: 1rem !important;
          }
          .space-y-6 > * + * {
            margin-top: 1rem !important;
          }
          /* Hindari konten terlalu dekat dengan margin */
          .print\\:p-2 {
            padding: 0.5rem !important;
          }
          
          /* SPTJM specific - konten di tengah dengan lebar terbatas untuk portrait */
          #sptjm-content {
            display: block !important;
          }
          #sptjm-content > div {
            display: block !important;
          }
        }
      `}</style>
    </div>
  )
}
