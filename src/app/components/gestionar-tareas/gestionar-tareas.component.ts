import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { TareaFinca, TareaStorageService } from 'src/app/services/tarea-storage.service';

interface GrupoTareasFinca {
  codigo: string;
  nombre: string;
  tareas: TareaFinca[];
}

@Component({
  selector: 'app-gestionar-tareas',
  templateUrl: './gestionar-tareas.component.html',
  styleUrls: ['./gestionar-tareas.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonBackButton,
    IonButton,
    IonButtons,
    IonCheckbox,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonTitle,
    IonToolbar
  ]
})
export class GestionarTareasComponent implements OnInit {
  fincas = [
    { codigo: 'FINCA-001', nombre: 'Finca La Esperanza' },
    { codigo: 'FINCA-002', nombre: 'Finca San Jose' },
    { codigo: 'FINCA-003', nombre: 'Finca Los Pinos' },
  ];

  tarea = {
    codigo_finca: '',
    titulo: '',
    descripcion: '',
    fecha: '',
    prioridad: 'media' as 'baja' | 'media' | 'alta',
    estado: 'pendiente' as 'pendiente' | 'completada',
  };

  tareas: TareaFinca[] = [];
  formularioVisible = false;

  constructor(
    private tareaStorage: TareaStorageService,
    private toastController: ToastController
  ) {}

  get tareasPendientes() {
    return this.tareas.filter((tarea) => tarea.estado !== 'completada');
  }

  get tareasPorFinca(): GrupoTareasFinca[] {
    return this.fincas
      .map((finca) => ({
        ...finca,
        tareas: this.tareasPendientes.filter((tarea) => tarea.codigo_finca === finca.codigo),
      }))
      .filter((grupo) => grupo.tareas.length > 0);
  }

  async ngOnInit() {
    await this.cargarTareas();
  }

  async guardarTarea() {
    await this.tareaStorage.guardarTarea(this.tarea);
    await this.cargarTareas();
    await this.presentToast('Tarea guardada con exito');
    this.limpiarFormulario();
    this.cerrarFormulario();
  }

  abrirFormulario() {
    this.formularioVisible = true;
  }

  cerrarFormulario() {
    this.formularioVisible = false;
  }

  async marcarTarea(tarea: TareaFinca, realizada: boolean) {
    if (!realizada) {
      return;
    }

    await this.tareaStorage.eliminarTarea(tarea.id);
    await this.cargarTareas();
    await this.presentToast('Tarea realizada y eliminada de la lista');
  }

  private async cargarTareas() {
    this.tareas = await this.tareaStorage.obtenerTareas();
  }

  private limpiarFormulario() {
    this.tarea = {
      codigo_finca: '',
      titulo: '',
      descripcion: '',
      fecha: '',
      prioridad: 'media',
      estado: 'pendiente',
    };
  }

  private async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'middle',
      cssClass: 'toast-bonito',
    });

    await toast.present();
  }
}
