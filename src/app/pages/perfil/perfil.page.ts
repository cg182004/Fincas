import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { getSupabaseClient } from 'src/app/supabase.client';
import { AuthService } from 'src/app/services/auth';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ActionSheetButton } from '@ionic/angular';
import { IonActionSheet, IonButton, IonContent, IonFooter, IonIcon, IonInput, IonItem, IonLabel, IonModal, IonTabBar, IonTabButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  barChartOutline,
  cameraOutline,
  imageOutline,
  homeOutline,
  locationOutline,
  mailOutline,
  personOutline,
  settingsOutline,
  shieldCheckmarkOutline,
  eyeOffOutline,
  eyeOutline,
  logOutOutline
} from 'ionicons/icons';

interface ProfileItem {
  title: string;
  detail: string;
  icon: string;
  status: string;
}

interface UserProfile {
  id?: string;
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
  imports: [IonActionSheet, IonButton, IonContent, IonFooter, IonIcon, IonInput, IonItem, IonLabel, IonModal, IonTabBar, IonTabButton, CommonModule, FormsModule, RouterLink, TranslatePipe]
})
export class PerfilPage implements OnInit {
  profile?: UserProfile;
  userId = '';
  loading = true;
  errorMessage = '';
  avatarMessage = '';
  uploadingAvatar = false;
  isAvatarActionSheetOpen = false;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  passwordMessage = '';
  changingPassword = false;
  isPasswordModalOpen = false;
  loggingOut = false;
  logoutMessage = '';
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

  constructor(
    private authService: AuthService,
    private router: Router,
    private translateService: TranslateService
  ) {
    addIcons({
      personOutline,
      mailOutline,
      shieldCheckmarkOutline,
      cameraOutline,
      imageOutline,
      homeOutline,
      locationOutline,
      barChartOutline,
      settingsOutline,
      logOutOutline,
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

  get avatarActionButtons(): ActionSheetButton[] {
    return [
      {
        text: this.translateService.instant('profile.take_photo'),
        icon: 'camera-outline',
        handler: () => {
          void this.pickAvatarFrom(CameraSource.Camera);
        }
      },
      {
        text: this.translateService.instant('profile.choose_gallery'),
        icon: 'image-outline',
        handler: () => {
          void this.pickAvatarFrom(CameraSource.Photos);
        }
      },
      {
        text: this.translateService.instant('common.cancel'),
        role: 'cancel'
      }
    ];
  }

  openAvatarOptions() {
    if (this.uploadingAvatar) {
      return;
    }

    this.avatarMessage = '';
    this.isAvatarActionSheetOpen = true;
  }

  async pickAvatarFrom(source: CameraSource) {
    if (!this.userId || !this.profile) {
      return;
    }

    this.avatarMessage = '';

    try {
      if (source === CameraSource.Camera) {
        const permission = await Camera.requestPermissions({ permissions: ['camera'] });

        if (permission.camera !== 'granted') {
          this.avatarMessage = 'Permiso de camara denegado';
          return;
        }
      }

      const photo = await Camera.getPhoto({
        quality: 65,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source,
        width: 900,
        height: 900
      });

      if (!photo.dataUrl) {
        this.avatarMessage = 'No se pudo leer la foto seleccionada';
        return;
      }

      const extension = photo.format || 'jpeg';
      const file = this.dataUrlToFile(photo.dataUrl, `avatar.${extension}`);
      await this.saveAvatarFile(file, photo.dataUrl);
    } catch (error) {
      this.avatarMessage = error instanceof Error ? error.message : 'No se pudo cargar la foto';
    }
  }

  async uploadAvatar(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file || !this.userId || !this.profile) {
      return;
    }

    this.avatarMessage = '';
    await this.saveAvatarFile(file);
    input.value = '';
  }

  private async saveAvatarFile(file: File, previewUrl?: string) {
    const currentProfile = this.profile;

    if (!this.userId || !currentProfile) {
      return;
    }

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      this.avatarMessage = 'Solo se permiten imagenes PNG, JPG o WEBP';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.avatarMessage = 'La imagen debe pesar menos de 2 MB';
      return;
    }

    this.uploadingAvatar = true;

    if (previewUrl) {
      this.profile = {
        ...currentProfile,
        avatar_url: previewUrl
      };
    }

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
      this.profile = currentProfile;
      this.uploadingAvatar = false;
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const avatarUrl = publicUrlData.publicUrl;

    const profileId = currentProfile.id ?? this.userId;
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', profileId)
      .select('avatar_url')
      .single();

    if (updateError || !updatedProfile?.avatar_url) {
      console.error('Avatar profile update error:', updateError);
      this.avatarMessage = `La foto subio, pero no se pudo guardar: ${updateError?.message ?? 'No se actualizo el perfil'}`;
      this.profile = currentProfile;
      this.uploadingAvatar = false;
      return;
    }

    this.profile = {
      ...currentProfile,
      avatar_url: updatedProfile.avatar_url
    };
    this.avatarMessage = 'Foto actualizada';
    this.uploadingAvatar = false;
  }

  private dataUrlToFile(dataUrl: string, fileName: string) {
    const [metadata, base64Data] = dataUrl.split(',');
    const mimeType = metadata.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);

    for (let index = 0; index < binaryString.length; index += 1) {
      bytes[index] = binaryString.charCodeAt(index);
    }

    return new File([bytes], fileName, { type: mimeType });
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
      this.passwordMessage = 'Escribe tu contraseña actual';
      return;
    }

    if (this.newPassword.length < 6) {
      this.passwordMessage = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.passwordMessage = 'Las contraseñas no coinciden';
      return;
    }

    this.changingPassword = true;

    const supabase = getSupabaseClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: this.profile.email,
      password: this.currentPassword
    });

    if (signInError) {
      this.passwordMessage = 'La contraseña actual no es correcta';
      this.changingPassword = false;
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: this.newPassword
    });

    if (error) {
      this.passwordMessage = 'No se pudo cambiar la contraseña';
      this.changingPassword = false;
      return;
    }

    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.changingPassword = false;
    this.isPasswordModalOpen = false;
    this.passwordMessage = 'Contraseña actualizada';
  }

  async logout() {
    if (this.loggingOut) {
      return;
    }

    this.loggingOut = true;
    this.logoutMessage = '';

    try {
      await this.authService.logout();
      await this.router.navigate(['/login'], { replaceUrl: true });
    } catch {
      this.logoutMessage = 'No se pudo cerrar sesion';
      this.loggingOut = false;
    }
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
      .select('id, nombre, apellido, email, nombre_usuario, genero, fecha_nacimiento, avatar_url')
      .eq('id', userData.user.id)
      .maybeSingle();

    if (error) {
      this.errorMessage = 'No se pudo cargar el perfil';
      this.loading = false;
      return;
    }

    if (data) {
      this.profile = data;
      this.errorMessage = '';
      this.loading = false;
      return;
    }

    if (userData.user.email) {
      await this.loadProfileByEmail(userData.user.email);
      return;
    }

    this.errorMessage = 'No se encontro un perfil para este usuario';
    this.loading = false;
  }

  private async loadProfileByEmail(email: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nombre, apellido, email, nombre_usuario, genero, fecha_nacimiento, avatar_url')
      .ilike('email', email.trim())
      .limit(1)
      .maybeSingle();

    if (error) {
      this.errorMessage = 'No se pudo cargar el perfil por correo';
      this.loading = false;
      return;
    }

    if (!data) {
      this.errorMessage = 'No se encontro un perfil relacionado con este correo';
      this.loading = false;
      return;
    }

    this.profile = data;
    this.errorMessage = '';
    this.loading = false;
  }

}
