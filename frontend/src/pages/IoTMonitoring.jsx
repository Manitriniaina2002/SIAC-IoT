import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Activity, TrendingUp, AlertTriangle, Database, Wifi, CheckCircle, Zap, ArrowUpRight, BarChart3, LineChart, RefreshCw, Brain, Calendar, Sparkles, HardDrive, TrendingDown, Eye, EyeOff, Radio, Cpu } from 'lucide-react'
import { StatCard, ContentCard, ActivityItem, ProgressBar } from '@/components/cards'
import { PageHeader } from '@/components/layout'
import { LineChart as RechartsLine, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import AnimatedBackground from '@/components/AnimatedBackground'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'

export default function IoTMonitoring() {
  const [devices, setDevices] = useState([])
  const [backendConnected, setBackendConnected] = useState(false)
  const [recentTelemetry, setRecentTelemetry] = useState([])
  const [sensorData, setSensorData] = useState([])

  const loadDevices = async () => {
    try {
      const data = await api.getDevices()
      setDevices(Array.isArray(data) ? data : [])
      setBackendConnected(true)
    } catch (e) {
      setBackendConnected(false)
    }
  }

  const loadRecentTelemetry = async () => {
    try {
      const data = await api.getRecentTelemetry(10)
      setRecentTelemetry(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed to load telemetry:', e)
      setRecentTelemetry([])
    }
  }

  useEffect(() => { 
    loadDevices()
    loadRecentTelemetry()
  }, [])

  const getSensorStatusColor = (value, type) => {
    switch(type) {
      case 'motion':
        return value ? 'text-green-600 bg-green-50' : 'text-gray-600 bg-gray-50'
      case 'distance':
        return value > 100 ? 'text-yellow-600 bg-yellow-50' : 'text-green-600 bg-green-50'
      case 'rfid':
        return value ? 'text-blue-600 bg-blue-50' : 'text-gray-600 bg-gray-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const formatSensorValue = (value, type) => {
    if (value === null || value === undefined) return 'N/A'
    
    switch(type) {
      case 'temperature':
        return `${value}°C`
      case 'humidity':
        return `${value}%`
      case 'distance':
        return `${value} cm`
      case 'motion':
        return value ? 'Détecté' : 'Aucun mouvement'
      case 'rfid_uid':
        return value || 'Aucun'
      case 'servo_state':
        return value
      case 'led_states':
        return Object.entries(value).map(([led, state]) => 
          `${led}: ${state ? 'ON' : 'OFF'}`
        ).join(', ')
      default:
        return value
    }
  }

  return (
    <div className="space-y-6 relative min-h-screen">
      <AnimatedBackground />
      <div className="relative" style={{zIndex: 10}}>
      
      <PageHeader 
        title="Monitoring IoT" 
        description="Surveillance en temps réel des capteurs ESP32"
        icon={Radio}
      />

      {/* Status Header */}
      <div className="rounded-2xl p-6 mb-6 bg-white/80 backdrop-blur-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className={`px-4 py-2 text-sm rounded-full font-semibold shadow-lg ${
              backendConnected 
                ? 'bg-green-500 text-white border-2 border-green-300' 
                : 'bg-red-500 text-white border-2 border-red-300'
            }`}>
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                backendConnected ? 'bg-green-200 animate-pulse' : 'bg-red-200'
              }`}></span>
              {backendConnected ? 'Connecté' : 'Déconnecté'}
            </span>
            <span className="text-sm text-gray-600">
              {devices.length} appareils connectés
            </span>
          </div>
          <Button 
            onClick={() => { loadDevices(); loadRecentTelemetry() }} 
            className="bg-blue-600 hover:bg-blue-700 shadow-lg font-semibold px-6 py-2 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Sensor Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Capteurs Actifs"
          value={devices.filter(d => d.last_seen).length}
          description="Appareils transmettant des données"
          icon={Radio}
          gradient="from-blue-500 via-cyan-600 to-teal-700"
        />

        <StatCard
          title="Mouvements Détectés"
          value={recentTelemetry.filter(t => t.sensors?.motion).length}
          description="Détections PIR récentes"
          icon={Eye}
          gradient="from-green-500 via-emerald-600 to-teal-700"
        />

        <StatCard
          title="RFID Scans"
          value={recentTelemetry.filter(t => t.sensors?.rfid_uid).length}
          description="Badges RFID lus"
          icon={Cpu}
          gradient="from-purple-500 via-violet-600 to-indigo-700"
        />

        <StatCard
          title="Distance Moyenne"
          value={`${recentTelemetry.reduce((acc, t) => acc + (t.sensors?.distance || 0), 0) / Math.max(recentTelemetry.length, 1).toFixed(1)} cm`}
          description="Distance ultrason moyenne"
          icon={TrendingUp}
          gradient="from-orange-500 via-amber-600 to-yellow-600"
        />
      </div>

      {/* Real-time Sensor Data */}
      <ContentCard
        title="Données Capteurs en Temps Réel"
        description="État actuel des capteurs ESP32"
        icon={Activity}
        iconColor="blue"
        gradientFrom="blue-50"
        gradientTo="cyan-50"
      >
        <div className="space-y-4">
          {recentTelemetry.map((telemetry, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-800">{telemetry.device_id}</span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(telemetry.ts).toLocaleString('fr-FR')}
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Température</div>
                  <div className="font-semibold text-lg">{formatSensorValue(telemetry.sensors?.temperature, 'temperature')}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Humidité</div>
                  <div className="font-semibold text-lg">{formatSensorValue(telemetry.sensors?.humidity, 'humidity')}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Distance</div>
                  <div className={`font-semibold text-lg px-2 py-1 rounded ${getSensorStatusColor(telemetry.sensors?.distance, 'distance')}`}>
                    {formatSensorValue(telemetry.sensors?.distance, 'distance')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Mouvement</div>
                  <div className={`font-semibold text-sm px-2 py-1 rounded ${getSensorStatusColor(telemetry.sensors?.motion, 'motion')}`}>
                    {formatSensorValue(telemetry.sensors?.motion, 'motion')}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                <div>
                  <div className="text-xs text-gray-500 mb-1">RFID UID</div>
                  <div className={`font-mono text-sm px-2 py-1 rounded ${getSensorStatusColor(telemetry.sensors?.rfid_uid, 'rfid')}`}>
                    {formatSensorValue(telemetry.sensors?.rfid_uid, 'rfid_uid')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Servo</div>
                  <div className="font-semibold text-sm px-2 py-1 rounded bg-gray-50">
                    {formatSensorValue(telemetry.sensors?.servo_state, 'servo_state')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">LEDs</div>
                  <div className="font-mono text-xs px-2 py-1 rounded bg-gray-50">
                    {formatSensorValue(telemetry.sensors?.led_states, 'led_states')}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {recentTelemetry.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Radio className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune donnée capteur reçue récemment</p>
            </div>
          )}
        </div>
      </ContentCard>

      {/* Sensor Trends Chart */}
      <ContentCard
        title="Tendances Capteurs"
        description="Évolution des mesures sur les dernières 24h"
        icon={LineChart}
        iconColor="green"
        gradientFrom="green-50"
        gradientTo="emerald-50"
      >
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sensorData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="temperature" stroke="#ef4444" name="Température (°C)" />
              <Line type="monotone" dataKey="humidity" stroke="#3b82f6" name="Humidité (%)" />
              <Line type="monotone" dataKey="distance" stroke="#10b981" name="Distance (cm)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ContentCard>

      </div>
    </div>
  )
}