import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createServer } from "../index";

const app = createServer();

describe("Marketplace API E2E", () => {
  it("should ping the healthcheck endpoint", async () => {
    const res = await request(app).get("/api/ping");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
  });

  describe("Auth API", () => {
    it("should fail to login with missing credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({});
      expect(res.status).toBe(400);
    });
  });

  describe("Listings API", () => {
    it("should fetch listings with pagination", async () => {
      const res = await request(app).get("/api/listings?page=1&limit=5");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty("pagination");
    });
  });
});
