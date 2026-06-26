import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonBadge,
  IonButton,
  IonContent,
  IonFooter,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSelect,
  IonSelectOption,
  IonTabBar,
  IonTabButton,
  IonToggle
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  analyticsOutline,
  barChartOutline,
  bugOutline,
  clipboardOutline,
  constructOutline,
  cutOutline,
  homeOutline,
  leafOutline,
  locationOutline,
  personOutline,
  settingsOutline,
  sparklesOutline,
  trailSignOutline,
  waterOutline
} from 'ionicons/icons';
import {
  RecomendacionAccion,
  RecomendacionesService
} from 'src/app/services/recomendaciones.service';

interface FincaBase {
  codigo: string;
  nombre: string;
}

interface CultivoBase {
  codigo: string;
  nombre: string;
}

@Component({
  selector: 'app-recomendaciones',
  templateUrl: './recomendaciones.page.html',
  styleUrls: ['./recomendaciones.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonBadge,
    IonButton,
    IonContent,
    IonFooter,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonSelect,
    IonSelectOption,
    IonTabBar,
    IonTabButton,
    IonToggle,
    RouterLink,
    TranslatePipe
  ]
})
export class RecomendacionesPage {
  fincas: FincaBase[] = [
    { codigo: 'FINCA-001', nombre: 'Finca La Esperanza' },
    { codigo: 'FINCA-002', nombre: 'Finca San Jose' },
    { codigo: 'FINCA-003', nombre: 'Finca Los Pinos' },
  ];

  cultivos: CultivoBase[] = [
    { codigo: 'CULT-001', nombre: 'Platano' },
    { codigo: 'CULT-002', nombre: 'Cacao' },
    { codigo: 'CULT-003', nombre: 'Maiz' },
  ];

  etapas = [
    'Preparacion del suelo',
    'Siembra',
    'Germinacion',
    'Crecimiento vegetativo',
    'Floracion',
    'Fructificacion',
    'Cosecha'
  ];

  humedades = [
    { valor: 'normal', etiqueta: 'Normal' },
    { valor: 'baja', etiqueta: 'Baja' },
    { valor: 'alta', etiqueta: 'Alta' }
  ];

  condicionesSuelo = [
    { valor: 'normal', etiqueta: 'Normal' },
    { valor: 'compactado', etiqueta: 'Compactado' },
    { valor: 'erosionado', etiqueta: 'Erosionado' }
  ];

  vigorOpciones = [
    { valor: 'bueno', etiqueta: 'Bueno' },
    { valor: 'medio', etiqueta: 'Medio' },
    { valor: 'bajo', etiqueta: 'Bajo' }
  ];

  codigoFinca = this.fincas[0].codigo;
  codigoCultivo = this.cultivos[0].codigo;
  etapa = this.etapas[2];
  humedad = 'normal';
  condicionSuelo = 'normal';
  vigor = 'bueno';
  plagaVisible = false;
  recomendaciones: RecomendacionAccion[] = [];

  constructor(private recomendacionesService: RecomendacionesService) {
    addIcons({
      analyticsOutline,
      barChartOutline,
      bugOutline,
      clipboardOutline,
      constructOutline,
      cutOutline,
      homeOutline,
      leafOutline,
      locationOutline,
      personOutline,
      settingsOutline,
      sparklesOutline,
      trailSignOutline,
      waterOutline
    });

    this.generarRecomendaciones();
  }

  generarRecomendaciones() {
    const finca = this.getFinca(this.codigoFinca);
    const cultivo = this.getCultivo(this.codigoCultivo);

    this.recomendaciones = this.recomendacionesService.generarRecomendaciones({
      codigo_finca: this.codigoFinca,
      nombre_finca: finca?.nombre ?? this.codigoFinca,
      codigo_cultivo: this.codigoCultivo,
      nombre_cultivo: cultivo?.nombre ?? this.codigoCultivo,
      etapa: this.etapa,
      humedad: this.humedad,
      condicion_suelo: this.condicionSuelo,
      vigor: this.vigor,
      plaga_visible: this.plagaVisible
    });
  }

  get prioridadAlta() {
    return this.recomendaciones.filter((recomendacion) => recomendacion.prioridad === 'alta').length;
  }

  getFinca(codigo: string) {
    return this.fincas.find((finca) => finca.codigo === codigo);
  }

  getCultivo(codigo: string) {
    return this.cultivos.find((cultivo) => cultivo.codigo === codigo);
  }
}
