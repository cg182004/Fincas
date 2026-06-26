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

  async completeProfile(userId: string, email: string, profile: RegisterProfileInput) {
    const supabase = getSupabaseClient();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = profile.nombreUsuario.trim().toLowerCase();

    if (normalizedEmail === normalizedUsername) {
      throw new Error('El nombre de usuario no puede ser igual al correo. Prueba con otro nombre de usuario.');
    }

    await this.ensureProfileCompletionDataIsAvailable(userId, normalizedEmail, normalizedUsername);

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: normalizedEmail,
        nombre: profile.nombre.trim(),
        apellido: profile.apellido.trim(),
        fecha_nacimiento: profile.fechaNacimiento,
        genero: profile.genero,
        nombre_usuario: profile.nombreUsuario.trim()
      }, {
        onConflict: 'id'
      })
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async registerWithEmail(email: string, password: string, profile: RegisterProfileInput) {
    const supabase = getSupabaseClient();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = profile.nombreUsuario.trim().toLowerCase();

    if (normalizedEmail === normalizedUsername) {
      throw new Error('El nombre de usuario no puede ser igual al correo. Prueba con otro nombre de usuario.');
    }

    await this.ensureRegisterDataIsAvailable(normalizedEmail, normalizedUsername);

    const redirectTo = this.getAuthRedirectUrl();
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          nombre: profile.nombre,
          apellido: profile.apellido,
          fecha_nacimiento: profile.fechaNacimiento,
          genero: profile.genero,
          nombre_usuario: profile.nombreUsuario.trim()
        }
      }
    });

    if (error) {
      throw error;
    }

    if (data.user && data.user.identities?.length === 0) {
      throw new Error('Este correo ya esta registrado. Prueba con otro correo.');
    }

    return data;
  }

  private async ensureRegisterDataIsAvailable(email: string, username: string) {
    const supabase = getSupabaseClient();
    const { data: emailProfile, error: emailError } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', email)
      .limit(1)
      .maybeSingle();

    if (emailError) {
      throw emailError;
    }

    if (emailProfile) {
      throw new Error('Este correo ya esta registrado. Prueba con otro correo.');
    }

    const { data: usernameProfile, error: usernameError } = await supabase
      .from('profiles')
      .select('id')
      .ilike('nombre_usuario', username)
      .limit(1)
      .maybeSingle();

    if (usernameError) {
      throw usernameError;
    }

    if (usernameProfile) {
      throw new Error('Este nombre de usuario ya esta registrado. Prueba con otro nombre de usuario.');
    }
  }

  private async ensureProfileCompletionDataIsAvailable(userId: string, email: string, username: string) {
    const supabase = getSupabaseClient();
    const { data: emailProfile, error: emailError } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', email)
      .limit(1)
      .maybeSingle();

    if (emailError) {
      throw emailError;
    }

    if (emailProfile && emailProfile.id !== userId) {
      throw new Error('Este correo ya esta relacionado con otra cuenta.');
    }

    const { data: usernameProfile, error: usernameError } = await supabase
      .from('profiles')
      .select('id')
      .ilike('nombre_usuario', username)
      .limit(1)
      .maybeSingle();

    if (usernameError) {
      throw usernameError;
    }

    if (usernameProfile && usernameProfile.id !== userId) {
      throw new Error('Este nombre de usuario ya esta registrado. Prueba con otro nombre de usuario.');
    }
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
    const redirectTo = this.getGoogleAuthRedirectUrl();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true
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

  private getGoogleAuthRedirectUrl() {
    return Capacitor.isNativePlatform()
      ? 'io.ionic.starter://login-callback'
      : `${window.location.origin}/completar-perfil`;
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
