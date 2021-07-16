import { CoreModule, HOOK_COMPONENTS } from '@c8y/ngx-components';
import { NgModule } from '@angular/core';
import '~styles/index.css';
import { OEEWidgetConfigComponent } from './configuration/oee-widget-config.component';
import { OEEWidgetComponent } from './oee-widget.component';

@NgModule({
  imports: [CoreModule],
  declarations: [OEEWidgetComponent, OEEWidgetConfigComponent],
  entryComponents: [OEEWidgetComponent, OEEWidgetConfigComponent],
  providers: [
    {
      provide: HOOK_COMPONENTS,
      multi: true,
      useValue: {
        id: 'oee.widget',
        label: 'OEE Widget',
        description: 'Displays the Overall Equipment Effectiveness',
        component: OEEWidgetComponent,
        configComponent: OEEWidgetConfigComponent,
        previewImage: require('~/styles/preview-image.png'),
        data: {
          ng1: {
            options: {
              noDeviceTarget: true
            }
          }
        }
      }
    }
  ]
})
export class OEEWidgetModule {}
