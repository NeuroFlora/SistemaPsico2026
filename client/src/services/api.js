import axios from "axios";

// Create an Axios instance
const api = axios.create({
  // The Vite proxy will handle redirecting this to http://localhost:4000/api
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

/*
  Add a request interceptor to include the token in all requests.
  The token is retrieved from localStorage, where it should be stored after login.
*/
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
