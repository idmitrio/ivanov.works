const shortWords = /(^|[\s(«])((?:а|без|в|во|для|до|за|и|из|к|ко|на|не|но|о|об|от|по|с|со|у)) /giu;

export function withNbsp(text: string) {
  return text.replace(shortWords, "$1$2\u00a0");
}
