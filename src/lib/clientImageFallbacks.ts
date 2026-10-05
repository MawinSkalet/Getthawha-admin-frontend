const branchPhotos: Array<{ match: string[]; src: string }> = [
  { match: ["rimping2"], src: "/branch-4.jpg" },
  {
    match: ["charoenmuang", "chareonmuang", "เจริญเมือง"],
    src: "/figma-assets/d1d08844-1250-482d-93a5-584e57a90e051762676750450.webp",
  },
  { match: ["chiangkang", "เชียงคาน"], src: "/branch-3.jpg" },
  { match: ["phrasingh", "phra singh", "พระสิงห์"], src: "/branch-5.jpg" },
  { match: ["rimping", "ริมปิง"], src: "/branch-1.jpg" },
];

export function getClientBranchImage(name?: string | null) {
  const normalized = (name || "").toLocaleLowerCase().replace(/\s+/g, "");
  return (
    branchPhotos.find(({ match }) =>
      match.some((alias) => normalized.includes(alias.toLocaleLowerCase().replace(/\s+/g, "")))
    )?.src || "/branch-1.jpg"
  );
}

const packagePhotos: Array<{ match: string[]; src: string }> = [
  { match: ["thai massage + herbal balm", "นวดไทยใส่ยาหม่อง"], src: "/figma-assets/360_F_676368959_pUZwtpsC8wqsEXy7vqR6UlLbxDCkoBdT.jpg" },
  { match: ["foot massage + herbal balm", "นวดเท้าใส่ยาหม่อง"], src: "/figma-assets/360_F_676368959_pUZwtpsC8wqsEXy7vqR6UlLbxDCkoBdT.jpg" },
  { match: ["thai massage + oil", "นวดไทยใส่น้ำมัน"], src: "/aromapics.png" },
  { match: ["thai lanna herbal compress", "thai lanna massage with herbal compress", "นวดไทยล้านนา ประคบสมุนไพร"], src: "/figma-assets/499423492_1317171240414602_1759116723071476687_n.jpg" },
  { match: ["foot + back + head + shoulder", "foot + back + head", "back + shoulder massage", "office syndrome", "นวดหลังไหล่", "นวดออฟฟิศซินโดรม"], src: "/figma-assets/487480568_1222783176523000_6232950887757154845_n.jpg" },
  { match: ["foot + head + shoulder", "head, back & shoulder", "นวดศีรษะ หลัง ไหล่"], src: "/figma-assets/498205899_1317171190414607_4302194740465620141_n.jpg" },
  { match: ["foot massage", "นวดเท้า"], src: "/figma-assets/66a0ca9d9d29769359124398_S__8716295.jpg" },
  { match: ["coconut oil", "น้ำมันเซรั่มมะพร้าว"], src: "/figma-assets/360_F_676368959_pUZwtpsC8wqsEXy7vqR6UlLbxDCkoBdT.jpg" },
  { match: ["oil massage + herbal compress", "นวดน้ำมัน ประคบสมุนไพร"], src: "/figma-assets/487480568_1222783176523000_6232950887757154845_n.jpg" },
  { match: ["traditional lanna herbal", "ประคบสมุนไพร พิเศษ"], src: "/figma-assets/499423492_1317171240414602_1759116723071476687_n.jpg" },
  { match: ["aroma oil + herbal compress", "นวดน้ำมันอโรม่า ประคบสมุนไพร"], src: "/aromapics.png" },
  { match: ["body scrub", "thai herbal steam", "ขัดผิว", "อบตัว"], src: "/figma-assets/1fff3681-6558-40ee-81ae-c652f729444a1762428977626.webp" },
  { match: ["best value lanna", "ชุดสุดคุ้ม"], src: "/home-pic1.jpg" },
  { match: ["hot stone", "หินร้อน"], src: "/figma-assets/487480568_1222783176523000_6232950887757154845_n.jpg" },
  { match: ["oil massage", "aroma oil", "นวดน้ำมัน", "อโรม่า"], src: "/aromapics.png" },
  { match: ["thai massage", "นวดไทย"], src: "/figma-assets/498205899_1317171190414607_4302194740465620141_n.jpg" },
];

export function getClientPackageImage(title?: string | null, category?: string | null) {
  const normalizedTitle = (title || "")
    .replace(/^\s*\d+(?:\.\d+)?\s*/, "")
    .replace(/\s*\(\d+\s*mins?\)\s*$/i, "")
    .toLocaleLowerCase();
  const match = packagePhotos.find(({ match: aliases }) =>
    aliases.some((alias) => normalizedTitle.includes(alias.toLocaleLowerCase()))
  );
  if (match) return match.src;

  const normalizedCategory = (category || "").toLocaleLowerCase();
  if (normalizedCategory.includes("foot")) return "/figma-assets/66a0ca9d9d29769359124398_S__8716295.jpg";
  if (normalizedCategory.includes("lanna")) return "/figma-assets/499423492_1317171240414602_1759116723071476687_n.jpg";
  if (normalizedCategory.includes("shoulder")) return "/figma-assets/487480568_1222783176523000_6232950887757154845_n.jpg";
  if (normalizedCategory.includes("premium")) return "/figma-assets/487480568_1222783176523000_6232950887757154845_n.jpg";
  if (normalizedCategory.includes("best massage")) return "/figma-assets/487480568_1222783176523000_6232950887757154845_n.jpg";
  return "/aromapics.png";
}
