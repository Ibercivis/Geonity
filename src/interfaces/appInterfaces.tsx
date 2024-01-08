export interface Location {
  latitude: number;
  longitude: number;
}

export interface User {
  pk: number,
  username: string;
  email: string,
  first_name:string,
  last_name: string,
  password?: string;
}

export interface LoginData {
  correo: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterResponse {
  key: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password1: string;
  password2: string;
}



export interface Mark {
  id?: number;
  name: string;
  type: string;
  ask: string;
  description: string;
  coordinates?: number[];
}
export interface Project {
  projectName: string;
  description: string;
  photo?: string;
  hastag: number[];
  topic:number[];
  marks: Mark[];
}

export interface Projects {
  id: number;
  name: string;
  description: string;
  creator: number;
  topic: number[];
  hasTag: number[];
}

export interface Topic {
  id: number;
  topic: string;
}

export interface HasTag {
  id: number;
  hasTag: string;
}