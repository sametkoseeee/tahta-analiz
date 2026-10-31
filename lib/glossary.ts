/** Borsa sözlüğü: /sozluk ve /sozluk/[slug] sayfaları (Google'da "X nedir" aramaları için) */
export type Term = {
  slug: string;
  term: string;
  /** Tek cümlelik özet (liste ve açıklama etiketi) */
  short: string;
  body: string[];
  formula?: string;
  example?: string;
  /** Sitedeki ilgili araç */
  link?: { href: string; label: string };
  related?: string[];
};

export const GLOSSARY: Term[] = [
  {
    slug: "f-k-orani",
    term: "F/K Oranı (Fiyat/Kazanç)",
    short: "Şirketin piyasa değerinin son 12 aylık net kârına oranı.",
    body: [
      "F/K, yatırımcının şirketin bir liralık yıllık kârı için kaç lira ödediğini gösterir. Genel olarak düşük F/K hissenin kârına göre ucuz, yüksek F/K pahalı olduğu şeklinde yorumlanır; ancak hızlı büyüyen şirketlerin F/K'sı doğal olarak yüksek olur.",
      "Zarar eden şirketlerin F/K'sı anlamlı değildir. F/K'yı en doğru şekilde aynı sektördeki şirketlerle karşılaştırmak gerekir; bankaların F/K'sı ile teknoloji şirketlerininki farklı seviyelerde seyreder.",
    ],
    formula: "F/K = Piyasa değeri / Son 12 ay net kâr",
    example: "Piyasa değeri 10 milyar TL, son 12 ay net kârı 2 milyar TL olan şirketin F/K'sı 5'tir.",
    link: { href: "/radar", label: "Hisse Radar'da F/K'ya göre tara" },
    related: ["pd-dd-orani", "fd-favok", "piyasa-degeri"],
  },
  {
    slug: "pd-dd-orani",
    term: "PD/DD Oranı (Piyasa Değeri / Defter Değeri)",
    short: "Şirketin piyasa değerinin özkaynağına (defter değerine) oranı.",
    body: [
      "PD/DD, piyasanın şirkete bilançodaki özkaynağının kaç katı değer biçtiğini gösterir. 1'in altındaki PD/DD, hissenin özkaynağından daha düşük fiyatlandığı anlamına gelir.",
      "Özellikle bankalar ve gayrimenkul yatırım ortaklıkları gibi varlık ağırlıklı şirketlerin değerlemesinde kullanılır. Yüksek kârlılığa (ROE) sahip şirketlerin PD/DD'si genellikle yüksektir.",
    ],
    formula: "PD/DD = Piyasa değeri / Ana ortaklık özkaynakları",
    example: "Piyasa değeri 6 milyar TL, özkaynağı 3 milyar TL olan şirketin PD/DD'si 2'dir.",
    link: { href: "/radar", label: "Hisse Radar'da PD/DD'ye göre tara" },
    related: ["f-k-orani", "ozkaynak-karliligi"],
  },
  {
    slug: "favok",
    term: "FAVÖK (Faiz, Amortisman ve Vergi Öncesi Kâr)",
    short: "Şirketin esas faaliyetlerinden elde ettiği, finansman ve amortisman etkisinden arındırılmış kâr.",
    body: [
      "FAVÖK (İngilizcesi EBITDA), şirketin ana işinden ne kadar nakit yarattığına yaklaşık bir ölçü verir. Borç yapısından, vergi oranından ve amortisman yönteminden etkilenmediği için farklı şirketleri karşılaştırmakta kullanılır.",
      "FAVÖK marjı (FAVÖK / Hasılat), şirketin satışlarının ne kadarını faaliyet kârına çevirdiğini gösterir.",
    ],
    formula: "FAVÖK = Esas faaliyet kârı + Amortisman ve itfa payları",
    related: ["fd-favok", "net-kar-marji"],
  },
  {
    slug: "fd-favok",
    term: "FD/FAVÖK (Firma Değeri / FAVÖK)",
    short: "Şirketin borçlarıyla birlikte değerinin yıllık FAVÖK'üne oranı.",
    body: [
      "FD/FAVÖK, F/K'ya benzer bir değerleme oranıdır ancak şirketin borcunu da hesaba katar. Bu yüzden borçluluğu farklı şirketleri karşılaştırmada F/K'dan daha sağlıklıdır.",
      "Düşük FD/FAVÖK görece ucuzluğa işaret eder. Bankalar ve finans şirketleri için kullanılmaz.",
    ],
    formula: "FD/FAVÖK = (Piyasa değeri + Net borç) / Son 12 ay FAVÖK",
    related: ["favok", "firma-degeri", "net-borc"],
  },
  {
    slug: "ozkaynak-karliligi",
    term: "Özkaynak Kârlılığı (ROE)",
    short: "Şirketin net kârının özkaynağına oranı; ortakların parasının ne kadar verimli kullanıldığını gösterir.",
    body: [
      "ROE yüksek olan şirket, ortaklarının koyduğu sermaye ile daha fazla kâr üretiyor demektir. Enflasyonun yüksek olduğu dönemlerde ROE'yi enflasyonla birlikte değerlendirmek gerekir.",
    ],
    formula: "ROE = Son 12 ay net kâr / Özkaynaklar",
    link: { href: "/radar", label: "Hisse Radar'da ROE'ye göre tara" },
    related: ["pd-dd-orani", "net-kar-marji"],
  },
  {
    slug: "net-kar-marji",
    term: "Net Kâr Marjı",
    short: "Şirketin satışlarının yüzde kaçının net kâra dönüştüğü.",
    body: [
      "Net kâr marjı, giderler, faiz ve vergiler düşüldükten sonra her 100 liralık satıştan kaç liranın kâr olarak kaldığını gösterir. Sektörden sektöre çok farklılık gösterir: perakende şirketlerinde düşük, yazılım şirketlerinde yüksek olur.",
    ],
    formula: "Net kâr marjı = Net kâr / Hasılat",
    related: ["favok", "ozkaynak-karliligi"],
  },
  {
    slug: "piyasa-degeri",
    term: "Piyasa Değeri",
    short: "Şirketin tüm paylarının borsadaki toplam değeri.",
    body: [
      "Piyasa değeri, hisse fiyatı ile toplam pay adedinin çarpımıdır ve şirketin borsadaki büyüklüğünü gösterir. Türkiye'de pay başına nominal değer genellikle 1 TL olduğundan ödenmiş sermaye pay adedine eşittir.",
    ],
    formula: "Piyasa değeri = Hisse fiyatı × Toplam pay adedi",
    link: { href: "/piyasa", label: "Isı haritasında piyasa değerlerini gör" },
    related: ["firma-degeri", "f-k-orani"],
  },
  {
    slug: "firma-degeri",
    term: "Firma Değeri (FD)",
    short: "Piyasa değerine net borcun eklenmesiyle bulunan, şirketin toplam değeri.",
    body: [
      "Firma değeri, bir şirketi borçlarıyla birlikte satın almanın maliyetini temsil eder. Nakdi borcundan fazla olan şirketlerde net borç eksi çıkar ve firma değeri piyasa değerinin altında kalır.",
    ],
    formula: "FD = Piyasa değeri + Net borç",
    related: ["net-borc", "fd-favok"],
  },
  {
    slug: "net-borc",
    term: "Net Borç",
    short: "Şirketin finansal borçlarından nakit ve benzerlerinin düşülmesiyle kalan borç.",
    body: [
      "Net borç, şirketin elindeki nakitle kapatamadığı borç miktarını gösterir. Net borç / FAVÖK oranı, borcun kaç yıllık faaliyet kârıyla ödenebileceğine dair kaba bir ölçüdür; 3'ün üzeri genellikle yüksek kabul edilir.",
    ],
    formula: "Net borç = Finansal borçlar − Nakit ve nakit benzerleri − Finansal yatırımlar",
    related: ["firma-degeri", "cari-oran"],
  },
  {
    slug: "cari-oran",
    term: "Cari Oran",
    short: "Dönen varlıkların kısa vadeli yükümlülüklere oranı; kısa vadeli ödeme gücü.",
    body: [
      "Cari oran 1'in üzerindeyse şirketin bir yıl içinde nakde dönecek varlıkları, bir yıl içinde ödemesi gereken borçlarından fazladır. Çok düşük cari oran likidite sıkıntısına işaret edebilir.",
    ],
    formula: "Cari oran = Dönen varlıklar / Kısa vadeli yükümlülükler",
    related: ["net-borc"],
  },
  {
    slug: "temettu",
    term: "Temettü (Kâr Payı)",
    short: "Şirketin kârının bir kısmını ortaklarına nakit ya da pay olarak dağıtması.",
    body: [
      "Temettü dağıtımına şirketin genel kurulu karar verir ve tutar KAP'ta açıklanır. Nakit temettüde pay başına brüt tutar açıklanır; yatırımcının hesabına stopaj kesildikten sonraki net tutar yatar.",
      "Hisseyi temettü ödeme gününden önceki işlem gününün kapanışında elinde tutan yatırımcı temettüyü alır. Ödeme günü hisse fiyatı temettü tutarı kadar düşük açılır.",
    ],
    link: { href: "/temettu", label: "Temettü takvimini gör" },
    related: ["temettu-verimi", "stopaj"],
  },
  {
    slug: "temettu-verimi",
    term: "Temettü Verimi",
    short: "Pay başına yıllık temettünün hisse fiyatına oranı.",
    body: [
      "Temettü verimi, hisseye yatırılan paranın yüzde kaçının temettü olarak geri döndüğünü gösterir. Geçmiş temettüye göre hesaplanır; şirketin gelecekte aynı tutarı dağıtacağının garantisi yoktur.",
    ],
    formula: "Temettü verimi = Pay başına brüt temettü / Hisse fiyatı",
    example: "Fiyatı 50 TL olan ve pay başına 4 TL brüt temettü veren hissenin verimi %8'dir.",
    link: { href: "/hesaplama#temettu", label: "Temettü gelirini hesapla" },
    related: ["temettu", "stopaj"],
  },
  {
    slug: "stopaj",
    term: "Temettü Stopajı",
    short: "Nakit temettü ödemesinden kaynakta kesilen vergi.",
    body: [
      "Şirket temettüyü öderken stopaj vergisini keser ve yatırımcıya net tutarı öder. Oran mevzuata göre değişebilir; şirketlerin KAP'taki temettü bildirimlerinde brüt ve net tutar birlikte yer alır.",
    ],
    formula: "Net temettü = Brüt temettü × (1 − Stopaj oranı)",
    related: ["temettu", "temettu-verimi"],
  },
  {
    slug: "bedelsiz-sermaye-artirimi",
    term: "Bedelsiz Sermaye Artırımı",
    short: "Şirketin iç kaynaklarını sermayeye ekleyerek ortaklara ücretsiz yeni pay vermesi.",
    body: [
      "Bedelsiz sermaye artırımında yatırımcı para ödemeden yeni pay alır; örneğin %100 bedelsizde her 1 paya 1 yeni pay verilir. Şirketin toplam değeri değişmediği için hisse fiyatı aynı oranda düzeltilir: 100 TL'lik hisse %100 bedelsiz sonrası 50 TL'den işlem görmeye başlar.",
      "Bedelsiz, şirkete para girişi sağlamaz; ancak yatırımcılar tarafından genellikle olumlu karşılanır.",
    ],
    formula: "Düzeltilmiş fiyat = Eski fiyat / (1 + Bedelsiz oranı)",
    link: { href: "/hesaplama#sermaye", label: "Sermaye artırımı hesaplayıcısı" },
    related: ["bedelli-sermaye-artirimi", "ruchan-hakki"],
  },
  {
    slug: "bedelli-sermaye-artirimi",
    term: "Bedelli Sermaye Artırımı",
    short: "Şirketin yeni pay satarak ortaklarından nakit toplaması.",
    body: [
      "Bedelli sermaye artırımında mevcut ortaklar, sahip oldukları pay oranında yeni payları genellikle 1 TL nominal fiyattan alma hakkına (rüçhan hakkı) sahiptir. Şirkete nakit girer; bu nakit borç ödemek ya da yatırım yapmak için kullanılır.",
    ],
    link: { href: "/sermaye-artirimi", label: "Süren sermaye artırımlarını gör" },
    related: ["ruchan-hakki", "bedelsiz-sermaye-artirimi", "tahsisli-sermaye-artirimi"],
  },
  {
    slug: "ruchan-hakki",
    term: "Rüçhan Hakkı",
    short: "Mevcut ortakların bedelli sermaye artırımında yeni payları öncelikle alma hakkı.",
    body: [
      "Rüçhan hakkı kullanım süresi boyunca ortaklar yeni payları belirlenen fiyattan alabilir. Hakkını kullanmak istemeyen yatırımcı, rüçhan hakkı kuponunu borsada satabilir. Kullanılmayan haklar genellikle sonradan borsada satışa sunulur.",
    ],
    link: { href: "/hesaplama#ruchan", label: "Rüçhan hakkı değerini hesapla" },
    related: ["bedelli-sermaye-artirimi"],
  },
  {
    slug: "tahsisli-sermaye-artirimi",
    term: "Tahsisli Sermaye Artırımı",
    short: "Yeni payların belirli bir yatırımcıya, mevcut ortakların rüçhan hakkı kısıtlanarak satılması.",
    body: [
      "Tahsisli artırımda yeni paylar halka açık değil, önceden belirlenmiş bir kişi ya da kuruma satılır. Mevcut ortakların payı sulanır; bu yüzden tahsis fiyatı ve alıcının kim olduğu yatırımcılar için önemlidir.",
    ],
    related: ["bedelli-sermaye-artirimi"],
  },
  {
    slug: "halka-arz",
    term: "Halka Arz",
    short: "Bir şirketin paylarını ilk kez borsada yatırımcılara satması.",
    body: [
      "Halka arz SPK onayından sonra talep toplama günlerinde yapılır; yatırımcılar aracı kurumları üzerinden talep girer. Talep fazla olursa paylar dağıtım yöntemine göre (eşit ya da oransal) paylaştırılır ve hisse birkaç gün içinde borsada işlem görmeye başlar.",
    ],
    link: { href: "/halka-arz", label: "Halka arz takvimini gör" },
    related: ["kap"],
  },
  {
    slug: "pay-geri-alimi",
    term: "Pay Geri Alımı",
    short: "Şirketin kendi paylarını borsadan satın alması.",
    body: [
      "Şirketler, yönetim kurulu kararıyla ve SPK düzenlemeleri çerçevesinde kendi paylarını geri alabilir. Geri alım genellikle yönetimin hisseyi değerinin altında gördüğü şeklinde yorumlanır; dolaşımdaki pay azaldığı için pay başına kâr artar. Her geri alım işlemi KAP'ta bildirilir.",
    ],
    link: { href: "/iceriden-islemler#geri-alimlar", label: "Pay geri alımlarını gör" },
    related: ["iceriden-alim-satim", "kap"],
  },
  {
    slug: "iceriden-alim-satim",
    term: "İçeriden Alım-Satım (Yönetici İşlemleri)",
    short: "Şirket yöneticilerinin ve önemli ortaklarının kendi şirketlerinin paylarında yaptığı işlemler.",
    body: [
      "Yönetim kurulu üyeleri, üst düzey yöneticiler ve onlarla yakın ilişkili kişiler şirket paylarında yaptıkları alım-satımları KAP'ta bildirmek zorundadır. Şirketi en iyi tanıyan kişilerin alımları yatırımcılar tarafından yakından takip edilir; ancak tek başına yatırım kararı için yeterli bir işaret değildir.",
    ],
    link: { href: "/iceriden-islemler", label: "İçeriden işlemleri gör" },
    related: ["pay-geri-alimi", "kap"],
  },
  {
    slug: "kap",
    term: "KAP (Kamuyu Aydınlatma Platformu)",
    short: "Borsa şirketlerinin yatırımcıları ilgilendiren tüm gelişmeleri duyurduğu resmi platform.",
    body: [
      "Borsada işlem gören şirketler finansal tablolarını, temettü ve sermaye artırımı kararlarını, önemli sözleşmeleri ve yönetici işlemlerini KAP'ta yayımlar. Tahta Analiz'deki bildirim, temettü, sermaye artırımı ve halka arz verileri KAP kaynaklıdır.",
    ],
    link: { href: "/izleme-listesi", label: "İzlediğin şirketlerin KAP bildirimlerini al" },
  },
  {
    slug: "volatilite-bazli-tedbir",
    term: "Volatilite Bazlı Tedbir (VBTS)",
    short: "Aşırı fiyat hareketi gösteren hisselere Borsa İstanbul'un uyguladığı işlem kısıtlamaları.",
    body: [
      "Borsa İstanbul, olağan dışı fiyat ve hacim hareketi gösteren paylara açığa satış ve kredili işlem yasağı, brüt takas ya da tek fiyat gibi tedbirler uygular. Tedbirler belirli bir süre için konur ve KAP'ta duyurulur.",
    ],
    link: { href: "/tedbirli-hisseler", label: "Tedbirli hisseleri gör" },
    related: ["brut-takas", "aciga-satis", "kredili-islem"],
  },
  {
    slug: "brut-takas",
    term: "Brüt Takas",
    short: "Hissede alım ve satımların netleştirilmeden ayrı ayrı takas edildiği tedbir.",
    body: [
      "Normalde gün içinde alıp satılan hisseler netleştirilir. Brüt takas tedbirinde ise alınan payın parası tam olarak ödenmeden aynı gün satılamaz; bu yüzden gün içi al-sat işlemleri zorlaşır.",
    ],
    related: ["volatilite-bazli-tedbir"],
  },
  {
    slug: "aciga-satis",
    term: "Açığa Satış",
    short: "Yatırımcının sahip olmadığı payı ödünç alarak satması.",
    body: [
      "Açığa satış yapan yatırımcı fiyatın düşmesini bekler; payları daha düşük fiyattan geri alıp ödünç verene iade eder. Tedbirli hisselerde açığa satış yasaklanabilir.",
    ],
    related: ["kredili-islem", "volatilite-bazli-tedbir"],
  },
  {
    slug: "kredili-islem",
    term: "Kredili İşlem",
    short: "Aracı kurumdan alınan kredi ile hisse senedi alınması.",
    body: [
      "Kredili işlemde yatırımcı kendi parasının bir katına kadar aracı kurum kredisiyle pay alabilir. Kâr ve zarar büyür; fiyat düştüğünde teminat tamamlama çağrısı gelebilir. Tedbirli hisselerde kredili işlem yasaklanabilir.",
    ],
    related: ["aciga-satis", "teminat"],
  },
  {
    slug: "tavan-taban",
    term: "Tavan ve Taban Fiyat",
    short: "Bir hissenin bir günde çıkabileceği en yüksek ve inebileceği en düşük fiyat.",
    body: [
      "Borsa İstanbul'da paylar için günlük fiyat değişim sınırı vardır; hisse bir önceki kapanışa göre bu sınır kadar yükseldiğinde tavana, düştüğünde tabana gelmiş olur. Bedelsiz ya da temettü gibi işlemlerden sonra baz fiyat düzeltilir.",
    ],
    related: ["bedelsiz-sermaye-artirimi"],
  },
  {
    slug: "bist-100",
    term: "BIST 100 Endeksi",
    short: "Borsa İstanbul'un en büyük ve en likit 100 şirketinden oluşan ana endeksi.",
    body: [
      "BIST 100, borsanın genel yönünü gösteren temel göstergedir. Endeks şirketlerin dolaşımdaki pay değerine göre ağırlıklandırılır ve belirli dönemlerde yeniden belirlenir. BIST 30 ve BIST 50 en büyük 30 ve 50 şirketten oluşur.",
    ],
    link: { href: "/endeksler", label: "Endeksleri gör" },
  },
  {
    slug: "lot",
    term: "Lot",
    short: "Borsa İstanbul'da hisse alım-satımının en küçük birimi; 1 lot 1 paya eşittir.",
    body: ["Bugün Borsa İstanbul'da 1 lot, 1 adet paydır. 100 lot THYAO almak, 100 adet THYAO payı almak demektir."],
    link: { href: "/hesaplama#maliyet", label: "Ortalama maliyet hesapla" },
    related: ["ortalama-maliyet"],
  },
  {
    slug: "ortalama-maliyet",
    term: "Ortalama Maliyet",
    short: "Farklı fiyatlardan alınan aynı hissenin lot başına ortalama alış fiyatı.",
    body: [
      "Aynı hisseyi farklı zamanlarda farklı fiyatlardan alan yatırımcının kâr/zararı ortalama maliyete göre hesaplanır. Ortalama maliyet, toplam ödenen tutarın toplam lot sayısına bölünmesiyle bulunur.",
    ],
    formula: "Ortalama maliyet = Toplam alış tutarı / Toplam lot",
    example: "100 lotu 10 TL'den, 100 lotu 12 TL'den alan yatırımcının ortalama maliyeti 11 TL'dir.",
    link: { href: "/hesaplama#maliyet", label: "Ortalama maliyet hesaplayıcısı" },
    related: ["lot"],
  },
  {
    slug: "yatirim-fonu",
    term: "Yatırım Fonu",
    short: "Birçok yatırımcının parasını profesyonel yöneticilerin yönettiği ortak bir havuzda toplayan yapı.",
    body: [
      "Yatırım fonları portföy yönetim şirketleri tarafından kurulur ve TEFAS üzerinden alınıp satılabilir. Hisse senedi fonları, para piyasası fonları, altın fonları ve serbest fonlar gibi türleri vardır. Fonun içindeki varlıklar aylık portföy raporlarında açıklanır.",
    ],
    link: { href: "/fonlar", label: "Fonları ve içlerindeki hisseleri gör" },
    related: ["serbest-fon"],
  },
  {
    slug: "serbest-fon",
    term: "Serbest Fon",
    short: "Yalnızca nitelikli yatırımcılara satılabilen, yatırım kısıtları daha esnek fon türü.",
    body: [
      "Serbest fonlar diğer fonlara göre daha esnek yatırım stratejileri izleyebilir. Mevzuat gereği yalnızca belirli bir varlık büyüklüğünün üzerindeki nitelikli yatırımcılar tarafından alınabilir.",
    ],
    related: ["yatirim-fonu"],
  },
  {
    slug: "viop",
    term: "VİOP (Vadeli İşlem ve Opsiyon Piyasası)",
    short: "Borsa İstanbul'da hisse, endeks, döviz ve emtia üzerine vadeli işlem ve opsiyonların işlem gördüğü piyasa.",
    body: [
      "VİOP'ta yatırımcı varlığın kendisini değil, ileri bir tarihteki fiyatı üzerine kontrat alıp satar. İşlem yapmak için kontrat değerinin tamamı yerine teminat yatırılır; bu kaldıraç kâr ve zararı büyütür.",
    ],
    link: { href: "/viop", label: "VİOP teminat tablosunu gör" },
    related: ["teminat"],
  },
  {
    slug: "teminat",
    term: "Teminat",
    short: "Vadeli işlem ya da kredili işlem açmak için yatırılması gereken güvence tutarı.",
    body: [
      "VİOP'ta başlangıç teminatı pozisyon açarken, sürdürme teminatı pozisyonu taşırken gereken en düşük tutardır. Hesaptaki tutar sürdürme teminatının altına düşerse teminat tamamlama çağrısı yapılır.",
    ],
    link: { href: "/viop", label: "VİOP teminatlarını gör" },
    related: ["viop", "kredili-islem"],
  },
  {
    slug: "bilanco",
    term: "Bilanço (Finansal Tablolar)",
    short: "Şirketin varlıklarını, borçlarını ve özkaynağını gösteren temel finansal tablo.",
    body: [
      "Borsa şirketleri üç ayda bir finansal tablolarını KAP'ta yayımlar: bilanço (varlıklar, yükümlülükler, özkaynak), gelir tablosu (hasılat, giderler, kâr) ve nakit akış tablosu. Yıllık ve 6 aylık tablolar bağımsız denetimden geçer.",
    ],
    link: { href: "/bilancolar/yaklasan", label: "Bilanço takvimini gör" },
    related: ["f-k-orani", "favok"],
  },
  {
    slug: "52-hafta-zirve-dip",
    term: "52 Hafta Zirvesi ve Dibi",
    short: "Hissenin son bir yılda gördüğü en yüksek ve en düşük kapanış fiyatı.",
    body: [
      "52 hafta zirvesi ve dibi, hissenin son bir yıldaki fiyat aralığını gösterir. Zirveye yakın hisseler güçlü bir yükseliş eğilimine, dibe yakın hisseler zayıf bir seyre işaret edebilir.",
    ],
    link: { href: "/piyasa#zirve-dip", label: "Zirvedeki ve dipteki hisseleri gör" },
  },
];

export const GLOSSARY_MAP = new Map(GLOSSARY.map((t) => [t.slug, t]));
