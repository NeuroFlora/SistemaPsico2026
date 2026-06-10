import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import StatCard from "../StatCard";
import { Card, CardContent } from "../../ui/Card";
import Button from "../../ui/Button";
import { usersService } from "../../../services/usersService";
import { ROUTES } from "../../../utils/constants";
import {
  Users,
  Brain,
  GraduationCap,
  UserPlus,
  Settings,
  Calendar,
  FileText,
  BarChart3,
  Activity,
  CheckCircle,
  Clock,
  TrendingUp,
  ArrowRight
} from "lucide-react";

export default function AdminInstitucion() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await usersService.getUserStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: "Gestionar Usuarios",
      description: "Administra usuarios de tu institución",
      icon: Users,
      href: ROUTES.USUARIOS,
      color: "bg-blue-500"
    },
    {
      title: "Ver Psicólogos",
      description: "Gestiona el equipo de psicólogos",
      icon: Brain,
      href: ROUTES.PSICOLOGOS,
      color: "bg-purple-500"
    },
    {
      title: "Ver Estudiantes",
      description: "Administra estudiantes registrados",
      icon: GraduationCap,
      href: ROUTES.ESTUDIANTES,
      color: "bg-green-500"
    },
    {
      title: "Administrar Citas",
      description: "Gestiona las citas de la institución",
      icon: Calendar,
      href: ROUTES.CITAS_ADMIN,
      color: "bg-orange-500"
    }
  ];

  const recentActivities = [
    {
      icon: UserPlus,
      color: "text-blue-500",
      title: "Nuevo psicólogo registrado",
      time: "Hace 2 horas"
    },
    {
      icon: CheckCircle,
      color: "text-green-500",
      title: "15 evaluaciones completadas",
      time: "Hace 4 horas"
    },
    {
      icon: Calendar,
      color: "text-purple-500",
      title: "8 citas programadas para hoy",
      time: "Hace 6 horas"
    },
    {
      icon: TrendingUp,
      color: "text-indigo-500",
      title: "Reportes mensuales generados",
      time: "Hace 1 día"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-gray-600">Gestiona tu institución de manera eficiente</p>
        </div>
        <Link to={ROUTES.USUARIOS}>
          <Button className="flex items-center space-x-2">
            <UserPlus className="w-4 h-4" />
            <span>Gestionar Usuarios</span>
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Usuarios"
          value={loading ? "..." : (stats?.total || "0")}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Estudiantes"
          value={loading ? "..." : (stats?.estudiantes || "0")}
          icon={GraduationCap}
          color="bg-green-500"
          trend={stats?.estudiantes > 0 ? "5" : undefined}
        />
        <StatCard
          title="Psicólogos Activos"
          value={loading ? "..." : (stats?.psicologos || "0")}
          icon={Brain}
          color="bg-purple-500"
        />
        <StatCard
          title="Usuarios Activos"
          value={loading ? "..." : (stats?.activos || "0")}
          icon={CheckCircle}
          color="bg-emerald-500"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link key={index} to={action.href}>
              <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${action.color}`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{action.title}</h3>
                      <p className="text-sm text-gray-500">{action.description}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Status */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-blue-500" />
              Estado del Sistema
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Módulo de Usuarios</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  Activo
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Evaluaciones</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  Activo
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sistema de Citas</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  Activo
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Reportes</span>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                  Configurando
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-purple-500" />
              Actividad Reciente
            </h3>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <activity.icon className={`w-5 h-5 ${activity.color}`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-emerald-500" />
              Estadísticas Rápidas
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Usuarios activos (30 días)</span>
                <span className="font-semibold text-gray-900">
                  {loading ? "..." : (stats?.activosUltimos30Dias || "0")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Usuarios inactivos</span>
                <span className="font-semibold text-gray-900">
                  {loading ? "..." : (stats?.inactivos || "0")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Orientadores</span>
                <span className="font-semibold text-gray-900">
                  {loading ? "..." : (stats?.orientadores || "0")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Administradores</span>
                <span className="font-semibold text-gray-900">
                  {loading ? "..." : (stats?.admins || "0")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
