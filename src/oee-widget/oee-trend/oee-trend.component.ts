import { Component, Input } from '@angular/core';
import { OeeTrend } from '../oee-widget.models';

@Component({
  selector: 'oee-trend',
  templateUrl: './oee-trend.component.html',
  styleUrls: ['./oee-trend.component.less']
})
export class OEETrendComponent {
  @Input() trend: OeeTrend;
}
