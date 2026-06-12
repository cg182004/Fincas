import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { getSupabaseClient } from 'src/app/supabase.client';
import { TranslatePipe } from '@ngx-translate/core';
import { IonButton, IonContent, IonFooter, IonIcon, IonInput, IonItem, IonLabel, IonModal, IonTabBar, IonTabButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  barChartOutline,
  cameraOutline,
  homeOutline,
  locationOutline,
  mailOutline,
  personOutline,
  settingsOutline,
  shieldCheckmarkOutline,
  eyeOffOutline,
  eyeOutline
} from 'ionicons/icons';

interface ProfileItem {
  title: string;
  detail: string;
  icon: string;
  status: string;
}

interface UserProfile {
  nombre: string;
  apellido: string;
  email: string;
  nombre_usuario: string;
  genero: string;
  fecha_nacimiento: string;
  avatar_url: string | null;
}

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [IonButton, IonContent, IonFooter, IonIcon, IonInput, IonItem, IonLabel, IonModal, IonTabBar, IonTabButton, CommonModule, FormsModule, RouterLink, TranslatePipe]
})
export class PerfilPage implements OnInit {
  profile?: UserProfile;
  userId = '';
  loading = true;
  errorMessage = '';
  avatarMessage = '';
  uploadingAvatar = false;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  passwordMessage = '';
  changingPassword = false;
  isPasswordModalOpen = false;
  profileItems: ProfileItem[] = [
    {
      title: 'Cuenta',
      detail: 'Administrador de AppFincas',
      icon: 'person-outline',
      status: 'Perfil activo'
    },
    {
      title: 'Correo',
      detail: 'admin@appfincas.com',
      icon: 'mail-outline',
      status: 'Verificado'
    },
    {
      title: 'Seguridad',
      detail: 'Acceso protegido',
      icon: 'shield-checkmark-outline',
      status: 'Sin alertas'
    }

  ];

  constructor() {
    addIcons({
      personOutline,
      mailOutline,
      shieldCheckmarkOutline,
      cameraOutline,
      homeOutline,
      locationOutline,
      barChartOutline,
      settingsOutline,
      'eye-off-outline': eyeOffOutline,
      'eye-outline': eyeOutline
    });
  }


  ngOnInit() {
        this.loadProfile();
  }

  ionViewWillEnter() {
    this.loadProfile();
  }

  get profileInitials() {
    if (!this.profile) {
      return 'AD';
    }

    const nombre = this.profile.nombre?.charAt(0) ?? '';
    const apellido = this.profile.apellido?.charAt(0) ?? '';
    return `${nombre}${apellido}`.toUpperCase() || 'AD';
  }

  async uploadAvatar(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file || !this.userId || !this.profile) {
      return;
    }

    this.avatarMessage = '';

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      this.avatarMessage = 'Solo se permiten imagenes PNG, JPG o WEBP';
      input.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.avatarMessage = 'La imagen debe pesar menos de 2 MB';
      input.value = '';
      return;
    }

    this.uploadingAvatar = true;

    const supabase = getSupabaseClient();
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `${this.userId}/avatar-${Date.now()}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      this.avatarMessage = `No se pudo subir la foto: ${uploadError.message}`;
      this.uploadingAvatar = false;
      input.value = '';
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const avatarUrl = publicUrlData.publicUrl;

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', this.userId)
      .select('avatar_url')
      .single();

    if (updateError || !updatedProfile?.avatar_url) {
      console.error('Avatar profile update error:', updateError);
      this.avatarMessage = `La foto subio, pero no se pudo guardar: ${updateError?.message ?? 'No se actualizo el perfil'}`;
      this.uploadingAvatar = false;
      input.value = '';
      return;
    }

    this.profile = {
      ...this.profile,
      avatar_url: updatedProfile.avatar_url
    };
    this.avatarMessage = 'Foto actualizada';
    this.uploadingAvatar = false;
    input.value = '';
  }

  openPasswordModal() {
    this.passwordMessage = '';
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.showCurrentPassword = false;
    this.showNewPassword = false;
    this.showConfirmPassword = false;
    this.isPasswordModalOpen = true;
  }

  closePasswordModal() {
    if (this.changingPassword) {
      return;
    }

    this.isPasswordModalOpen = false;
  }

  cancelPasswordModal() {
    this.closePasswordModal();
    this.passwordMessage = '';
  }

  async changePassword() {
    this.passwordMessage = '';

    if (!this.profile?.email) {
      this.passwordMessage = 'No se encontro el correo de la cuenta';
      return;
    }

    if (!this.currentPassword) {
      this.passwordMessage = 'Escribe tu contrasena actual';
      return;
    }

    if (this.newPassword.length < 6) {
      this.passwordMessage = 'La contrasena debe tener al menos 6 caracteres';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.passwordMessage = 'Las contrasenas no coinciden';
      return;
    }

    this.changingPassword = true;

    const supabase = getSupabaseClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: this.profile.email,
      password: this.currentPassword
    });

    if (signInError) {
      this.passwordMessage = 'La contrasena actual no es correcta';
      this.changingPassword = false;
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: this.newPassword
    });

    if (error) {
      this.passwordMessage = 'No se pudo cambiar la contrasena';
      this.changingPassword = false;
      return;
    }

    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.changingPassword = false;
    this.isPasswordModalOpen = false;
    this.passwordMessage = 'Contrasena actualizada';
  }

  async loadProfile() {
  const supabase = getSupabaseClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    this.errorMessage = 'No hay usuario logueado';
    this.loading = false;
    return;
  }

  this.userId = userData.user.id;

  const { data, error } = await supabase
    .from('profiles')
    .select('nombre, apellido, email, nombre_usuario, genero, fecha_nacimiento, avatar_url')
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

}
