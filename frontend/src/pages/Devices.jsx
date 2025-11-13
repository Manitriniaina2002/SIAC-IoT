import React, { useState, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import { Cpu, Wifi, AlertTriangle, Radio, Plus, Edit2, Trash2, Save, X, Search, Download, History, CheckSquare, Square, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react'
import { StatCard, ContentCard } from '@/components/cards'
import { PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'
import AnimatedBackground from '@/components/AnimatedBackground'

export default function Devices(){
  const [devices, setDevices] = useState([
    {id: 'esp32-001', name: 'Capteur Température Bureau', status: 'online', lastSeen: 'Il y a 2 min', type: 'ESP32', temp: '22.5°C', history: []},
    {id: 'esp32-002', name: 'Capteur Humidité Entrepôt', status: 'online', lastSeen: 'Il y a 5 min', type: 'ESP32', temp: '18.3°C', history: []},
    {id: 'rpi-001', name: 'Gateway Principal', status: 'warning', lastSeen: 'Il y a 15 min', type: 'Raspberry Pi', temp: '45.2°C', history: []},
    {id: 'esp32-003', name: 'Capteur Mouvement Hall', status: 'online', lastSeen: 'Il y a 1 min', type: 'ESP32', temp: '21.8°C', history: []},
  ])

  // UI State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    type: 'ESP32',
    status: 'online',
    temp: '20.0°C'
  })

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')

  // Sorting
  const [sortColumn, setSortColumn] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Bulk Selection
  const [selectedDevices, setSelectedDevices] = useState([])
  const [selectAll, setSelectAll] = useState(false)

  // MQTT Simulation
  const [mqttConnected, setMqttConnected] = useState(false)
  const [lastMqttMessage, setLastMqttMessage] = useState(null)

  // Audit Log
  const [auditLog, setAuditLog] = useState([])

  // Add audit log entry
  const addAuditEntry = (action, deviceId, details) => {
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action,
      deviceId,
      details,
      user: 'Current User'
    }
    setAuditLog(prev => [entry, ...prev])
  }

  // MQTT Simulation
  useEffect(() => {
    if (mqttConnected) {
      const interval = setInterval(() => {
        // Simulate random MQTT messages
        const randomDevice = devices[Math.floor(Math.random() * devices.length)]
        const randomTemp = (15 + Math.random() * 30).toFixed(1)
        
        setLastMqttMessage({
          deviceId: randomDevice.id,
          temp: `${randomTemp}°C`,
          timestamp: new Date().toISOString()
        })

        // Update device temperature
        setDevices(prev => prev.map(d => 
          d.id === randomDevice.id 
            ? { ...d, temp: `${randomTemp}°C`, lastSeen: 'Il y a quelques secondes' }
            : d
        ))

        addAuditEntry('MQTT_UPDATE', randomDevice.id, `Température mise à jour: ${randomTemp}°C`)
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [mqttConnected, devices])

  // Sorting logic
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // Filtered, sorted, and paginated devices
  const filteredAndSortedDevices = useMemo(() => {
    let filtered = devices.filter(device => {
      const matchesSearch = 
        device.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.type.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = filterStatus === 'all' || device.status === filterStatus
      const matchesType = filterType === 'all' || device.type === filterType

      return matchesSearch && matchesStatus && matchesType
    })

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortColumn]
      let bVal = b[sortColumn]

      if (sortColumn === 'temp') {
        aVal = parseFloat(aVal)
        bVal = parseFloat(bVal)
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [devices, searchQuery, filterStatus, filterType, sortColumn, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedDevices.length / itemsPerPage)
  const paginatedDevices = filteredAndSortedDevices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Bulk Selection
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedDevices([])
    } else {
      setSelectedDevices(paginatedDevices.map(d => d.id))
    }
    setSelectAll(!selectAll)
  }

  const handleSelectDevice = (deviceId) => {
    if (selectedDevices.includes(deviceId)) {
      setSelectedDevices(selectedDevices.filter(id => id !== deviceId))
    } else {
      setSelectedDevices([...selectedDevices, deviceId])
    }
  }

  // Export functions
  const exportToJSON = () => {
    const dataStr = JSON.stringify(devices, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `devices_export_${Date.now()}.json`
    link.click()
    toast.success('Devices exportés en JSON')
    addAuditEntry('EXPORT', 'ALL', 'Export JSON')
  }

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Type', 'Status', 'Temperature', 'Last Seen']
    const rows = devices.map(d => [
      d.id,
      d.name,
      d.type,
      d.status,
      d.temp,
      d.lastSeen
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const dataBlob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `devices_export_${Date.now()}.csv`
    link.click()
    toast.success('Devices exportés en CSV')
    addAuditEntry('EXPORT', 'ALL', 'Export CSV')
  }

  // CREATE
  const handleAdd = () => {
    setFormData({
      id: '',
      name: '',
      type: 'ESP32',
      status: 'online',
      temp: '20.0°C'
    })
    setIsAddDialogOpen(true)
  }

  const handleCreateDevice = () => {
    if (!formData.id || !formData.name) {
      toast.error('ID et Nom sont requis')
      return
    }

    if (devices.find(d => d.id === formData.id)) {
      toast.error('Un device avec cet ID existe déjà')
      return
    }

    const newDevice = {
      ...formData,
      lastSeen: 'Il y a quelques secondes',
      history: []
    }

    setDevices([...devices, newDevice])
    setIsAddDialogOpen(false)
    toast.success(`Device ${formData.name} ajouté avec succès`)
    addAuditEntry('CREATE', formData.id, `Device créé: ${formData.name}`)
  }

  // UPDATE
  const handleEdit = (device) => {
    setSelectedDevice(device)
    setFormData({ ...device })
    setIsEditDialogOpen(true)
  }

  const handleUpdateDevice = () => {
    if (!formData.name) {
      toast.error('Le nom est requis')
      return
    }

    setDevices(devices.map(d => 
      d.id === selectedDevice.id ? { 
        ...formData, 
        lastSeen: 'Il y a quelques secondes',
        history: [...(d.history || []), {
          timestamp: new Date().toISOString(),
          action: 'UPDATE',
          changes: formData
        }]
      } : d
    ))
    setIsEditDialogOpen(false)
    toast.success(`Device ${formData.name} mis à jour`)
    addAuditEntry('UPDATE', selectedDevice.id, `Device mis à jour: ${formData.name}`)
  }

  // DELETE
  const handleDelete = (device) => {
    setSelectedDevice(device)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    setDevices(devices.filter(d => d.id !== selectedDevice.id))
    setIsDeleteDialogOpen(false)
    toast.success(`Device ${selectedDevice.name} supprimé`)
    addAuditEntry('DELETE', selectedDevice.id, `Device supprimé: ${selectedDevice.name}`)
  }

  // BULK DELETE
  const handleBulkDelete = () => {
    if (selectedDevices.length === 0) {
      toast.error('Aucun device sélectionné')
      return
    }
    setIsBulkDeleteDialogOpen(true)
  }

  const handleConfirmBulkDelete = () => {
    const deletedNames = devices
      .filter(d => selectedDevices.includes(d.id))
      .map(d => d.name)
      .join(', ')
    
    setDevices(devices.filter(d => !selectedDevices.includes(d.id)))
    setSelectedDevices([])
    setSelectAll(false)
    setIsBulkDeleteDialogOpen(false)
    toast.success(`${selectedDevices.length} devices supprimés`)
    addAuditEntry('BULK_DELETE', 'MULTIPLE', `${selectedDevices.length} devices supprimés`)
  }

  // View History
  const handleViewHistory = (device) => {
    setSelectedDevice(device)
    setIsHistoryDialogOpen(true)
  }

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
  }

  const getSortIcon = (column) => {
    if (sortColumn !== column) return <ArrowUpDown size={14} className="ml-1 inline opacity-30" />
    return sortDirection === 'asc' 
      ? <ArrowUp size={14} className="ml-1 inline" style={{color: '#7F0202'}} />
      : <ArrowDown size={14} className="ml-1 inline" style={{color: '#7F0202'}} />
  }

  return (
    <div className="container relative">
      <AnimatedBackground />
      <div className="space-y-6 relative" style={{zIndex: 10}}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <PageHeader 
            title="Devices IoT" 
            description="Gestion de vos appareils connectés"
            icon={Radio}
          />
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setMqttConnected(!mqttConnected)}
              className="flex items-center gap-2"
              style={{
                background: mqttConnected ? 'linear-gradient(to right, #10b981, #059669)' : '#6b7280',
                color: 'white'
              }}
            >
              <RefreshCw size={18} className={mqttConnected ? 'animate-spin' : ''} />
              MQTT {mqttConnected ? 'ON' : 'OFF'}
            </Button>
            <Button
              onClick={handleAdd}
              className="flex items-center gap-2"
              style={{background: 'linear-gradient(to right, #7F0202, #311156)', color: 'white'}}
            >
              <Plus size={20} />
              Ajouter
            </Button>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          <StatCard
            title="Total Devices"
            value={filteredAndSortedDevices.length}
            description="Appareils filtrés"
            icon={Cpu}
            gradient="from-emerald-500 via-green-600 to-teal-700"
          />

          <StatCard
            title="En ligne"
            value={filteredAndSortedDevices.filter(d => d.status === 'online').length}
            description="Actuellement actifs"
            icon={Wifi}
            gradient="from-blue-500 via-blue-600 to-indigo-700"
          />

          <StatCard
            title="Warnings"
            value={filteredAndSortedDevices.filter(d => d.status === 'warning').length}
            description="Nécessitent attention"
            icon={AlertTriangle}
            gradient="from-amber-500 via-orange-600 to-yellow-600"
          />
        </div>

        {/* Search, Filter, Export Controls */}
        <ContentCard
          title="Recherche et Filtres"
          description="Filtrez et exportez vos devices"
          icon={Search}
          iconColor="blue"
          gradientFrom="blue-50"
          gradientTo="indigo-50"
        >
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rechercher
                </label>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ID, nom, type..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              {/* Filter by Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="all">Tous</option>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="warning">Warning</option>
                </select>
              </div>

              {/* Filter by Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="all">Tous</option>
                  <option value="ESP32">ESP32</option>
                  <option value="ESP8266">ESP8266</option>
                  <option value="Raspberry Pi">Raspberry Pi</option>
                  <option value="Arduino">Arduino</option>
                </select>
              </div>

              {/* Items per page */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Par page
                </label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>

            {/* Export and Bulk Actions */}
            <div className="flex gap-2 flex-wrap pt-2 border-t">
              <Button
                onClick={exportToJSON}
                className="flex items-center gap-2"
                style={{background: '#3b82f6', color: 'white'}}
              >
                <Download size={18} />
                Export JSON
              </Button>
              <Button
                onClick={exportToCSV}
                className="flex items-center gap-2"
                style={{background: '#10b981', color: 'white'}}
              >
                <Download size={18} />
                Export CSV
              </Button>
              <Button
                onClick={() => setIsHistoryDialogOpen(true)}
                className="flex items-center gap-2"
                style={{background: '#8b5cf6', color: 'white'}}
              >
                <History size={18} />
                Audit Log ({auditLog.length})
              </Button>
              {selectedDevices.length > 0 && (
                <Button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2"
                  style={{background: '#ef4444', color: 'white'}}
                >
                  <Trash2 size={18} />
                  Supprimer ({selectedDevices.length})
                </Button>
              )}
            </div>
          </div>
        </ContentCard>

        <ContentCard
          title={`Liste des devices (${filteredAndSortedDevices.length})`}
          description={`Page ${currentPage} sur ${totalPages || 1}`}
          icon={Wifi}
          iconColor="violet"
          gradientFrom="violet-50"
          gradientTo="purple-50"
        >
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th style={{width: '50px'}}>
                    <button onClick={handleSelectAll} className="p-1">
                      {selectAll ? <CheckSquare size={20} style={{color: '#7F0202'}} /> : <Square size={20} />}
                    </button>
                  </th>
                  <th onClick={() => handleSort('id')} className="cursor-pointer hover:bg-gray-50">
                    Device ID {getSortIcon('id')}
                  </th>
                  <th onClick={() => handleSort('name')} className="cursor-pointer hover:bg-gray-50">
                    Nom {getSortIcon('name')}
                  </th>
                  <th onClick={() => handleSort('type')} className="cursor-pointer hover:bg-gray-50">
                    Type {getSortIcon('type')}
                  </th>
                  <th onClick={() => handleSort('status')} className="cursor-pointer hover:bg-gray-50">
                    Status {getSortIcon('status')}
                  </th>
                  <th onClick={() => handleSort('temp')} className="cursor-pointer hover:bg-gray-50">
                    Température {getSortIcon('temp')}
                  </th>
                  <th>Last Seen</th>
                  <th style={{width: '180px'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDevices.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-gray-500">
                      Aucun device trouvé
                    </td>
                  </tr>
                ) : (
                  paginatedDevices.map(d => (
                    <tr key={d.id} className={selectedDevices.includes(d.id) ? 'bg-violet-50' : ''}>
                      <td>
                        <button onClick={() => handleSelectDevice(d.id)} className="p-1">
                          {selectedDevices.includes(d.id) 
                            ? <CheckSquare size={20} style={{color: '#7F0202'}} /> 
                            : <Square size={20} className="text-gray-400" />
                          }
                        </button>
                      </td>
                      <td><code>{d.id}</code></td>
                      <td style={{fontWeight: '600', color: '#1e293b'}}>{d.name}</td>
                      <td className="text-muted">{d.type}</td>
                      <td>
                        <span className={`badge ${d.status}`}>
                          {d.status}
                        </span>
                      </td>
                      <td style={{fontWeight: '600'}}>{d.temp}</td>
                      <td className="text-muted" style={{fontSize: '0.875rem'}}>{d.lastSeen}</td>
                      <td>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleViewHistory(d)}
                            className="p-2 rounded-lg hover:bg-purple-50 transition-colors"
                            title="Historique"
                          >
                            <History size={18} style={{color: '#8b5cf6'}} />
                          </button>
                          <button 
                            onClick={() => handleEdit(d)}
                            className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Modifier"
                          >
                            <Edit2 size={18} style={{color: '#3b82f6'}} />
                          </button>
                          <button 
                            onClick={() => handleDelete(d)}
                            className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={18} style={{color: '#ef4444'}} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <div className="text-sm text-gray-600">
                Affichage {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredAndSortedDevices.length)} sur {filteredAndSortedDevices.length} devices
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  variant="ghost"
                  className="px-3 py-1"
                >
                  Premier
                </Button>
                <Button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="ghost"
                  className="px-3 py-1"
                >
                  Précédent
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      return page === 1 || 
                             page === totalPages || 
                             (page >= currentPage - 1 && page <= currentPage + 1)
                    })
                    .map((page, index, array) => (
                      <React.Fragment key={page}>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-2">...</span>
                        )}
                        <Button
                          onClick={() => setCurrentPage(page)}
                          variant="ghost"
                          className="px-3 py-1"
                          style={currentPage === page ? {
                            background: 'linear-gradient(to right, #7F0202, #311156)',
                            color: 'white'
                          } : {}}
                        >
                          {page}
                        </Button>
                      </React.Fragment>
                    ))
                  }
                </div>
                <Button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  variant="ghost"
                  className="px-3 py-1"
                >
                  Suivant
                </Button>
                <Button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  variant="ghost"
                  className="px-3 py-1"
                >
                  Dernier
                </Button>
              </div>
            </div>
          )}
        </ContentCard>

        {/* ADD Device Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogClose onClick={() => setIsAddDialogOpen(false)} />
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau device</DialogTitle>
              <DialogDescription>
                Remplissez les informations du nouveau device IoT
              </DialogDescription>
            </DialogHeader>
            
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device ID *
                </label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => handleInputChange('id', e.target.value)}
                  placeholder="esp32-004"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du device *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Capteur Salle Serveur"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="ESP32">ESP32</option>
                  <option value="ESP8266">ESP8266</option>
                  <option value="Raspberry Pi">Raspberry Pi</option>
                  <option value="Arduino">Arduino</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="warning">Warning</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Température
                </label>
                <input
                  type="text"
                  value={formData.temp}
                  onChange={(e) => handleInputChange('temp', e.target.value)}
                  placeholder="20.0°C"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setIsAddDialogOpen(false)}
                className="hover:bg-gray-100"
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateDevice}
                style={{background: 'linear-gradient(to right, #7F0202, #311156)', color: 'white'}}
                className="flex items-center gap-2"
              >
                <Save size={18} />
                Ajouter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* EDIT Device Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogClose onClick={() => setIsEditDialogOpen(false)} />
            <DialogHeader>
              <DialogTitle>Modifier le device</DialogTitle>
              <DialogDescription>
                Mettez à jour les informations du device
              </DialogDescription>
            </DialogHeader>
            
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device ID
                </label>
                <input
                  type="text"
                  value={formData.id}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du device *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="ESP32">ESP32</option>
                  <option value="ESP8266">ESP8266</option>
                  <option value="Raspberry Pi">Raspberry Pi</option>
                  <option value="Arduino">Arduino</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="warning">Warning</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Température
                </label>
                <input
                  type="text"
                  value={formData.temp}
                  onChange={(e) => handleInputChange('temp', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setIsEditDialogOpen(false)}
                className="hover:bg-gray-100"
              >
                Annuler
              </Button>
              <Button
                onClick={handleUpdateDevice}
                style={{background: 'linear-gradient(to right, #7F0202, #311156)', color: 'white'}}
                className="flex items-center gap-2"
              >
                <Save size={18} />
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DELETE Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogClose onClick={() => setIsDeleteDialogOpen(false)} />
            <DialogHeader>
              <DialogTitle>Confirmer la suppression</DialogTitle>
              <DialogDescription>
                Cette action est irréversible
              </DialogDescription>
            </DialogHeader>
            
            <div className="px-6 py-4">
              <p className="text-gray-700">
                Êtes-vous sûr de vouloir supprimer le device{' '}
                <strong>{selectedDevice?.name}</strong> ({selectedDevice?.id}) ?
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="hover:bg-gray-100"
              >
                Annuler
              </Button>
              <Button
                onClick={handleConfirmDelete}
                style={{background: '#ef4444', color: 'white'}}
                className="hover:opacity-90 flex items-center gap-2"
              >
                <Trash2 size={18} />
                Supprimer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* History/Audit Log Dialog */}
        <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
          <DialogContent>
            <DialogClose onClick={() => setIsHistoryDialogOpen(false)} />
            <DialogHeader>
              <DialogTitle>
                {selectedDevice ? `Historique: ${selectedDevice.name}` : 'Audit Log Global'}
              </DialogTitle>
              <DialogDescription>
                {selectedDevice ? 'Historique des modifications du device' : 'Toutes les opérations effectuées'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="px-6 py-4 max-h-96 overflow-y-auto">
              {selectedDevice ? (
                selectedDevice.history && selectedDevice.history.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDevice.history.map((entry, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm">{entry.action}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(entry.timestamp).toLocaleString('fr-FR')}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {JSON.stringify(entry.changes, null, 2)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">Aucun historique disponible</p>
                )
              ) : (
                auditLog.length > 0 ? (
                  <div className="space-y-2">
                    {auditLog.map((entry) => (
                      <div key={entry.id} className="p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded font-semibold ${
                              entry.action === 'CREATE' ? 'bg-green-100 text-green-700' :
                              entry.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                              entry.action === 'DELETE' ? 'bg-red-100 text-red-700' :
                              entry.action === 'BULK_DELETE' ? 'bg-red-100 text-red-700' :
                              entry.action === 'EXPORT' ? 'bg-purple-100 text-purple-700' :
                              entry.action === 'MQTT_UPDATE' ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {entry.action}
                            </span>
                            <code className="text-xs text-gray-600">{entry.deviceId}</code>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(entry.timestamp).toLocaleString('fr-FR')}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 mt-1">
                          {entry.details}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Par: {entry.user}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">Aucune activité enregistrée</p>
                )
              )}
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsHistoryDialogOpen(false)
                  setSelectedDevice(null)
                }}
                className="hover:bg-gray-100"
              >
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Delete Confirmation Dialog */}
        <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
          <DialogContent>
            <DialogClose onClick={() => setIsBulkDeleteDialogOpen(false)} />
            <DialogHeader>
              <DialogTitle>Supprimer plusieurs devices</DialogTitle>
              <DialogDescription>
                Cette action est irréversible
              </DialogDescription>
            </DialogHeader>
            
            <div className="px-6 py-4">
              <p className="text-gray-700 mb-3">
                Êtes-vous sûr de vouloir supprimer <strong>{selectedDevices.length} devices</strong> ?
              </p>
              <div className="max-h-40 overflow-y-auto bg-gray-50 p-3 rounded border">
                <ul className="space-y-1">
                  {devices
                    .filter(d => selectedDevices.includes(d.id))
                    .map(d => (
                      <li key={d.id} className="text-sm">
                        <code className="text-xs text-gray-600">{d.id}</code> - {d.name}
                      </li>
                    ))
                  }
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setIsBulkDeleteDialogOpen(false)}
                className="hover:bg-gray-100"
              >
                Annuler
              </Button>
              <Button
                onClick={handleConfirmBulkDelete}
                style={{background: '#ef4444', color: 'white'}}
                className="hover:opacity-90 flex items-center gap-2"
              >
                <Trash2 size={18} />
                Supprimer tout ({selectedDevices.length})
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      </div>
    </div>
  )
}
