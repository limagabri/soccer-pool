export type TeamCode = string

export interface Team {
  code: TeamCode
  flag: string
  names: { 'pt-BR': string; en: string; es: string }
}

export interface Group {
  id: string
  teams: TeamCode[]
}

export const TEAMS: Team[] = [
  // Group A
  { code: 'USA', flag: '🇺🇸', names: { 'pt-BR': 'Estados Unidos', en: 'United States', es: 'Estados Unidos' } },
  { code: 'MEX', flag: '🇲🇽', names: { 'pt-BR': 'México',         en: 'Mexico',        es: 'México' } },
  { code: 'CAN', flag: '🇨🇦', names: { 'pt-BR': 'Canadá',         en: 'Canada',        es: 'Canadá' } },
  { code: 'PAN', flag: '🇵🇦', names: { 'pt-BR': 'Panamá',         en: 'Panama',        es: 'Panamá' } },

  // Group B
  { code: 'ARG', flag: '🇦🇷', names: { 'pt-BR': 'Argentina',      en: 'Argentina',     es: 'Argentina' } },
  { code: 'MAR', flag: '🇲🇦', names: { 'pt-BR': 'Marrocos',       en: 'Morocco',       es: 'Marruecos' } },
  { code: 'UKR', flag: '🇺🇦', names: { 'pt-BR': 'Ucrânia',        en: 'Ukraine',       es: 'Ucrania' } },
  { code: 'IRQ', flag: '🇮🇶', names: { 'pt-BR': 'Iraque',         en: 'Iraq',          es: 'Irak' } },

  // Group C
  { code: 'BRA', flag: '🇧🇷', names: { 'pt-BR': 'Brasil',         en: 'Brazil',        es: 'Brasil' } },
  { code: 'NED', flag: '🇳🇱', names: { 'pt-BR': 'Holanda',        en: 'Netherlands',   es: 'Países Bajos' } },
  { code: 'RSA', flag: '🇿🇦', names: { 'pt-BR': 'África do Sul',  en: 'South Africa',  es: 'Sudáfrica' } },
  { code: 'TUN', flag: '🇹🇳', names: { 'pt-BR': 'Tunísia',        en: 'Tunisia',       es: 'Túnez' } },

  // Group D
  { code: 'FRA', flag: '🇫🇷', names: { 'pt-BR': 'França',         en: 'France',        es: 'Francia' } },
  { code: 'SUI', flag: '🇨🇭', names: { 'pt-BR': 'Suíça',          en: 'Switzerland',   es: 'Suiza' } },
  { code: 'SEN', flag: '🇸🇳', names: { 'pt-BR': 'Senegal',        en: 'Senegal',       es: 'Senegal' } },
  { code: 'MEA', flag: '🌍',  names: { 'pt-BR': 'Equipe Árabe',   en: 'Arab Team',     es: 'Equipo Árabe' } },

  // Group E
  { code: 'GER', flag: '🇩🇪', names: { 'pt-BR': 'Alemanha',       en: 'Germany',       es: 'Alemania' } },
  { code: 'POR', flag: '🇵🇹', names: { 'pt-BR': 'Portugal',       en: 'Portugal',      es: 'Portugal' } },
  { code: 'COD', flag: '🇨🇩', names: { 'pt-BR': 'Congo (RD)',     en: 'DR Congo',      es: 'Congo (RD)' } },
  { code: 'TBD', flag: '🌍',  names: { 'pt-BR': 'A definir',      en: 'TBD',           es: 'Por definir' } },

  // Group F
  { code: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', names: { 'pt-BR': 'Inglaterra',     en: 'England',       es: 'Inglaterra' } },
  { code: 'COL', flag: '🇨🇴', names: { 'pt-BR': 'Colômbia',       en: 'Colombia',      es: 'Colombia' } },
  { code: 'ECU', flag: '🇪🇨', names: { 'pt-BR': 'Equador',        en: 'Ecuador',       es: 'Ecuador' } },
  { code: 'NGA', flag: '🇳🇬', names: { 'pt-BR': 'Nigéria',        en: 'Nigeria',       es: 'Nigeria' } },

  // Group G
  { code: 'ESP', flag: '🇪🇸', names: { 'pt-BR': 'Espanha',        en: 'Spain',         es: 'España' } },
  { code: 'JPN', flag: '🇯🇵', names: { 'pt-BR': 'Japão',          en: 'Japan',         es: 'Japón' } },
  { code: 'CIV', flag: '🇨🇮', names: { 'pt-BR': 'Costa do Marfim', en: "Côte d'Ivoire", es: 'Costa de Marfil' } },
  { code: 'PER', flag: '🇵🇪', names: { 'pt-BR': 'Peru',           en: 'Peru',          es: 'Perú' } },

  // Group H
  { code: 'POR2', flag: '🇵🇹', names: { 'pt-BR': 'Portugal',      en: 'Portugal',      es: 'Portugal' } },
  { code: 'URU', flag: '🇺🇾', names: { 'pt-BR': 'Uruguai',        en: 'Uruguay',       es: 'Uruguay' } },
  { code: 'MEX2', flag: '🇲🇽', names: { 'pt-BR': 'México',        en: 'Mexico',        es: 'México' } },
  { code: 'TBD2', flag: '🌍', names: { 'pt-BR': 'A definir',      en: 'TBD',           es: 'Por definir' } },

  // Group I
  { code: 'ITA', flag: '🇮🇹', names: { 'pt-BR': 'Itália',         en: 'Italy',         es: 'Italia' } },
  { code: 'KOR', flag: '🇰🇷', names: { 'pt-BR': 'Coreia do Sul',  en: 'South Korea',   es: 'Corea del Sur' } },
  { code: 'ALG', flag: '🇩🇿', names: { 'pt-BR': 'Argélia',        en: 'Algeria',       es: 'Argelia' } },
  { code: 'TBD3', flag: '🌍', names: { 'pt-BR': 'A definir',      en: 'TBD',           es: 'Por definir' } },

  // Group J
  { code: 'NED2', flag: '🇳🇱', names: { 'pt-BR': 'Holanda',       en: 'Netherlands',   es: 'Países Bajos' } },
  { code: 'CRO', flag: '🇭🇷', names: { 'pt-BR': 'Croácia',        en: 'Croatia',       es: 'Croacia' } },
  { code: 'IRN', flag: '🇮🇷', names: { 'pt-BR': 'Irã',            en: 'Iran',          es: 'Irán' } },
  { code: 'TBD4', flag: '🌍', names: { 'pt-BR': 'A definir',      en: 'TBD',           es: 'Por definir' } },

  // Group K
  { code: 'BEL', flag: '🇧🇪', names: { 'pt-BR': 'Bélgica',        en: 'Belgium',       es: 'Bélgica' } },
  { code: 'AUS', flag: '🇦🇺', names: { 'pt-BR': 'Austrália',      en: 'Australia',     es: 'Australia' } },
  { code: 'ROU', flag: '🇷🇴', names: { 'pt-BR': 'Romênia',        en: 'Romania',       es: 'Rumanía' } },
  { code: 'TBD5', flag: '🌍', names: { 'pt-BR': 'A definir',      en: 'TBD',           es: 'Por definir' } },

  // Group L
  { code: 'MEX3', flag: '🇲🇽', names: { 'pt-BR': 'México',        en: 'Mexico',        es: 'México' } },
  { code: 'SAU', flag: '🇸🇦', names: { 'pt-BR': 'Arábia Saudita', en: 'Saudi Arabia',  es: 'Arabia Saudita' } },
  { code: 'TBD6', flag: '🌍', names: { 'pt-BR': 'A definir',      en: 'TBD',           es: 'Por definir' } },
  { code: 'TBD7', flag: '🌍', names: { 'pt-BR': 'A definir',      en: 'TBD',           es: 'Por definir' } },
]

export const GROUPS: Group[] = [
  { id: 'A', teams: ['USA', 'MEX',  'CAN',  'PAN'] },
  { id: 'B', teams: ['ARG', 'MAR',  'UKR',  'IRQ'] },
  { id: 'C', teams: ['BRA', 'NED',  'RSA',  'TUN'] },
  { id: 'D', teams: ['FRA', 'SUI',  'SEN',  'MEA'] },
  { id: 'E', teams: ['GER', 'POR',  'COD',  'TBD'] },
  { id: 'F', teams: ['ENG', 'COL',  'ECU',  'NGA'] },
  { id: 'G', teams: ['ESP', 'JPN',  'CIV',  'PER'] },
  { id: 'H', teams: ['POR2','URU',  'MEX2', 'TBD2'] },
  { id: 'I', teams: ['ITA', 'KOR',  'ALG',  'TBD3'] },
  { id: 'J', teams: ['NED2','CRO',  'IRN',  'TBD4'] },
  { id: 'K', teams: ['BEL', 'AUS',  'ROU',  'TBD5'] },
  { id: 'L', teams: ['MEX3','SAU',  'TBD6', 'TBD7'] },
]

export const KEY_DATES = {
  groupStageStart: '2026-06-11',
  groupStageEnd:   '2026-07-02',
  round32Start:    '2026-07-04',
  quarterFinals:   '2026-07-17',
  semiFinals:      '2026-07-21',
  thirdPlace:      '2026-07-25',
  final:           '2026-07-26',
} as const

export const SCORING = {
  exactScore:     10,
  correctResult:   7,
  correctWinner:   5,
  knockoutExact:  15,
  knockoutResult: 10,
  advancerBonus:   5,  // mata-mata: acertar quem avança nos pênaltis
} as const

export function getTeam(code: TeamCode): Team | undefined {
  return TEAMS.find(t => t.code === code)
}

export function getTeamName(code: TeamCode, lang: 'pt-BR' | 'en' | 'es' = 'pt-BR'): string {
  return getTeam(code)?.names[lang] ?? code
}
