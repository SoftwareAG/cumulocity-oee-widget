import { Component, Input } from '@angular/core';
import { OeeDisplay } from '../oee-widget.models';

@Component({
  selector: 'oee-bar',
  templateUrl: './oee-bar.component.html',
  styleUrls: ['./oee-bar.component.less']
})
export class OEEBarComponent {
  @Input() item: OeeDisplay;
}
