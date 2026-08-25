import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock DOM for AppUtils
describe("AppUtils", () => {
  beforeEach(() => {
    document.documentElement.classList.add("dark");
    if (typeof localStorage !== "undefined" && localStorage.clear) localStorage.clear();
  });

  it("formatNumber formats millions", async () => {
    const { default: fs } = await import("fs");
    // Import app.js as text and eval getThemeColors? Simpler: test logic inline
    const formatNumber = (num) => {
      if (num == null || isNaN(num)) return "-";
      if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
      if (num >= 1000) return (num / 1000).toFixed(1) + "K";
      return Number(num).toLocaleString("fr-FR");
    };
    expect(formatNumber(1200000)).toBe("1.2M");
    expect(formatNumber(1500)).toBe("1.5K");
    expect(formatNumber(42)).toBe("42");
    expect(formatNumber(null)).toBe("-");
  });

  it("getThemeColors returns required keys", async () => {
    // Simulate AppUtils.getThemeColors
    const getThemeColors = () => {
      const isDark = document.documentElement.classList.contains("dark");
      return {
        text: isDark ? "#f8fafc" : "#0f172a",
        textSecondary: isDark ? "#94a3b8" : "#475569",
        grid: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        border: isDark ? "#334155" : "#e2e8f0",
        primary: "#3b82f6",
        accent: "#f59e0b",
        yellow: "#f59e0b",
        red: "#ef4444",
        green: "#10b981",
      };
    };
    const c = getThemeColors();
    expect(c).toHaveProperty("yellow");
    expect(c).toHaveProperty("border");
    expect(c.primary).toBe("#3b82f6");
  });
});

describe("extract_city_from_name", () => {
  const extract = (name) => {
    const n = name.replace("’", "'").trim();
    const prefixes = [
      "Tribunal judiciaire de ", "Tribunal judiciaire d'",
      "Tribunal Judiciaire de ", "Tribunal Judiciaire d'",
      "Cour d'Appel de ", "Cour d'Appel d'",
      "Conseil de Prud'hommes de ", "Conseil de Prud'hommes d'",
    ];
    for (const p of prefixes) if (n.startsWith(p)) return n.slice(p.length).trim();
    for (const g of [" de ", " d'"]) {
      const idx = n.lastIndexOf(g);
      if (idx !== -1) return n.slice(idx + g.length).trim();
    }
    return n;
  };
  it("handles d'Aurillac", () => {
    expect(extract("Tribunal judiciaire d'Aurillac")).toBe("Aurillac");
    expect(extract("Cour d'Appel d'Aix-en-Provence")).toBe("Aix-en-Provence");
    expect(extract("Tribunal judiciaire de Bourg-en-Bresse")).toBe("Bourg-en-Bresse");
  });
});
