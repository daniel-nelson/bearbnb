// This file is auto-generated during sync — do not edit
import { create } from 'zustand'
import * as sdk from './sdk.gen'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SdkFn = (...args: any[]) => Promise<{ data?: any; error?: any }>

interface SdkStore<TData, TArgs extends unknown[]> {
  data: TData | undefined
  error: unknown
  isLoading: boolean
  fetch: (...args: TArgs) => Promise<TData | undefined>
  reset: () => void
}

function createSdkStore<T extends SdkFn>(fn: T) {
  type TData = Awaited<ReturnType<T>>['data']
  return create<SdkStore<TData, Parameters<T>>>()((set) => ({
    data: undefined as TData | undefined,
    error: undefined as unknown,
    isLoading: false,

    fetch: async (...args: Parameters<T>) => {
      set({ isLoading: true, error: undefined })
      const { data, error } = await (fn as SdkFn)(...args)
      set({ data, error, isLoading: false })
      return data as TData | undefined
    },

    reset: () => set({ data: undefined, error: undefined, isLoading: false }),
  }))
}

export const useGetStatus = createSdkStore(sdk.getStatus)
export const useDeleteV1HostLocalizedTextsById = createSdkStore(sdk.deleteV1HostLocalizedTextsById)
export const usePatchV1HostLocalizedTextsById = createSdkStore(sdk.patchV1HostLocalizedTextsById)
export const useGetV1HostPlaces = createSdkStore(sdk.getV1HostPlaces)
export const usePostV1HostPlaces = createSdkStore(sdk.postV1HostPlaces)
export const useDeleteV1HostPlacesById = createSdkStore(sdk.deleteV1HostPlacesById)
export const useGetV1HostPlacesById = createSdkStore(sdk.getV1HostPlacesById)
export const usePatchV1HostPlacesById = createSdkStore(sdk.patchV1HostPlacesById)
export const useGetV1HostPlacesByPlaceIdRooms = createSdkStore(sdk.getV1HostPlacesByPlaceIdRooms)
export const usePostV1HostPlacesByPlaceIdRooms = createSdkStore(sdk.postV1HostPlacesByPlaceIdRooms)
export const useDeleteV1HostPlacesByPlaceIdRoomsById = createSdkStore(sdk.deleteV1HostPlacesByPlaceIdRoomsById)
export const useGetV1HostPlacesByPlaceIdRoomsById = createSdkStore(sdk.getV1HostPlacesByPlaceIdRoomsById)
export const usePatchV1HostPlacesByPlaceIdRoomsById = createSdkStore(sdk.patchV1HostPlacesByPlaceIdRoomsById)
export const useGetV1Me = createSdkStore(sdk.getV1Me)
export const useGetV1VisitorPlaces = createSdkStore(sdk.getV1VisitorPlaces)
export const useGetV1VisitorPlacesById = createSdkStore(sdk.getV1VisitorPlacesById)
