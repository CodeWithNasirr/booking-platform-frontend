import axios from "axios";

// Detect if running on browser or SSR
const isBrowser = typeof window !== "undefined";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  withCredentials: true, // send cookies if you use JWT/SessionAuth
  timeout: 10000,
});

// Optional: Set token if using JWT
axiosInstance.interceptors.request.use(
  (config) => {
    if (isBrowser) {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401, refresh token logic, etc.
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If unauthorized, attempt refresh
    if (error.response?.status === 401 && isBrowser) {
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
          const refreshRes = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/api/token/refresh/`,
            { refresh: refreshToken }
          );

          localStorage.setItem("access_token", refreshRes.data.access);

          // retry original request
          error.config.headers.Authorization = `Bearer ${refreshRes.data.access}`;
          return axiosInstance(error.config);
        }
      } catch (refreshError) {
        console.error("Refresh token failed:", refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
