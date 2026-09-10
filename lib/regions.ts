/** Przybliżone środki pasm/regionów (lat, lng), do wyboru właściwego wyniku geokodowania przy niejednoznacznych nazwach (np. Wisła miasto vs Wisła gdzie indziej). */
export const REGION_CENTER: Record<string, [number, number]> = {
  "Tatry": [49.25, 19.95], "Podhale": [49.4, 19.95], "Pieniny": [49.42, 20.4], "Gorce": [49.55, 20.15], "Beskid Niski": [49.5, 21.4], "Beskid Sądecki": [49.45, 20.75],
  "Beskid Wyspowy": [49.7, 20.2], "Beskid Żywiecki": [49.55, 19.2], "Beskid Śląski": [49.65, 18.9], "Beskid Mały": [49.8, 19.25], "Beskid Makowski": [49.75, 19.75],
  "Bieszczady": [49.15, 22.5], "Karkonosze": [50.78, 15.65], "Góry Izerskie": [50.85, 15.35], "Góry Stołowe": [50.47, 16.35], "Góry Sowie": [50.65, 16.5],
  "Góry Bystrzyckie": [50.3, 16.55], "Góry Orlickie": [50.35, 16.4], "Góry Bardzkie": [50.5, 16.7], "Góry Złote": [50.35, 16.9], "Góry Opawskie": [50.25, 17.5],
  "Góry Kaczawskie": [50.95, 15.95], "Rudawy Janowickie": [50.85, 15.9], "Masyw Śnieżnika": [50.2, 16.85], "Góry Wałbrzyskie": [50.75, 16.25], "Kotlina Kłodzka": [50.45, 16.65],
  "Jura": [50.5, 19.6], "Jura Krakowsko-Częstochowska": [50.5, 19.6], "Góry Świętokrzyskie": [50.9, 20.9], "Roztocze": [50.55, 23.2], "Pogórze": [49.8, 21.3],
  "Kaszuby": [54.3, 18.0], "Mazury": [53.9, 21.4], "Sudety": [50.6, 16.3], "Beskidy": [49.6, 19.6], "Lasek Wolski": [50.06, 19.85], "Warmia": [53.9, 20.5],
};
