import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'urlencode',
  standalone: true
})
export class UrlEncodePipe implements PipeTransform {
  transform(value: any): string {
    if (value === null || value === undefined) return '';
    return encodeURIComponent(String(value));
  }
}