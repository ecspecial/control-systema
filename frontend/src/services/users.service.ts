import api from './api';

export const usersService = {
  getContractors: async () => {
    const { data } = await api.get('/users/contractors');
    return data;
  }
};
