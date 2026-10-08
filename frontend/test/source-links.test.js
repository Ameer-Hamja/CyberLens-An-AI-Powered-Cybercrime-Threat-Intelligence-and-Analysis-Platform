import { test } from "node:test";
import assert from "node:assert/strict";
import { safeSource } from "../src/utils/intelligence.js";

test("placeholder incident sources are not public links", () => {
  for (const url of [
    "https://test.crimelens.in/manual-123",
    "https://example.invalid/fallback/MANUAL",
    "https://example.com/demo",
    "https://source.test/demo",
    "https://TEST.CRIMELENS.IN./manual-123",
    "http://localhost/demo",
    "javascript:alert(1)",
    "not a URL",
    null,
  ]) assert.equal(safeSource(url), null, String(url));
});

test("genuine source URLs remain available", () => {
  for (const url of [
    "https://www.cert-in.org.in/",
    "https://cybercrime.gov.in/",
    "https://example.com.real-source.org/report",
  ]) assert.equal(safeSource(url), url);
});
