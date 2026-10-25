// Borsa Analiz service worker: site kapalıyken gelen KAP bildirimlerini gösterir.

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Borsa Analiz", body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "KAP bildirimi", {
      body: data.body || "",
      tag: data.tag,
      icon: "/icon.png",
      badge: "/icon.png",
      data: { url: data.url || "/izleme-listesi" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url;
  event.waitUntil(self.clients.openWindow(url || "/izleme-listesi"));
});
