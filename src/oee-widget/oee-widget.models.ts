import { IManagedObject, IMeasurement } from '@c8y/client';
import { OEE_WIDGET_EQUIPMENT_FRAGMENT, OEE_WIDGET_PROFILE_FRAGMENT } from './oee-widget.constats';

export enum OeeType {
  AREA = 'Area',
  LINE = 'Line',
  MACHINE = 'Machine',
  SITE = 'Site'
}

export enum OeeMeasurementType {
  OEE = 'OEE',
  AVAILABILITY = 'Availability',
  PERFORMANCE = 'Performance',
  QUALITY = 'Quality'
}

export enum OeeTrend {
  UP = 1,
  DOWN = -1,
  NEUTRAL = 0
}

export interface OeeMeasurement extends IMeasurement {
  type: string;
}

export interface OeeDisplay {
  title: string;
  current: number;
  target: number;
  trend: OeeTrend;
}

export interface OeeConfig {
  showDetails: boolean;
  showChart: boolean;
  showCountdown: boolean;
  interval: number;
  digits: number;
  equipmentId?: string;
  profileId?: string;
}

export interface OeeProfileSelectGroup {
  id: string;
  label: string;
  profiles: IManagedObject[];
}

export interface OeeHierarchy {
  profileID: string;
  ID: string;
}

export interface OeeIntervalOption {
  label: string;
  value: number;
}

export class OeeBaseClass {
  constructor() {}

  convertType(type: string): OeeType | void {
    switch (type.toLowerCase()) {
      case 'area':
        return OeeType.AREA;
      case 'line':
        return OeeType.LINE;
      case 'machine':
        return OeeType.MACHINE;
      case 'site':
        return OeeType.SITE;
      default:
        console.error(`Type "${type}" unknown.`);
        return;
    }
  }
}

export class OeeEquipment extends OeeBaseClass {
  id: string;
  name: string;
  type: OeeType;
  hierarchy: OeeHierarchy[] | null;
  oeetarget?: number;
  lastUpdated: Date;
  // orderByIndex

  constructor(mo?: IManagedObject) {
    super();

    if (mo) {
      this.import(mo);
    }
  }

  import(mo: IManagedObject): void {
    // set type
    if (mo.hasOwnProperty('c8y_IsDevice')) {
      this.type = OeeType.MACHINE;
    } else if (mo.hasOwnProperty(OEE_WIDGET_EQUIPMENT_FRAGMENT)) {
      const type = this.convertType(mo.type);
      if (type) {
        this.type = type;
      }
    }

    // general stuff
    this.id = mo.id;
    this.lastUpdated = new Date(mo.lastUpdated);

    // by type
    switch (this.type) {
      case OeeType.MACHINE:
        this.name = mo.name;
        this.hierarchy = null;
        break;
      case OeeType.LINE:
      case OeeType.AREA:
      case OeeType.SITE:
        this.name = mo.description;
        this.hierarchy = mo.hierarchy;
        this.oeetarget = mo.oeetarget;
        break;
      default:
        console.error('Equipment type not available');
        break;
    }
  }
}

export class OeeProfile extends OeeBaseClass {
  id: string;
  deviceId: string;
  uid: string;
  tenantId: string;
  name: string;
  deviceName?: string;
  lastUpdated: Date;
  intervals: number[];
  oeeTargets: any; // TODO
  locationId: string;
  type: OeeType | void;

  constructor(mo?: IManagedObject) {
    super();

    if (mo) {
      this.import(mo);
    }
  }

  import(mo: IManagedObject): void {
    const oee = mo[OEE_WIDGET_PROFILE_FRAGMENT];

    this.id = mo.id;
    this.deviceId = oee.deviceId;
    this.name = oee.name;
    this.lastUpdated = new Date(mo.lastUpdated);
    this.intervals = oee.intervals;
    this.locationId = oee.locationId;
    this.oeeTargets = oee.oeeTargets;
    this.tenantId = oee.tenantId;
    this.uid = oee.uid;
    this.type = this.convertType(oee.type);
  }
}
