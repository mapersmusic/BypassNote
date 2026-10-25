import { normalizeSourceData, resolveSourceUrl } from "./schema";

describe("normalizeSourceData", () => {
  it.each([2, 3])("extrait l'identifiant vidéo d'une URL complète pour le type %i", (type) => {
    expect(
      normalizeSourceData(type, "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=playlist"),
    ).toBe("dQw4w9WgXcQ");
  });

  it("extrait les identifiants des liens courts, Music, Shorts et embed", () => {
    expect(normalizeSourceData(2, "https://youtu.be/dQw4w9WgXcQ?t=30")).toBe("dQw4w9WgXcQ");
    expect(normalizeSourceData(3, "https://music.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
    expect(normalizeSourceData(2, "https://youtube.com/shorts/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
    expect(normalizeSourceData(2, "https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("conserve un identifiant brut et ne modifie pas les URLs du type URL", () => {
    expect(normalizeSourceData(2, "dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(normalizeSourceData(1, " https://example.com/video ")).toBe(
      " https://example.com/video ",
    );
  });
});

describe("resolveSourceUrl", () => {
  it("redirige les anciens enregistrements contenant une URL YouTube complète", () => {
    expect(
      resolveSourceUrl(
        { type: 2, data: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
        42,
      ),
    ).toBe("https://youtu.be/dQw4w9WgXcQ?t=42");

    expect(
      resolveSourceUrl(
        { type: 3, data: "https://youtu.be/dQw4w9WgXcQ" },
        42,
      ),
    ).toBe("https://music.youtube.com/watch?v=dQw4w9WgXcQ&t=42");
  });

  it("construit le lien YouTube depuis un identifiant seul", () => {
    expect(resolveSourceUrl({ type: 2, data: "dQw4w9WgXcQ" })).toBe(
      "https://youtu.be/dQw4w9WgXcQ",
    );
    expect(resolveSourceUrl({ type: 3, data: "dQw4w9WgXcQ" })).toBe(
      "https://music.youtube.com/watch?v=dQw4w9WgXcQ",
    );
  });
});
