import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { getSupabaseClient } from '../supabase.client';

export interface RegisterProfileInput {
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  genero: string;
  nombreUsuario: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  async loginWithEmailOrUsername(identifier: string, password: string) {
    const email = this.isEmail(identifier)
      ? identifier
      : await this.getEmailByUsername(identifier);

    return this.loginWithEmail(email, password);
  }

  async loginWithEmail(email: string, password: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async registerWithEmail(email: string, password: string, profile: RegisterProfileInput) {
    const supabase = getSupabaseClient();
    const redirectTo = this.getAuthRedirectUrl();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          nombre: profile.nombre,
          apellido: profile.apellido,
          fecha_nacimiento: profile.fechaNacimiento,
          genero: profile.genero,
          nombre_usuario: profile.nombreUsuario
        }
      }
    });

    if (error) {
      throw error;
    }

    return data;
  }

  private async getEmailByUsername(username: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('nombre_usuario', username)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data?.email) {
      throw new Error('Username not found');
    }

    return data.email;
  }

  private isEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async loginWithGoogle() {
    const supabase = getSupabaseClient();
    const redirectTo = this.getAuthRedirectUrl();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo
      }
    });

    if (error) {
      throw error;
    }

    return data;
  }

  private getAuthRedirectUrl() {
    return Capacitor.isNativePlatform()
      ? 'io.ionic.starter://login-callback'
      : `${window.location.origin}/home`;
  }

  async logout() {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }

  async getUser() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return null;
    }

    return data.user;
  }

  async getSession() {
    const supabase = getSupabaseClient();
    const { data } = await supabase.auth.getSession();
    return data.session;
  }
}
