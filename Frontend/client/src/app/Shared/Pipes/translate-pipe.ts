import { Pipe, PipeTransform } from '@angular/core';
import { TranslationService } from '../../Services/translation-service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  constructor(private translationService: TranslationService) {}

  transform(key: string): string {
    return this.translationService.get(key);
  }
}
