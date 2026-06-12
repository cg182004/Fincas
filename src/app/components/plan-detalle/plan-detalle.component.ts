import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { SiembraRegistro, SiembraStorageService } from 'src/app/services/siembra-storage.service';

@Component({
  selector: 'app-plan-detalle',
  templateUrl: './plan-detalle.component.html',
  styleUrls: ['./plan-detalle.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar
  ]
})
export class PlanDetalleComponent implements OnInit {
  plan?: SiembraRegistro;

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
    private route: ActivatedRoute,
    private siembraStorage: SiembraStorageService
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      return;
    }

    this.plan = await this.siembraStorage.obtenerSiembraPorId(id);
  }

  getNombreFinca(codigo: string) {
    return this.fincas.find((finca) => finca.codigo === codigo)?.nombre ?? codigo;
  }

  getNombreCultivo(codigo: string) {
    return this.cultivos.find((cultivo) => cultivo.codigo === codigo)?.nombre ?? codigo;
  }
}
