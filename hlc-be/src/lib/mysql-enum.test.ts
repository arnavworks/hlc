import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseMysqlEnumValues } from "./mysql-enum.js";

describe("MySQL ENUM introspection", () => {
  it("reads the values MySQL returns in COLUMN_TYPE", () => {
    assert.deepEqual(parseMysqlEnumValues("enum('web','phone','in person')"), ["web", "phone", "in person"]);
  });

  it("handles escaped and doubled quotes", () => {
    assert.deepEqual(parseMysqlEnumValues(String.raw`enum('customer\'s','staff''s')`), ["customer's", "staff's"]);
  });

  it("rejects non-enum and malformed definitions", () => {
    assert.equal(parseMysqlEnumValues("varchar(255)"), null);
    assert.equal(parseMysqlEnumValues("enum('web',broken)"), null);
  });
});
