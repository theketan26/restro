export interface DeviceInfo {
  id: string;
  name: string;
  master_name?: string;
  device_type: string;
  ip_address: string;
  port: number;
  version: string;
}