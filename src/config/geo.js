/**
 * src/config/geo.js —— 国家/省份编码中文名映射 + 地图名称对齐
 * （与 edge/maps.js 语义一致，前端本地展示用）
 */

export const countryName = {
  CN: '中国大陆', US: '美国', JP: '日本', KR: '韩国', HK: '中国香港', SG: '新加坡', TW: '中国台湾',
  DE: '德国', GB: '英国', IN: '印度', FR: '法国', CA: '加拿大', AU: '澳大利亚', RU: '俄罗斯',
  BR: '巴西', NL: '荷兰', ID: '印度尼西亚', IT: '意大利', ES: '西班牙', AE: '阿联酋', MY: '马来西亚',
  TH: '泰国', PH: '菲律宾', VN: '越南', SA: '沙特阿拉伯', MX: '墨西哥', PL: '波兰', CH: '瑞士',
  SE: '瑞典', TR: '土耳其', AR: '阿根廷', CL: '智利', CZ: '捷克', IE: '爱尔兰', NO: '挪威',
  DK: '丹麦', FI: '芬兰', ZA: '南非', EG: '埃及', NG: '尼日利亚', PK: '巴基斯坦', BD: '孟加拉',
  IL: '以色列', KP: '朝鲜', MO: '中国澳门', RO: '罗马尼亚', BE: '比利时', AT: '奥地利', PT: '葡萄牙',
  GR: '希腊', HU: '匈牙利', UA: '乌克兰', KZ: '哈萨克斯坦', NZ: '新西兰', PE: '秘鲁', CO: '哥伦比亚',
  VE: '委内瑞拉', KE: '肯尼亚', MM: '缅甸', LK: '斯里兰卡', IR: '伊朗', IQ: '伊拉克', AF: '阿富汗',
  DZ: '阿尔及利亚', MA: '摩洛哥', TN: '突尼斯', BD: '孟加拉', LT: '立陶宛', BG: '保加利亚', SK: '斯洛伐克',
  SI: '斯洛文尼亚', HR: '克罗地亚', RS: '塞尔维亚', EE: '爱沙尼亚', LV: '拉脱维亚', CY: '塞浦路斯',
  LU: '卢森堡', MT: '马耳他', IS: '冰岛', GH: '加纳', TZ: '坦桑尼亚', ET: '埃塞俄比亚', UG: '乌干达',
  GE: '格鲁吉亚', AM: '亚美尼亚', AZ: '阿塞拜疆', BY: '白俄罗斯', UZ: '乌兹别克斯坦', KH: '柬埔寨',
  LA: '老挝', NP: '尼泊尔', BT: '不丹', MV: '马尔代夫', QA: '卡塔尔', KW: '科威特', OM: '阿曼',
  JO: '约旦', LB: '黎巴嫩', SY: '叙利亚', YE: '也门', BH: '巴林', GL: '格陵兰岛', PR: '波多黎各',
  CU: '古巴', JM: '牙买加', HT: '海地', DO: '多米尼加', CR: '哥斯达黎加', PA: '巴拿马', GT: '危地马拉',
  HN: '洪都拉斯', NI: '尼加拉瓜', SV: '萨尔瓦多', EC: '厄瓜多尔', UY: '乌拉圭', PY: '巴拉圭',
  BO: '玻利维亚', GY: '圭亚那', SR: '苏里南', NZ: '新西兰', PG: '巴布亚新几内亚', FJ: '斐济'
};

export const provinceName = {
  '22': '北京', '86': '内蒙古', '146': '山西', '1069': '河北', '1177': '天津', '119': '宁夏',
  '152': '陕西', '1208': '甘肃', '1467': '青海', '1468': '新疆', '145': '黑龙江', '1445': '吉林',
  '1464': '辽宁', '2': '福建', '120': '江苏', '121': '安徽', '122': '山东', '1050': '上海',
  '1442': '浙江', '182': '河南', '1135': '湖北', '1465': '江西', '1466': '湖南', '118': '贵州',
  '153': '云南', '1051': '重庆', '1068': '四川', '1155': '西藏', '4': '广东', '173': '广西',
  '1441': '海南', '0': '其他', '1': '港澳台', '-1': '境外'
};

export const resolveCountry = (key) => countryName[key] || key;
export const resolveProvince = (key) => provinceName[key] || key;

/** 英文地图名 -> 中文（对应 world.json feature） */
const EN_TO_ZH = {
  China: '中国大陆', 'United States': '美国', Japan: '日本', 'South Korea': '韩国', Korea: '韩国',
  'North Korea': '朝鲜', 'Dem. Rep. Korea': '朝鲜', 'Hong Kong': '中国香港', Taiwan: '中国台湾',
  India: '印度', Russia: '俄罗斯', Germany: '德国', 'United Kingdom': '英国', France: '法国',
  Canada: '加拿大', Australia: '澳大利亚', Singapore: '新加坡', Indonesia: '印度尼西亚',
  Italy: '意大利', Spain: '西班牙', Netherlands: '荷兰', Sweden: '瑞典', Switzerland: '瑞士',
  Poland: '波兰', Turkey: '土耳其', 'United Arab Emirates': '阿联酋', Malaysia: '马来西亚',
  Thailand: '泰国', Philippines: '菲律宾', Vietnam: '越南', 'Saudi Arabia': '沙特阿拉伯',
  Mexico: '墨西哥', 'Czech Rep.': '捷克', Ireland: '爱尔兰', Norway: '挪威', Denmark: '丹麦',
  Finland: '芬兰', 'South Africa': '南非', Egypt: '埃及', Nigeria: '尼日利亚', Pakistan: '巴基斯坦',
  Bangladesh: '孟加拉', Israel: '以色列', Brazil: '巴西', Argentina: '阿根廷', Chile: '智利',
  Austria: '奥地利', Portugal: '葡萄牙', Greece: '希腊', Hungary: '匈牙利', Ukraine: '乌克兰',
  Kazakhstan: '哈萨克斯坦', 'New Zealand': '新西兰', Peru: '秘鲁', Colombia: '哥伦比亚',
  'Dominican Rep.': '多米尼加', 'Costa Rica': '哥斯达黎加', Cuba: '古巴', Romania: '罗马尼亚',
  Belgium: '比利时', 'Central African Rep.': '中非', Morocco: '摩洛哥', Algeria: '阿尔及利亚',
  'S. Sudan': '南苏丹', 'Bosnia and Herz.': '波黑', 'Eq. Guinea': '赤道几内亚', Macedonia: '马其顿',
  'Dominican Rep.': '多米尼加', Myanmar: '缅甸', Iran: '伊朗', Iraq: '伊拉克', Afghanistan: '阿富汗',
  Venezuela: '委内瑞拉', 'Bolivia': '玻利维亚', 'Dem. Rep. Congo': '刚果民主共和国', Congo: '刚果共和国',
  'Solomon Is.': '所罗门群岛', Ethiopia: '埃塞俄比亚', Tanzania: '坦桑尼亚', Kenya: '肯尼亚',
  Ghana: '加纳', Uganda: '乌干达', Cameroon: '喀麦隆', IvoryCoast: '科特迪瓦', Senegal: '塞内加尔',
  Zimbabwe: '津巴布韦', Zambia: '赞比亚', Angola: '安哥拉', Mozambique: '莫桑比克', Madagascar: '马达加斯加',
  Lithuania: '立陶宛', Latvia: '拉脱维亚', Estonia: '爱沙尼亚', Slovakia: '斯洛伐克', Slovenia: '斯洛文尼亚',
  Croatia: '克罗地亚', Serbia: '塞尔维亚', Cyprus: '塞浦路斯', Malta: '马耳他', Luxembourg: '卢森堡',
  Iceland: '冰岛', Georgia: '格鲁吉亚', Armenia: '亚美尼亚', Azerbaijan: '阿塞拜疆', Belarus: '白俄罗斯',
  Uzbekistan: '乌兹别克斯坦', Cambodia: '柬埔寨', Laos: '老挝', Nepal: '尼泊尔', Bhutan: '不丹',
  Maldives: '马尔代夫', Qatar: '卡塔尔', Kuwait: '科威特', Oman: '阿曼', Jordan: '约旦', Lebanon: '黎巴嫩',
  Syria: '叙利亚', Yemen: '也门', Bahrain: '巴林', Greenland: '格陵兰岛', 'Puerto Rico': '波多黎各',
  'New Caledonia': '新喀里多尼亚', 'Papua New Guinea': '巴布亚新几内亚', Fiji: '斐济', 'W. Sahara': '西撒哈拉',
  'Somalia': '索马里', 'Somaliland': '索马里兰', 'Moldova': '摩尔多瓦', Albania: '阿尔巴尼亚',
  Mongolia: '蒙古', Paraguay: '巴拉圭', Uruguay: '乌拉圭', Ecuador: '厄瓜多尔', Guatemala: '危地马拉',
  Honduras: '洪都拉斯', Nicaragua: '尼加拉瓜', 'El Salvador': '萨尔瓦多', Panama: '巴拿马',
  'Cote d Ivoire': '科特迪瓦', 'Sierra Leone': '塞拉利昂', 'Burkina Faso': '布基纳法索', Mali: '马里',
  Niger: '尼日尔', Chad: '乍得', Sudan: '苏丹', Libya: '利比亚', Tunisia: '突尼斯', Mauritania: '毛里塔尼亚'
};

/** 世界地图 nameMap：feature 英文名 -> 数据点中文名 */
export function buildMapNameMap() {
  const m = {};
  Object.entries(EN_TO_ZH).forEach(([en, zh]) => {
    m[en] = zh;
  });
  return m;
}

export const worldNameMap = buildMapNameMap();

/** 把编码 Key 转为地图数据点名称（country: 返回中文名以便与 nameMap 对齐） */
export function toCountryMapName(key) {
  const zh = countryName[key];
  if (zh) return zh;
  return key; // 兜底
}
