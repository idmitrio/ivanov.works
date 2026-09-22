import type { MetadataRoute } from "next";
import { solutionDirections } from "./solutions/data";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://ivanov.works/",
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://ivanov.works/solutions",
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...solutionDirections.map(({ slug }) => ({
      url: `https://ivanov.works/solutions/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
