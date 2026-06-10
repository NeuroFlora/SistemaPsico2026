import React, { useState } from 'react';
import {
  Phone,
  Mail,
  MessageCircle,
  Clock,
  MapPin,
  Send,
  FileText,
  HelpCircle,
  Book,
  Video,
  Download,
  ExternalLink,
  CheckCircle,
  User,
  Calendar
} from 'lucide-react';

const SupportPage = () => {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    message: '',
    priority: 'medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simular envío
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setSubmitted(true);

    // Resetear formulario después de 3 segundos
    setTimeout(() => {
      setSubmitted(false);
      setContactForm({
        name: '',
        email: '',
        subject: '',
        category: 'general',
        message: '',
        priority: 'medium'
      });
    }, 3000);
  };

  const contactMethods = [
    {
      icon: Phone,
      title: 'Teléfono',
      description: 'Llámanos durante horarios de atención',
      contact: '+52 (55) 1234-5678',
      available: 'Lun - Vie, 8:00 AM - 6:00 PM',
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: Mail,
      title: 'Email',
      description: 'Envíanos un correo electrónico',
      contact: 'soporte@sistemapsico.edu.mx',
      available: 'Respuesta en 24-48 horas',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: MessageCircle,
      title: 'Chat en Vivo',
      description: 'Habla con nuestro equipo de soporte',
      contact: 'Iniciar Chat',
      available: 'Lun - Vie, 9:00 AM - 5:00 PM',
      color: 'bg-purple-100 text-purple-600'
    }
  ];

  const faqCategories = [
    {
      title: 'Citas',
      icon: Calendar,
      faqs: [
        {
          question: '¿Cómo puedo agendar una cita?',
          answer: 'Puedes agendar una cita desde el menú "Agendar Cita" en tu dashboard. Selecciona el psicólogo, fecha y hora disponible.'
        },
        {
          question: '¿Puedo cancelar o reprogramar mi cita?',
          answer: 'Sí, puedes cancelar o reprogramar tu cita hasta 24 horas antes de la fecha programada desde la sección "Mis Citas".'
        },
        {
          question: '¿Qué pasa si llego tarde a mi cita?',
          answer: 'Si llegas más de 15 minutos tarde, tu cita podría ser cancelada. Te recomendamos llegar 5 minutos antes.'
        }
      ]
    },
    {
      title: 'Evaluaciones',
      icon: FileText,
      faqs: [
        {
          question: '¿Cómo accedo a mis resultados de evaluación?',
          answer: 'Los resultados están disponibles en la sección "Mis Resultados" una vez que el psicólogo haya procesado tu evaluación.'
        },
        {
          question: '¿Cuánto tiempo toma completar una evaluación?',
          answer: 'Las evaluaciones típicamente toman entre 15-45 minutos dependiendo del tipo y número de preguntas.'
        }
      ]
    },
    {
      title: 'Cuenta',
      icon: User,
      faqs: [
        {
          question: '¿Cómo cambio mi contraseña?',
          answer: 'Ve a Configuración > Seguridad > Cambiar Contraseña. Necesitarás tu contraseña actual para confirmar el cambio.'
        },
        {
          question: '¿Cómo actualizo mi información de perfil?',
          answer: 'Puedes actualizar tu información en la sección "Mi Perfil" usando el botón "Editar Perfil".'
        }
      ]
    }
  ];

  const resources = [
    {
      title: 'Manual de Usuario',
      description: 'Guía completa para usar el sistema',
      icon: Book,
      type: 'PDF',
      link: '#'
    },
    {
      title: 'Videos Tutoriales',
      description: 'Aprende con videos paso a paso',
      icon: Video,
      type: 'Video',
      link: '#'
    },
    {
      title: 'Guía de Primeros Pasos',
      description: 'Introducción rápida al sistema',
      icon: Download,
      type: 'PDF',
      link: '#'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Centro de Soporte</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Estamos aquí para ayudarte. Encuentra respuestas a tus preguntas o contacta con nuestro equipo de soporte.
          </p>
        </div>

        {/* Métodos de contacto */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {contactMethods.map((method, index) => {
            const IconComponent = method.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${method.color} mb-4`}>
                  <IconComponent className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{method.title}</h3>
                <p className="text-gray-600 mb-4">{method.description}</p>
                <div className="font-medium text-gray-900 mb-2">{method.contact}</div>
                <div className="text-sm text-gray-500 flex items-center justify-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {method.available}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario de contacto */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Enviar Mensaje</h2>

            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">¡Mensaje Enviado!</h3>
                <p className="text-gray-600">Tu mensaje ha sido enviado exitosamente. Nos pondremos en contacto contigo pronto.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={contactForm.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={contactForm.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asunto *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={contactForm.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoría
                    </label>
                    <select
                      name="category"
                      value={contactForm.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="general">Consulta General</option>
                      <option value="technical">Problema Técnico</option>
                      <option value="appointments">Citas</option>
                      <option value="evaluations">Evaluaciones</option>
                      <option value="billing">Facturación</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prioridad
                    </label>
                    <select
                      name="priority"
                      value={contactForm.priority}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Baja</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje *
                  </label>
                  <textarea
                    name="message"
                    value={contactForm.message}
                    onChange={handleInputChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe tu consulta o problema en detalle..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Send className="w-5 h-5 mr-2" />
                  )}
                  {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
                </button>
              </form>
            )}
          </div>

          {/* FAQ y Recursos */}
          <div className="space-y-8">
            {/* Preguntas Frecuentes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <HelpCircle className="w-6 h-6 mr-2 text-blue-600" />
                Preguntas Frecuentes
              </h2>

              <div className="space-y-6">
                {faqCategories.map((category, categoryIndex) => (
                  <div key={categoryIndex}>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <category.icon className="w-5 h-5 mr-2 text-blue-600" />
                      {category.title}
                    </h3>
                    <div className="space-y-3 ml-7">
                      {category.faqs.map((faq, faqIndex) => (
                        <details key={faqIndex} className="group">
                          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                            {faq.question}
                          </summary>
                          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                            {faq.answer}
                          </p>
                        </details>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recursos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recursos Útiles</h2>

              <div className="space-y-4">
                {resources.map((resource, index) => {
                  const IconComponent = resource.icon;
                  return (
                    <a
                      key={index}
                      href={resource.link}
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="bg-blue-100 p-2 rounded-lg mr-4">
                        <IconComponent className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          {resource.title}
                        </h4>
                        <p className="text-sm text-gray-600">{resource.description}</p>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">{resource.type}</span>
                        <ExternalLink className="w-4 h-4" />
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Información de contacto adicional */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Información de Contacto</h2>

              <div className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-3 text-blue-600" />
                  <span>Av. Universidad 123, Ciudad Universitaria, CDMX 04510</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Phone className="w-5 h-5 mr-3 text-blue-600" />
                  <span>+52 (55) 1234-5678</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Mail className="w-5 h-5 mr-3 text-blue-600" />
                  <span>soporte@sistemapsico.edu.mx</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="w-5 h-5 mr-3 text-blue-600" />
                  <span>Lunes a Viernes: 8:00 AM - 6:00 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;