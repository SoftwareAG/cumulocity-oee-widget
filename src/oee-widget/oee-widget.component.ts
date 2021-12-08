import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { OeeConfig, OeeDisplay, OeeEquipment, OeeMeasurementType, OeeProfile, OeeTrend } from './oee-widget.models';
import { OEEWidgetService } from './oee-widget.service';
import * as _ from 'lodash';

@Component({
  selector: 'oee-widget',
  templateUrl: './oee-widget.component.html',
  styleUrls: ['./oee-widget.component.less']
})
export class OEEWidgetComponent implements OnInit, OnDestroy {
  private intervalUpdateTimer: NodeJS.Timer;
  private intervalCountdownTimer: NodeJS.Timer;
  private intervalDuration: number;
  private countdownUpdateDuration = 1000;
  private remainingInterval = 0;
  loadingEquipment: boolean;
  equipment: OeeEquipment;
  profile: OeeProfile;
  aggregatedOee: OeeDisplay;
  oeeDetails: OeeDisplay[] = [];
  countdownPercent: string;
  @Input() config: OeeConfig;

  constructor(private oeeService: OEEWidgetService) {}

  private setupOeeDisplay(): void {
    this.aggregatedOee = {
      title: 'OEE',
      current: 0,
      target: this.profile.oeeTargets.overall,
      trend: OeeTrend.NEUTRAL
    };
    this.oeeDetails.push({
      title: 'Availability',
      current: 0,
      target: this.profile.oeeTargets.availability,
      trend: OeeTrend.NEUTRAL
    });
    this.oeeDetails.push({
      title: 'Performance',
      current: 0,
      target: this.profile.oeeTargets.performance,
      trend: OeeTrend.NEUTRAL
    });
    this.oeeDetails.push({
      title: 'Quality',
      current: 0,
      target: this.profile.oeeTargets.quality,
      trend: OeeTrend.NEUTRAL
    });
  }

  private setOeeDisplayData(display: OeeDisplay, newValue: number): OeeDisplay {
    display.trend = display.current < newValue ? 1 : display.current > newValue ? -1 : 0;
    display.current = _.round(newValue, this.config.digits);

    return display;
  }

  private updateOee(): void {

    let key = this.oeeService.intervalToString(this.config.interval);
    this.oeeService.fetchLatestMeasurements(this.profile.id, key).then(
      (measurements) => {
        for (let measure of measurements) {
          for (let fragmentType in OeeMeasurementType) {
            let oeeMeasurementType = OeeMeasurementType[fragmentType];
            
            if (measure && measure[oeeMeasurementType] && measure[oeeMeasurementType][key]) {
              let value = measure[oeeMeasurementType][key].value;
  
              switch (oeeMeasurementType) {
                case OeeMeasurementType.OEE:
                  this.aggregatedOee = this.setOeeDisplayData(this.aggregatedOee, value);
                  break;
                case OeeMeasurementType.AVAILABILITY:
                case OeeMeasurementType.PERFORMANCE:
                case OeeMeasurementType.QUALITY:
                  this.oeeDetails.map((detail) => {
                    if (detail.title === oeeMeasurementType) {
                      detail = this.setOeeDisplayData(detail, value);
                    }
                  });
                  break;
              }
            }
          }

        }
      },
      (err) => {
        console.log('Measurement could not be loaded.', err);
      }
    );
  }

  private updateCountdown(total: number): void {
    const calcTotal = total - this.countdownUpdateDuration;
    this.remainingInterval = this.remainingInterval - this.countdownUpdateDuration;

    if (this.remainingInterval < 0) {
      this.remainingInterval = calcTotal;
    }

    this.countdownPercent = Math.round((this.remainingInterval / calcTotal) * 100) + '%';
  }

  private setInterval(): void {
    // data display
    this.intervalUpdateTimer = setInterval(() => {
      this.updateOee();
    }, this.intervalDuration);

    // interval countdown
    if (this.config.showCountdown) {
      this.updateCountdown(this.intervalDuration);
      this.intervalCountdownTimer = setInterval(() => {
        this.updateCountdown(this.intervalDuration);
      }, this.countdownUpdateDuration);
    }
  }

  ngOnInit(): void {
    if (this.config.interval) {
      this.intervalDuration = this.oeeService.convertIntervalToMillisec(this.config.interval);

      this.loadingEquipment = true;
      let profileReq = this.config.profileId ? this.oeeService.fetchProfile(this.config.profileId) : Promise.resolve();
      let equipmentReq = this.config.equipmentId
        ? this.oeeService.fetchEquipment(this.config.equipmentId)
        : Promise.resolve();

      Promise.all([profileReq, equipmentReq])
        .then((response) => {
          const [profile, equipment] = response;
          if (equipment && profile) {
            this.equipment = equipment;
            this.profile = profile;
            this.profile.deviceName = equipment.name;
            this.setupOeeDisplay();
            this.updateOee();
            this.setInterval();
          }
        })
        .finally(() => {
          delete this.loadingEquipment;
        });
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalUpdateTimer);
    clearInterval(this.intervalCountdownTimer);
  }
}
