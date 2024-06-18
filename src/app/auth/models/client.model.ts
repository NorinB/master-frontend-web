import { DeviceType } from './device-type.model';

export interface Client {
  userId: string;
  clientId: string;
  deviceType: DeviceType;
}
