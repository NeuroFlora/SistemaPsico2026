import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import recommendationsService from '../services/recommendationsService';
import {
  BookOpen,
  Video,
  FileText,
  Heart,
  Star,
  Clock,
  User,
  Search,
  Filter,
  Play,
  Download,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  Target,
  Brain,
  Lightbulb,
  Activity,
  Headphones,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';

const RecommendationsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('personalized');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');

  // Estado de datos
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState([]);
  const [resources, setResources] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [wellnessTechniques, setWellnessTechniques] = useState([]);
  const [categories, setCategories] = useState([]);
  const [progressStats, setProgressStats] = useState(null);
  const [favorites, setFavorites] = useState(new Set());

  // Estados de UI
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const timeoutId = setTimeout(() => {
        performSearch();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, selectedCategory, selectedPriority]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [personalizedRes, resourcesRes, exercisesRes, wellnessRes, categoriesRes, statsRes] = await Promise.all([
        recommendationsService.getPersonalizedRecommendations(),
        recommendationsService.getRecommendedResources(),
        recommendationsService.getRecommendedExercises(),
        recommendationsService.getWellnessTechniques(),
        recommendationsService.getCategories(),
        recommendationsService.getProgressStats()
      ]);

      if (personalizedRes.success) {
        setPersonalizedRecommendations(personalizedRes.data || []);
      }
      if (resourcesRes.success) {
        setResources(resourcesRes.data || []);
      }
      if (exercisesRes.success) {
        setExercises(exercisesRes.data || []);
      }
      if (wellnessRes.success) {
        setWellnessTechniques(wellnessRes.data || []);
      }
      if (categoriesRes.success) {
        setCategories(categoriesRes.data || []);
      }
      if (statsRes.success) {
        setProgressStats(statsRes.data);
      }

      // Si no hay datos del backend, usar datos mock
      if (!personalizedRes.success) {
        setPersonalizedRecommendations(getMockPersonalizedRecommendations());
      }
      if (!resourcesRes.success) {
        setResources(getMockResources());
      }
      if (!exercisesRes.success) {
        setExercises(getMockExercises());
      }
      if (!wellnessRes.success) {
        setWellnessTechniques(getMockWellnessTechniques());
      }
      if (!categoriesRes.success) {
        setCategories(getMockCategories());
      }
      if (!statsRes.success) {
        setProgressStats(getMockProgressStats());
      }

    } catch (error) {
      console.error('Error loading recommendations:', error);
      setMessage({ type: 'error', text: 'Error cargando recomendaciones' });

      // Cargar datos mock en caso de error
      setPersonalizedRecommendations(getMockPersonalizedRecommendations());
      setResources(getMockResources());
      setExercises(getMockExercises());
      setWellnessTechniques(getMockWellnessTechniques());
      setCategories(getMockCategories());
      setProgressStats(getMockProgressStats());
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    if (!searchTerm.trim()) return;

    setSearchLoading(true);
    try {
      const filters = {
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(selectedPriority !== 'all' && { priority: selectedPriority })
      };

      const result = await recommendationsService.searchRecommendations(searchTerm, filters);

      if (result.success) {
        // Actualizar resultados según el tab activo
        switch (activeTab) {
          case 'resources':
            setResources(result.data.filter(item => item.type === 'resource') || []);
            break;
          case 'exercises':
            setExercises(result.data.filter(item => item.type === 'exercise') || []);
            break;
          case 'wellness':
            setWellnessTechniques(result.data.filter(item => item.type === 'wellness') || []);
            break;
          default:
            setPersonalizedRecommendations(result.data || []);
        }
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleToggleFavorite = async (recommendationId) => {
    try {
      const result = await recommendationsService.toggleFavorite(recommendationId);
      if (result.success) {
        if (favorites.has(recommendationId)) {
          setFavorites(prev => {
            const newSet = new Set(prev);
            newSet.delete(recommendationId);
            return newSet;
          });
        } else {
          setFavorites(prev => new Set(prev).add(recommendationId));
        }
        setMessage({ type: 'success', text: result.message });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Simular toggle local
      if (favorites.has(recommendationId)) {
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(recommendationId);
          return newSet;
        });
      } else {
        setFavorites(prev => new Set(prev).add(recommendationId));
      }
    }
  };

  const handleMarkAsViewed = async (recommendationId) => {
    try {
      await recommendationsService.markAsViewed(recommendationId);
    } catch (error) {
      console.error('Error marking as viewed:', error);
    }
  };

  const handleInteraction = async (recommendationId, type, data = {}) => {
    try {
      await recommendationsService.recordInteraction(recommendationId, type, data);
    } catch (error) {
      console.error('Error recording interaction:', error);
    }
  };

  // Datos mock para cuando el backend no esté disponible
  const getMockPersonalizedRecommendations = () => [
    {
      id: 1,
      title: 'Técnicas de Respiración para Ansiedad',
      description: 'Basado en tu última evaluación, te recomendamos practicar ejercicios de respiración para manejar los niveles de ansiedad.',
      category: 'Ansiedad',
      priority: 'high',
      type: 'technique',
      duration: '10-15 min',
      difficulty: 'Fácil',
      completedBy: 1250,
      rating: 4.8,
      isViewed: false,
      tags: ['Respiración', 'Relajación', 'Ansiedad']
    },
    {
      id: 2,
      title: 'Artículo: Manejo del Estrés Académico',
      description: 'Estrategias efectivas para estudiantes que enfrentan presión académica y estrés relacionado con los estudios.',
      category: 'Estrés',
      priority: 'medium',
      type: 'article',
      duration: '5 min lectura',
      difficulty: 'Intermedio',
      completedBy: 890,
      rating: 4.6,
      isViewed: true,
      tags: ['Estrés', 'Estudiantes', 'Académico']
    },
    {
      id: 3,
      title: 'Meditación Guiada: Mindfulness Básico',
      description: 'Introducción al mindfulness con ejercicios guiados para principiantes.',
      category: 'Mindfulness',
      priority: 'medium',
      type: 'audio',
      duration: '20 min',
      difficulty: 'Principiante',
      completedBy: 2100,
      rating: 4.9,
      isViewed: false,
      tags: ['Meditación', 'Mindfulness', 'Audio']
    }
  ];

  const getMockResources = () => [
    {
      id: 4,
      title: 'Guía Completa de Salud Mental para Estudiantes',
      description: 'Recurso integral sobre bienestar psicológico en el ámbito académico.',
      type: 'pdf',
      category: 'Educacional',
      duration: '45 min lectura',
      rating: 4.7,
      downloads: 3200,
      tags: ['Salud Mental', 'Estudiantes', 'Guía']
    },
    {
      id: 5,
      title: 'Video: Técnicas de Estudio Efectivas',
      description: 'Aprende métodos probados para mejorar tu rendimiento académico y reducir el estrés.',
      type: 'video',
      category: 'Productividad',
      duration: '25 min',
      rating: 4.5,
      views: 12500,
      tags: ['Estudio', 'Productividad', 'Video']
    },
    {
      id: 6,
      title: 'Podcast: Conversaciones sobre Bienestar',
      description: 'Serie de entrevistas con expertos en salud mental y bienestar estudiantil.',
      type: 'audio',
      category: 'Bienestar',
      duration: '35 min',
      rating: 4.8,
      listens: 8900,
      tags: ['Podcast', 'Bienestar', 'Expertos']
    }
  ];

  const getMockExercises = () => [
    {
      id: 7,
      title: 'Ejercicio de Relajación Progresiva',
      description: 'Técnica para liberar tensión física y mental a través de la relajación muscular.',
      category: 'Relajación',
      difficulty: 'Fácil',
      duration: '15 min',
      completions: 1800,
      benefits: ['Reduce tensión', 'Mejora sueño', 'Calma ansiedad'],
      steps: 5
    },
    {
      id: 8,
      title: 'Diario de Gratitud Digital',
      description: 'Actividad diaria para desarrollar una perspectiva positiva y mejorar el estado de ánimo.',
      category: 'Positividad',
      difficulty: 'Fácil',
      duration: '5 min',
      completions: 2500,
      benefits: ['Mejora ánimo', 'Aumenta gratitud', 'Reduce negatividad'],
      steps: 3
    },
    {
      id: 9,
      title: 'Técnica de Visualización',
      description: 'Ejercicio mental para reducir ansiedad ante situaciones específicas como exámenes.',
      category: 'Visualización',
      difficulty: 'Intermedio',
      duration: '20 min',
      completions: 950,
      benefits: ['Reduce ansiedad', 'Mejora confianza', 'Prepara mentalmente'],
      steps: 7
    }
  ];

  const getMockWellnessTechniques = () => [
    {
      id: 10,
      title: 'Rutina Matutina para el Bienestar',
      description: 'Conjunto de actividades para comenzar el día con energía positiva y claridad mental.',
      category: 'Rutinas',
      timeOfDay: 'Mañana',
      duration: '30 min',
      difficulty: 'Fácil',
      benefits: ['Energía', 'Claridad', 'Motivación'],
      activities: ['Meditación', 'Ejercicio ligero', 'Afirmaciones']
    },
    {
      id: 11,
      title: 'Técnicas de Respiración 4-7-8',
      description: 'Método científicamente respaldado para reducir estrés y mejorar el sueño.',
      category: 'Respiración',
      timeOfDay: 'Cualquiera',
      duration: '10 min',
      difficulty: 'Fácil',
      benefits: ['Calma', 'Mejor sueño', 'Reduce estrés'],
      activities: ['Respiración controlada', 'Concentración', 'Relajación']
    }
  ];

  const getMockCategories = () => [
    { id: 1, name: 'Ansiedad', count: 45 },
    { id: 2, name: 'Estrés', count: 38 },
    { id: 3, name: 'Mindfulness', count: 29 },
    { id: 4, name: 'Autoestima', count: 22 },
    { id: 5, name: 'Sueño', count: 18 }
  ];

  const getMockProgressStats = () => ({
    totalRecommendations: 127,
    completedRecommendations: 34,
    favoriteRecommendations: 12,
    weeklyProgress: 8,
    completionRate: 27,
    streak: 5
  });

  const tabs = [
    { id: 'personalized', label: 'Personalizadas', icon: Target, count: personalizedRecommendations.length },
    { id: 'resources', label: 'Recursos', icon: BookOpen, count: resources.length },
    { id: 'exercises', label: 'Ejercicios', icon: Activity, count: exercises.length },
    { id: 'wellness', label: 'Bienestar', icon: Heart, count: wellnessTechniques.length }
  ];

  const RecommendationCard = ({ recommendation, onToggleFavorite, onMarkAsViewed, onInteraction }) => {
    const isFavorite = favorites.has(recommendation.id);

    const handleClick = () => {
      onMarkAsViewed?.(recommendation.id);
      onInteraction?.(recommendation.id, 'view');
    };

    const getPriorityColor = (priority) => {
      const colors = {
        high: 'bg-red-100 text-red-800 border-red-200',
        medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        low: 'bg-green-100 text-green-800 border-green-200'
      };
      return colors[priority] || colors.medium;
    };

    const getTypeIcon = (type) => {
      const icons = {
        article: FileText,
        video: Video,
        audio: Headphones,
        technique: Brain,
        exercise: Activity,
        pdf: FileText
      };
      const IconComponent = icons[type] || BookOpen;
      return <IconComponent className="w-4 h-4" />;
    };

    return (
      <div
        className={`bg-white rounded-xl shadow-sm border transition-all duration-200 hover:shadow-md cursor-pointer ${
          recommendation.isViewed ? 'border-gray-200' : 'border-blue-200 bg-blue-50/30'
        }`}
        onClick={handleClick}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                {getTypeIcon(recommendation.type)}
                <span className="text-sm text-gray-600 capitalize">{recommendation.type}</span>
                {recommendation.priority && (
                  <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(recommendation.priority)}`}>
                    {recommendation.priority === 'high' ? 'Alta' : recommendation.priority === 'medium' ? 'Media' : 'Baja'}
                  </span>
                )}
                {!recommendation.isViewed && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {recommendation.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {recommendation.description}
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite?.(recommendation.id);
              }}
              className={`ml-4 p-2 rounded-lg transition-colors ${
                isFavorite
                  ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100'
                  : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
              }`}
              title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            >
              {isFavorite ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <div className="flex items-center space-x-4">
              {recommendation.duration && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{recommendation.duration}</span>
                </div>
              )}
              {recommendation.difficulty && (
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>{recommendation.difficulty}</span>
                </div>
              )}
              {recommendation.rating && (
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{recommendation.rating}</span>
                </div>
              )}
            </div>

            {(recommendation.completedBy || recommendation.views || recommendation.downloads) && (
              <div className="flex items-center space-x-1">
                <User className="w-4 h-4" />
                <span>
                  {recommendation.completedBy || recommendation.views || recommendation.downloads}{' '}
                  {recommendation.completedBy ? 'completaron' : recommendation.views ? 'vistas' : 'descargas'}
                </span>
              </div>
            )}
          </div>

          {recommendation.tags && (
            <div className="flex flex-wrap gap-1 mb-4">
              {recommendation.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Categoría: {recommendation.category}
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onInteraction?.(recommendation.id, 'click');
                }}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Play className="w-3 h-3" />
                <span>Comenzar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ExerciseCard = ({ exercise, onToggleFavorite, onInteraction }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {exercise.title}
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              {exercise.description}
            </p>
          </div>
          <button
            onClick={() => onToggleFavorite?.(exercise.id)}
            className="ml-4 p-2 text-gray-400 hover:text-yellow-500 rounded-lg hover:bg-yellow-50 transition-colors"
          >
            <Bookmark className="w-5 h-5" />
          </button>
        </div>

        {exercise.benefits && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Beneficios:</h4>
            <div className="flex flex-wrap gap-1">
              {exercise.benefits.map((benefit, index) => (
                <span
                  key={index}
                  className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full"
                >
                  {benefit}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{exercise.duration}</span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-4 h-4" />
              <span>{exercise.difficulty}</span>
            </div>
            {exercise.steps && (
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-4 h-4" />
                <span>{exercise.steps} pasos</span>
              </div>
            )}
          </div>
          <span>{exercise.completions} personas lo completaron</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {exercise.category}
          </span>
          <button
            onClick={() => onInteraction?.(exercise.id, 'start')}
            className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
          >
            <Activity className="w-4 h-4" />
            <span>Comenzar Ejercicio</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderProgressStats = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Tu Progreso</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{progressStats?.totalRecommendations || 0}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{progressStats?.completedRecommendations || 0}</div>
          <div className="text-sm text-gray-600">Completadas</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{progressStats?.favoriteRecommendations || 0}</div>
          <div className="text-sm text-gray-600">Favoritas</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{progressStats?.weeklyProgress || 0}</div>
          <div className="text-sm text-gray-600">Esta Semana</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-indigo-600">{progressStats?.completionRate || 0}%</div>
          <div className="text-sm text-gray-600">Completadas</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{progressStats?.streak || 0}</div>
          <div className="text-sm text-gray-600">Días Seguidos</div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personalized':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {personalizedRecommendations.map((recommendation) => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                onToggleFavorite={handleToggleFavorite}
                onMarkAsViewed={handleMarkAsViewed}
                onInteraction={handleInteraction}
              />
            ))}
            {personalizedRecommendations.length === 0 && (
              <div className="lg:col-span-2 text-center py-12">
                <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay recomendaciones personalizadas</h3>
                <p className="text-gray-600">Completa algunas evaluaciones para recibir recomendaciones personalizadas.</p>
              </div>
            )}
          </div>
        );

      case 'resources':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {resources.map((resource) => (
              <RecommendationCard
                key={resource.id}
                recommendation={resource}
                onToggleFavorite={handleToggleFavorite}
                onMarkAsViewed={handleMarkAsViewed}
                onInteraction={handleInteraction}
              />
            ))}
          </div>
        );

      case 'exercises':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {exercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onToggleFavorite={handleToggleFavorite}
                onInteraction={handleInteraction}
              />
            ))}
          </div>
        );

      case 'wellness':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {wellnessTechniques.map((technique) => (
              <div key={technique.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {technique.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">
                        {technique.description}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleFavorite(technique.id)}
                      className="ml-4 p-2 text-gray-400 hover:text-yellow-500 rounded-lg hover:bg-yellow-50 transition-colors"
                    >
                      <Bookmark className="w-5 h-5" />
                    </button>
                  </div>

                  {technique.activities && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Actividades:</h4>
                      <div className="flex flex-wrap gap-1">
                        {technique.activities.map((activity, index) => (
                          <span
                            key={index}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full"
                          >
                            {activity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{technique.duration}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{technique.timeOfDay}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {technique.category}
                    </span>
                    <button
                      onClick={() => handleInteraction(technique.id, 'start')}
                      className="flex items-center space-x-1 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                      <span>Comenzar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando recomendaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Recomendaciones</h1>
          <p className="text-gray-600">Recursos personalizados para tu bienestar y crecimiento personal</p>

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

        {/* Progress Stats */}
        {progressStats && renderProgressStats()}

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar recomendaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchLoading && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 animate-spin text-gray-400" />
              )}
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name} ({category.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas las prioridades</option>
              <option value="high">Alta prioridad</option>
              <option value="medium">Media prioridad</option>
              <option value="low">Baja prioridad</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={loadInitialData}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      isActive
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecommendationsPage;