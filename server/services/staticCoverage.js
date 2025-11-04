const REGION_LIST = {
  // Africa - 12 стран
  AFRICA: 'EG;MA;TZ;UG;TN;ZA;ZM;MG;NG;KE;MU;RE',
  
  // Americas + US + CA - 13 стран
  AMERICAS: 'AR;BR;CL;CO;CR;EC;SV;PE;UY;MX;US;CA;GF',
  
  // Asia - 14 стран
  ASIA: 'AU;HK;ID;KR;MO;MY;PK;SG;LK;TW;TH;UZ;VN;NZ',
  
  // South East Europe (Balkans) - 10 стран
  BALKANS: 'AL;BA;BG;HR;GR;MD;MK;ME;RO;SI',
  
  // Middle East - 8 стран (БЕЗ RU и UA)
  MIDDLE_EAST: 'EG;IL;JO;KW;MA;OM;TR;AE',
  
  // Europe + USA - 39 стран
  EU_PLUS_USA: 'AT;DK;IE;IT;SE;FR;BG;CY;EE;FI;GR;HU;LV;LT;NL;NO;PL;PT;RO;SK;SI;ES;CZ;HR;DE;BE;LU;CH;MT;GB;US;LI;IS;IC;VA;CYP;IM;JE;AX',
  
  // Europe + USA + Business Hubs - 45 стран
  EU_BUSINESS_HUBS: 'AT;DK;IE;IT;SE;FR;BG;CY;EE;FI;GR;HU;LV;LT;NL;NO;PL;PT;RO;SK;SI;ES;CZ;HR;DE;BE;LU;CH;MT;GB;US;LI;IS;IC;VA;CYP;IM;JE;AX;SG;HK;AE;JP;KR;AU;CA',
  
  // Global - Light (61 страна, БЕЗ RU и UA)
  GLOBAL_LIGHT: 'AU;AT;AL;BG;GB;HU;DE;GR;DK;EG;IL;ID;IE;IS;ES;IT;KZ;CA;CY;LV;LT;LU;MY;MT;NL;NZ;NO;AE;PK;PL;PT;RO;SG;SK;SI;TH;TR;UZ;FI;FR;HR;CZ;CH;SE;LK;US;VN;KR;HK;TW;LI;MO;JE;AX;CYP;IO;UM',
  
  // Global - Standard (74 страны, БЕЗ RU и UA)
  GLOBAL_STANDARD: 'AU;AT;AL;BG;BR;GB;HU;DE;GR;DK;EG;IL;ID;IE;IS;ES;IT;KZ;CA;CY;LV;LT;LU;MY;MT;MX;NL;NZ;NO;AE;OM;PK;PT;RO;RS;SG;SK;SI;TH;TR;UZ;FI;FR;HR;ME;CZ;CH;SE;LK;JP;MA;JO;GI;GU;TZ;UG;QA;TW;HK;LI;MO;JE;IO;AX;PL',
  
  // Global - Max (103 страны, БЕЗ RU и UA)
  GLOBAL_MAX: 'AU;AT;AL;AR;BG;BA;BR;GB;HU;DE;GR;DK;EG;IL;IN;ID;IE;IS;ES;IT;KZ;CA;QA;CY;CN;KW;LV;LT;LU;MY;MT;MX;NL;NZ;NO;AE;OM;PK;PT;RO;SA;RS;SG;SK;SI;TH;TR;UZ;FI;FR;HR;ME;CZ;CH;SE;LK;ZA;JP;AD;BH;BO;CO;CR;EC;SV;GI;GU;GT;GY;IQ;KE;MG;MU;MA;NI;PA;PY;PE;RE;SC;TZ;TN;UG;UY;VN;TW;KR;HK;MO;LI;JE;IO;AX;PL',
  
  // Старые алиасы для совместимости
  CONGO: 'CD;CG',
  EU_PLUS: 'AT;DK;IE;IT;SE;FR;BG;CY;EE;FI;GR;HU;LV;LT;NL;NO;PL;RO;SK;ES;GB;TR;DE;MT;CH;BE;HR;CZ;LI;LU;PT;SI;IS;IC;VA;CYP',
  EUROPE_LITE: 'AT;DK;IE;IT;SE;FR;BG;CY;EE;FI;GR;HU;LV;LT;NL;NO;PL;RO;SK;ES;DE;MT;CH;BE;HR;CZ;LI;LU;PT;SI;IS;IC;VA;MD',
  GLOBAL: 'AT;DK;IE;IT;SE;IM;FR;BG;CY;EE;FI;GR;HU;LV;LT;NL;NO;PL;RO;SK;ES;GB;TR;DE;MT;CH;BE;HR;CZ;LI;LU;PT;SI;IS;JE;SG;MO;HK;IL;AX;ID;VN;AE;AU;TH;TW;LK;MY;PK;UZ;EG;NZ;AL;KR;CA;KZ;MD;MK;KW;MX;GG;JO;OM;GI;MA;BR;CL;RS;JP;ME;GU;US;TZ;CR;EC;NI;IN;AR;SV;PE;UY;CN;PA;RE;TN;BA;ZA;ZM;MG;NG;KE;AD;IQ;QA;SC;MU;CO;GT;CM;GY;SA;PY;BO',
  MIDDLE_EAST_AFRICA: 'EG;IL;JO;KW;MA;OM;TR;AE',
  MENA: 'AE;BH;EG;IL;MA;SA;TN;QA;KW',
  NORTH_AMERICA: 'CA;MX;US',
};

function splitCodes(str) {
  return str.split(';').map(s => s.trim()).filter(Boolean);
}

const REGION_CODES = Object.fromEntries(
  Object.entries(REGION_LIST).map(([k, v]) => [k, splitCodes(v)])
);

function union(...arrays) {
  const set = new Set();
  for (const arr of arrays) for (const c of arr || []) set.add(c);
  return Array.from(set);
}

// Try to map human region name to a static list of ISO codes
function getStaticCoverageByName(name) {
  if (!name) return [];
  const n = String(name).toLowerCase();

  // Global variants (по приоритету)
  if (/global.*max/i.test(n)) return REGION_CODES.GLOBAL_MAX;
  if (/global.*standard/i.test(n)) return REGION_CODES.GLOBAL_STANDARD;
  if (/global.*light/i.test(n)) return REGION_CODES.GLOBAL_LIGHT;
  if (/global/i.test(n)) return REGION_CODES.GLOBAL_STANDARD; // по умолчанию Standard

  // Europe + USA + Business Hubs
  if (/europe.*business|business.*hub/i.test(n)) return REGION_CODES.EU_BUSINESS_HUBS;

  // Europe + USA
  if (/europe.*usa|usa.*europe|eu\s*\+\s*us/i.test(n)) {
    return REGION_CODES.EU_PLUS_USA;
  }

  // South East Europe → Балканы
  if (/south.*east.*europe|balkans/i.test(n)) return REGION_CODES.BALKANS;

  // Middle East
  if (/middle\s*east.*africa/i.test(n)) return REGION_CODES.MIDDLE_EAST_AFRICA;
  if (/middle\s*east/i.test(n)) return REGION_CODES.MIDDLE_EAST;
  
  // MENA
  if (/mena|north\s*africa/i.test(n)) return REGION_CODES.MENA;
  
  // Africa
  if (/africa/i.test(n)) return REGION_CODES.AFRICA;
  
  // Americas
  if (/americas|america/i.test(n)) return REGION_CODES.AMERICAS;
  
  // Asia
  if (/asia/i.test(n)) return REGION_CODES.ASIA;
  
  // Europe
  if (/europe\s*lite/i.test(n)) return REGION_CODES.EUROPE_LITE;
  if (/eu\+|europe/i.test(n)) return REGION_CODES.EU_PLUS;
  
  // Other
  if (/caribbean/i.test(n)) return REGION_CODES.CARIBBEAN;
  if (/congo|democratic\s*republic\s*of\s*the/i.test(n)) return REGION_CODES.CONGO;
  if (/north\s*america/i.test(n)) return REGION_CODES.NORTH_AMERICA;

  return [];
}

module.exports = { getStaticCoverageByName };
