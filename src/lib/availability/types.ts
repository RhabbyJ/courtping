import type { AvailabilitySlot } from "@/types/domain";

export type AvailabilityQuery = {
  from?: Date;
  days?: number;
};

export type AvailabilityAdapter = {
  name: "mock";
  listAvailability(query?: AvailabilityQuery): Promise<AvailabilitySlot[]>;
};

