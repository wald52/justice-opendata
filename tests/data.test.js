import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const dataDir = path.resolve("data");

describe("data JSON schemas", () => {
  const files = [
    "activite.json",
    "prisons.json",
    "budget.json",
    "aide_juridictionnelle.json",
    "delais.json",
    "civil.json",
    "condamnations.json",
    "vif.json",
  ];
  for (const f of files) {
    it(`${f} exists and is valid JSON with metrics`, () => {
      const p = path.join(dataDir, f);
      expect(fs.existsSync(p)).toBe(true);
      const j = JSON.parse(fs.readFileSync(p, "utf-8"));
      expect(j).toHaveProperty("metrics");
    });
  }

  it("prisons.json has correct keys (fixed mismatches)", () => {
    const j = JSON.parse(fs.readFileSync(path.join(dataDir, "prisons.json"), "utf-8"));
    expect(j.metrics).toHaveProperty("population_detenue");
    expect(j.metrics).toHaveProperty("densite_carcerale");
  });
  it("budget.json has budget_total", () => {
    const j = JSON.parse(fs.readFileSync(path.join(dataDir, "budget.json"), "utf-8"));
    expect(j.metrics).toHaveProperty("budget_total");
  });
});
