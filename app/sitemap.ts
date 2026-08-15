import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://ivanov.works/",
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
