export interface User {
  id: string;
  name: string;
  email: string;
  contact: string;
  address: string;
  role: 'Admin' | 'Customer';
  avatar: string;
}
