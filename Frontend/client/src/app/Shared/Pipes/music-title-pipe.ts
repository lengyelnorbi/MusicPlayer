import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'musicTitlePipe',
})
export class MusicTitlePipe implements PipeTransform {
  transform(title: string | undefined): string | null {
    if(title) {
      var titleWithoutExtension = null; 
      if(title.includes('.mp3')) {
        titleWithoutExtension = title.replace(".mp3", "");
      }
      if(title.includes('.m4a')) {
        titleWithoutExtension = title.replace(".m4a", "");
      }
      return titleWithoutExtension;
    }
    return null;
  }
}
