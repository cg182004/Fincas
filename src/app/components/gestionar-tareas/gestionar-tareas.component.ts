import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import {
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonIcon,
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
import { addIcons } from 'ionicons';
import { chevronBackOutline } from 'ionicons/icons';
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
    ReactiveFormsModule,
    RouterLink,
    IonButton,
    IonButtons,
    IonCheckbox,
    IonContent,
    IonHeader,
    IonIcon,
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

  tareas: TareaFinca[] = [];
  tareasPendientes: TareaFinca[] = [];
  tareasPorFinca: GrupoTareasFinca[] = [];
  formularioVisible = false;
  formSubmitted = false;

  tareaForm = this.fb.group({
    codigo_finca: ['', Validators.required],
    titulo: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: [''],
    fecha: ['', Validators.required],
    prioridad: ['media' as 'baja' | 'media' | 'alta', Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private tareaStorage: TareaStorageService,
    private toastController: ToastController,
    private alterController: AlertController
  ) {
    addIcons({
      chevronBackOutline
    });
  }

  async ngOnInit() {
    await this.cargarTareas();
  }

  async confirmarguardar() {
    this.formSubmitted = true;

    if (this.tareaForm.invalid) {
      this.tareaForm.markAllAsTouched();
      await this.presentToast('Revisa los campos marcados');
      return;
    }

    const alert = await this.alterController.create({
      header: 'Confirmar',
      message: 'Estas seguro que quieres guardar esta tarea?',
      buttons: [
        {
          text: 'cancelar',
          role: 'cancel',
        },
        {
          text: 'si, guardar',
          handler: async () => {
            await this.guardarTarea();
          },
        },
      ],
    });
    await alert.present();
  }

  async guardarTarea() {
    const tarea = this.getTareaFormValue();

    this.limpiarFormulario();
    this.cerrarFormulario();

    await this.tareaStorage.guardarTarea(tarea);
    await this.cargarTareas();
    await this.presentToast('Tarea guardada con exito');
  }

  abrirFormulario() {
    this.formularioVisible = true;
  }

  cerrarFormulario() {
    this.formularioVisible = false;
  }

  isInvalid(controlName: string) {
    const control = this.tareaForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched || this.formSubmitted);
  }

  trackByFinca(_: number, grupo: GrupoTareasFinca) {
    return grupo.codigo;
  }

  trackByTarea(_: number, tarea: TareaFinca) {
    return tarea.id;
  }

  async marcarTarea(tarea: TareaFinca, event: CustomEvent<{ checked?: boolean }>) {
    const realizada = event.detail.checked === true;

    if (!realizada) {
      return;
    }

    const checkbox = event.target as HTMLIonCheckboxElement | null;

    const alert = await this.alterController.create({
      header: 'Confirmar tarea',
      message: 'Estas seguro que quieres marcar esta tarea como realizada?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            if (checkbox) {
              checkbox.checked = false;
            }
          },
        },
        {
          text: 'Si, marcar',
          role: 'confirm',
          handler: async () => {
            await this.tareaStorage.eliminarTarea(tarea.id);
            await this.cargarTareas();
            await this.presentToast('Tarea realizada y eliminada de la lista');
          },
        },
      ],
    });

    await alert.present();
  }

  private async cargarTareas() {
    this.tareas = await this.tareaStorage.obtenerTareas();
    this.tareasPendientes = this.tareas.filter((tarea) => tarea.estado !== 'completada');
    this.tareasPorFinca = this.fincas
      .map((finca) => ({
        ...finca,
        tareas: this.tareasPendientes.filter((tarea) => tarea.codigo_finca === finca.codigo),
      }))
      .filter((grupo) => grupo.tareas.length > 0);
  }

  private limpiarFormulario() {
    this.tareaForm.reset({
      codigo_finca: '',
      titulo: '',
      descripcion: '',
      fecha: '',
      prioridad: 'media',
    });
    this.formSubmitted = false;
  }

  private getTareaFormValue(): Omit<TareaFinca, 'id' | 'creado_en'> {
    const value = this.tareaForm.getRawValue();

    return {
      codigo_finca: value.codigo_finca ?? '',
      titulo: value.titulo ?? '',
      descripcion: value.descripcion ?? '',
      fecha: value.fecha ?? '',
      prioridad: value.prioridad ?? 'media',
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
