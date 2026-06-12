import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';
import {
  LayoutDashboard,
  Users,
  Brain,
  GraduationCap,
  FileText,
  Calendar,
  BarChart3,
  Settings,
  Building,
  UserPlus,
  ClipboardList,
  MessageSquare,
  BookOpen,
  Heart,
  TrendingUp
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  // Definir menús según rol
  const getNavigationItems = () => {
    const commonItems = [
      {
        name: 'Dashboard',
        href: ROUTES.DASHBOARD,
        icon: LayoutDashboard,
        roles: ['all']
      }
    ];

    const roleSpecificItems = [
      // Super Admin Nacional
      {
        name: 'Instituciones',
        href: ROUTES.INSTITUCIONES,
        icon: Building,
        roles: ['SUPER_ADMIN_NACIONAL']
      },
      {
        name: 'Estadísticas Globales',
        href: ROUTES.ESTADISTICAS_GLOBALES,
        icon: TrendingUp,
        roles: ['SUPER_ADMIN_NACIONAL']
      },

      // Super Admin Institución
      {
        name: 'Gestión de Usuarios',
        href: ROUTES.USUARIOS,
        icon: Users,
        roles: ['SUPER_ADMIN_INSTITUCION', 'SUPER_ADMIN_NACIONAL']
      },
      {
        name: 'Registrar Psicólogo',
        href: ROUTES.PSICOLOGOS,
        icon: Brain,
        roles: ['SUPER_ADMIN_INSTITUCION', 'SUPER_ADMIN_NACIONAL']
      },
      {
        name: 'Registrar Estudiantes',
        href: ROUTES.ESTUDIANTES,
        icon: GraduationCap,
        roles: ['SUPER_ADMIN_INSTITUCION', 'SUPER_ADMIN_NACIONAL']
      },
      {
        name: 'Módulos del Sistema',
        href: ROUTES.MODULOS,
        icon: Settings,
        roles: ['SUPER_ADMIN_INSTITUCION', 'SUPER_ADMIN_NACIONAL']
      },

      // Psicólogo
      {
        name: 'Aplicar Quiz',
        href: ROUTES.QUIZ_APLICAR,
        icon: ClipboardList,
        roles: ['PSICOLOGO', 'SUPER_ADMIN_INSTITUCION', 'SUPER_ADMIN_NACIONAL']
      },
      {
        name: 'Canalizaciones',
        href: ROUTES.CANALIZACIONES,
        icon: Heart,
        roles: ['PSICOLOGO', 'SUPER_ADMIN_INSTITUCION', 'SUPER_ADMIN_NACIONAL']
      },
      {
        name: 'Gestión de Citas',
        href: ROUTES.CITAS,
        icon: Calendar,
        roles: ['PSICOLOGO', 'SUPER_ADMIN_INSTITUCION', 'SUPER_ADMIN_NACIONAL']
      },
      {
        name: 'Notas de Sesión',
        href: ROUTES.SESIONES,
        icon: MessageSquare,
        roles: ['PSICOLOGO', 'SUPER_ADMIN_INSTITUCION', 'SUPER_ADMIN_NACIONAL']
      },

      // Estudiante
      {
        name: 'Contestar Quiz',
        href: ROUTES.QUIZ_CONTESTAR,
        icon: FileText,
        roles: ['ESTUDIANTE']
      },
      {
        name: 'Mis Citas',
        href: ROUTES.MIS_CITAS,
        icon: Calendar,
        roles: ['ESTUDIANTE']
      },
      {
        name: 'Recomendaciones',
        href: ROUTES.RECOMENDACIONES,
        icon: BookOpen,
        roles: ['ESTUDIANTE']
      },

      // Reportes (para personal administrativo y psicológico)
      {
        name: 'Reportes',
        href: '/reportes',
        icon: BarChart3,
        roles: ['PSICOLOGO', 'SUPER_ADMIN_INSTITUCION', 'SUPER_ADMIN_NACIONAL']
      }
    ];

    // Filtrar items según el rol del usuario
    const filteredItems = roleSpecificItems.filter(item => 
      item.roles.includes('all') || item.roles.includes(user?.rol)
    );

    return [...commonItems, ...filteredItems];
  };

  const navigationItems = getNavigationItems();

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar header (mobile only) */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">Sistema Psicológico</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <span className="sr-only">Cerrar menú</span>
            ×
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {/* User info section */}
          <div className="mb-6 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {user?.nombre?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.nombre} {user?.apellidoPaterno}
                </p>
                <p className="text-xs text-gray-500 truncate"></p>