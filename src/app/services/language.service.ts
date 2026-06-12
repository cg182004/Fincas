import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type AppLanguage = 'es' | 'en';

const LANGUAGE_STORAGE_KEY = 'appfincas.language';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  readonly languages: AppLanguage[] = ['es', 'en'];

  constructor(private translate: TranslateService) {}

  init() {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) as AppLanguage | null;
    const browserLanguage = this.translate.getBrowserLang() === 'en' ? 'en' : 'es';
    const language = savedLanguage && this.languages.includes(savedLanguage)
      ? savedLanguage
      : browserLanguage;

    this.translate.addLangs(this.languages);
    this.translate.setFallbackLang('es');
    this.use(language);
  }

  get currentLanguage(): AppLanguage {
    return (this.translate.getCurrentLang() as AppLanguage | undefined) ?? 'es';
  }

  use(language: AppLanguage) {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
    this.translate.use(language);
  }
}
