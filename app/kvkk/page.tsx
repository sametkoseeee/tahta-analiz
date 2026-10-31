import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni",
  description: "Tahta Analiz'in kişisel verileri nasıl işlediğine dair bilgilendirme.",
};

/** Veri sorumlusu bilgileri — değişirse yalnızca burayı güncelle. */
const CONTROLLER = "Samet Köse";
const CONTACT_EMAIL = "info@tahtaanaliz.com";
const UPDATED = "26 Ekim 2026";

const h2 = "mt-8 mb-2 text-lg font-semibold";
const table = "my-3 w-full text-sm [&_td]:border-t [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-medium [&_th]:text-muted";
const list = "list-disc space-y-1 pl-5";

export default function KvkkPage() {
  return (
    <article className="mx-auto max-w-3xl text-[15px] leading-relaxed">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">Yasal bilgilendirme</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">KVKK Aydınlatma Metni</h1>
      <p className="mt-1 text-sm text-muted">Son güncelleme: {UPDATED}</p>

      <p className="mt-4">
        Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu&apos;nun (&quot;KVKK&quot;) 10. maddesi uyarınca,
        <strong> tahtaanaliz.com</strong> (&quot;Tahta Analiz&quot;) sitesini kullanan ve üye olan kişilere, kişisel
        verilerinin nasıl işlendiğini anlatmak için hazırlanmıştır.
      </p>

      <h2 className={h2}>1. Veri sorumlusu</h2>
      <p>
        Kişisel verileriniz, veri sorumlusu sıfatıyla <strong>{CONTROLLER}</strong> tarafından işlenir. İletişim:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">
          {CONTACT_EMAIL}
        </a>
      </p>

      <h2 className={h2}>2. Hangi verileri işliyoruz?</h2>
      <div className="card overflow-x-auto">
        <table className={table}>
          <thead>
            <tr>
              <th>Veri</th>
              <th>Örnek</th>
              <th>Ne zaman</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>İletişim</td>
              <td>E-posta adresi</td>
              <td>Üye olurken</td>
            </tr>
            <tr>
              <td>Hesap güvenliği</td>
              <td>Şifre (yalnızca şifrelenmiş hâliyle saklanır, kimse göremez), oturum bilgisi</td>
              <td>Üye olurken ve giriş yaparken</td>
            </tr>
            <tr>
              <td>Kullanım tercihleri</td>
              <td>
                İzleme listesine eklediğiniz hisse ve fonlar; Portföyüm&apos;e girdiğiniz hisse, lot ve maliyet bilgileri;
                e-posta bülteni tercihiniz
              </td>
              <td>İzleme listesi, Portföyüm ve bülten özelliklerini kullanırken</td>
            </tr>
            <tr>
              <td>Bildirim aboneliği</td>
              <td>Tarayıcınızın bildirim adresi ve anahtarları, tarayıcı türü</td>
              <td>Anlık bildirimleri açtığınızda</td>
            </tr>
            <tr>
              <td>İşlem güvenliği</td>
              <td>IP adresi, giriş zamanı, tarayıcı bilgisi</td>
              <td>Siteyi ziyaret ederken ve giriş yaparken</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3">
        Üye olmadan siteyi gezen ziyaretçilerden yalnızca teknik olarak zorunlu işlem güvenliği verileri (ör. IP adresi)
        sunucu kayıtlarında tutulur. Sitede reklam, pazarlama veya takip amaçlı çerez kullanılmaz; yalnızca giriş yapmış
        kalmanız için zorunlu oturum çerezi ve tarayıcınızda tutulan site tercihleri (ör. okunan bildirimler, tema seçimi)
        kullanılır.
      </p>
      <p className="mt-3">
        Sitenin nasıl kullanıldığını görmek için Cloudflare Web Analytics ile <strong>çerezsiz ve anonim</strong> ziyaret
        istatistiği tutulur: ziyaret edilen sayfa, sitenin hangi bağlantıdan açıldığı, ülke, cihaz ve tarayıcı türü.
        Ziyaretçiyi tanımlayan bir bilgi (ad, e-posta, IP adresi) saklanmaz, çerez kullanılmaz ve ziyaretler başka
        sitelerdeki hareketlerinizle birleştirilmez.
      </p>

      <h2 className={h2}>3. Hangi amaçlarla işliyoruz?</h2>
      <ul className={list}>
        <li>Üyelik hesabını oluşturmak, e-posta adresini doğrulamak, oturum açmayı ve şifre sıfırlamayı sağlamak,</li>
        <li>İzleme listenizi saklamak ve tüm cihazlarınızda aynı şekilde göstermek,</li>
        <li>İzlediğiniz şirketler KAP&apos;ta bildirim yayımladığında size anlık bildirim göndermek (yalnızca açtıysanız),</li>
        <li>Portföyünüzü saklamak ve tüm cihazlarınızda göstermek,</li>
        <li>Açıkça abone olduysanız haftalık &quot;Hap Bilgiler&quot; e-posta bültenini göndermek,</li>
        <li>Sitenin ve kullanıcıların güvenliğini sağlamak, kötüye kullanımı önlemek,</li>
        <li>Yasal yükümlülükleri yerine getirmek ve yetkili kurumların talep etmesi hâlinde bilgi vermek.</li>
      </ul>

      <h2 className={h2}>4. Hukuki sebepler</h2>
      <p>Kişisel verileriniz KVKK&apos;nın 5. maddesinin 2. fıkrasında yer alan şu sebeplere dayanılarak işlenir:</p>
      <ul className={list}>
        <li>
          <strong>(c)</strong> Üyelik sözleşmesinin kurulması ve ifası için gerekli olması (hesap, izleme listesi,
          portföy, bildirim ve bülten hizmetleri),
        </li>
        <li>
          <strong>(ç)</strong> Veri sorumlusunun hukuki yükümlülüğünü yerine getirmesi (ör. 5651 sayılı Kanun kapsamındaki
          yükümlülükler),
        </li>
        <li>
          <strong>(f)</strong> Temel hak ve özgürlüklerinize zarar vermemek kaydıyla meşru menfaat (site güvenliği).
        </li>
      </ul>

      <h2 className={h2}>5. Verileri nasıl topluyoruz?</h2>
      <p>
        Veriler; üyelik ve giriş formları, izleme listesi ve bildirim ayarları aracılığıyla elektronik ortamda, sizin
        tarafınızdan girilerek ve siteyi kullanımınız sırasında otomatik olarak toplanır.
      </p>

      <h2 className={h2}>6. Verileri kimlerle paylaşıyoruz?</h2>
      <p>Kişisel verileriniz satılmaz ve reklam amacıyla paylaşılmaz. Siteyi çalıştırmak için şu hizmet sağlayıcılardan yararlanılır:</p>
      <div className="card overflow-x-auto">
        <table className={table}>
          <thead>
            <tr>
              <th>Hizmet sağlayıcı</th>
              <th>Ne için</th>
              <th>Verilerin bulunduğu yer</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Supabase</td>
              <td>Üyelik ve veritabanı (izleme listesi, portföy, bildirim ve bülten abonelikleri)</td>
              <td>Avrupa</td>
            </tr>
            <tr>
              <td>Cloudflare</td>
              <td>Sitenin barındırılması ve sunulması, alan adı (DNS), anonim ziyaret istatistiği</td>
              <td>ABD ve dünya genelindeki sunucular</td>
            </tr>
            <tr>
              <td>Resend</td>
              <td>Doğrulama ve şifre sıfırlama e-postalarının, abone olduysanız haftalık &quot;Hap Bilgiler&quot; bülteninin gönderilmesi</td>
              <td>İrlanda (AB)</td>
            </tr>
            <tr>
              <td>GitHub</td>
              <td>Otomatik işler: veri güncelleme ve anlık bildirimlerin gönderilmesi</td>
              <td>ABD</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3">
        Bu hizmet sağlayıcıların sunucuları yurt dışında bulunduğundan, verileriniz KVKK&apos;nın 9. maddesinde öngörülen
        usul ve güvencelere uygun olarak yurt dışına aktarılır. Anlık bildirimler, tarayıcınızın üreticisinin bildirim
        servisi (ör. Google, Apple, Mozilla) üzerinden iletilir. Ayrıca kanunen yetkili kamu kurum ve kuruluşlarına, talep
        edilmesi hâlinde ve hukuki zorunluluk çerçevesinde bilgi verilebilir.
      </p>
      <p className="mt-3">
        Sitedeki piyasa verileri (KAP, TEFAS, İş Yatırım, Yahoo Finance) herkese açık kaynaklardan alınır; bu kaynaklarla
        sizinle ilgili hiçbir veri paylaşılmaz. E-posta adresiniz, izleme listeniz ve portföyünüz sitede başkalarına gösterilmez.
      </p>

      <h2 className={h2}>7. Ne kadar süre saklıyoruz?</h2>
      <ul className={list}>
        <li>
          Hesap verileri, izleme listeniz ve portföyünüz, hesabınız açık olduğu sürece saklanır. Hesabınız silindiğinde
          e-posta adresiniz, izleme listeniz, portföyünüz ve abonelikleriniz de silinir.
        </li>
        <li>Bildirim aboneliği, bildirimleri kapattığınızda ya da tarayıcınız aboneliği iptal ettiğinde silinir.</li>
        <li>Bülten aboneliği, Portföyüm sayfasından abonelikten çıktığınızda silinir.</li>
        <li>İşlem güvenliği kayıtları, ilgili mevzuatın öngördüğü süre boyunca saklanır ve sonra silinir.</li>
      </ul>

      <h2 className={h2}>8. Haklarınız</h2>
      <p>KVKK&apos;nın 11. maddesi uyarınca veri sorumlusuna başvurarak:</p>
      <ul className={list}>
        <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
        <li>İşlenmişse buna ilişkin bilgi talep etme,</li>
        <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
        <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,</li>
        <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme,</li>
        <li>KVKK&apos;nın 7. maddesindeki şartlar çerçevesinde silinmesini veya yok edilmesini isteme,</li>
        <li>Düzeltme ve silme işlemlerinin, verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme,</li>
        <li>Münhasıran otomatik sistemlerle analiz edilmesi sonucu aleyhinize bir sonuç çıkmasına itiraz etme,</li>
        <li>Kanuna aykırı işleme nedeniyle zarara uğramanız hâlinde zararın giderilmesini talep etme</li>
      </ul>
      <p>haklarına sahipsiniz.</p>

      <h2 className={h2}>9. Başvuru</h2>
      <p>
        Haklarınızı kullanmak veya hesabınızın silinmesini istemek için üye olduğunuz e-posta adresinden{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">
          {CONTACT_EMAIL}
        </a>{" "}
        adresine yazabilirsiniz. Başvurunuz en geç 30 gün içinde ücretsiz olarak sonuçlandırılır.
      </p>

      <h2 className={h2}>10. Yatırım tavsiyesi değildir</h2>
      <p>
        Sitedeki veriler, oranlar ve grafikler yalnızca bilgilendirme amaçlıdır; yatırım danışmanlığı veya alım-satım
        önerisi değildir. Verilerin doğruluğu ve güncelliği için kaynak kuruluşların (KAP, TEFAS) yayınları esastır.
      </p>
    </article>
  );
}
