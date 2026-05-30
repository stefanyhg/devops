import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import { app } from "../src/app.js";

test("GET /health debe responder status ok", async () => {

  const response = await request(app).get("/health");

  assert.equal(response.statusCode, 200);

  assert.equal(response.body.status, "ok");

});