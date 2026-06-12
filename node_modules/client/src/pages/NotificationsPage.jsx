import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Bell,
  Check,
  X,
  Calendar,
  FileText,
  User,
  AlertCircle,
  CheckCircle,
  Info,
  Trash2,
  MoreVertical,
  Filter,
  Search
} from 'lucide-react';

const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState([]);

  // Mock data - En producción esto vendría de la API
  useEffect(() => {
    const mockNotifications = [
      {
        id: 1,
        type: 'appointment',
        title: 'Cita programada confirmada',
        message: 'Tu cita con el Dr. García ha sido confirmada para mañana a las 10:00 AM',
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutos atrás
        read: false,
        priority: 'high',
        actions: [
          { label: 'Ver cita', action: 'view' },
          { label: 'Reagendar', action: 'reschedule' }
        ]
      },
      {
        id: 2,
        type: 'quiz',
        title: 'Resultados de evaluación disponibles',
        message: 'Los resultados de tu evaluación de ansiedad ya están disponibles',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
        read: false,
        priority: 'medium',
        actions: [
          { label: 'Ver resultados', action: 'view' }
        ]
      },
      {
        id: 3,
        type: 'system',
        title: 'Actualización del sistema',
        message: 'El sistema se actualizará esta noche. Algunos servicios podrían no estar disponibles.',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 día atrás
        read: true,
        priority: 'low',
        actions: []
      },
      {
        id: 4,
        type: 'appointment',
        title: 'Recordatorio de cita',
        message: 'Tienes una cita programada para hoy a las 3:00 PM con la Psic. Martínez',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 horas atrás
        read: true,
        priority: 'high',
        actions: [
          { label: 'Ver cita', action: 'view' }
        ]
      },
      {
        id: 5,
        type: 'user',
        title: 'Nuevo mensaje',
        message: 'Has recibido un mensaje del personal de atención',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 días atrás
        read: true,
        priority: 'medium',
        actions: [
          { label: 'Ver mensaje', action: 'view' }
        ]
      }
    ];
    setNotifications(mockNotifications);
  }, []);

  const getNotificationIcon = (type) => {
    const iconMap = {
      appointment: Calendar,
      quiz: FileText,
      user: User,
      system: AlertCircle
    };
    const IconComponent = iconMap[type] || Bell;
    return <IconComponent className="w-5 h-5" />;
  };

  const getPriorityColor = (priority) => {
    const colorMap = {
      high: 'bg-red-100 text-red-600 border-red-200',
      medium: 'bg-yellow-100 text-yellow-600 border-yellow-200',
      low: 'bg-blue-100 text-blue-600 border-blue-200'
    };
    return colorMap[priority] || colorMap.medium;
  };

  const getTypeLabel = (type) => {
    const labelMap = {
      appointment: 'Citas',
      quiz: 'Evaluaciones',
      user: 'Mensajes',
      system: 'Sistema'
    };
    return labelMap[type] || 'General';
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `Hace ${minutes} minutos`;
    if (hours < 24) return `Hace ${hours} horas`;
    return `Hace ${days} días`;
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' ||
                         (filter === 'unread' && !notification.read) ||
                         (filter === notification.type);

    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const deleteSelected = () => {
    setNotifications(prev => prev.filter(notification => !selectedNotifications.includes(notification.id)));
    setSelectedNotifications([]);
  };

  const toggleSelection = (id) => {
    setSelectedNotifications(prev =>
      prev.includes(id) ? prev.filter(nId => nId !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const visibleIds = filteredNotifications.map(n => n.id);
    setSelectedNotifications(visibleIds);
  };

  const unselectAll = () => {
    setSelectedNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                <Bell className="w-8 h-8 mr-3 text-blue-600" />
                Notificaciones
                {unreadCount > 0 && (
                  <span className="ml-3 px-2 py-1 bg-red-500 text-white text-sm rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h1>
              <p className="text-gray-600">Mantente al día con las últimas actualizaciones</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Marcar todas como leídas
              </button>
            )}
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            {/* Búsqueda */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar notificaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtros */}
            <div className="flex items-center space-x-4">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas</option>
                <option value="unread">No leídas</option>
                <option value="appointment">Citas</option>
                <option value="quiz">Evaluaciones</option>
                <option value="user">Mensajes</option>
                <option value="system">Sistema</option>
              </select>
            </div>
          </div>

          {/* Acciones en lote */}
          {selectedNotifications.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedNotifications.length} notificaciones seleccionadas
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={unselectAll}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  Deseleccionar
                </button>
                <button
                  onClick={deleteSelected}
                  className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Eliminar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Lista de notificaciones */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay notificaciones</h3>
              <p className="text-gray-600">
                {filter === 'all' ? 'No tienes notificaciones en este momento.' : `No hay notificaciones de tipo "${getTypeLabel(filter)}".`}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md ${
                  notification.read ? 'border-gray-200' : 'border-blue-200 bg-blue-50/30'
                } ${selectedNotifications.includes(notification.id) ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Checkbox de selección */}
                    <div className="flex-shrink-0 pt-1">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={() => toggleSelection(notification.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>

                    {/* Ícono de tipo */}
                    <div className={`flex-shrink-0 p-2 rounded-full ${getPriorityColor(notification.priority)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className={`text-sm font-medium ${notification.read ? 'text-gray-900' : 'text-gray-900 font-semibold'}`}>
                              {notification.title}
                            </h3>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                          <div className="flex items-center space-x-4">
                            <span className="text-xs text-gray-500">{formatTimestamp(notification.timestamp)}</span>
                            <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(notification.priority)}`}>
                              {getTypeLabel(notification.type)}
                            </span>
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center space-x-2 ml-4">
                          {notification.actions.map((action, index) => (
                            <button
                              key={index}
                              className="text-xs px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                            >
                              {action.label}
                            </button>
                          ))}

                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                              title="Marcar como leída"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                            title="Eliminar notificación"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Paginación o load more (placeholder) */}
        {filteredNotifications.length > 10 && (
          <div className="text-center mt-8">
            <button className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Cargar más notificaciones
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;