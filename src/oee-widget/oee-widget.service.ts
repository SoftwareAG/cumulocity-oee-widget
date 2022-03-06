import { Injectable } from '@angular/core';
import { IResult, IResultList, IManagedObject } from '@c8y/client';
import { InventoryService, MeasurementService } from '@c8y/ngx-components/api';
import { OEE_WIDGET_EQUIPMENT_FRAGMENT, OEE_WIDGET_PROFILE_TYPE } from './oee-widget.constats';
import { OeeEquipment, OeeMeasurement, OeeMeasurementType, OeeProfile } from './oee-widget.models';
import * as _ from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class OEEWidgetService {
  constructor(private inventoryService: InventoryService, private measurementService: MeasurementService) {}

  private unifyEquipmentListData(equipment: IManagedObject[]): OeeEquipment[] {
    const unifiedEquipment: OeeEquipment[] = [];

    for (let item of equipment) {
      unifiedEquipment.push(new OeeEquipment(item));
    }

    return unifiedEquipment;
  }

  fetchEquipments(): Promise<void | OeeEquipment[]> {
    return this.inventoryService
      .list({
        query: `$filter=(has(c8y_IsDevice) or has(${OEE_WIDGET_EQUIPMENT_FRAGMENT}))`,
        pageSize: 2000,
        withTotalPages: false
      })
      .then(
        (response: IResultList<IManagedObject>) => {
          return this.unifyEquipmentListData(response.data);
        },
        (err) => {
          Promise.reject(err);
        }
      );
  }

  fetchEquipment(equipmentId: string): Promise<OeeEquipment | void> {
    return this.inventoryService.detail(equipmentId).then(
      (response: IResult<IManagedObject>) => {
        return new OeeEquipment(response.data);
      },
      (err) => {
        Promise.reject(err);
      }
    );
  }

  private convertProfiles(mos: IManagedObject[]): OeeProfile[] {
    return mos.flatMap(mo => {
      try {
        return [new OeeProfile(mo)];
      } catch(error) {
        return [];
      }
    });
  }

  fetchProfiles(): Promise<void | OeeProfile[]> {
    return this.inventoryService
      .list({
        type: OEE_WIDGET_PROFILE_TYPE,
        pageSize: 2000,
        withTotalPages: false
      })
      .then(
        (response: IResultList<IManagedObject>) => this.convertProfiles(response.data),
        (err) => {
          Promise.reject(err);
        }
      );
  }

  fetchProfile(profileId: string): Promise<OeeProfile | void> {
    return this.inventoryService.detail(profileId).then(
      (response: IResult<IManagedObject>) => {
        return new OeeProfile(response.data);
      },
      (err) => {
        Promise.reject(err);
      }
    );
  }

  // not in use - could be used to optimize the number of requests
  fetchEquipmentAndProfile(equipmentId: string, profileId: string) {
    return this.inventoryService
      .list({
        query: `$filter=id eq '${equipmentId}' or id eq '${profileId}'`,
        pageSize: 2000,
        withTotalPages: false
      })
      .then(
        (response: IResultList<IManagedObject>) => {
          if (response.data.length) {
            console.log(response.data);
            // return new OeeProfile(response.data.pop());
          }
        },
        (err) => {
          Promise.reject(err);
        }
      );
  }

  convertIntervalToMillisec(interval: number): number {
    return interval * 1000;
  }

  fetchLatestMeasurements(id: string, series: string): Promise<OeeMeasurement[]> {
    return Promise.all([
      this.fetchLatestMeasurementByType(id, OeeMeasurementType.OEE, series),
      //COE-417: once the OEE10.10Fix1 is deployed, we could remove the 3 calls below b/c all relevant measurement fragments are part of each OEE measurement
      this.fetchLatestMeasurementByType(id, OeeMeasurementType.AVAILABILITY, series),
      this.fetchLatestMeasurementByType(id, OeeMeasurementType.PERFORMANCE, series),
      this.fetchLatestMeasurementByType(id, OeeMeasurementType.QUALITY, series)
    ]).then((response) => {
      const measurements: OeeMeasurement[] = [];

      for (let measurement of response) {
        if (measurement) {
          measurements.push(measurement);
        }
      }

      return measurements;
    });
  }

  fetchLatestMeasurementByType(id: string, type: OeeMeasurementType, series: string): Promise<void | OeeMeasurement> {
    const dateFrom = new Date();
    dateFrom.setDate(-3);
    dateFrom.setHours(0, 0, 0, 0);

    return this.measurementService
      .list({
        source: id,
        valueFragmentType: type,
	valueFragmentSeries: series,
        dateFrom: dateFrom.toISOString(),
        pageSize: 1,
        withTotalPages: false,
        revert: true
      })
      .then((response) => {
        if (response.data.length) {
          return response.data.pop();
        }
      });
  }

  intervalToString(interval: number): string {
    return interval + 's';
  }
}
