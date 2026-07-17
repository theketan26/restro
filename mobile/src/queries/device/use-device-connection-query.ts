import { useMutation, useQueryClient } from '@tanstack/react-query';
import { connectToDevice, disconnectFromDevice, requestAuthAndConnect } from '../../services/connection-service';
import type { DiscoveredDevice } from '../../services/device-discovery';

export const DEVICE_CONNECTION_MUTATION_KEY = ['device-connection'] as const;

export function useConnectDeviceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ device }: { device: DiscoveredDevice }) => connectToDevice(device),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-discovery'] });
    },
  });
}

export function useDisconnectDeviceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ device }: { device: DiscoveredDevice }) => disconnectFromDevice(device),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-discovery'] });
    },
  });
}

export function useRequestAuthAndConnectMutation() {
  return useMutation({
    mutationFn: ({ device, email }: { device: DiscoveredDevice; email: string }) =>
      requestAuthAndConnect(device, email),
  });
}
