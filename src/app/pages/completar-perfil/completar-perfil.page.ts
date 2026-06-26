import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonText
} from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth';
import { getSupabaseClient } from 'src/app/supabase.client';

interface ProfileStatus {
  nombre?: string | null;
  apellido?: string | null;
  email?: string | null;
  nombre_usuario?: string | null;
  genero?: string | null;
  fecha_nacimiento?: string | null;
}

@Component({
  selector: 'app-completar-perfil',
  templateUrl: './completar-perfil.page.html',
  styleUrls: ['./completar-perfil.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonContent,
    IonInput,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonText
  ]
})
export class CompletarPerfilPage implements OnInit {
  userId = '';
  email = '';
  nombre = '';
  apellido = '';
  fechaNacimiento = '';
  genero = '';
  nombreUsuario = '';
  isLoading = true;
  isSaving = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    try {
      await this.completeOAuthRedirectIfNeeded();

      const user = await this.authService.getUser();

      if (!user?.email) {
        await this.router.navigateByUrl('/login');
        return;
      }

      this.userId = user.id;
      this.email = user.email;

      const profileExists = await this.profileEmailExistsForCurrentUser(user.id, user.email);

      console.log('Comparando correo de Google con profiles:', {
        googleUserId: user.id,
        googleEmail: this.normalizeEmail(user.email),
        profileExists
      });

      if (profileExists) {
        await this.router.navigateByUrl('/home');
        return;
      }

      await this.authService.logout();
      this.errorMessage = 'Ese correo no tiene cuenta. Primero crea una cuenta antes de iniciar con Google.';
    } catch (error) {
      console.error('No se pudo validar el inicio con Google:', error);
      await this.safeLogout();
      this.errorMessage = error instanceof Error
        ? error.message
        : 'No se pudo validar el inicio con Google.';
    } finally {
      this.isLoading = false;
    }
  }

  async submitProfile() {
    if (!this.nombre || !this.apellido || !this.fechaNacimiento || !this.genero || !this.nombreUsuario) {
      this.errorMessage = 'Completa todos los campos';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    try {
      await this.authService.completeProfile(this.userId, this.email, {
        nombre: this.nombre,
        apellido: this.apellido,
        fechaNacimiento: this.fechaNacimiento,
        genero: this.genero,
        nombreUsuario: this.nombreUsuario
      });
      await this.router.navigateByUrl('/home');
    } catch (error) {
      this.errorMessage = error instanceof Error
        ? error.message
        : 'No se pudo completar el perfil';
    } finally {
      this.isSaving = false;
    }
  }

  async goToLogin() {
    await this.router.navigateByUrl('/login');
  }

  private async profileEmailExistsForCurrentUser(userId: string, email: string) {
    const supabase = getSupabaseClient();
    const normalizedEmail = this.normalizeEmail(email);
    const { data: existsByRpc, error: rpcError } = await supabase
      .rpc('profile_email_exists_for_current_user');

    console.log('Respuesta de Supabase al buscar correo en profiles:', {
      googleEmail: normalizedEmail,
      existsByRpc,
      rpcError
    });

    if (!rpcError) {
      return existsByRpc === true;
    }

    console.warn('No se pudo usar profile_email_exists_for_current_user sin parametros. Probando version anterior:', rpcError);

    const { data: existsByLegacyRpc, error: legacyRpcError } = await supabase
      .rpc('profile_email_exists_for_current_user', {
        google_email: normalizedEmail
      });

    console.log('Respuesta de Supabase al buscar correo en profiles con parametro:', {
      googleEmail: normalizedEmail,
      existsByLegacyRpc,
      legacyRpcError
    });

    if (!legacyRpcError) {
      return existsByLegacyRpc === true;
    }

    console.warn('No se pudo usar ningun RPC de profile_email_exists_for_current_user. Usando busqueda directa:', legacyRpcError);

    const profile = await this.getExistingProfile(userId, email);

    if (profile?.email) {
      return this.normalizeEmail(profile.email) === normalizedEmail;
    }

    throw new Error('No se pudo validar el correo en Supabase. Ejecuta el archivo supabase-google-login.sql en el SQL Editor.');
  }

  private async getExistingProfile(userId: string, email: string) {
    const supabase = getSupabaseClient();
    const profileFields = 'nombre, apellido, email, nombre_usuario, genero, fecha_nacimiento';
    const { data: idProfile, error: idError } = await supabase
      .from('profiles')
      .select(profileFields)
      .eq('id', userId)
      .maybeSingle();

    if (idError) {
      throw idError;
    }

    if (idProfile) {
      return idProfile;
    }

    const normalizedEmail = this.normalizeEmail(email);
    const { data: emailProfiles, error: emailError } = await supabase
      .from('profiles')
      .select(profileFields)
      .ilike('email', `%${normalizedEmail}%`)
      .limit(10);

    if (emailError) {
      throw emailError;
    }

    return emailProfiles?.find((emailProfile) => {
      return this.normalizeEmail(emailProfile.email) === normalizedEmail;
    }) ?? null;
  }

  private normalizeEmail(email: string | null | undefined) {
    return String(email ?? '').trim().toLowerCase();
  }

  private async safeLogout() {
    try {
      await this.authService.logout();
    } catch (logoutError) {
      console.warn('No se pudo cerrar la sesion despues de fallar Google:', logoutError);
    }
  }

  private async completeOAuthRedirectIfNeeded() {
    const currentUrl = new URL(window.location.href);
    const code = currentUrl.searchParams.get('code');
    const hashParams = new URLSearchParams(currentUrl.hash.replace(/^#/, ''));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (!code && (!accessToken || !refreshToken)) {
      return;
    }

    const supabase = getSupabaseClient();

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('No se pudo convertir el codigo de Google en sesion:', error);
        return;
      }
    } else if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      if (error) {
        console.error('No se pudo guardar la sesion de Google:', error);
        return;
      }
    }

    window.history.replaceState({}, document.title, currentUrl.pathname);
  }
}
