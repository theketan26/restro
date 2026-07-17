import { httpClient } from '../infrastructure/http/axios-client';

export interface DataPayload {
  from_device: string;
  data_type: string;
  content: any;
}

export interface DataResponse {
  status: string;
  message: string;
}

const DATA_TIMEOUT = 5000; // 5 seconds for data transfer

/**
 * Send data to a remote device
 */
export async function sendDataToDevice(
  deviceBaseUrl: string,
  fromDeviceId: string,
  dataType: string,
  content: any
): Promise<DataResponse | null> {
  try {
    const payload: DataPayload = {
      from_device: fromDeviceId,
      data_type: dataType,
      content,
    };

    const response = await httpClient.post(
      `${deviceBaseUrl}/api/data/send`,
      payload,
      {
        timeout: DATA_TIMEOUT,
      }
    );

    if (response.data && response.data.data) {
      return response.data.data;
    }

    return null;
  } catch (error) {
    console.error('Error sending data to device:', error);
    throw error;
  }
}

/**
 * Receive pending data from a remote device
 */
export async function receiveDataFromDevice(
  deviceBaseUrl: string
): Promise<any | null> {
  try {
    const response = await httpClient.get(
      `${deviceBaseUrl}/api/data/receive`,
      {
        timeout: DATA_TIMEOUT,
      }
    );

    if (response.data && response.data.data) {
      return response.data.data;
    }

    return null;
  } catch (error) {
    console.error('Error receiving data from device:', error);
    throw error;
  }
}

/**
 * Send a file to a remote device (as base64)
 */
export async function sendFileToDevice(
  deviceBaseUrl: string,
  fromDeviceId: string,
  fileName: string,
  fileData: string
): Promise<DataResponse | null> {
  return sendDataToDevice(deviceBaseUrl, fromDeviceId, 'file', {
    name: fileName,
    data: fileData,
  });
}

/**
 * Send text message to a remote device
 */
export async function sendMessageToDevice(
  deviceBaseUrl: string,
  fromDeviceId: string,
  message: string
): Promise<DataResponse | null> {
  return sendDataToDevice(deviceBaseUrl, fromDeviceId, 'message', {
    text: message,
  });
}

/**
 * Send user data synchronization
 */
export async function syncUserDataWithDevice(
  deviceBaseUrl: string,
  fromDeviceId: string,
  userData: any
): Promise<DataResponse | null> {
  return sendDataToDevice(deviceBaseUrl, fromDeviceId, 'user_sync', userData);
}
