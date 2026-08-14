import { MOCK_LATENCY_MS } from "../constants/apiEndpoints";

export function delay(ms = MOCK_LATENCY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function clone(value) {
  return structuredClone(value);
}

export async function mockRequest(fn, ms = MOCK_LATENCY_MS) {
  await delay(ms);
  return clone(await fn());
}

export class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
