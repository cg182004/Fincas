import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { getSupabaseClient } from 'src/app/supabase.client';
import { TranslatePipe } from '@ngx-translate/core';
import { IonContent, IonTabButton, IonLabel, IonFooter, IonTabBar, IonIcon, IonRippleEffect } from '@ionic/angular/standalone';
import { SiembraRegistro, SiembraStorageService } from 'src/app/services/siembra-storage.service';
import {
  homeOutline,
  locationOutline,
  barChartOutline,
  personOutline,
  settingsOutline,
  leafOutline,
  wifiOutline,
  notificationsOutline,
  cameraOutline,
  trendingUpOutline,
  bugOutline,
  chevronForwardOutline
} from 'ionicons/icons';
import { addIcons } from 'ionicons';

interface UserProfile {
  nombre: string;
  apellido: string;
  avatar_url: string | null;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonIcon, IonTabBar, IonFooter, IonLabel, IonTabButton, IonContent, IonRippleEffect, CommonModule, FormsModule, RouterLink, TranslatePipe]
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

  constructor(private siembraStorage: SiembraStorageService) {
    addIcons({
      notificationsOutline,
      locationOutline,
      leafOutline,
      bugOutline,
      cameraOutline,
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
      .select('nombre, apellido, avatar_url')
      .eq('id', userData.user.id)
      .single();

    if (error) {
      this.errorMessage = 'No se pudo cargar el perfil';
      this.loading = false;
      return;
    }

    this.profile = data;
    this.loading = false;
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
