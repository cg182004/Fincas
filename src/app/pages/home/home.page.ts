import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { getSupabaseClient } from 'src/app/supabase.client';
import { TranslatePipe } from '@ngx-translate/core';
import { IonContent, IonTabButton, IonLabel, IonFooter, IonTabBar, IonIcon, IonRippleEffect, IonFab, IonFabButton } from '@ionic/angular/standalone';
import { SiembraRegistro, SiembraStorageService } from 'src/app/services/siembra-storage.service';
import {
  homeOutline,
  locationOutline,
  barChartOutline,
  personOutline,
  settingsOutline,
  leafOutline,
  wifiOutline,
  add,
  analyticsOutline,
  notificationsOutline,
  trendingUpOutline,
  bugOutline,
  cubeOutline,
  imagesOutline,
  chevronForwardOutline
} from 'ionicons/icons';
import { addIcons } from 'ionicons';

interface UserProfile {
  email?: string;
  nombre: string;
  apellido: string;
  nombre_usuario?: string;
  genero?: string;
  fecha_nacimiento?: string;
  avatar_url: string | null;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonIcon, IonTabBar, IonFooter, IonLabel, IonTabButton, IonContent, IonRippleEffect, IonFab, IonFabButton, CommonModule, FormsModule, RouterLink, TranslatePipe]
})
export class HomePage implements OnInit {
  profile?: UserProfile;
  loading = true;
  errorMessage = '';
  planesSiembra: SiembraRegistro[] = [];

  fincas = [
    { codigo: 'FINCA-001', nombre: 'Finca La Esperanza' },
    { codigo: 'FINCA-002', nombre: 'Finca San Jose' },
    { codigo: 'FINCA-003', nombre: 'Finca Los Pinos' },
  ];

  cultivos = [
    { codigo: 'CULT-001', nombre: 'Platano' },
    { codigo: 'CULT-002', nombre: 'Cacao' },
    { codigo: 'CULT-003', nombre: 'Maiz' },
  ];

  constructor(
    private siembraStorage: SiembraStorageService,
    private router: Router
  ) {
    addIcons({
      notificationsOutline,
      add,
      analyticsOutline,
      locationOutline,
      leafOutline,
      bugOutline,
      cubeOutline,
      imagesOutline,
      trendingUpOutline,
      chevronForwardOutline,
      homeOutline,
      barChartOutline,
      personOutline,
      settingsOutline,
      wifiOutline
    });
  }

  async ngOnInit() {
    this.loadProfile();
    await this.loadPlanesSiembra();
  }

  async ionViewWillEnter() {
    this.loadProfile();
    await this.loadPlanesSiembra();
  }

  get profileInitials() {
    if (!this.profile) {
      return 'AD';
    }

    const nombre = this.profile.nombre?.charAt(0) ?? '';
    const apellido = this.profile.apellido?.charAt(0) ?? '';
    return `${nombre}${apellido}`.toUpperCase() || 'AD';
  }

  async loadProfile() {
    const supabase = getSupabaseClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      this.errorMessage = 'No hay usuario logueado';
      this.loading = false;
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('nombre, apellido, email, nombre_usuario, genero, fecha_nacimiento, avatar_url')
      .eq('id', userData.user.id)
      .maybeSingle();

    if (error) {
      this.errorMessage = 'No se pudo cargar el perfil';
      this.loading = false;
      return;
    }

    let profile = data;

    if (!profile && userData.user.email) {
      const normalizedUserEmail = this.normalizeEmail(userData.user.email);
      const { data: emailProfiles, error: emailProfileError } = await supabase
        .from('profiles')
        .select('nombre, apellido, email, nombre_usuario, genero, fecha_nacimiento, avatar_url')
        .ilike('email', `%${normalizedUserEmail}%`)
        .limit(10);

      if (emailProfileError) {
        this.errorMessage = 'No se pudo cargar el perfil';
        this.loading = false;
        return;
      }

      profile = emailProfiles?.find((emailProfile) => {
        return this.normalizeEmail(emailProfile.email) === normalizedUserEmail;
      }) ?? null;
    }

    this.profile = profile ?? this.getFallbackProfile(userData.user);
    this.loading = false;
  }

  private getFallbackProfile(user: { email?: string; user_metadata?: Record<string, unknown> }): UserProfile {
    const metadata = user.user_metadata ?? {};
    const fullName = String(metadata['full_name'] ?? metadata['name'] ?? '').trim();
    const [firstName, ...lastNameParts] = fullName.split(' ').filter(Boolean);
    const email = user.email ?? '';

    return {
      nombre: String(metadata['given_name'] ?? firstName ?? email.split('@')[0] ?? 'Usuario'),
      apellido: String(metadata['family_name'] ?? lastNameParts.join(' ') ?? ''),
      email,
      nombre_usuario: email.split('@')[0] ?? '',
      genero: '',
      fecha_nacimiento: '',
      avatar_url: String(metadata['avatar_url'] ?? metadata['picture'] ?? '') || null
    };
  }

  private normalizeEmail(email: string | null | undefined) {
    return String(email ?? '').trim().toLowerCase();
  }

  async loadPlanesSiembra() {
    const planes = await this.siembraStorage.obtenerSiembras();
    this.planesSiembra = planes.filter((plan) => (plan.estado ?? 'activo') === 'activo');
  }

  getNombreFinca(codigo: string) {
    return this.fincas.find((finca) => finca.codigo === codigo)?.nombre ?? codigo;
  }

  getNombreCultivo(codigo: string) {
    return this.cultivos.find((cultivo) => cultivo.codigo === codigo)?.nombre ?? codigo;
  }
}
