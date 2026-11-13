const URL_ = "https://api.github.com/repos/sametkoseeee/tahta-analiz/actions/workflows/fiyat.yml/dispatches";

async function tetikle(env) {
  if (!env.GH_TOKEN) throw new Error("GH_TOKEN gizli değişkeni yok");
  const r = await fetch(URL_, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GH_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "tahta-fiyat-zamanlayici",
    },
    body: JSON.stringify({ ref: "master" }),
  });
  if (r.status !== 204) throw new Error(`GitHub ${r.status}: ${(await r.text()).slice(0, 300)}`);
  console.log("fiyat işi başlatıldı");
}

export default {
  async scheduled(_event, env) {
    await tetikle(env);
  },
};
