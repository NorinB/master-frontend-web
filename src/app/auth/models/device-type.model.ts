export enum DeviceType {
  Web,
  Android,
  IOS,
  Other,
}

export function mapStringToDeviceType(deviceTypeString: string): DeviceType {
  switch (deviceTypeString) {
    case 'Web':
      return DeviceType.Web;
    case 'Android':
      return DeviceType.Android;
    case 'IOS':
      return DeviceType.IOS;
    default: {
      return DeviceType.Other;
    }
  }
}

export function mapDeviceTypeToString(deviceType: DeviceType): string {
  switch (deviceType) {
    case DeviceType.Web:
      return 'Web';
    case DeviceType.Android:
      return 'Android';
    case DeviceType.IOS:
      return 'IOS';
    case DeviceType.Other:
      return 'Other';
  }
}
