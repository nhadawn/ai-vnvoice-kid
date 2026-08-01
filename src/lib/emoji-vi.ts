// Vietnamese → English lexicon so parents/children can search the full emoji
// catalogue by typing Vietnamese words (accents optional).

export const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").trim();

/** vietnamese (unaccented) -> english search terms */
export const VI_EN: Record<string, string[]> = {
  // people & family
  "nguoi": ["person", "people"], "be": ["baby", "child"], "em be": ["baby"],
  "tre": ["child", "boy", "girl"], "be trai": ["boy"], "be gai": ["girl"],
  "me": ["woman", "mother"], "bo": ["man", "father"], "cha": ["man", "father"],
  "ba": ["older woman", "grandma"], "ong": ["older man", "grandpa"],
  "anh": ["boy", "man"], "chi": ["girl", "woman"], "em": ["child"],
  "co giao": ["teacher"], "thay": ["teacher"], "hoc sinh": ["student"],
  "bac si": ["health worker", "doctor"], "y ta": ["health worker"],
  "canh sat": ["police"], "linh cuu hoa": ["firefighter"], "dau bep": ["cook"],
  "nong dan": ["farmer"], "cong nhan": ["factory worker"], "ca si": ["singer"],
  "gia dinh": ["family"], "ban": ["people holding hands", "friend"],
  "co dau": ["bride"], "chu re": ["groom"], "thien than": ["angel"],
  "ong gia noel": ["santa"], "cong chua": ["princess"], "hoang tu": ["prince"],
  // emotions / faces
  "vui": ["grinning face", "smiling"], "cuoi": ["grinning", "laughing"],
  "buon": ["frowning", "sad", "crying"], "khoc": ["crying face"],
  "gian": ["angry", "pouting"], "so": ["fearful", "scream"],
  "met": ["tired", "sleepy", "weary"], "ngu": ["sleeping"],
  "yeu": ["heart", "smiling face with hearts", "kiss"], "thuong": ["heart"],
  "trai tim": ["heart"], "hon": ["kiss"], "om": ["hugging"],
  "benh": ["face with thermometer", "sick", "nauseated"], "dau": ["head bandage", "injured"],
  "nong": ["hot face"], "lanh": ["cold face"], "ngac nhien": ["astonished", "surprised"],
  "suy nghi": ["thinking face"], "im lang": ["zipper-mouth", "shushing"],
  "nhay mat": ["winking"], "deo kinh": ["sunglasses"], "khau trang": ["medical mask"],
  // body
  "tay": ["hand", "raised hand", "palm"], "chan": ["foot", "leg"],
  "mat": ["eye", "eyes"], "mui": ["nose"], "mieng": ["mouth"], "tai": ["ear"],
  "rang": ["tooth"], "toc": ["hair", "haircut"], "nao": ["brain"], "xuong": ["bone"],
  "vo tay": ["clapping"], "chi tay": ["backhand index", "pointing"],
  "ngon tay": ["finger"], "co tay len": ["flexed biceps"], "cau nguyen": ["folded hands"],
  "dong y": ["thumbs up", "ok hand"], "khong dong y": ["thumbs down"],
  // animals
  "con vat": ["animal", "paw"], "cho": ["dog"], "meo": ["cat"], "ga": ["chicken", "rooster"],
  "vit": ["duck"], "bo": ["cow", "ox"], "trau": ["water buffalo"], "lon": ["pig"],
  "heo": ["pig"], "ngua": ["horse"], "de": ["goat"], "cuu": ["sheep", "ewe"],
  "tho": ["rabbit"], "chuot": ["mouse", "rat"], "chim": ["bird"], "ca": ["fish"],
  "voi": ["elephant"], "ho": ["tiger"], "su tu": ["lion"], "khi": ["monkey"],
  "gau": ["bear", "teddy bear"], "gau bong": ["teddy bear"], "huou": ["deer", "giraffe"],
  "ca sau": ["crocodile"], "ran": ["snake"], "ech": ["frog"], "buom": ["butterfly"],
  "ong": ["honeybee"], "kien": ["ant"], "nhen": ["spider"], "rua": ["turtle"],
  "ca heo": ["dolphin"], "ca voi": ["whale"], "cua": ["crab"], "tom": ["shrimp"],
  "muc": ["squid"], "chim cong": ["peacock"], "dai bang": ["eagle"], "cu": ["owl"],
  "cho soi": ["wolf"], "cao": ["fox"], "gau panda": ["panda"], "khung long": ["dinosaur"],
  // food & drink
  "com": ["cooked rice"], "gao": ["rice"], "pho": ["steaming bowl", "noodle"],
  "mi": ["noodle", "spaghetti"], "bun": ["noodle"], "banh": ["cake", "bread", "pastry"],
  "banh mi": ["bread", "baguette"], "banh kem": ["birthday cake", "cake"],
  "keo": ["candy", "lollipop"], "kem": ["ice cream", "soft ice cream"],
  "socola": ["chocolate"], "thit": ["meat", "poultry leg", "cut of meat"],
  "trung": ["egg"], "rau": ["leafy green", "broccoli", "vegetable"],
  "trai cay": ["fruit"], "tao": ["apple"], "chuoi": ["banana"], "cam": ["tangerine", "orange"],
  "nho": ["grapes"], "dua hau": ["watermelon"], "dua": ["coconut", "pineapple"],
  "xoai": ["mango"], "dao": ["peach"], "le": ["pear"], "dau": ["strawberry"],
  "chanh": ["lemon"], "ca chua": ["tomato"], "khoai tay": ["potato"], "ca rot": ["carrot"],
  "ngo": ["ear of corn"], "nam": ["mushroom"], "sua": ["glass of milk", "milk"],
  "nuoc": ["water", "droplet", "beverage box"], "nuoc cam": ["beverage box", "juice"],
  "tra": ["teacup"], "ca phe": ["hot beverage", "coffee"], "sinh to": ["cup with straw"],
  "pizza": ["pizza"], "hamburger": ["hamburger"], "ga ran": ["poultry leg"],
  "sushi": ["sushi"], "sup": ["pot of food", "soup"], "muoi": ["salt"],
  "bat": ["bowl"], "dia": ["plate", "fork and knife"], "coc": ["cup", "glass"],
  "thia": ["spoon"], "dao nia": ["fork and knife"], "dua an": ["chopsticks"],
  // actions / activities
  "an": ["fork and knife with plate", "eating"], "uong": ["cup with straw", "beverage"],
  "choi": ["video game", "joystick"], "tam": ["bathtub", "shower"],
  "di": ["person walking"], "chay": ["person running"], "nhay": ["cartwheel", "dancer"],
  "ngoi": ["chair", "person kneeling"], "dung": ["person standing"],
  "boi": ["swimming"], "dap xe": ["biking", "bicycle"], "leo": ["climbing"],
  "hat": ["microphone", "singer"], "nghe": ["ear", "headphone"], "nhin": ["eyes"],
  "doc": ["book", "open book"], "viet": ["writing hand", "pencil"], "ve": ["artist", "art"],
  "hoc": ["school", "books", "graduation"], "lam viec": ["laptop", "briefcase"],
  "the thao": ["sports", "ball"], "bong da": ["soccer ball"], "bong ro": ["basketball"],
  "bong chuyen": ["volleyball"], "cau long": ["badminton"], "tennis": ["tennis"],
  "bong ban": ["ping pong"], "vo": ["martial arts"], "yoga": ["lotus position"],
  "am nhac": ["musical note", "music"], "dan": ["guitar", "musical keyboard", "violin"],
  "trong": ["drum"], "sao": ["flute"], "phim": ["movie", "clapper"],
  // objects
  "sach": ["book"], "but": ["pencil", "pen"], "giay": ["page", "paper"],
  "mau": ["crayon", "paintbrush"], "cap sach": ["backpack"], "tui": ["handbag", "bag"],
  "dien thoai": ["mobile phone", "telephone"], "may tinh": ["laptop", "computer"],
  "tivi": ["television"], "may anh": ["camera"], "tai nghe": ["headphone"],
  "loa": ["loudspeaker", "speaker"], "chuot may tinh": ["computer mouse"],
  "ban phim": ["keyboard"], "may in": ["printer"], "pin": ["battery"],
  "den": ["light bulb", "lamp"], "chia khoa": ["key"], "khoa": ["lock"],
  "dong ho": ["watch", "clock", "alarm clock"], "guong": ["mirror"],
  "gio": ["basket"], "thung rac": ["wastebasket"], "xa phong": ["soap"],
  "ban chai": ["toothbrush"], "khan": ["roll of paper", "towel"], "luoc": ["comb"],
  "thuoc": ["pill", "syringe", "medicine"], "kim tiem": ["syringe"],
  "tien": ["money", "dollar", "coin"], "qua": ["gift", "wrapped gift"],
  "bong bay": ["balloon"], "bong": ["ball", "balloon"], "dieu": ["kite"],
  "robot": ["robot"], "do choi": ["teddy bear", "toy", "yo-yo"], "bup be": ["doll", "nesting dolls"],
  "xep hinh": ["puzzle piece"], "co vua": ["chess"], "xuc xac": ["game die"],
  "giuong": ["bed"], "ghe": ["chair", "couch"], "ban": ["table", "desk"],
  "sofa": ["couch"], "tu": ["door", "cabinet"], "cua": ["door"], "cua so": ["window"],
  "tu lanh": ["refrigerator"], "bep": ["cooking", "stove"], "noi": ["pot of food"],
  "chao": ["shallow pan", "pan"], "may giat": ["washing machine"], "quat": ["cyclone", "fan"],
  "o": ["umbrella"], "ao mua": ["coat", "umbrella"],
  // clothes
  "ao": ["t-shirt", "shirt", "clothing"], "ao khoac": ["coat", "jacket"],
  "quan": ["jeans", "shorts", "trousers"], "vay": ["dress"], "dam": ["dress", "kimono"],
  "mu": ["cap", "hat"], "non": ["woman's hat"], "giay": ["shoe", "running shoe"],
  "dep": ["sandal", "thong sandal"], "tat": ["socks"], "gang tay": ["gloves"],
  "khan quang": ["scarf"], "kinh": ["glasses", "eyeglasses"], "nhan": ["ring"],
  "vong": ["ring", "necklace"], "ba lo": ["backpack"], "vali": ["luggage"],
  // places & nature
  "nha": ["house", "home"], "truong": ["school"], "lop": ["school", "classroom"],
  "benh vien": ["hospital"], "nha thuoc": ["pill", "hospital"], "cho": ["convenience store", "shop"],
  "sieu thi": ["shopping cart", "department store"], "nha hang": ["fork and knife", "restaurant"],
  "quan ca phe": ["hot beverage"], "cong vien": ["national park", "park"],
  "san choi": ["playground slide"], "thu vien": ["books", "library"], "so thu": ["zoo", "lion"],
  "bai bien": ["beach"], "bien": ["water wave", "beach"], "nui": ["mountain"],
  "song": ["river", "water wave"], "ho": ["water wave", "lake"], "rung": ["tree", "forest"],
  "vuon": ["house with garden", "garden"], "san bay": ["airplane departure", "airport"],
  "ben xe": ["bus stop"], "ga tau": ["station"], "nha tho": ["church"], "chua": ["temple"],
  "cay": ["tree", "deciduous tree"], "hoa": ["flower", "blossom", "rose"],
  "la": ["leaf", "fallen leaf"], "co": ["herb", "seedling"], "hat": ["chestnut", "seed"],
  "mat troi": ["sun"], "mat trang": ["moon"], "sao troi": ["star"], "may": ["cloud"],
  "mua": ["rain", "cloud with rain"], "tuyet": ["snow", "snowflake"],
  "sam": ["thunder", "lightning"], "cau vong": ["rainbow"], "gio": ["wind face"],
  "lua": ["fire"], "nuoc bien": ["water wave"], "trai dat": ["globe", "earth"],
  // vehicles
  "xe": ["car", "automobile"], "o to": ["automobile", "car"], "oto": ["automobile"],
  "xe may": ["motorcycle"], "xe dap": ["bicycle"], "xe buyt": ["bus"],
  "xe tai": ["truck"], "taxi": ["taxi"], "xe cuu thuong": ["ambulance"],
  "xe cuu hoa": ["fire engine"], "xe canh sat": ["police car"],
  "tau hoa": ["train", "locomotive"], "tau dien": ["metro", "tram"],
  "may bay": ["airplane"], "truc thang": ["helicopter"], "ten lua": ["rocket"],
  "tau thuy": ["ship"], "thuyen": ["sailboat", "canoe"], "van truot": ["skateboard"],
  // time / numbers / symbols
  "gio": ["clock", "o'clock"], "sang": ["sunrise"], "trua": ["sun"],
  "chieu": ["sunset"], "toi": ["cityscape at dusk", "night"], "dem": ["crescent moon", "night"],
  "lich": ["calendar"], "tuan": ["calendar"], "thang": ["calendar"],
  "so": ["keycap"], "mot": ["keycap: 1"], "hai": ["keycap: 2"], "ba so": ["keycap: 3"],
  "bon": ["keycap: 4"], "nam so": ["keycap: 5"], "sau": ["keycap: 6"],
  "bay": ["keycap: 7"], "tam so": ["keycap: 8"], "chin": ["keycap: 9"], "muoi": ["keycap: 10"],
  "cong": ["plus"], "tru": ["minus"], "nhan": ["multiply"], "chia": ["divide"],
  "dung roi": ["check mark"], "sai": ["cross mark"], "co": ["check mark"],
  "khong": ["cross mark", "prohibited"], "canh bao": ["warning"], "cam": ["prohibited", "no entry"],
  "cau hoi": ["question mark"], "moi": ["new button"], "sos": ["SOS"],
  "sao": ["star", "sparkles"], "phao hoa": ["fireworks"], "tiec": ["party popper"],
  "huy chuong": ["medal"], "cup": ["trophy"], "vuong mien": ["crown"],
};

const VI_KEYS = Object.keys(VI_EN);

/** Expand a Vietnamese query into English search terms (plus the raw query). */
export function expandQuery(query: string): string[] {
  const q = norm(query);
  if (!q) return [];
  const terms = new Set<string>([q]);
  for (const k of VI_KEYS) {
    if (k === q || q.includes(k) || (k.includes(q) && q.length >= 3)) {
      VI_EN[k].forEach((t) => terms.add(norm(t)));
    }
  }
  return [...terms];
}
