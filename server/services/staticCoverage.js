const REGION_LIST = {
  AFRICA: 'EG;MA;TZ;UG;TN;ZA;ZM;MG;NG;KE;MU;RE',
  AMERICAS: 'AR;BR;CL;CO;CR;EC;SV;PE;UY;GF;MX',
  ASIA: 'AU;HK;ID;KR;MO;MY;PK;SG;LK;TW;TH;UZ;VN;NZ',
  BALKANS: 'AL;BA;BG;GR;HR;MK;ME;RO;RS;SI',
  CARIBBEAN: 'AI;AG;BS;BB;BM;BQ;KY;CW;DM;SV;GF;GD;GY;HT;JM;MQ;MS;AN;KN;LC;VC;TT;TC;VG;SR',
  CONGO: 'CD;CG',
  EU_PLUS: 'AT;DK;IE;IT;SE;FR;BG;CY;EE;FI;GR;HU;LV;LT;NL;NO;PL;RO;SK;ES;GB;TR;DE;MT;CH;BE;HR;CZ;LI;LU;PT;SI;IS;IC;VA;CYP',
  EUROPE_LITE: 'AT;DK;IE;IT;SE;FR;BG;CY;EE;FI;GR;HU;LV;LT;NL;NO;PL;RO;SK;ES;DE;MT;CH;BE;HR;CZ;LI;LU;PT;SI;IS;IC;VA;MD',
  GLOBAL: 'AT;DK;IE;IT;SE;IM;FR;BG;CY;EE;FI;GR;HU;LV;LT;NL;NO;PL;RO;SK;ES;GB;TR;DE;MT;CH;BE;HR;CZ;LI;LU;PT;SI;IS;JE;SG;MO;HK;IL;AX;ID;VN;AE;AU;TH;TW;LK;MY;PK;UZ;EG;NZ;AL;KR;CA;KZ;MD;MK;KW;MX;GG;JO;OM;GI;MA;BR;CL;RS;JP;ME;GU;US;TZ;CR;EC;NI;IN;AR;SV;PE;UY;CN;PA;RE;TN;BA;ZA;ZM;MG;NG;KE;AD;IQ;QA;SC;MU;CO;GT;CM;GY;SA;PY;BO',
  MIDDLE_EAST_AFRICA: 'EG;IL;JO;KW;MA;OM;TR;AE',
  MENA: 'AE;BH;EG;IL;MA;SA;TN;QA;KW',
  MIDDLE_EAST: 'AE;BH;IL;JO;KW;QA;SA;TR;OM',
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

  // Global variants
  if (/global/.test(n)) return REGION_CODES.GLOBAL;

  // Europe + USA
  if (/europe.*usa|usa.*europe|eu\s*\+\s*us/i.test(n)) {
    return union(REGION_CODES.EU_PLUS, ['US']);
  }

  // Europe + Business Hubs → приблизим как EU+
  if (/europe.*business|business.*hub/i.test(n)) return REGION_CODES.EU_PLUS;

  // South East Europe → возьмём Балканы как приближение
  if (/south.*east.*europe|balkans/i.test(n)) return REGION_CODES.BALKANS;

  if (/europe\s*lite/i.test(n)) return REGION_CODES.EUROPE_LITE;
  if (/eu\+|europe/i.test(n)) return REGION_CODES.EU_PLUS;
  if (/middle\s*east.*africa/i.test(n)) return REGION_CODES.MIDDLE_EAST_AFRICA;
  if (/middle\s*east/i.test(n)) return REGION_CODES.MIDDLE_EAST;
  if (/mena|north\s*africa/i.test(n)) return REGION_CODES.MENA;
  if (/africa/i.test(n)) return REGION_CODES.AFRICA;
  if (/americas|america/i.test(n)) return union(REGION_CODES.AMERICAS, REGION_CODES.NORTH_AMERICA);
  if (/asia/i.test(n)) return REGION_CODES.ASIA;
  if (/caribbean/i.test(n)) return REGION_CODES.CARIBBEAN;
  if (/congo|democratic\s*republic\s*of\s*the/i.test(n)) return REGION_CODES.CONGO;
  if (/north\s*america/i.test(n)) return REGION_CODES.NORTH_AMERICA;

  return [];
}

module.exports = { getStaticCoverageByName };
