import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import FormInput from "../components/FormInput";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    institucionId: "", // You might get this from a dropdown or a fixed value
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { email, password, institucionId } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!institucionId) {
      setError("El ID de la institución es obligatorio.");
      setLoading(false);
      return;
    }

    try {
      const res = await api.post("/auth/login", formData);

      // Store the token in localStorage
      localStorage.setItem("token", res.data.token);

      // Redirect to dashboard or home page
      navigate("/dashboard");
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Error al iniciar sesión. Verifique sus credenciales.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
          Iniciar Sesión
        </h2>
        {error && (
          <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">
            {error}
          </p>
        )}
        <form onSubmit={onSubmit}>
          <FormInput
            id="institucionId"
            label="ID de Institución"
            type="text"
            value={institucionId}
            onChange={onChange}
            placeholder="Ingrese el ID de su institución"
            required
          />
          <FormInput
            id="email"
            label="Correo Electrónico"
            type="email"
            value={email}
            onChange={onChange}
            placeholder="usuario@ejemplo.com"
            required
          />
          <FormInput
            id="password"
            label="Contraseña"
            type="password"
            value={password}
            onChange={onChange}
            placeholder="••••••••"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
