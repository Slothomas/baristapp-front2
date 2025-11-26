// src/api/business.ts
import { http } from "./http";


export type Business = {
  id: number;
  owner_id: number;
  name: string;
};

export type BusinessLocation = {
  id: number;
  business_id: number;
  name: string;
  address: string;
  region?: string | null;
  comuna?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export async function getMyBusinesses(userId: number): Promise<Business[]> {
  const { data } = await http.get(`/business/my`, {
    params: { user_id: userId },
  });
  return data;
}

export async function getLocationsByBusiness(
  businessId: number
): Promise<BusinessLocation[]> {
  const { data } = await http.get(`/business/${businessId}/locations`);
  return data;
}
