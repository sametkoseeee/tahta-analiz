/**
 * Ana sayfadaki "Günün Ekonomi Fikri": her gün sıradaki fikir (İstanbul tarihine göre).
 * Metinler alıntı değil, fikirlerin kendi cümlelerimizle kısa anlatımı (telif nedeniyle).
 */
export type Idea = {
  who: string;
  /** Kişinin kısa tanımı, ör. "Matematikçi, 1994 Nobel Ekonomi Ödülü" */
  role: string;
  title: string;
  body: string;
  /** Borsa / günlük hayattan örnek */
  example: string;
  /** İlgili sözlük terimi ya da sayfa */
  link?: { href: string; label: string };
};

const NASH = "John Nash";
const NASH_ROLE = "Matematikçi, 1994 Nobel Ekonomi Ödülü";
const MEDICI = "Medici Ailesi";
const MEDICI_ROLE = "Floransalı bankacılar, 1397–1494";
const GRAHAM = "Benjamin Graham";
const GRAHAM_ROLE = "Değer yatırımının babası, Buffett'ın hocası";
const BUFFETT = "Warren Buffett";
const BUFFETT_ROLE = "Yatırımcı, Berkshire Hathaway";
const SMITH = "Adam Smith";
const SMITH_ROLE = "İktisatçı, Ulusların Zenginliği (1776)";
const KEYNES = "John Maynard Keynes";
const KEYNES_ROLE = "İktisatçı ve yatırımcı";

export const IDEAS: Idea[] = [
  {
    who: NASH, role: NASH_ROLE, title: "Nash dengesi",
    body: "Birden fazla kişinin karar verdiği her durumda herkes, diğerlerinin ne yapacağını hesaba katarak kendine en iyi hamleyi seçer. Kimsenin tek başına kararını değiştirmek istemediği nokta dengedir.",
    example: "Aynı sokaktaki iki benzinci fiyat kırarak birbirinin müşterisini çalmaya çalışır; sonunda ikisinin de değiştirmek istemediği bir fiyatta dururlar. Hisse fiyatı da alıcı ile satıcının buluştuğu böyle bir dengedir.",
  },
  {
    who: NASH, role: NASH_ROLE, title: "Herkesin çıkarı, herkesin iyiliği değildir",
    body: "Nash dengesi her zaman herkes için en iyi sonuç değildir. Herkes kendi çıkarını en iyi şekilde gözetse bile toplu sonuç herkesi kaybettirebilir.",
    example: "Panik anında herkes aynı anda satarsa, tek tek mantıklı görünen kararlar hissenin değerinin çok altına düşmesine yol açar ve satanların çoğu zarar eder.",
  },
  {
    who: NASH, role: NASH_ROLE, title: "Pazarlıkta güç, kaybedeceğin şeydir",
    body: "Nash'in pazarlık çözümüne göre iki taraf bir anlaşmadan payı bölüşürken, anlaşma bozulursa daha az kaybedecek olan taraf daha güçlüdür.",
    example: "Başka iyi teklifi olan kiracı, kirasını daha rahat pazarlık eder. Şirketlerde de nakdi bol olan taraf satın alma görüşmelerinde elini güçlü tutar.",
  },
  {
    who: NASH, role: NASH_ROLE, title: "Rakibin ne düşündüğünü düşün",
    body: "Oyun teorisinin temel dersi: doğru karar sadece senin ne istediğine değil, karşı tarafın ne yapacağını tahmin etmene bağlıdır.",
    example: "Halka arzda herkes çok talep gelecek diye fazla lot yazar; herkes böyle düşündüğü için talep şişer ve kişi başına düşen lot azalır.",
    link: { href: "/halka-arz", label: "Halka arz takvimi" },
  },
  {
    who: NASH, role: NASH_ROLE, title: "İdeal para",
    body: "Nash hayatının son yıllarında paranın zamanla değerini koruması gerektiğini savundu. Ona göre enflasyon, hükümetlerin kullandığı gizli bir vergiydi ve para, metre gibi değişmeyen bir ölçü olmalıydı.",
    example: "Yıllık %40 enflasyonda 100 TL bir yıl sonra yaklaşık 71 TL'lik alım gücüne düşer. Bu yüzden yatırımcı getiriyi her zaman enflasyonla karşılaştırmalıdır.",
  },
  {
    who: NASH, role: NASH_ROLE, title: "Kurallar oyunu belirler",
    body: "Oyun teorisi, aynı insanların farklı kurallar altında çok farklı davrandığını gösterir. Bugün devlet ihaleleri ve açık artırmalar bu fikirle tasarlanıyor.",
    example: "Borsadaki tavan-taban sınırları ya da açığa satış yasakları gibi kurallar, yatırımcıların davranışını doğrudan değiştirir.",
    link: { href: "/tedbirli-hisseler", label: "Tedbirli hisseler" },
  },
  {
    who: MEDICI, role: MEDICI_ROLE, title: "Çift taraflı kayıt",
    body: "Mediciler, her işlemi hem borç hem alacak olarak iki kez kaydeden muhasebe yöntemini sistemli biçimde kullanarak dev bir ağı yönettiler. Bugünkü bilançoların temeli bu yöntemdir.",
    example: "Bir şirketin bilançosunda varlıklar her zaman borçlar ile özkaynağın toplamına eşittir; bu eşitlik çift taraflı kaydın sonucudur.",
    link: { href: "/sozluk/bilanco", label: "Bilanço nedir?" },
  },
  {
    who: MEDICI, role: MEDICI_ROLE, title: "Şubeleri ayrı şirket yap",
    body: "Medici Bankası'nın şubeleri ayrı ortaklıklar olarak kuruluydu. Bir şube batsa bile zarar bütün bankayı sürüklemiyordu. Bugünkü holding yapısının erken bir örneğidir.",
    example: "Borsadaki holdingler de iştiraklerini ayrı şirketler olarak yönetir; bir iştirakteki sorun diğerlerine doğrudan sıçramaz.",
  },
  {
    who: MEDICI, role: MEDICI_ROLE, title: "Güçlüye borç vermenin riski",
    body: "Mediciler'in çöküşünde krallara ve soylulara verilen, geri dönmeyen büyük borçların payı vardı. Tek bir büyük müşteriye bağımlılık en sağlam bankayı bile sarsabilir.",
    example: "Gelirinin büyük kısmını tek bir müşteriden ya da tek bir devlet ihalesinden alan şirketlerde bu yoğunlaşma riskine dikkat etmek gerekir.",
  },
  {
    who: MEDICI, role: MEDICI_ROLE, title: "Para, güvenle taşınır",
    body: "Mediciler poliçe (bill of exchange) ile tüccarların altın taşımadan şehirler arası ödeme yapmasını sağladı. Bankacılığın özü, güvenin bir kâğıda dönüşmesidir.",
    example: "Bugün borsada hisseler de fiziksel kâğıt olarak değil, Merkezi Kayıt Kuruluşu'nda kayıt olarak tutulur; sistem güvene dayanır.",
  },
  {
    who: MEDICI, role: MEDICI_ROLE, title: "Kârını itibara yatır",
    body: "Mediciler kazançlarının bir kısmını sanatçıları ve kenti desteklemeye harcayarak itibar ve güç kazandı. Uzun vadede itibar da bir sermayedir.",
    example: "Yatırımcılar, yönetimine ve şeffaflığına güvendikleri şirketlere daha yüksek değer biçer; KAP'ta düzenli ve açık bilgi veren şirketler bu güveni kazanır.",
  },
  {
    who: MEDICI, role: MEDICI_ROLE, title: "Şube müdürüne güven ama denetle",
    body: "Medici Bankası'nın Brugge ve Londra şubelerinin müdürleri, merkezden uzakta riskli krediler verdi ve büyük zararlar yazdı. Uzaktaki yöneticilerin yeterince denetlenmemesi bankayı zayıflattı.",
    example: "Yatırımcılar şirket yönetiminin ve bağımsız denetimin kalitesine bu yüzden önem verir; denetim raporundaki çekinceler dikkatle okunmalıdır.",
  },
  {
    who: MEDICI, role: MEDICI_ROLE, title: "Patron işten koparsa şirket zayıflar",
    body: "Bankayı büyüten Cosimo de' Medici işin başındayken temkinli ve titizdi. Torunu Lorenzo ise siyasete ve sanata daha çok zaman ayırdı; bankanın işleri bu dönemde geriledi.",
    example: "Hâkim ortağı ya da yönetimi değişen şirketlerde yeni yönetimin işe ne kadar odaklandığı yakından izlenmelidir.",
  },
  {
    who: GRAHAM, role: GRAHAM_ROLE, title: "Güvenlik marjı",
    body: "Bir hisseyi gerçek değerinin belirgin şekilde altında almak, hesaplarında yanılsan bile seni korur. Graham buna güvenlik marjı der.",
    example: "Değerini 100 TL hesapladığın bir hisseyi 95 TL'den değil, 65–70 TL'den almak hata payı bırakır.",
    link: { href: "/radar", label: "Radar'da ucuz hisseleri tara" },
  },
  {
    who: GRAHAM, role: GRAHAM_ROLE, title: "Bay Piyasa",
    body: "Graham piyasayı her gün kapını çalıp fiyat teklif eden, bazen aşırı neşeli bazen aşırı karamsar bir ortağa benzetir. Onun ruh haline uymak zorunda değilsin; teklifini beğenirsen kullanırsın.",
    example: "Borsanın sert düştüğü bir günde iyi bir şirketin hissesi ucuzlamış olabilir; piyasanın korkusu sana fırsat verebilir.",
  },
  {
    who: GRAHAM, role: GRAHAM_ROLE, title: "Kısa vadede oylama, uzun vadede tartı",
    body: "Graham'a göre piyasa kısa vadede hisselerin popülerliğini oylar, uzun vadede ise şirketin gerçek değerini tartar.",
    example: "Bir hisse haberle birkaç gün tavan yapabilir; ama yıllar içinde fiyatını belirleyen şirketin kârı ve büyümesidir.",
  },
  {
    who: GRAHAM, role: GRAHAM_ROLE, title: "Yatırım ile spekülasyon farkı",
    body: "Graham'a göre yatırım; ciddi analizle anaparayı korumayı ve makul bir getiriyi hedefler. Bu şartları taşımayan işlem spekülasyondur.",
    example: "Bilançosunu incelemeden sadece yükseliyor diye alınan hisse spekülasyondur; bunu bilerek yapmak ayrı, farkında olmadan yapmak ayrıdır.",
    link: { href: "/bilancolar", label: "Bilançolar" },
  },
  {
    who: GRAHAM, role: GRAHAM_ROLE, title: "Defter değerinin altında",
    body: "Graham, piyasa değeri özkaynağının (defter değerinin) altında işlem gören sağlam şirketleri fırsat olarak görürdü.",
    example: "PD/DD oranı 1'in altında olan hisseler bu yüzden takip edilir; ama düşük oranın bir nedeni olabilir, kârlılığa da bakılmalıdır.",
    link: { href: "/sozluk/pd-dd-orani", label: "PD/DD nedir?" },
  },
  {
    who: BUFFETT, role: BUFFETT_ROLE, title: "Anladığın işe yatırım yap",
    body: "Buffett, ne yaptığını ve nasıl para kazandığını anlamadığı şirketlere yatırım yapmaz. Ona göre yeterlilik alanını bilmek, onu genişletmekten önemlidir.",
    example: "Bir şirketin ne sattığını, kime sattığını ve rakiplerini bir cümleyle anlatamıyorsan, o hisseyi almadan önce biraz daha araştırmak gerekir.",
  },
  {
    who: BUFFETT, role: BUFFETT_ROLE, title: "Hendek (rekabet avantajı)",
    body: "Buffett, rakiplerin kolayca kopyalayamadığı bir avantajı olan şirketleri sever: güçlü marka, maliyet üstünlüğü ya da müşterinin vazgeçemediği ürün.",
    example: "Yıllarca yüksek kâr marjını koruyabilen şirketlerin çoğunda böyle bir avantaj vardır; Radar'da yüksek marjlı şirketleri bulabilirsin.",
    link: { href: "/radar", label: "Hisse Radar" },
  },
  {
    who: BUFFETT, role: BUFFETT_ROLE, title: "Başkaları açgözlüyken kork",
    body: "Buffett'a göre herkes coşkuluyken temkinli, herkes korkmuşken cesur olmak uzun vadede kazandırır.",
    example: "Herkesin aynı hisseyi konuştuğu dönemler genellikle fiyatın pahalandığı, herkesin borsadan kaçtığı dönemler ise ucuzladığı zamanlardır.",
  },
  {
    who: BUFFETT, role: BUFFETT_ROLE, title: "Zaman iyi şirketin dostudur",
    body: "İyi bir şirketin hissesini uzun süre tutmak, kârın birikmesine ve bileşik getirinin çalışmasına izin verir. Sık al-sat ise masraf ve hata demektir.",
    example: "Her yıl %15 değer kazanan bir yatırım 10 yılda yaklaşık 4 katına çıkar; bunun için sabırla tutmak gerekir.",
  },
  {
    who: BUFFETT, role: BUFFETT_ROLE, title: "Fiyat ödediğin, değer aldığındır",
    body: "Bir hissenin fiyatı ile şirketin değeri aynı şey değildir. Önemli olan, ödediğin fiyata karşılık ne kadar değer aldığındır.",
    example: "Aynı sektörden iki şirketten F/K'sı daha düşük olan her zaman daha ucuz değildir; büyümesine ve borcuna da bakmak gerekir.",
    link: { href: "/sozluk/f-k-orani", label: "F/K nedir?" },
  },
  {
    who: SMITH, role: SMITH_ROLE, title: "Görünmez el",
    body: "Adam Smith'e göre insanlar kendi çıkarları için çalışırken, piyasa sayesinde farkında olmadan toplumun da işine yarayan sonuçlar ortaya çıkar.",
    example: "Fırıncı ekmeği iyilikten değil kazanç için üretir; yine de sabah hepimiz taze ekmek buluruz. Borsa da tasarrufu, onu iyi kullanacak şirketlere yönlendirir.",
  },
  {
    who: SMITH, role: SMITH_ROLE, title: "İş bölümü",
    body: "Smith'in iğne fabrikası örneğinde, işi parçalara bölüp her işçiyi bir aşamada uzmanlaştırmak üretimi kat kat artırır. Verimlilik, zenginliğin kaynağıdır.",
    example: "Aynı satışla daha fazla kâr eden şirketlerin marjları yükselir; FAVÖK marjı bir şirketin ne kadar verimli çalıştığının işaretidir.",
    link: { href: "/sozluk/favok", label: "FAVÖK nedir?" },
  },
  {
    who: SMITH, role: SMITH_ROLE, title: "Rekabet fiyatı düşürür",
    body: "Smith'e göre rakiplerin serbestçe girebildiği piyasalarda fiyatlar maliyete yaklaşır ve aşırı kâr uzun süre korunamaz.",
    example: "Yeni rakiplerin kolayca girdiği sektörlerde kâr marjları zamanla daralır; sektör ortalamalarına bakmak bu yüzden faydalıdır.",
    link: { href: "/piyasa#sektorler", label: "Sektör ortalamaları" },
  },
  {
    who: KEYNES, role: KEYNES_ROLE, title: "Piyasa senden uzun süre mantıksız kalabilir",
    body: "Keynes'e atfedilen bu ders şunu söyler: haklı olman, piyasanın sana hemen hak vereceği anlamına gelmez. Borçla yapılan yatırımda bu bekleyişi taşıyamayabilirsin.",
    example: "Kredili işlemle aldığın ucuz bir hisse daha da ucuzlarsa, teminat tamamlama çağrısı seni haklı çıkmadan önce satmaya zorlayabilir.",
    link: { href: "/sozluk/kredili-islem", label: "Kredili işlem nedir?" },
  },
  {
    who: KEYNES, role: KEYNES_ROLE, title: "Güzellik yarışması",
    body: "Keynes borsayı, en güzeli değil, diğerlerinin en güzel bulacağını tahmin etmeye çalışılan bir yarışmaya benzetti. Fiyatlar beklentilerin beklentisiyle oluşur.",
    example: "Bilanço beklentinin üzerinde gelse bile hisse düşebilir; çünkü piyasa daha da iyisini bekliyor olabilir.",
  },
  {
    who: KEYNES, role: KEYNES_ROLE, title: "Hayvansal güdüler",
    body: "Keynes, yatırım kararlarının yalnızca hesapla değil, güven, korku ve iyimserlik gibi duygularla da verildiğini anlattı.",
    example: "Aynı veriler varken piyasanın bir hafta coşup ertesi hafta panik yapması bu duyguların etkisidir.",
  },
  {
    who: KEYNES, role: KEYNES_ROLE, title: "Uzun vadede hepimiz ölüyüz",
    body: "Keynes bu sözle, sorunların kendiliğinden düzelmesini beklemenin bazen çok uzun süreceğini, bugün harekete geçmek gerektiğini anlatmak istemişti.",
    example: "Yatırımda uzun vade önemlidir ama 'nasılsa toparlar' diye zararına bakmadan beklemek de bir karardır; nedenini sorgulamak gerekir.",
  },
  {
    who: "Albert Einstein'a atfedilir", role: "Bileşik faiz", title: "Dünyanın sekizinci harikası",
    body: "Bileşik getiri, kazancın da kazanç getirmesidir. Zaman uzadıkça etkisi katlanarak büyür. Sözün Einstein'a ait olduğu kesin değildir ama fikir doğrudur.",
    example: "Temettüleri harcamayıp aynı hisseye yeniden yatıran yatırımcı, zamanla daha fazla hisseye ve daha fazla temettüye sahip olur.",
    link: { href: "/hesaplama#temettu", label: "Temettü geliri hesapla" },
  },
  {
    who: "Harry Markowitz", role: "Nobel Ekonomi Ödülü 1990, portföy teorisi", title: "Çeşitlendirme bedava öğle yemeğidir",
    body: "Markowitz, birlikte hareket etmeyen varlıkları bir arada tutmanın, getiriden fazla vazgeçmeden riski azalttığını gösterdi.",
    example: "Tüm parayı tek bir sektöre yatırmak yerine farklı sektörlere ve varlıklara dağıtmak, tek bir kötü haberin etkisini azaltır.",
  },
  {
    who: "Peter Lynch", role: "Fon yöneticisi, Fidelity Magellan", title: "Bildiğin şeye yatırım yap",
    body: "Lynch, iyi yatırım fikirlerinin çoğunun günlük hayatta, sevdiğin ürünlerde ve kalabalık mağazalarda görülebileceğini söyler. Ama her fikir mutlaka bilançoyla doğrulanmalıdır.",
    example: "Sürekli dolu gördüğün bir mağaza zincirinin hissesine bakmak iyi bir başlangıçtır; sonra satış büyümesini ve borcunu incelemek gerekir.",
  },
  {
    who: "Peter Lynch", role: "Fon yöneticisi, Fidelity Magellan", title: "Hikâyeye değil, kâra bak",
    body: "Lynch'e göre hisse fiyatları uzun vadede şirketin kârını izler. Heyecan verici bir hikâyesi olup kâr etmeyen şirketler risklidir.",
    example: "F/K oranı hesaplanamayan, yani zarar eden şirketlerde yatırım tamamen gelecekteki kâr beklentisine dayanır.",
  },
  {
    who: "John Bogle", role: "Endeks fonlarının öncüsü, Vanguard", title: "Masraf getiriyi yer",
    body: "Bogle, yatırım masraflarının küçük görünse bile uzun vadede getirinin önemli bir kısmını alıp götürdüğünü gösterdi.",
    example: "Yıllık %2 masraflı bir fon ile %0,5 masraflı bir fon arasındaki fark, 20 yılda birikimin dörtte birine yaklaşabilir.",
    link: { href: "/fonlar", label: "Fonları karşılaştır" },
  },
  {
    who: "John Bogle", role: "Endeks fonlarının öncüsü, Vanguard", title: "Samanlıkta iğne arama, samanlığı al",
    body: "Bogle'a göre kazanan hisseyi bulmaya çalışmak yerine piyasanın tamamını alan düşük maliyetli bir endeks fonu, çoğu yatırımcı için daha iyi sonuç verir.",
    example: "BIST 100'ü izleyen bir borsa yatırım fonu, tek tek hisse seçmeden endeksin getirisini almanın bir yoludur.",
    link: { href: "/endeksler", label: "Endeksler" },
  },
  {
    who: "Milton Friedman", role: "Nobel Ekonomi Ödülü 1976", title: "Enflasyon parasal bir olgudur",
    body: "Friedman'a göre kalıcı enflasyonun temel nedeni, para miktarının üretimden hızlı artmasıdır.",
    example: "Yüksek enflasyon dönemlerinde yatırımcılar paralarının değerini korumak için hisse, altın ya da döviz gibi varlıklara yönelir.",
    link: { href: "/piyasa#ekonomik-takvim", label: "Enflasyon açıklama tarihleri" },
  },
  {
    who: "Milton Friedman", role: "Nobel Ekonomi Ödülü 1976", title: "Bedava öğle yemeği yoktur",
    body: "Her şeyin bir maliyeti vardır; bir şeyi seçmek, başka bir şeyden vazgeçmek demektir. Ekonomide buna fırsat maliyeti denir.",
    example: "Paranı mevduatta tutmanın da maliyeti var: hisseye ya da başka bir yatırıma yatırsaydın elde edebileceğin getiri.",
  },
  {
    who: "Joseph Schumpeter", role: "İktisatçı", title: "Yaratıcı yıkım",
    body: "Schumpeter'e göre kapitalizmin motoru, yeni teknolojilerin ve şirketlerin eskileri yıkıp yerlerini almasıdır.",
    example: "Endeksteki şirketler zamanla değişir; bir dönemin dev şirketi yeniliğe ayak uyduramazsa yerini yenilere bırakır.",
  },
  {
    who: "Irving Fisher", role: "İktisatçı", title: "Reel faiz",
    body: "Fisher, gerçek getirinin, kazanılan faizden enflasyonun çıkarılmasıyla bulunduğunu gösterdi.",
    example: "Mevduat %45 faiz verirken enflasyon %40 ise gerçek kazanç yaklaşık %5'tir. Hisse getirilerini de enflasyonla karşılaştırmak gerekir.",
  },
  {
    who: "Charlie Munger", role: "Yatırımcı, Buffett'ın ortağı", title: "Tersinden düşün",
    body: "Munger, bir hedefe nasıl ulaşacağını düşünmenin yanında, neyin seni kesin başarısızlığa götüreceğini düşünüp ondan kaçınmayı önerir.",
    example: "Nasıl kazanırım yerine nasıl batarım diye sor: aşırı borç, tek hisse ve anlamadığın işe yatırım listenin başında çıkar.",
  },
  {
    who: "Charlie Munger", role: "Yatırımcı, Buffett'ın ortağı", title: "Sabır kazandırır",
    body: "Munger'a göre büyük kazançlar sık işlemle değil, doğru fırsatı bekleyip geldiğinde kararlı davranmakla elde edilir.",
    example: "Takip listende iyi şirketleri tutup makul fiyata gelmelerini beklemek bu sabrın bir yoludur.",
    link: { href: "/izleme-listesi", label: "İzleme listesi" },
  },
  {
    who: "Howard Marks", role: "Yatırımcı, Oaktree Capital", title: "İkinci seviye düşünce",
    body: "Marks'a göre 'iyi şirket, alalım' birinci seviye düşüncedir. İkinci seviye ise şunu sorar: herkes zaten iyi biliyorsa, fiyat bunu yansıtmış mı?",
    example: "Herkesin çok iyi dediği bir şirketin hissesi pahalı olabilir; sıradan görünen bir şirketin hissesi ise ucuz kalmış olabilir.",
  },
  {
    who: "Howard Marks", role: "Yatırımcı, Oaktree Capital", title: "Piyasalar sarkaç gibidir",
    body: "Piyasa duygusu aşırı iyimserlik ile aşırı karamsarlık arasında gidip gelir ve ortada nadiren uzun süre kalır.",
    example: "52 haftanın zirvesindeki ve dibindeki hisseler bu sarkacın iki ucunu gösterir.",
    link: { href: "/piyasa#zirve-dip", label: "Zirve ve dipteki hisseler" },
  },
  {
    who: "Daniel Kahneman", role: "Psikolog, 2002 Nobel Ekonomi Ödülü", title: "Kayıptan kaçınma",
    body: "Kahneman, insanların kaybetmenin acısını aynı miktarı kazanmanın sevincinden daha güçlü hissettiğini gösterdi.",
    example: "Yatırımcılar zarardaki hisseyi 'toparlasın' diye uzun süre tutar, kârdaki hisseyi ise erken satar. Bu eğilimin farkında olmak önemlidir.",
  },
  {
    who: "Daniel Kahneman", role: "Psikolog, 2002 Nobel Ekonomi Ödülü", title: "Çapalama",
    body: "İnsanlar karar verirken ilk gördükleri sayıya takılır ve sonraki tahminlerini ona göre ayarlar.",
    example: "Bir hisseyi '100 TL'den aldım' diye o fiyatı referans almak yanıltıcıdır; piyasa senin alış fiyatını bilmez.",
    link: { href: "/hesaplama#maliyet", label: "Ortalama maliyet hesapla" },
  },
  {
    who: "Richard Thaler", role: "2017 Nobel Ekonomi Ödülü", title: "Zihinsel muhasebe",
    body: "Thaler, insanların parayı zihinlerinde farklı kutulara ayırdığını ve aynı parayı kaynağına göre farklı harcadığını gösterdi.",
    example: "Temettüden gelen parayı 'bedava para' gibi görüp kolayca harcamak yaygındır; oysa o da yatırımın getirisinin bir parçasıdır.",
  },
  {
    who: "Eugene Fama", role: "2013 Nobel Ekonomi Ödülü", title: "Etkin piyasalar",
    body: "Fama'ya göre fiyatlar herkesin bildiği bilgiyi hızla yansıtır; bu yüzden herkesin bildiği bir haberle sürekli kazanmak zordur.",
    example: "KAP'ta yayımlanan bir haber dakikalar içinde fiyata yansır. Avantaj, haberi herkesten iyi yorumlamaktan gelir.",
    link: { href: "/izleme-listesi", label: "KAP bildirimlerini takip et" },
  },
  {
    who: "Robert Shiller", role: "2013 Nobel Ekonomi Ödülü", title: "Akıl dışı coşku",
    body: "Shiller, fiyatların bazen hikâyeler ve sürü davranışıyla şirketlerin gerçek değerinden uzun süre uzaklaşabildiğini gösterdi.",
    example: "Bir sektör herkesin dilindeyken F/K oranları tarihsel ortalamalarının çok üzerine çıkabilir; sektör ortalamalarıyla karşılaştırmak uyarıcı olur.",
    link: { href: "/piyasa#sektorler", label: "Sektör ortalamaları" },
  },
  {
    who: "David Ricardo", role: "İktisatçı, 19. yüzyıl", title: "Karşılaştırmalı üstünlük",
    body: "Ricardo, her ülkenin en verimli olduğu işte uzmanlaşıp ticaret yapmasının herkesi zenginleştirdiğini gösterdi.",
    example: "İhracat ağırlıklı şirketlerin kârları kur ve dış talepten etkilenir; dış ticaret verileri bu yüzden takip edilir.",
    link: { href: "/piyasa#ekonomik-takvim", label: "Dış ticaret açıklama tarihleri" },
  },
  {
    who: "Benjamin Franklin", role: "ABD'nin kurucularından", title: "Zaman paradır",
    body: "Franklin'in bu öğüdü, boşa geçen zamanın da kaybedilen bir kazanç olduğunu hatırlatır.",
    example: "Yatırıma erken başlamak, bileşik getirinin daha uzun süre çalışması demektir; küçük ama düzenli birikim yıllar içinde büyür.",
  },
  {
    who: "Benjamin Franklin", role: "ABD'nin kurucularından", title: "Bilgiye yatırım en iyi faizi getirir",
    body: "Franklin, öğrenmeye yapılan yatırımın en kârlı yatırım olduğunu söyler.",
    example: "Bir terimi anlamadan işlem yapmak yerine birkaç dakika okumak, pahalı bir hatadan kurtarabilir.",
    link: { href: "/sozluk", label: "Borsa Sözlüğü" },
  },
  {
    who: "Jesse Livermore", role: "Ünlü spekülatör, 1900'ler", title: "Piyasa her zaman haklıdır",
    body: "Livermore'un en bilinen derslerinden biri: piyasa senin fikrine uymak zorunda değildir; zararda inat etmek, zararı büyütür.",
    example: "Zarar durdurma seviyesi belirlemek, yanıldığında küçük bir kayıpla çıkmanın yoludur.",
  },
  {
    who: "John Templeton", role: "Yatırımcı ve fon yöneticisi", title: "Boğa piyasası karamsarlıkta doğar",
    body: "Templeton'a göre yükseliş dönemleri karamsarlıkta doğar, şüphecilikle büyür, iyimserlikle olgunlaşır ve coşkuyla biter.",
    example: "Herkesin borsadan çıktığı dönemler genellikle yeni yükselişlerin başladığı zamanlardır.",
  },
  {
    who: "John Templeton", role: "Yatırımcı ve fon yöneticisi", title: "Bu sefer farklı değil",
    body: "Templeton, 'bu sefer farklı' cümlesini yatırımdaki en tehlikeli dört kelime olarak görürdü.",
    example: "Her yükseliş döneminde fiyatların artık hiç düşmeyeceğine dair yeni bir hikâye anlatılır; tarih çoğu zaman tekrar eder.",
  },
  {
    who: "Philip Fisher", role: "Büyüme yatırımının öncüsü", title: "Dedikodu yöntemi",
    body: "Fisher, bir şirketi anlamak için müşterileriyle, tedarikçileriyle ve rakipleriyle konuşmayı önerirdi.",
    example: "Bir şirketin ürününü kullananlardan, bayilerinden ya da çalışanlarından duyduklarınız bilançonun anlatmadıklarını anlatabilir.",
  },
  {
    who: "Philip Fisher", role: "Büyüme yatırımının öncüsü", title: "İyi şirketi satmak için acele etme",
    body: "Fisher'a göre doğru seçilmiş büyüyen bir şirketi satmanın tek iyi nedeni, şirketin artık o özelliklerini kaybetmesidir.",
    example: "Hisse çok yükseldi diye satmak yerine, şirketin büyümesinin ve kârlılığının sürüp sürmediğine bakmak gerekir.",
  },
  {
    who: "Nassim Taleb", role: "Yazar, risk düşünürü", title: "Siyah kuğu",
    body: "Taleb, hiç beklenmeyen ve çok büyük etki yaratan olayların tarihi şekillendirdiğini, bu yüzden risk hesaplarının fazla güvenilmemesi gerektiğini anlattı.",
    example: "Portföyü tek bir senaryoya göre kurmak yerine beklenmedik olaylara dayanabilecek şekilde dağıtmak bu yüzden önemlidir.",
  },
  {
    who: "Nassim Taleb", role: "Yazar, risk düşünürü", title: "Kırılganlığın tersi",
    body: "Taleb, bazı sistemlerin şoklardan zarar görmek yerine güçlendiğini söyler. Borcu az, nakdi bol şirketler krizlerde rakiplerini geride bırakabilir.",
    example: "Net nakit pozisyonundaki şirketler zor dönemlerde ucuzlayan fırsatları değerlendirebilir.",
    link: { href: "/sozluk/net-borc", label: "Net borç nedir?" },
  },
  {
    who: "Hyman Minsky", role: "İktisatçı", title: "İstikrar istikrarsızlığı doğurur",
    body: "Minsky'ye göre uzun sakin dönemler insanları daha fazla borçlanmaya ve risk almaya iter; bu da bir sonraki krizin tohumlarını eker.",
    example: "Uzun süre yükselen piyasalarda kredili işlemler artar; ani bir düşüş zincirleme satışlara yol açabilir.",
  },
  {
    who: "Ray Dalio", role: "Yatırımcı, Bridgewater", title: "Borç döngüleri",
    body: "Dalio, ekonomilerin borcun arttığı ve azaldığı döngülerden geçtiğini, bu döngüleri anlamanın piyasaları anlamak için önemli olduğunu anlatır.",
    example: "Faiz kararları borçlanma maliyetini değiştirir; bu yüzden TCMB toplantıları borsada yakından izlenir.",
    link: { href: "/piyasa#ekonomik-takvim", label: "Faiz kararı tarihleri" },
  },
  {
    who: "André Kostolany", role: "Borsa yazarı ve spekülatör", title: "Köpek ve sahibi",
    body: "Kostolany ekonomiyi sahibine, borsayı ise onunla yürürken ileri geri koşan köpeğe benzetir. Köpek bazen öne geçer bazen geride kalır ama sonunda sahibiyle aynı yere varır.",
    example: "Hisse fiyatları kısa vadede şirket kârından kopabilir ama uzun vadede yine kâr ile aynı yöne gider.",
  },
  {
    who: "André Kostolany", role: "Borsa yazarı ve spekülatör", title: "Uyku hapı al",
    body: "Kostolany, iyi hisseleri aldıktan sonra yıllarca fiyatlara bakmadan beklemenin çoğu zaman en iyi sonucu verdiğini söyler.",
    example: "Günlük fiyat hareketlerine göre sürekli karar değiştirmek yerine, şirketin çeyreklik sonuçlarını takip etmek yeterli olabilir.",
    link: { href: "/bilancolar/yaklasan", label: "Bilanço takvimi" },
  },
];

/** İstanbul tarihine göre bugünün fikri (her gece yarısı değişir) */
export function ideaIndex(now: Date = new Date()): number {
  const day = Math.floor((now.getTime() + 3 * 3600_000) / 86400_000);
  return ((day % IDEAS.length) + IDEAS.length) % IDEAS.length;
}
