import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import userService from '../services/userService';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Edit3,
  Camera,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Heart
} from 'lucide-react';

const ProfilePage = () => {
  const { user, updateProfile: updateAuthProfile } = useAuth();
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    nombre: user?.nombre || '',
    apellidoPaterno: user?.apellidoPaterno || '',
    apellidoMaterno: user?.apellidoMaterno || '',
    email: user?.email || '',
    telefono: user?.telefono || '',
    direccion: user?.direccion || '',
    genero: user?.genero || '',
    fechaNacimiento: user?.fechaNacimiento ? new Date(user.fechaNacimiento).toISOString().split('T')[0] : '',
  });
  const [errors, setErrors] = useState({});

  const getRoleColor = (role) => {
    const colors = {
      SUPER_ADMIN_NACIONAL: "bg-purple-100 text-purple-800 border-purple-200",
      SUPER_ADMIN_INSTITUCION: "bg-blue-100 text-blue-800 border-blue-200",
      PSICOLOGO: "bg-green-100 text-green-800 border-green-200",
      ESTUDIANTE: "bg-orange-100 text-orange-800 border-orange-200",
      ORIENTADOR: "bg-indigo-100 text-indigo-800 border-indigo-200",
    };
    return colors[role] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getRoleLabel = (role) => {
    const labels = {
      SUPER_ADMIN_NACIONAL: "Super Admin Nacional",
      SUPER_ADMIN_INSTITUCION: "Admin Institución",
      PSICOLOGO: "Psicólogo",
      ESTUDIANTE: "Estudiante",
      ORIENTADOR: "Orientador",
    };
    return labels[role] || role;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.apellidoPaterno.trim()) {
      newErrors.apellidoPaterno = 'El apellido paterno es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El formato del email es inválido';
    }

    if (formData.telefono && !/^[0-9+\-\s()]+$/.test(formData.telefono)) {
      newErrors.telefono = 'El formato del teléfono es inválido';
    }

    if (formData.fechaNacimiento) {
      const birthDate = new Date(formData.fechaNacimiento);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();

      if (age < 13 || age > 100) {
        newErrors.fechaNacimiento = 'La edad debe estar entre 13 y 100 años';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setMessage({ type: 'error', text: 'Por favor corrige los errores en el formulario' });
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await userService.updateProfile(formData);

      if (result.success) {
        // Actualizar el contexto de autenticación
        if (updateAuthProfile) {
          await updateAuthProfile();
        }

        setMessage({ type: 'success', text: result.message || 'Perfil actualizado correctamente' });
        setIsEditing(false);

        // Limpiar mensaje después de 5 segundos
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Error actualizando el perfil' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Error de conexión. Inténtalo de nuevo.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      nombre: user?.nombre || '',
      apellidoPaterno: user?.apellidoPaterno || '',
      apellidoMaterno: user?.apellidoMaterno || '',
      email: user?.email || '',
      telefono: user?.telefono || '',
      direccion: user?.direccion || '',
      genero: user?.genero || '',
      fechaNacimiento: user?.fechaNacimiento ? new Date(user.fechaNacimiento).toISOString().split('T')[0] : '',
    });
    setErrors({});
    setMessage({ type: '', text: '' });
    setIsEditing(false);
  };

  const handlePhotoClick = () => {
    if (!isUploadingPhoto) {
      fileInputRef.current?.click();
    }
  };

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Solo se permiten archivos de imagen' });
      return;
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'La imagen no puede ser mayor a 5MB' });
      return;
    }

    setIsUploadingPhoto(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await userService.uploadProfilePhoto(file);

      if (result.success) {
        // Actualizar el contexto de autenticación para refrescar la foto
        if (updateAuthProfile) {
          await updateAuthProfile();
        }

        setMessage({ type: 'success', text: 'Foto actualizada correctamente' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Error actualizando la foto' });
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      setMessage({ type: 'error', text: 'Error subiendo la foto. Inténtalo de nuevo.' });
    } finally {
      setIsUploadingPhoto(false);
    }

    // Limpiar input
    event.target.value = '';
  };

  const getActiveRole = () => {
    if (user?.instituciones && user.instituciones.length > 0) {
      return user.instituciones[0].rol;
    }
    return user?.rol;
  };

  const getActiveInstitution = () => {
    if (user?.instituciones && user.instituciones.length > 0) {
      return user.instituciones[0].institucionNombre;
    }
    return 'No asignada';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
          <p className="text-gray-600">Gestiona tu información personal y configuraciones</p>

          {/* Mensaje de estado */}
          {message.text && (
            <div className={`mt-4 p-4 rounded-lg flex items-center space-x-3 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header con foto y info básica */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-12">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="relative">
                <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                  {user?.foto ? (
                    <img
                      src={user.foto}
                      alt="Foto de perfil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-gray-700">
                      {user?.nombre?.charAt(0)}{user?.apellidoPaterno?.charAt(0)}
                    </span>
                  )}
                </div>
                <button
                  onClick={handlePhotoClick}
                  disabled={isUploadingPhoto}
                  className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:bg-gray-400 transition-colors shadow-lg"
                  title="Cambiar foto de perfil"
                >
                  {isUploadingPhoto ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>

              <div className="text-center sm:text-left text-white">
                <h2 className="text-3xl font-bold mb-2">
                  {user?.nombreCompleto || `${user?.nombre || ''} ${user?.apellidoPaterno || ''}`.trim() || 'Usuario'}
                </h2>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(getActiveRole())} bg-white/10 backdrop-blur-sm`}>
                  <Shield className="w-4 h-4 mr-2" />
                  {getRoleLabel(getActiveRole())}
                </div>
                <p className="mt-2 text-blue-100">{user?.email}</p>
                {user?.perfilCompletado && (
                  <div className="flex items-center mt-2 text-green-200">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <span className="text-sm">Perfil completado</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Información del perfil */}
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Información Personal</h3>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Editar Perfil
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {isLoading ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Nombre
                </label>
                {isEditing ? (
                  <div>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.nombre ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Ingresa tu nombre"
                    />
                    {errors.nombre && (
                      <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
                    )}
                  </div>
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                    {user?.nombre || 'No especificado'}
                  </div>
                )}
              </div>

              {/* Apellido Paterno */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido Paterno
                </label>
                {isEditing ? (
                  <div>
                    <input
                      type="text"
                      name="apellidoPaterno"
                      value={formData.apellidoPaterno}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.apellidoPaterno ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Ingresa tu apellido paterno"
                    />
                    {errors.apellidoPaterno && (
                      <p className="mt-1 text-sm text-red-600">{errors.apellidoPaterno}</p>
                    )}
                  </div>
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                    {user?.apellidoPaterno || 'No especificado'}
                  </div>
                )}
              </div>

              {/* Apellido Materno */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido Materno
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="apellidoMaterno"
                    value={formData.apellidoMaterno}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ingresa tu apellido materno (opcional)"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                    {user?.apellidoMaterno || 'No especificado'}
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Correo Electrónico
                </label>
                {isEditing ? (
                  <div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Ingresa tu correo electrónico"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                    {user?.email || 'No especificado'}
                  </div>
                )}
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Teléfono
                </label>
                {isEditing ? (
                  <div>
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.telefono ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Ej: +52 55 1234 5678"
                    />
                    {errors.telefono && (
                      <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>
                    )}
                  </div>
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                    {user?.telefono || 'No especificado'}
                  </div>
                )}
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Dirección
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ingresa tu dirección"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                    {user?.direccion || 'No especificado'}
                  </div>
                )}
              </div>
              {/* Género */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Heart className="w-4 h-4 inline mr-2" />
                  Género
                </label>
                {isEditing ? (
                  <select
                    name="genero"
                    value={formData.genero}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecciona tu género</option>
                    <option value="MASCULINO">Masculino</option>
                    <option value="FEMENINO">Femenino</option>
                    <option value="NO_BINARIO">No binario</option>
                    <option value="PREFIERO_NO_DECIR">Prefiero no decir</option>
                  </select>
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                    {user?.genero ? user.genero.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : 'No especificado'}
                  </div>
                )}
              </div>

              {/* Fecha de Nacimiento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Fecha de Nacimiento
                </label>
                {isEditing ? (
                  <div>
                    <input
                      type="date"
                      name="fechaNacimiento"
                      value={formData.fechaNacimiento}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.fechaNacimiento ? 'border-red-300' : 'border-gray-300'
                      }`}
                      max={new Date().toISOString().split('T')[0]}
                    />
                    {errors.fechaNacimiento && (
                      <p className="mt-1 text-sm text-red-600">{errors.fechaNacimiento}</p>
                    )}
                  </div>
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                    {user?.fechaNacimiento ? new Date(user.fechaNacimiento).toLocaleDateString('es-ES') : 'No especificado'}
                  </div>
                )}
              </div>
            </div>

            {/* Información adicional del sistema */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Información del Sistema</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">ID de Usuario</div>
                  <div className="text-gray-900 font-medium">{user?.id || 'N/A'}</div>
                </div>
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Estado del Perfil</div>
                  <div className="text-gray-900 font-medium flex items-center">
                    {user?.perfilCompletado ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                        Completado
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-orange-500 mr-1" />
                        Incompleto
                      </>
                    )}
                  </div>
                </div>
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Fecha de Registro</div>
                  <div className="text-gray-900 font-medium">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES') : 'N/A'}
                  </div>
                </div>
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Último Acceso</div>
                  <div className="text-gray-900 font-medium">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {user?.lastLogin ? new Date(user.lastLogin).toLocaleString('es-ES') : 'N/A'}
                  </div>
                </div>
                {getActiveInstitution() !== 'No asignada' && (
                  <div className="px-4 py-3 bg-gray-50 rounded-lg md:col-span-2">
                    <div className="text-sm text-gray-600 mb-1">Institución Activa</div>
                    <div className="text-gray-900 font-medium">{getActiveInstitution()}</div>
                  </div>
                )}
                {user?.instituciones && user.instituciones.length > 1 && (
                  <div className="px-4 py-3 bg-gray-50 rounded-lg md:col-span-2">
                    <div className="text-sm text-gray-600 mb-2">Otras Instituciones</div>
                    <div className="space-y-1">
                      {user.instituciones.slice(1).map((inst, index) => (
                        <div key={index} className="text-sm text-gray-700 flex items-center justify-between">
                          <span>{inst.institucionNombre}</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${getRoleColor(inst.rol)}`}>
                            {getRoleLabel(inst.rol)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;