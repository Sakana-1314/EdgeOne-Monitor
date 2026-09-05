/**
 * edge/maps.js
 * 国家 / 省份 编码 -> 中文名 映射（供地图与排行展示）。
 * 其中 countryMap / provinceMap 数据对齐腾讯云 EdgeOne 指标返回值。
 */

// EdgeOne “国内省份”编码 -> 省份名
export const provinceMap = {
  '22': '北京', '86': '内蒙古', '146': '山西', '1069': '河北', '1177': '天津',
  '119': '宁夏', '152': '陕西', '1208': '甘肃', '1467': '青海', '1468': '新疆',
  '145': '黑龙江', '1445': '吉林', '1464': '辽宁', '2': '福建', '120': '江苏',
  '121': '安徽', '122': '山东', '1050': '上海', '1442': '浙江', '182': '河南',
  '1135': '湖北', '1465': '江西', '1466': '湖南', '118': '贵州', '153': '云南',
  '1051': '重庆', '1068': '四川', '1155': '西藏', '4': '广东', '173': '广西',
  '1441': '海南', '0': '其他', '1': '港澳台', '-1': '境外'
};

// 国家代码 -> 中文名
export const countryMap = {
  'CN': '中国大陆', 'AF': '阿富汗', 'MV': '马尔代夫', 'AM': '亚美尼亚', 'MN': '蒙古', 'AZ': '阿塞拜疆',
  'MM': '缅甸', 'BH': '巴林', 'NP': '尼泊尔', 'BD': '孟加拉', 'KP': '朝鲜',
  'BT': '不丹', 'OM': '阿曼', 'IO': '英属印度洋领地', 'PK': '巴基斯坦', 'KH': '柬埔寨',
  'PS': '巴勒斯坦', 'CX': '圣诞岛', 'PH': '菲律宾', 'HK': '中国香港', 'QA': '卡塔尔',
  'IN': '印度', 'SA': '沙特阿拉伯', 'ID': '印度尼西亚', 'SG': '新加坡', 'IR': '伊朗',
  'KR': '韩国', 'IQ': '伊拉克', 'LK': '斯里兰卡', 'IL': '以色列', 'SY': '叙利亚',
  'JP': '日本', 'TW': '中国台湾', 'JO': '约旦', 'TJ': '塔吉克斯坦', 'KZ': '哈萨克斯坦',
  'TH': '泰国', 'KW': '科威特', 'TM': '土库曼斯坦', 'KG': '吉尔吉斯斯坦', 'AE': '阿联酋',
  'LA': '老挝', 'UZ': '乌兹别克斯坦', 'LB': '黎巴嫩', 'VN': '越南', 'MO': '中国澳门',
  'YE': '也门', 'MY': '马来西亚', 'TR': '土耳其', 'AX': '奥兰群岛', 'IT': '意大利',
  'AL': '阿尔巴尼亚', 'JE': '泽西岛', 'AD': '安道尔', 'LT': '立陶宛', 'AT': '奥地利',
  'LU': '卢森堡', 'BY': '白俄罗斯', 'MK': '马其顿', 'BE': '比利时', 'MT': '马耳他',
  'BA': '波黑', 'MD': '摩尔多瓦', 'BG': '保加利亚', 'MC': '摩纳哥', 'BQ': '荷兰加勒比区',
  'ME': '黑山', 'HR': '克罗地亚', 'NL': '荷兰', 'CZ': '捷克', 'NO': '挪威',
  'DK': '丹麦', 'PL': '波兰', 'EE': '爱沙尼亚', 'PT': '葡萄牙', 'FO': '法罗群岛',
  'RO': '罗马尼亚', 'FI': '芬兰', 'RU': '俄罗斯', 'FR': '法国', 'SM': '圣马力诺',
  'DE': '德国', 'RS': '塞尔维亚', 'GI': '直布罗陀', 'SX': '荷属圣马丁', 'GR': '希腊',
  'SK': '斯洛伐克', 'GG': '根西岛', 'ES': '西班牙', 'HU': '匈牙利', 'SE': '瑞典',
  'IS': '冰岛', 'CH': '瑞士', 'IE': '爱尔兰', 'UA': '乌克兰', 'IM': '马恩岛',
  'GB': '英国', 'DZ': '阿尔及利亚', 'ML': '马里', 'AO': '安哥拉', 'MR': '毛里塔尼亚',
  'BJ': '贝宁', 'MU': '毛里求斯', 'BW': '博茨瓦纳', 'YT': '马约特', 'BF': '布基纳法索',
  'MA': '摩洛哥', 'BI': '布隆迪', 'MZ': '莫桑比克', 'CM': '喀麦隆', 'NA': '纳米比亚',
  'CV': '佛得角', 'NE': '尼日尔', 'CF': '中非', 'NG': '尼日利亚', 'TD': '乍得',
  'RW': '卢旺达', 'KM': '科摩罗', 'SH': '圣赫勒拿', 'DJ': '吉布提', 'ST': '圣多美和普林西比',
  'EG': '埃及', 'SN': '塞内加尔', 'GQ': '赤道几内亚', 'SC': '塞舌尔', 'ER': '厄立特里亚',
  'SL': '塞拉利昂', 'ET': '埃塞俄比亚', 'SO': '索马里', 'GA': '加蓬', 'ZA': '南非',
  'GM': '冈比亚', 'SS': '南苏丹', 'GH': '加纳', 'SD': '苏丹', 'GN': '几内亚',
  'SZ': '斯威士兰', 'GW': '几内亚比绍', 'TZ': '坦桑尼亚', 'KE': '肯尼亚', 'TG': '多哥',
  'LS': '莱索托', 'TN': '突尼斯', 'LR': '利比里亚', 'UG': '乌干达', 'LY': '利比亚',
  'EH': '西撒哈拉', 'MG': '马达加斯加', 'ZM': '赞比亚', 'MW': '马拉维', 'ZW': '津巴布韦',
  'CD': '刚果民主共和国', 'CG': '刚果共和国', 'CI': '科特迪瓦', 'AU': '澳大利亚', 'NF': '诺福克岛',
  'CK': '库克群岛', 'MP': '北马里亚纳群岛', 'TL': '东帝汶', 'PW': '帕劳', 'GU': '关岛',
  'PG': '巴布亚新几内亚', 'KI': '基里巴斯', 'SB': '所罗门群岛', 'MH': '马绍尔群岛', 'TO': '汤加',
  'NR': '瑙鲁', 'TV': '图瓦卢', 'NZ': '新西兰', 'AI': '安圭拉', 'HT': '海地',
  'AG': '安提瓜和巴布达', 'HN': '洪都拉斯', 'AW': '阿鲁巴', 'JM': '牙买加', 'BS': '巴哈马',
  'MX': '墨西哥', 'BB': '巴巴多斯', 'MS': '蒙塞拉特岛', 'BM': '百慕大', 'NI': '尼加拉瓜',
  'CA': '加拿大', 'PA': '巴拿马', 'KY': '开曼群岛', 'PR': '波多黎各', 'CR': '哥斯达黎加',
  'KN': '圣基茨和尼维斯', 'CU': '古巴', 'LC': '圣卢西亚', 'CW': '库拉索', 'MF': '法属圣马丁',
  'SV': '萨尔瓦多', 'TT': '特立尼达和多巴哥', 'GL': '格陵兰岛', 'TC': '特克斯和凯科斯群岛',
  'GD': '格林纳达', 'US': '美国', 'GT': '危地马拉', 'AR': '阿根廷', 'GY': '圭亚那',
  'BO': '玻利维亚', 'PY': '巴拉圭', 'BR': '巴西', 'PE': '秘鲁', 'CL': '智利',
  'SR': '苏里南', 'CO': '哥伦比亚', 'UY': '乌拉圭', 'EC': '厄瓜多尔', 'VE': '委内瑞拉',
  'GF': '法属圭亚那', 'Antarctica': '南极洲'
};

// 国家代码 -> ECharts 世界地图（echarts@4 world.json）feature 名（英文）
export const codeToMapName = {
  'CN': 'China', 'AF': 'Afghanistan', 'AL': 'Albania', 'DZ': 'Algeria', 'AO': 'Angola', 'AR': 'Argentina',
  'AM': 'Armenia', 'AU': 'Australia', 'AT': 'Austria', 'AZ': 'Azerbaijan', 'BS': 'Bahamas', 'BH': 'Bahrain',
  'BD': 'Bangladesh', 'BB': 'Barbados', 'BY': 'Belarus', 'BE': 'Belgium', 'BZ': 'Belize', 'BJ': 'Benin',
  'BT': 'Bhutan', 'BO': 'Bolivia', 'BA': 'Bosnia and Herz.', 'BW': 'Botswana', 'BR': 'Brazil',
  'BN': 'Brunei', 'BG': 'Bulgaria', 'BF': 'Burkina Faso', 'BI': 'Burundi', 'KH': 'Cambodia', 'CM': 'Cameroon',
  'CA': 'Canada', 'CF': 'Central African Rep.', 'TD': 'Chad', 'CL': 'Chile', 'CO': 'Colombia',
  'KM': 'Comoros', 'CG': 'Congo', 'CD': 'Dem. Rep. Congo', 'CR': 'Costa Rica',
  'HR': 'Croatia', 'CU': 'Cuba', 'CY': 'Cyprus', 'CZ': 'Czech Rep.', 'DK': 'Denmark', 'DJ': 'Djibouti',
  'DO': 'Dominican Rep.', 'EC': 'Ecuador', 'EG': 'Egypt', 'SV': 'El Salvador', 'GQ': 'Eq. Guinea',
  'ER': 'Eritrea', 'EE': 'Estonia', 'ET': 'Ethiopia', 'FJ': 'Fiji', 'FI': 'Finland', 'FR': 'France',
  'GA': 'Gabon', 'GM': 'Gambia', 'GE': 'Georgia', 'DE': 'Germany', 'GH': 'Ghana', 'GR': 'Greece',
  'GT': 'Guatemala', 'GN': 'Guinea', 'GW': 'Guinea-Bissau', 'GY': 'Guyana', 'HT': 'Haiti', 'HN': 'Honduras',
  'HU': 'Hungary', 'IS': 'Iceland', 'IN': 'India', 'ID': 'Indonesia', 'IR': 'Iran', 'IQ': 'Iraq',
  'IE': 'Ireland', 'IL': 'Israel', 'IT': 'Italy', 'JM': 'Jamaica', 'JP': 'Japan',
  'JO': 'Jordan', 'KZ': 'Kazakhstan', 'KE': 'Kenya', 'KP': 'North Korea', 'KR': 'South Korea',
  'KW': 'Kuwait', 'KG': 'Kyrgyzstan', 'LA': 'Laos', 'LV': 'Latvia', 'LB': 'Lebanon', 'LS': 'Lesotho',
  'LR': 'Liberia', 'LY': 'Libya', 'LT': 'Lithuania', 'LU': 'Luxembourg', 'MK': 'Macedonia', 'MG': 'Madagascar',
  'MW': 'Malawi', 'MY': 'Malaysia', 'ML': 'Mali', 'MT': 'Malta', 'MR': 'Mauritania', 'MU': 'Mauritius',
  'MX': 'Mexico', 'MD': 'Moldova', 'MN': 'Mongolia', 'ME': 'Montenegro', 'MA': 'Morocco', 'MZ': 'Mozambique',
  'MM': 'Myanmar', 'NA': 'Namibia', 'NP': 'Nepal', 'NL': 'Netherlands', 'NZ': 'New Zealand', 'NI': 'Nicaragua',
  'NE': 'Niger', 'NG': 'Nigeria', 'NO': 'Norway', 'OM': 'Oman', 'PK': 'Pakistan', 'PA': 'Panama',
  'PG': 'Papua New Guinea', 'PY': 'Paraguay', 'PE': 'Peru', 'PH': 'Philippines', 'PL': 'Poland',
  'PT': 'Portugal', 'PR': 'Puerto Rico', 'QA': 'Qatar', 'RO': 'Romania', 'RU': 'Russia', 'RW': 'Rwanda',
  'SA': 'Saudi Arabia', 'SN': 'Senegal', 'RS': 'Serbia', 'SL': 'Sierra Leone', 'SG': 'Singapore',
  'SK': 'Slovakia', 'SI': 'Slovenia', 'SB': 'Solomon Is.', 'SO': 'Somalia', 'ZA': 'South Africa',
  'SS': 'S. Sudan', 'ES': 'Spain', 'LK': 'Sri Lanka', 'SD': 'Sudan', 'SR': 'Suriname', 'SZ': 'Swaziland',
  'SE': 'Sweden', 'CH': 'Switzerland', 'SY': 'Syria', 'TW': 'Taiwan', 'TJ': 'Tajikistan', 'TZ': 'Tanzania',
  'TH': 'Thailand', 'TL': 'Timor-Leste', 'TG': 'Togo', 'TT': 'Trinidad and Tobago', 'TN': 'Tunisia',
  'TR': 'Turkey', 'TM': 'Turkmenistan', 'UG': 'Uganda', 'UA': 'Ukraine', 'AE': 'United Arab Emirates',
  'GB': 'United Kingdom', 'US': 'United States', 'UY': 'Uruguay', 'UZ': 'Uzbekistan', 'VU': 'Vanuatu',
  'VE': 'Venezuela', 'VN': 'Vietnam', 'YE': 'Yemen', 'ZM': 'Zambia', 'ZW': 'Zimbabwe'
};

// echarts@4 world.json 里与标准国名不一致、需要人工对齐的 feature 名
const worldNameSynonyms = {
  'Korea': '韩国',                 // 地图上没有分开南/北
  'Dem. Rep. Korea': '朝鲜',
  'Dominican Rep.': '多米尼加',
  'Central African Rep.': '中非',
  'Eq. Guinea': '赤道几内亚',
  'Congo': '刚果共和国',
  'Dem. Rep. Congo': '刚果民主共和国',
  'Czech Rep.': '捷克',
  'Bosnia and Herz.': '波黑',
  'Solomon Is.': '所罗门群岛',
  'S. Sudan': '南苏丹',
  'Macedonia': '马其顿',
  'W. Sahara': '西撒哈拉',
  'Falkland Is.': '福克兰群岛',
  'Faeroe Is.': '法罗群岛',
  'N. Cyprus': '北塞浦路斯',
  'Somaliland': '索马里兰',
  'United States': '美国',
  'United Kingdom': '英国',
  'Russia': '俄罗斯',
  'Tanzania': '坦桑尼亚',
  'Venezuela': '委内瑞拉',
  'Laos': '老挝',
  'Syria': '叙利亚',
  'Moldova': '摩尔多瓦',
  'Brunei': '文莱',
  'Iran': '伊朗',
  'Bolivia': '玻利维亚',
  'Vietnam': '越南',
  'Palestine': '巴勒斯坦',
  'Timor-Leste': '东帝汶',
  'South Korea': '韩国',
  'North Korea': '朝鲜',
  'Taiwan': '中国台湾',
  'Hong Kong': '中国香港',
  'Macau': '中国澳门',
  'China': '中国大陆',
  'Antarctica': '南极洲'
};

/**
 * 构建“地图 feature 名 -> 中文名”的 nameMap。
 * 数据点使用 countryMap[code] 的中文名，ECharts 通过 nameMap 与英文 feature 对齐。
 */
export function buildWorldNameMap() {
  const map = {};
  Object.keys(codeToMapName).forEach((code) => {
    const zh = countryMap[code];
    if (!zh) return;
    map[codeToMapName[code]] = zh;
  });
  // 覆盖已知不一致项
  Object.assign(map, worldNameSynonyms);
  // 反向别名：若地图为中文名(备用) 保持原样
  return map;
}

export const worldNameMap = buildWorldNameMap();
