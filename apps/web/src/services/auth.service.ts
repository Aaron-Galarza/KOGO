import apiClient from './api';

export interface LoginResponse {
  token: string;
  user: {
    _id: string;
    email: string;
    role: 'owner' | 'admin';
  };
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post('/users/login', { email, password });
    return response.data.data;
  },

  logout: () => {},
};
