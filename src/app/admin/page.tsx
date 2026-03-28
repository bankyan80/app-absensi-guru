'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { 
  GraduationCap, 
  Users, 
  School, 
  MapPin, 
  BarChart3,
  RefreshCw,
  Database
} from 'lucide-react'

interface SekolahEntry {
  kecamatan: string
  namaSekolah: string
  jumlahGuru: number
  namaKepsek: string
  npsn: string
  lastUpdate: string
}

interface AgregateData {
  totalSekolah: number
  totalGuru: number
  totalKecamatan: number
  sekolahList: SekolahEntry[]
}

export default function AdminMonitoringPage() {
  const [data, setData] = useState<AgregateData>({
    totalSekolah: 0,
    totalGuru: 0,
    totalKecamatan: 0,
    sekolahList: []
  })
  const [isLoading, setIsLoading] = useState(true)

  // Load data from localStorage on mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setIsLoading(true)
    try {
      // Get current data from localStorage
      const savedData = localStorage.getItem('absensi-guru-data')
      if (savedData) {
        const parsed = JSON.parse(savedData)
        const guruList = parsed.guruList || []
        const korwilData = parsed.korwilData || {}
        
        // Create entry for current school
        const entry: SekolahEntry = {
          kecamatan: korwilData.kecamatan || '-',
          namaSekolah: parsed.sekolah || '-',
          jumlahGuru: guruList.length,
          namaKepsek: parsed.kepsek || '-',
          npsn: parsed.npsn || '-',
          lastUpdate: parsed.savedAt || new Date().toISOString()
        }

        // Get all stored schools data
        const allSchoolsKey = 'absensi-all-schools'
        let allSchools: SekolahEntry[] = []
        const storedSchools = localStorage.getItem(allSchoolsKey)
        
        if (storedSchools) {
          allSchools = JSON.parse(storedSchools)
        }

        // Update or add current school
        const existingIndex = allSchools.findIndex(
          s => s.namaSekolah === entry.namaSekolah && s.kecamatan === entry.kecamatan
        )
        
        if (entry.namaSekolah !== '-' && entry.jumlahGuru > 0) {
          if (existingIndex >= 0) {
            allSchools[existingIndex] = entry
          } else {
            allSchools.push(entry)
          }
          localStorage.setItem(allSchoolsKey, JSON.stringify(allSchools))
        }

        // Calculate aggregates
        const uniqueKecamatan = [...new Set(allSchools.map(s => s.kecamatan).filter(k => k !== '-'))]
        
        setData({
          totalSekolah: allSchools.length,
          totalGuru: allSchools.reduce((sum, s) => sum + s.jumlahGuru, 0),
          totalKecamatan: uniqueKecamatan.length,
          sekolahList: allSchools
        })
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
    setIsLoading(false)
  }

  const formatDateTime = (isoString: string): string => {
    if (!isoString) return '-'
    try {
      const date = new Date(isoString)
      return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return '-'
    }
  }

  const clearAllData = () => {
    if (confirm('Hapus semua data monitoring? Data tidak dapat dikembalikan.')) {
      localStorage.removeItem('absensi-all-schools')
      loadData()
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin" />
          Memuat data...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Database className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Monitoring Data</h1>
                <p className="text-emerald-100 mt-1">Sistem Manajemen Guru - Dashboard</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadData}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <a
                href="/"
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-2 transition-colors"
              >
                ← Kembali ke Aplikasi
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Kecamatan</p>
                  <p className="text-4xl font-bold mt-1">{data.totalKecamatan}</p>
                </div>
                <div className="p-4 bg-white/20 rounded-xl">
                  <MapPin className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">Total Sekolah</p>
                  <p className="text-4xl font-bold mt-1">{data.totalSekolah}</p>
                </div>
                <div className="p-4 bg-white/20 rounded-xl">
                  <School className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-600 to-violet-700 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-violet-100 text-sm">Total Guru</p>
                  <p className="text-4xl font-bold mt-1">{data.totalGuru}</p>
                </div>
                <div className="p-4 bg-white/20 rounded-xl">
                  <Users className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="border-b border-slate-700">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Daftar Sekolah Terdaftar
              </CardTitle>
              {data.sekolahList.length > 0 && (
                <button
                  onClick={clearAllData}
                  className="px-3 py-1.5 text-sm bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors"
                >
                  Hapus Semua Data
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {data.sekolahList.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <GraduationCap className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Belum ada data sekolah</p>
                <p className="text-sm mt-2">Import data dari aplikasi utama untuk melihat data di sini</p>
                <a
                  href="/"
                  className="inline-block mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Buka Aplikasi
                </a>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-700/50 hover:bg-slate-700/50">
                    <TableHead className="text-slate-300 font-semibold w-12">No</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Kecamatan</TableHead>
                    <TableHead className="text-slate-300 font-semibold">NPSN</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Nama Sekolah</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Kepala Sekolah</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-center w-32">Jumlah Guru</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Terakhir Update</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.sekolahList
                    .sort((a, b) => a.kecamatan.localeCompare(b.kecamatan))
                    .map((sekolah, index) => (
                      <TableRow key={index} className="border-slate-700 hover:bg-slate-700/30">
                        <TableCell className="text-slate-300">{index + 1}</TableCell>
                        <TableCell className="text-white font-medium">{sekolah.kecamatan}</TableCell>
                        <TableCell className="text-slate-300">{sekolah.npsn}</TableCell>
                        <TableCell className="text-white">{sekolah.namaSekolah}</TableCell>
                        <TableCell className="text-slate-300">{sekolah.namaKepsek}</TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-emerald-600 text-white">
                            {sekolah.jumlahGuru} guru
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm">
                          {formatDateTime(sekolah.lastUpdate)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Summary by Kecamatan */}
        {data.sekolahList.length > 0 && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Ringkasan per Kecamatan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-700/50 hover:bg-slate-700/50">
                    <TableHead className="text-slate-300 font-semibold w-12">No</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Kecamatan</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-center">Jumlah Sekolah</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-center">Total Guru</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(
                    data.sekolahList.reduce((acc, s) => {
                      if (!acc[s.kecamatan]) {
                        acc[s.kecamatan] = { sekolah: 0, guru: 0 }
                      }
                      acc[s.kecamatan].sekolah += 1
                      acc[s.kecamatan].guru += s.jumlahGuru
                      return acc
                    }, {} as Record<string, { sekolah: number; guru: number }>)
                  )
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([kecamatan, stats], index) => (
                      <TableRow key={kecamatan} className="border-slate-700 hover:bg-slate-700/30">
                        <TableCell className="text-slate-300">{index + 1}</TableCell>
                        <TableCell className="text-white font-medium">{kecamatan}</TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-blue-600 text-white">{stats.sekolah}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-violet-600 text-white">{stats.guru}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-slate-500 text-sm py-4">
          <p>Sistem Manajemen Guru - Monitoring Dashboard</p>
          <p className="mt-1">Data disimpan di localStorage browser</p>
        </div>
      </div>
    </div>
  )
}
