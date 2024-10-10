import { describe, test, expect } from "@jest/globals";
import { toValue } from "./to-value";

describe("Convert WS CSS Values to native CSS strings", () => {
  test("keyword", () => {
    const value = toValue({ type: "keyword", value: "red" });
    expect(value).toBe("red");
  });

  test("unit", () => {
    const value = toValue({ type: "unit", value: 10, unit: "px" });
    expect(value).toBe("10px");
  });

  test("invalid", () => {
    const value = toValue({ type: "invalid", value: "bad" });
    expect(value).toBe("bad");
  });

  test("unset", () => {
    const value = toValue({ type: "unset", value: "" });
    expect(value).toBe("");
  });

  test("var", () => {
    const value = toValue({ type: "var", value: "namespace" });
    expect(value).toBe("var(--namespace)");
  });

  test("var with fallbacks", () => {
    const value = toValue({
      type: "var",
      value: "namespace",
      fallback: {
        type: "unparsed",
        value: "normal, 10px",
      },
    });
    expect(value).toBe("var(--namespace, normal, 10px)");
  });

  test("fontFamily is known stack name", () => {
    expect(
      toValue({
        type: "fontFamily",
        value: ["Humanist"],
      })
    ).toBe(
      'Seravek, "Gill Sans Nova", Ubuntu, Calibri, "DejaVu Sans", source-sans-pro, sans-serif'
    );
  });

  test("fontFamily is a custom stack", () => {
    expect(
      toValue({
        type: "fontFamily",
        value: ["DejaVu Sans Mono", "monospace"],
      })
    ).toBe('"DejaVu Sans Mono", monospace');
  });

  test("fontFamily is unknown family name", () => {
    expect(
      toValue({
        type: "fontFamily",
        value: ["something-random"],
      })
    ).toBe("something-random, sans-serif");
  });

  test("fontFamily is empty", () => {
    expect(
      toValue({
        type: "fontFamily",
        value: [],
      })
    ).toBe("sans-serif");
  });

  test("fontFamily has duplicates", () => {
    expect(
      toValue({
        type: "fontFamily",
        value: ["a", "a", "b"],
      })
    ).toBe("a, b");
  });

  test("Transform font family value to override default fallback", () => {
    const value = toValue(
      {
        type: "fontFamily",
        value: ["Courier New"],
      },
      (styleValue) => {
        if (styleValue.type === "fontFamily") {
          return {
            type: "fontFamily",
            value: ["A B"],
          };
        }
      }
    );
    expect(value).toBe('"A B"');
  });

  test("array", () => {
    const assets = new Map<string, { path: string }>([
      ["1234567890", { path: "foo.png" }],
    ]);

    const value = toValue(
      {
        type: "layers",
        value: [
          {
            type: "keyword",
            value: "auto",
          },
          { type: "unit", value: 10, unit: "px" },
          { type: "unparsed", value: "calc(10px)" },
          {
            type: "image",
            value: {
              type: "asset",
              value: "1234567890",
            },
          },
        ],
      },
      (styleValue) => {
        if (styleValue.type === "image" && styleValue.value.type === "asset") {
          const asset = assets.get(styleValue.value.value);
          if (asset === undefined) {
            return {
              type: "keyword",
              value: "none",
            };
          }
          return {
            type: "image",
            value: {
              type: "url",
              url: asset.path,
            },
          };
        }
      }
    );

    expect(value).toBe(`auto, 10px, calc(10px), url("foo.png")`);
  });

  test("tuple", () => {
    const value = toValue({
      type: "tuple",
      value: [
        { type: "unit", value: 10, unit: "px" },
        { type: "unit", value: 20, unit: "px" },
        { type: "unit", value: 30, unit: "px" },
        { type: "unit", value: 40, unit: "px" },
      ],
    });
    expect(value).toBe("10px 20px 30px 40px");
  });

  test("function", () => {
    const translate3D = toValue({
      type: "function",
      name: "translate3d",
      args: {
        type: "keyword",
        value: "42px, -62px, -135px",
      },
    });

    const dropShadowValue = toValue({
      type: "function",
      name: "drop-shadow",
      args: {
        type: "tuple",
        value: [
          { type: "unit", value: 10, unit: "px" },
          { type: "unit", value: 10, unit: "px" },
          { type: "unit", value: 10, unit: "px" },
          { type: "keyword", value: "red" },
        ],
      },
    });

    expect(translate3D).toBe("translate3d(42px, -62px, -135px)");
    expect(dropShadowValue).toBe("drop-shadow(10px 10px 10px red)");
  });

  test("sanitize url", () => {
    const assets = new Map<string, { path: string }>([
      ["1234567890", { path: `fo"o\\o.png` }],
    ]);

    const value = toValue(
      {
        type: "image",
        value: {
          type: "asset",
          value: "1234567890",
        },
      },
      (styleValue) => {
        if (styleValue.type === "image" && styleValue.value.type === "asset") {
          const asset = assets.get(styleValue.value.value);
          if (asset === undefined) {
            return {
              type: "keyword",
              value: "none",
            };
          }
          return {
            type: "image",
            value: {
              type: "url",
              url: asset.path,
            },
          };
        }
      }
    );

    expect(value).toMatchInlineSnapshot(`"url("fo\\"o\\\\o.png")"`);
  });

  test("guaranteed-invalid", () => {
    const value = toValue({
      type: "guaranteedInvalid",
    });
    expect(value).toBe("");
  });
});
