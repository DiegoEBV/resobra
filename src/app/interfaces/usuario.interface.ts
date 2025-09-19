export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: 'logistica' | 'residente';
  activo?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CrearUsuarioRequest {
  email: string;
  nombre: string;
  rol: 'logistica' | 'residente';
  obra_id?: string;
  password: string;
  confirmPassword?: string;
}

export interface ActualizarUsuarioRequest {
  email?: string;
  nombre?: string;
  rol?: 'logistica' | 'residente';
  activo?: boolean;
}

export interface CambiarPasswordRequest {
  password: string;
  confirmPassword: string;
}

export interface FiltrosUsuario {
  busqueda?: string;
  rol?: 'logistica' | 'residente' | 'todos';
  activo?: boolean | null;
}