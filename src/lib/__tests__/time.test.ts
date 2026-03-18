import { isOpenNow, getTodayHours, getCurrentBusyness } from "../time";

const sampleHours: Record<string, string> = {
  monday: "10:00 AM - 9:00 PM",
  tuesday: "10:00 AM - 9:00 PM",
  wednesday: "10:00 AM - 9:00 PM",
  thursday: "10:00 AM - 9:00 PM",
  friday: "10:00 AM - 6:00 PM",
  saturday: "10:00 AM - 6:00 PM",
  sunday: "12:00 PM - 6:00 PM",
};

const samplePopularTimes: Record<string, number[]> = {
  monday: [0,0,0,0,0,0,0,0,0,10,25,45,60,75,85,90,80,70,65,50,30,10,0,0],
};

describe("getTodayHours", () => {
  it("returns hours string for a given day", () => {
    const result = getTodayHours(sampleHours, new Date("2026-03-16T12:00:00")); // Monday
    expect(result).toBe("10:00 AM - 9:00 PM");
  });

  it("returns null for missing day", () => {
    const result = getTodayHours({}, new Date("2026-03-16T12:00:00"));
    expect(result).toBeNull();
  });
});

describe("isOpenNow", () => {
  it("returns true when current time is within hours", () => {
    const result = isOpenNow(sampleHours, new Date("2026-03-16T14:00:00")); // Monday 2pm
    expect(result).toBe(true);
  });

  it("returns false when current time is outside hours", () => {
    const result = isOpenNow(sampleHours, new Date("2026-03-16T08:00:00")); // Monday 8am
    expect(result).toBe(false);
  });

  it("returns false when current time is after closing", () => {
    const result = isOpenNow(sampleHours, new Date("2026-03-16T21:30:00")); // Monday 9:30pm
    expect(result).toBe(false);
  });

  it("returns false when no hours for day", () => {
    const result = isOpenNow({}, new Date("2026-03-16T14:00:00"));
    expect(result).toBe(false);
  });
});

describe("getCurrentBusyness", () => {
  it("returns busyness value for current hour", () => {
    const result = getCurrentBusyness(samplePopularTimes, new Date("2026-03-16T15:30:00")); // Monday 3:30pm = index 15
    expect(result).toBe(90);
  });

  it("returns null when no data for day", () => {
    const result = getCurrentBusyness({}, new Date("2026-03-16T15:00:00"));
    expect(result).toBeNull();
  });

  it("returns null when popularTimes is empty", () => {
    const result = getCurrentBusyness(samplePopularTimes, new Date("2026-03-17T15:00:00")); // Tuesday not in data
    expect(result).toBeNull();
  });
});
