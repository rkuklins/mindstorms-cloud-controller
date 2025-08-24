'use client';

import { useState, useEffect } from 'react';
import { Battery100Icon, WifiIcon, CpuChipIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { robotController } from '@/lib/robot-api';

interface EV3Port {
  id: string;
  name: string;
  type: 'motor' | 'sensor';
  device: string | null;
  status: 'connected' | 'disconnected' | 'error';
  value?: string | number;
}

interface EV3Status {
  isConnected: boolean;
  batteryLevel: number;
  cpuUsage: number;
  temperature: number;
  firmwareVersion: string;
  ipAddress: string;
  lastUpdate: Date;
}

export default function EV3StatusPanel() {
  const [ev3Status, setEV3Status] = useState<EV3Status>({
    isConnected: true,
    batteryLevel: 75,
    cpuUsage: 25,
    temperature: 45,
    firmwareVersion: 'v1.10H',
    ipAddress: '192.168.1.100',
    lastUpdate: new Date('2024-01-01T12:00:00')
  });

  const [statusExpanded, setStatusExpanded] = useState(true);
  const [motorsExpanded, setMotorsExpanded] = useState(true);
  const [sensorsExpanded, setSensorsExpanded] = useState(true);

  const [ports, setPorts] = useState<EV3Port[]>([
    { id: 'A', name: 'Port A', type: 'motor', device: 'Large Motor', status: 'connected' },
    { id: 'B', name: 'Port B', type: 'motor', device: 'Large Motor', status: 'connected' },
    { id: 'C', name: 'Port C', type: 'motor', device: 'Medium Motor', status: 'connected' },
    { id: 'D', name: 'Port D', type: 'motor', device: null, status: 'disconnected' },
    { id: '1', name: 'Port 1', type: 'sensor', device: 'Ultrasonic', status: 'connected', value: '12 cm' },
    { id: '2', name: 'Port 2', type: 'sensor', device: 'Color Sensor', status: 'connected', value: 'Blue' },
    { id: '3', name: 'Port 3', type: 'sensor', device: 'Gyro Sensor', status: 'connected', value: '45°' },
    { id: '4', name: 'Port 4', type: 'sensor', device: null, status: 'disconnected' },
  ]);

  useEffect(() => {
    const fetchRobotStatus = async () => {
      try {
        const response = await robotController.getStatus();
        const connectionStatus = robotController.getConnectionStatus();
        
        setEV3Status(prev => ({
          ...prev,
          isConnected: connectionStatus === 'connected',
          lastUpdate: new Date(),
          // Keep simulated values for now, as the actual EV3 may not return detailed status
          batteryLevel: Math.max(20, Math.min(100, prev.batteryLevel + (Math.random() - 0.5) * 2)),
          cpuUsage: Math.max(0, Math.min(100, prev.cpuUsage + (Math.random() - 0.5) * 5)),
          temperature: Math.max(20, Math.min(60, prev.temperature + (Math.random() - 0.5) * 1)),
        }));

        // Update sensor readings with simulated values
        setPorts(prev => prev.map(port => ({
          ...port,
          status: connectionStatus === 'connected' ? port.status : 'disconnected',
          value: port.type === 'sensor' && port.device && connectionStatus === 'connected' ? 
            port.device === 'Ultrasonic' ? `${Math.floor(Math.random() * 50 + 5)} cm` :
            port.device === 'Color Sensor' ? ['Red', 'Blue', 'Green', 'Yellow'][Math.floor(Math.random() * 4)] :
            port.device === 'Gyro Sensor' ? `${Math.floor(Math.random() * 360)}°` :
            port.value : undefined
        })));

      } catch (error) {
        console.error('Failed to fetch robot status:', error);
        setEV3Status(prev => ({
          ...prev,
          isConnected: false,
          lastUpdate: new Date()
        }));
        
        setPorts(prev => prev.map(port => ({
          ...port,
          status: 'error'
        })));
      }
    };

    // Fetch status immediately
    fetchRobotStatus();

    // Then fetch every 5 seconds
    const interval = setInterval(fetchRobotStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-400';
      case 'disconnected': return 'text-gray-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'disconnected': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* EV3 Connection Status */}
      <div className="bg-gray-700 rounded-lg p-4">
        <button 
          onClick={() => setStatusExpanded(!statusExpanded)}
          className="flex items-center justify-between w-full text-left hover:text-blue-400 transition-colors mb-4"
        >
          <div className="flex items-center space-x-2">
            {statusExpanded ? (
              <ChevronDownIcon className="w-5 h-5 text-white" />
            ) : (
              <ChevronRightIcon className="w-5 h-5 text-white" />
            )}
            <h2 className="text-xl font-semibold text-white">EV3 Brick Status</h2>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">
              {ev3Status.isConnected ? 'Connected' : 'Disconnected'}
            </span>
            <div className={`w-3 h-3 rounded-full ${ev3Status.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
        </button>
        
        {statusExpanded && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Battery100Icon className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm text-gray-300">Battery</span>
                  <span className="text-sm font-medium text-white">{Math.round(ev3Status.batteryLevel)}%</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <CpuChipIcon className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-gray-300">CPU</span>
                  <span className="text-sm font-medium text-white">{Math.round(ev3Status.cpuUsage)}%</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <WifiIcon className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-gray-300">IP</span>
                  <span className="text-sm font-medium text-white">{ev3Status.ipAddress}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <span className="text-xs">🌡️</span>
                  </div>
                  <span className="text-sm text-gray-300">Temp</span>
                  <span className="text-sm font-medium text-white">{Math.round(ev3Status.temperature)}°C</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-600">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Firmware: {ev3Status.firmwareVersion}</span>
                <span>Updated: {ev3Status.lastUpdate.toLocaleTimeString()}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Motor Ports */}
      <div className="bg-gray-700 rounded-lg p-4">
        <button 
          onClick={() => setMotorsExpanded(!motorsExpanded)}
          className="flex items-center justify-between w-full text-left hover:text-blue-400 transition-colors mb-4"
        >
          <div className="flex items-center space-x-2">
            {motorsExpanded ? (
              <ChevronDownIcon className="w-5 h-5 text-white" />
            ) : (
              <ChevronRightIcon className="w-5 h-5 text-white" />
            )}
            <h3 className="text-lg font-semibold text-white">Motor Ports</h3>
            <span className="text-sm text-gray-400">
              ({ports.filter(port => port.type === 'motor' && port.status === 'connected').length}/4)
            </span>
          </div>
          
          <div className="flex space-x-1">
            {ports.filter(port => port.type === 'motor').map((port) => (
              <div 
                key={port.id}
                className={`w-2 h-2 rounded-full ${getStatusBg(port.status)}`}
                title={`${port.name}: ${port.status}`}
              />
            ))}
          </div>
        </button>

        {motorsExpanded && (
          <div className="space-y-3">
            {ports.filter(port => port.type === 'motor').map((port) => (
              <div key={port.id} className="flex items-center justify-between p-3 bg-gray-600 rounded">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold text-sm">
                    {port.id}
                  </div>
                  <div>
                    <div className="text-white font-medium">{port.name}</div>
                    <div className="text-gray-300 text-sm">{port.device || 'No device'}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${getStatusColor(port.status)}`}>
                    {port.status}
                  </span>
                  <div className={`w-2 h-2 rounded-full ${getStatusBg(port.status)}`} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sensor Ports */}
      <div className="bg-gray-700 rounded-lg p-4">
        <button 
          onClick={() => setSensorsExpanded(!sensorsExpanded)}
          className="flex items-center justify-between w-full text-left hover:text-blue-400 transition-colors mb-4"
        >
          <div className="flex items-center space-x-2">
            {sensorsExpanded ? (
              <ChevronDownIcon className="w-5 h-5 text-white" />
            ) : (
              <ChevronRightIcon className="w-5 h-5 text-white" />
            )}
            <h3 className="text-lg font-semibold text-white">Sensor Ports</h3>
            <span className="text-sm text-gray-400">
              ({ports.filter(port => port.type === 'sensor' && port.status === 'connected').length}/4)
            </span>
          </div>
          
          <div className="flex space-x-1">
            {ports.filter(port => port.type === 'sensor').map((port) => (
              <div 
                key={port.id}
                className={`w-2 h-2 rounded-full ${getStatusBg(port.status)}`}
                title={`${port.name}: ${port.status} - ${port.value || 'No data'}`}
              />
            ))}
          </div>
        </button>

        {sensorsExpanded && (
          <div className="space-y-3">
            {ports.filter(port => port.type === 'sensor').map((port) => (
              <div key={port.id} className="flex items-center justify-between p-3 bg-gray-600 rounded">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-white font-bold text-sm">
                    {port.id}
                  </div>
                  <div>
                    <div className="text-white font-medium">{port.name}</div>
                    <div className="text-gray-300 text-sm">{port.device || 'No device'}</div>
                    {port.value && (
                      <div className="text-blue-300 text-xs font-mono">{port.value}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${getStatusColor(port.status)}`}>
                    {port.status}
                  </span>
                  <div className={`w-2 h-2 rounded-full ${getStatusBg(port.status)}`} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}