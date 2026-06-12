import { Component } from '@angular/core';
import { IonItem, IonLabel, IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { LanguageService, AppLanguage } from '../../services/language.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [IonItem, IonLabel, IonSelect, IonSelectOption],
  templateUrl: './language-switcher.component.html',
  styleUrls: ['./language-switcher.component.scss']
})
export class LanguageSwitcherComponent {
  constructor(public languageService: LanguageService) {}

  changeLanguage(value: string | string[] | null | undefined) {
    if (value !== 'es' && value !== 'en') {
      return;
    }

    this.languageService.use(value as AppLanguage);
  }
}
