import { Component, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { OEE_WIDGET_DEFAULT_CONFIG, OEE_WIDGET_DEFAULT_INTERVALS } from '../oee-widget.constats';
import {
  OeeConfig,
  OeeEquipment,
  OeeProfileSelectGroup,
  OeeIntervalOption,
  OeeProfile,
  OeeType
} from '../oee-widget.models';
import { OEEWidgetService } from '../oee-widget.service';
import { version } from '../../../package.json';

@Component({
  selector: 'oee-widget-config',
  templateUrl: './oee-widget-config.component.html',
  styleUrls: ['./oee-widget-config.component.less']
})
export class OEEWidgetConfigComponent implements OnInit {
  private defaultConfig = OEE_WIDGET_DEFAULT_CONFIG;
  loadingEquipment: boolean;
  loadingProfiles: boolean;
  profiles: OeeProfile[] = [];
  equipment: OeeEquipment[] = [];
  intervals: OeeIntervalOption[] = [];
  profileOptions: any[] = [];
  appVersion: string;
  @Input() config: OeeConfig;

  constructor(private oeeService: OEEWidgetService, private translateService: TranslateService) {
    this.appVersion = version;
  }

  private sortAlphabetical<T>(list: T[], key?: string, caseSensitive = false): Array<T> {
    return list.sort((a, b) => {
      let valA: string;
      let valB: string;

      if (key) {
        valA = a[key];
        valB = b[key];
      }

      if (!caseSensitive) {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      return valA > valB ? 1 : valA < valB ? -1 : 0;
    });
  }

  private groupProfilesByType(profiles: OeeProfile[]): OeeProfileSelectGroup[] {
    const groups = [];
    const disabledOptionLabel = this.translateService.instant('not supported yet');

    // group by types
    for (let item of profiles) {
      const device = this.equipment.find((e) => e.id === item.deviceId);
      if (device) {
        item.deviceName = device.name;
      }

      if (!groups.find((i) => i.id === item.type)) {
        groups.push({
          id: item.type,
          profiles: [],
          label:
            item.type === OeeType.AREA || item.type === OeeType.SITE
              ? `${item.type} (${disabledOptionLabel})`
              : item.type
        });
      }

      groups.find((i) => i.id === item.type).profiles.push(item);
    }

    return groups;
  }

  private sortProfilesForSelect(profiles: OeeProfile[]): OeeProfileSelectGroup[] {
    const groups = this.groupProfilesByType(profiles);

    // sort
    for (let group of groups) {
      group.profiles = this.sortAlphabetical(group.profiles, 'name');
    }

    return this.sortAlphabetical(groups, 'label');
  }

  private fetchEquipment(): Promise<void | OeeEquipment[]> {
    this.loadingEquipment = true;

    return this.oeeService
      .fetchEquipments()
      .then((response: OeeEquipment[]) => {
        return response;
      })
      .finally(() => {
        delete this.loadingEquipment;
      });
  }

  private loadProfiles(): Promise<OeeProfile[] | void> {
    this.loadingProfiles = true;

    return this.oeeService
      .fetchProfiles()
      .then((profiles: OeeProfile[]) => {
        return profiles;
      })
      .finally(() => {
        delete this.loadingProfiles;
      });
  }

  private getReadableIntervalLabel(interval: number): string {
    let calc: number;

    // TODO use pluralization via translation
    const secSg = this.translateService.instant('Second');
    const secPl = this.translateService.instant('Seconds');
    const minSg = this.translateService.instant('Minute');
    const minPl = this.translateService.instant('Minutes');
    const hourSg = this.translateService.instant('Hour');
    const hourPl = this.translateService.instant('Hours');

    if (interval >= 3600) {
      calc = interval / 3600;
      return calc === 1 ? `1 ${hourSg}` : `${calc} ${hourPl}`;
    } else if (interval >= 60) {
      calc = interval / 60;
      return calc === 1 ? `1 ${minSg}` : `${calc} ${minPl}`;
    } else {
      return interval === 1 ? `1 ${secSg}` : `${calc} ${secPl}`;
    }
  }

  private setIntervals(intervals: number[]): OeeIntervalOption[] {
    const options: OeeIntervalOption[] = [];

    for (let interval of intervals) {
      options.push({
        label: this.getReadableIntervalLabel(interval),
        value: interval
      } as OeeIntervalOption);
    }

    return options;
  }

  ngOnInit(): void {
    // set default
    Object.assign(this.config, {
      ...this.defaultConfig,
      ...this.config
    });

    Promise.all([this.loadProfiles(), this.fetchEquipment()]).then((response) => {
      const [profiles, equipment] = response;
      if (equipment) {
        this.equipment = equipment;
      }
      if (profiles) {
        this.profiles = profiles;
      }

      this.profileOptions = this.sortProfilesForSelect(this.profiles);

      if (this.config.profileId) {
        this.setProfile();
      }
    });
  }

  setProfile(): void {
    delete this.config.equipmentId;

    const profile = this.profiles.find((item) => item.id === this.config.profileId);

    if (profile) {
      this.config.equipmentId = profile.deviceId;
      this.intervals = this.setIntervals(profile.intervals);
    }
  }
}
