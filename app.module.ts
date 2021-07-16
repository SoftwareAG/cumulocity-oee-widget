import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule as NgRouterModule } from '@angular/router';
import { UpgradeModule as NgUpgradeModule } from '@angular/upgrade/static';
import { CoreModule, HOOK_COMPONENTS, RouterModule } from '@c8y/ngx-components';
import { DashboardUpgradeModule, UpgradeModule, HybridAppModule, UPGRADE_ROUTES } from '@c8y/ngx-components/upgrade';
import { AssetsNavigatorModule } from '@c8y/ngx-components/assets-navigator';
import { CockpitDashboardModule, ReportDashboardModule } from '@c8y/ngx-components/context-dashboard';
import { ReportsModule } from '@c8y/ngx-components/reports';
import { SensorPhoneModule } from '@c8y/ngx-components/sensor-phone';
import { BinaryFileDownloadModule } from '@c8y/ngx-components/binary-file-download';
import { OEEWidgetComponent } from './src/oee-widget/oee-widget.component';
import { OEEWidgetConfigComponent } from './src/oee-widget/configuration/oee-widget-config.component';
import { OEETrendComponent } from './src/oee-widget/oee-trend/oee-trend.component';
import { OEEBarComponent } from './src/oee-widget/oee-bar/oee-bar.component';

@NgModule({
  imports: [
    // Upgrade module must be the first
    UpgradeModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(),
    NgRouterModule.forRoot([...UPGRADE_ROUTES], { enableTracing: false, useHash: true }),
    CoreModule.forRoot(),
    AssetsNavigatorModule,
    ReportsModule,
    NgUpgradeModule,
    DashboardUpgradeModule,
    CockpitDashboardModule,
    SensorPhoneModule,
    ReportDashboardModule,
    BinaryFileDownloadModule
  ],
  declarations: [OEEWidgetComponent, OEEWidgetConfigComponent, OEETrendComponent, OEEBarComponent],
  entryComponents: [OEEWidgetComponent, OEEWidgetConfigComponent, OEETrendComponent, OEEBarComponent],
  providers: [
    {
      provide: HOOK_COMPONENTS,
      multi: true,
      useValue: {
        id: 'oee.widget',
        label: 'OEE',
        description: 'Displays the Overall Equipment Effectiveness',
        component: OEEWidgetComponent,
        configComponent: OEEWidgetConfigComponent,
        previewImage: require('./styles/preview-image.png'),
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
export class AppModule extends HybridAppModule {
  constructor(protected upgrade: NgUpgradeModule) {
    super();
  }
}
