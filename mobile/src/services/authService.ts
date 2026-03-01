import api from './api';

export const authService = {
  async login(credentials: any) {
    const formData = new FormData();
    formData.append('username', credentials.phone || '');
    formData.append('password', credentials.password || '');

    const response = await api.post('/login/access-token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  async signup(data: any) {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },

  async getMe() {
    const response = await api.get('/users/me');
    return response.data;
  },
};
