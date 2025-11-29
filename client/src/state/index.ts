import { createSlice } from "@reduxjs/toolkit";

export type FiltersState = {
  location?: string;
  priceRange?: [number, number];
  beds?: number;
  baths?: number;
  propertyType?: string;
  squareFeet?: [number, number];
  amenities?: string[];
  availableFrom?: string;
  coordinates?: [number, number];
};

export const initialState = {};

export const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {},
});

export const {} = globalSlice.actions;

export default globalSlice.reducer;
