export const LARK_LINKS_MATCH_FILTER = [
  "larkoffice.com",
  "feishu.cn",
  "feishu",
  "bytedance",
];

export const filerLinks = (links: string[], onlyLark: true) => {
  if (onlyLark) {
    return links?.filter((link) =>
      Boolean(LARK_LINKS_MATCH_FILTER.find((item) => link.includes(item)))
    );
  }
  return links;
};
