export const AFRICAN_CAMPAIGN_COUNTRY_IDS = [
  'DZ',
  'CD',
  'EG',
  'ET',
  'GH',
  'KE',
  'MA',
  'NG',
  'ZA',
  'TZ'
];

const AFRICAN_CAMPAIGN_POPULATION_MB = {
  DZ: 45,
  CD: 99,
  EG: 109,
  ET: 123,
  GH: 33,
  KE: 55,
  MA: 37,
  NG: 218,
  ZA: 60,
  TZ: 65
};

export function getAfricanCampaignCountries(countries) {
  const countriesById = new Map(
    countries
      .filter(country => country.region === 'Africa')
      .map(country => [country.id, country])
  );

  return AFRICAN_CAMPAIGN_COUNTRY_IDS
    .map(countryId => countriesById.get(countryId))
    .filter(Boolean)
    .map(country => ({
      ...country,
      populationMb: AFRICAN_CAMPAIGN_POPULATION_MB[country.id]
    }));
}
